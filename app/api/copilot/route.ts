import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { auditMetadata, localeLabelForCountry } from '@/lib/aso';

// The AI Copilot. Runs server-side so the Anthropic key stays private. It is
// GROUNDED on the user's REAL data: their apps, current metadata, ASO audit,
// 30-day sales and ratings (fetched live, best-effort). It never invents numbers.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const MODEL = 'claude-sonnet-4-6';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Msg = { role: 'user' | 'assistant'; content: string };

// Best-effort call to the asc-proxy edge function with the user's token.
async function edge(action: string, token: string, body: unknown): Promise<any | null> {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=${action}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "L'IA n'est pas encore configurée (clé Anthropic manquante côté serveur)." },
      { status: 503 },
    );
  }

  let body: { messages?: Msg[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const messages = (body.messages ?? []).filter((m) => m.content?.trim()).slice(-12);
  if (messages.length === 0) return NextResponse.json({ error: 'No message' }, { status: 400 });

  // ── Build REAL context (best-effort) ────────────────────────────────────────
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [{ data: apps }, { data: locs }, { data: creds }] = await Promise.all([
    userClient.from('apps').select('name,asc_app_id,created_at').order('created_at', { ascending: false }),
    userClient.from('app_localizations').select('title,subtitle,keywords,description,promotional_text,country_code').eq('is_current', true),
    userClient.from('asc_credentials').select('id').maybeSingle(),
  ]);

  const primaryAppId = (apps ?? []).find((a: any) => a.asc_app_id)?.asc_app_id as string | undefined;

  // Live Apple data (only if credentials are connected).
  let sales: any = null;
  let ratings: any = null;
  if (creds) {
    [sales, ratings] = await Promise.all([
      edge('get-sales', token, {}),
      primaryAppId ? edge('get-ratings', token, { appId: primaryAppId, limit: 20 }) : Promise.resolve(null),
    ]);
  }

  // Compose a compact, factual context block.
  const ctx: string[] = [];
  ctx.push(`Apps de l'utilisateur: ${(apps ?? []).map((a: any) => a.name).join(', ') || 'aucune'}.`);
  for (const l of (locs ?? [])) {
    const label = localeLabelForCountry((l as any).country_code ?? '');
    const a = auditMetadata({
      title: (l as any).title ?? '', subtitle: (l as any).subtitle ?? '', keywords: (l as any).keywords ?? '',
      description: (l as any).description ?? '', promotional_text: (l as any).promotional_text ?? '',
    });
    ctx.push(
      `Fiche [${label}] titre="${(l as any).title ?? ''}" sous-titre="${(l as any).subtitle ?? ''}" ` +
      `mots-cles="${(l as any).keywords ?? ''}" | score ASO ${a.score}/100` +
      (a.findings.length ? ` | a corriger: ${a.findings.slice(0, 3).map((f) => f.message).join(' ; ')}` : ''),
    );
  }
  if (sales) {
    ctx.push(`Ventes 30j: ${sales.totalDownloads ?? 0} telechargements, ${sales.totalRevenue ?? 0} EUR de revenus (proceeds).`);
  } else if (creds) {
    ctx.push('Ventes: aucune donnee sur 30j (app peut etre pre-lancement).');
  } else {
    ctx.push('App Store Connect non connecte: pas de ventes ni d avis reels disponibles.');
  }
  if (ratings) {
    ctx.push(`Note moyenne: ${ratings.averageRating ?? 'n/a'} (${ratings.ratingCount ?? 0} notes). Avis recents: ${(ratings.reviews ?? []).length}.`);
    const sample = (ratings.reviews ?? []).slice(0, 5).map((r: any) => `${r.rating}* ${r.title ?? ''}: ${(r.body ?? '').slice(0, 120)}`);
    if (sample.length) ctx.push('Extraits avis: ' + sample.join(' | '));
  }

  const system =
    "Tu es le copilote IA d'Appolyn, un outil d'App Store Optimization pour developpeurs indie iOS. " +
    "Tu aides sur l'ASO, les metadonnees, les mots-cles, les avis, les revenus et la croissance. " +
    "Reponds dans la langue de l'utilisateur (par defaut francais), de facon concise, concrete et actionnable. " +
    "N'utilise pas de tirets longs. Tu disposes ci-dessous des DONNEES REELLES de l'utilisateur: appuie-toi " +
    "dessus, cite des chiffres seulement s'ils y figurent, et si une donnee manque dis-le clairement plutot " +
    "que d'inventer. Limites Apple utiles: titre 30, sous-titre 30, mots-cles 100 caracteres.\n\n" +
    'DONNEES REELLES:\n' + (ctx.join('\n') || 'Aucune donnee disponible.');

  const client = new Anthropic({ apiKey });
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: 'disabled' },
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    const reply = textBlock?.text?.trim() ?? '';
    if (!reply) return NextResponse.json({ error: 'Réponse vide.' }, { status: 502 });
    return NextResponse.json({ reply });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Copilot failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
