import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// "Améliorer avec l'IA": the ONE place AI is allowed to act. It rewrites a
// locale's metadata to maximise ASO (search ranking + conversion), steering the
// keywords away from the saturated terms the free iTunes score flagged. The
// score itself stays computed for free on real iTunes data — the AI optimises,
// it never grades. Runs server-side so the Anthropic key never reaches the browser.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-4-6';
const LIMITS = { title: 30, subtitle: 30, keywords: 100, description: 4000, promotional_text: 170 };

const FieldsSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  keywords: z.string(),
  description: z.string(),
  promotional_text: z.string(),
});
type Fields = z.infer<typeof FieldsSchema>;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    subtitle: { type: 'string' },
    keywords: { type: 'string' },
    description: { type: 'string' },
    promotional_text: { type: 'string' },
    changes: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'subtitle', 'keywords', 'description', 'promotional_text', 'changes'],
  additionalProperties: false,
} as const;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const clamp = (v: string, max: number) => (v.length > max ? v.slice(0, max).trim() : v);

function clampKeywords(raw: string, max: number): string {
  const terms = raw.split(',').map((t) => t.trim()).filter(Boolean);
  const seen = new Set<string>();
  const unique = terms.filter((t) => { const k = t.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  let out = '';
  for (const term of unique) { const next = out ? `${out},${term}` : term; if (next.length > max) break; out = next; }
  return out;
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// Mots vides (FR + EN) à ignorer dans la détection de répétition.
const STOP = new Set(['the', 'and', 'for', 'your', 'with', 'app', 'pro', 'les', 'des', 'une', 'pour', 'avec', 'ton', 'ta', 'tes', 'mon', 'ma', 'mes', 'sur', 'dans', 'que', 'qui', 'est', 'and', 'now']);

// GARANTIE déterministe « zéro répétition » : Apple indexe chaque mot du titre et
// du sous-titre une seule fois. On retire donc des mots-clés tout terme dont TOUS
// les mots sont déjà dans le titre/sous-titre (ça gaspillerait les 100 caractères).
function dropTitleWords(keywords: string, title: string, subtitle: string): string {
  const covered = new Set(
    norm(`${title} ${subtitle}`).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)),
  );
  if (covered.size === 0) return keywords;
  const kept = keywords.split(',').map((t) => t.trim()).filter(Boolean).filter((term) => {
    const words = norm(term).split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
    return words.length === 0 || !words.every((w) => covered.has(w));
  });
  return kept.join(',');
}

function enforceLimits(f: Fields): Fields {
  return {
    title: clamp(f.title, LIMITS.title),
    subtitle: clamp(f.subtitle, LIMITS.subtitle),
    keywords: clampKeywords(f.keywords, LIMITS.keywords),
    description: clamp(f.description, LIMITS.description),
    promotional_text: clamp(f.promotional_text, LIMITS.promotional_text),
  };
}

type Body = {
  locale?: string; label?: string; country?: string;
  fields?: Partial<Fields>;
  weak?: string[];
  keywords_analysis?: { term: string; difficulty: number; popularity: number; verdict: string }[];
};

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "L'IA n'est pas configurée sur le serveur (clé Anthropic manquante)." }, { status: 503 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 }); }

  const f = body.fields ?? {};
  const fields: Fields = {
    title: (f.title ?? '').trim(), subtitle: (f.subtitle ?? '').trim(), keywords: (f.keywords ?? '').trim(),
    description: (f.description ?? '').trim(), promotional_text: (f.promotional_text ?? '').trim(),
  };
  if (!fields.title && !fields.subtitle && !fields.description) {
    return NextResponse.json({ error: 'Renseigne au moins un titre ou une description avant de lancer l’IA.' }, { status: 400 });
  }

  const label = body.label ?? body.locale ?? 'en-US';
  const country = (body.country ?? 'us').toUpperCase();
  const weak = (body.weak ?? []).filter(Boolean);
  const analysis = body.keywords_analysis ?? [];
  const saturatedLine = weak.length
    ? `Keywords flagged as TOO COMPETITIVE / saturated on the ${country} store (replace them with relevant but more winnable terms): ${weak.join(', ')}.`
    : 'No specific saturated keyword was flagged, but still prefer precise, mid-tail keywords over generic head terms.';
  const analysisLine = analysis.length
    ? 'Real competition data per current keyword (difficulty/popularity 0-100): ' +
      analysis.map((k) => `${k.term} [diff ${k.difficulty}, pop ${k.popularity}, ${k.verdict}]`).join('; ') + '.'
    : '';

  const system =
    'You are a senior App Store Optimization (ASO) expert. You rewrite an app listing for ONE App Store locale to maximise BOTH search ranking and install conversion. ' +
    'Rules: (1) Write in the SAME language as the existing metadata — do NOT switch language. ' +
    '(2) Keep the brand/product name intact in the title, then add the strongest descriptive keyword. ' +
    '(3) Replace saturated/very-difficult keywords with relevant, more winnable mid-tail terms real users in this market search for. ' +
    '(4) Never repeat a word across title, subtitle and keywords (Apple indexes each word once) — every field must add NEW terms. ' +
    '(5) Keywords field: comma-separated, NO spaces after commas, no duplicates, prefer singular forms. ' +
    '(6) Stay truthful to what the app does — do NOT invent features. Improve clarity, benefits and the first description line (the hook shown before "more"). ' +
    'Respect Apple limits STRICTLY: title <=30 chars, subtitle <=30, keywords <=100 chars total, description <=4000, promotional_text <=170. ' +
    'In "changes", list 2-5 short bullet strings (in the metadata language) explaining what you changed and why.';

  const userMsg =
    `Locale: ${label}\nStore country: ${country}\n\n` +
    `Current title: ${fields.title}\n` +
    `Current subtitle: ${fields.subtitle}\n` +
    `Current keywords: ${fields.keywords}\n` +
    `Current description: ${fields.description}\n` +
    `Current promotional text: ${fields.promotional_text}\n\n` +
    `${saturatedLine}\n${analysisLine}\n\n` +
    `Rewrite all five fields to maximise ASO for this market, then explain your changes.`;

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      thinking: { type: 'disabled' },
      system,
      messages: [{ role: 'user', content: userMsg }],
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA }, effort: 'low' },
    } as Anthropic.MessageCreateParamsNonStreaming);

    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) return NextResponse.json({ error: 'Réponse vide de l’IA.' }, { status: 502 });
    const raw = JSON.parse(textBlock.text) as Fields & { changes?: string[] };
    const improved = enforceLimits(FieldsSchema.parse(raw));
    // Filet déterministe : on garantit zéro répétition titre/sous-titre ↔ mots-clés,
    // même si l'IA en a laissé passer. Puis on re-clamp à 100 caractères.
    improved.keywords = clampKeywords(dropTitleWords(improved.keywords, improved.title, improved.subtitle), LIMITS.keywords);
    const changes = Array.isArray(raw.changes) ? raw.changes.slice(0, 6) : [];
    return NextResponse.json({ fields: improved, changes });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'La génération a échoué.' }, { status: 502 });
  }
}
