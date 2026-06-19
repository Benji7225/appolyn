import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Teardown stratégique d'un concurrent à partir de ses VRAIES données publiques
// App Store (nom, catégorie, description, note). Clé Anthropic côté serveur.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-4-6';

const Schema = z.object({
  positioning: z.string(),
  strengths: z.array(z.string()),
  keyword_angle: z.string(),
  differentiation: z.array(z.string()),
});
type Teardown = z.infer<typeof Schema>;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    positioning: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    keyword_angle: { type: 'string' },
    differentiation: { type: 'array', items: { type: 'string' } },
  },
  required: ['positioning', 'strengths', 'keyword_angle', 'differentiation'],
  additionalProperties: false,
} as const;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "L'IA n'est pas configurée sur le serveur." }, { status: 503 });

  let body: { id?: string; country?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }); }
  const id = (body.id ?? '').trim();
  const country = (body.country ?? 'us').toLowerCase();
  if (!id) return NextResponse.json({ error: 'Concurrent manquant.' }, { status: 400 });

  // Données publiques App Store réelles.
  let app: Record<string, unknown> | undefined;
  try {
    const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&country=${country}`, { headers: { 'User-Agent': 'Appolyn/1.0' } });
    const j = await r.json() as { results?: Record<string, unknown>[] };
    app = (j.results ?? [])[0];
  } catch { /* géré ci-dessous */ }
  if (!app) return NextResponse.json({ error: 'Concurrent introuvable sur cet App Store.' }, { status: 404 });

  const name = (app.trackName as string) ?? '';
  const genre = (app.primaryGenreName as string) ?? '';
  const desc = ((app.description as string) ?? '').slice(0, 2500);
  const rating = app.averageUserRating as number | undefined;
  const ratingCount = app.userRatingCount as number | undefined;

  const system =
    'You are an App Store Optimization (ASO) and product strategist helping an indie mobile developer ' +
    'compete against a rival app. From the rival\'s real public App Store data, produce a concise, honest, ' +
    'specific strategic teardown. positioning = how this app positions itself (1-2 sentences). ' +
    'strengths = 3-4 things it does well (short bullets). keyword_angle = its likely ASO/keyword strategy ' +
    '(1-2 sentences). differentiation = 3-4 concrete, actionable ways an indie dev could differentiate and win. ' +
    'No fluff, no generic advice. Write in FRENCH. Return only the requested fields.';

  const userMsg =
    `Concurrent : ${name}\nCatégorie : ${genre}\nNote : ${rating ?? '?'} (${ratingCount ?? 0} avis)\n\nDescription App Store :\n${desc}`;

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      thinking: { type: 'disabled' },
      system,
      messages: [{ role: 'user', content: userMsg }],
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA }, effort: 'low' },
    } as Anthropic.MessageCreateParamsNonStreaming);
    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) throw new Error('No content');
    const teardown: Teardown = Schema.parse(JSON.parse(textBlock.text));
    return NextResponse.json({ teardown, app: { name, genre, rating: rating ?? null, ratingCount: ratingCount ?? null, icon: (app.artworkUrl100 as string) ?? '' } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Analyse impossible' }, { status: 502 });
  }
}
