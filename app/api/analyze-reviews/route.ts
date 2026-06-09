import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// AI analysis of REAL App Store reviews: clusters recurring themes with their
// share of reviews and an example. Percentages are computed by the model over
// the reviews actually fetched, never invented. Server-side (key stays private).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const MODEL = 'claude-sonnet-4-6';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    themes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          count: { type: 'integer' },
          percentage: { type: 'integer' },
          sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
          example: { type: 'string' },
        },
        required: ['label', 'count', 'percentage', 'sentiment', 'example'],
        additionalProperties: false,
      },
    },
  },
  required: ['summary', 'themes'],
  additionalProperties: false,
} as const;

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "L'IA n'est pas configurée (clé Anthropic manquante)." }, { status: 503 });

  let body: { appId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  if (!body.appId) return NextResponse.json({ error: 'appId requis.' }, { status: 400 });

  // Fetch the real reviews via the secured edge proxy (uses the user's creds).
  let reviews: { rating: number; title: string; body: string; territory: string }[] = [];
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-ratings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: body.appId, limit: 50 }),
    });
    const j = await r.json();
    reviews = (j.reviews ?? []);
  } catch {
    return NextResponse.json({ error: 'Impossible de récupérer les avis.' }, { status: 502 });
  }

  if (reviews.length < 3) {
    return NextResponse.json({ enough: false, count: reviews.length });
  }

  const reviewText = reviews
    .map((r, i) => `#${i + 1} [${r.rating}*${r.territory ? ' ' + r.territory : ''}] ${r.title ?? ''} :: ${(r.body ?? '').slice(0, 400)}`)
    .join('\n');

  const system =
    'Tu analyses les avis App Store réels d\'une app. Regroupe les thèmes récurrents (bugs, demandes de ' +
    'fonctionnalités, éloges, prix, etc.). Pour chaque thème: un libellé court en français, le nombre d\'avis ' +
    'concernés (count) sur les ' + reviews.length + ' avis analysés, le pourcentage entier correspondant, le ' +
    'sentiment, et un exemple court tiré des avis. Donne aussi un résumé de 2-3 phrases. Base-toi UNIQUEMENT sur ' +
    'les avis fournis, n\'invente rien. Classe les thèmes du plus fréquent au moins fréquent.';

  const client = new Anthropic({ apiKey });
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      thinking: { type: 'disabled' },
      system,
      messages: [{ role: 'user', content: `Avis (${reviews.length}) :\n${reviewText}` }],
      output_config: { format: { type: 'json_schema', schema: SCHEMA }, effort: 'low' },
    } as Anthropic.MessageCreateParamsNonStreaming);
    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) return NextResponse.json({ error: 'Réponse vide.' }, { status: 502 });
    const analysis = JSON.parse(textBlock.text);
    return NextResponse.json({ enough: true, count: reviews.length, analysis });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Analyse échouée';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
