import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Génère des idées de contenu court-format (hooks TikTok/Reels/Shorts) pour
// promouvoir l'app organiquement. Clé Anthropic côté serveur.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-4-6';

const Schema = z.object({
  ideas: z.array(z.object({ hook: z.string(), format: z.string() })),
});
type Ideas = z.infer<typeof Schema>;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        properties: { hook: { type: 'string' }, format: { type: 'string' } },
        required: ['hook', 'format'],
        additionalProperties: false,
      },
    },
  },
  required: ['ideas'],
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

  let body: { ascAppId?: string; appName?: string; angle?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }); }
  let appName = (body.appName ?? '').trim();
  const angle = (body.angle ?? '').trim();
  const ascAppId = (body.ascAppId ?? '').trim();

  // AUTO : le dev n'a rien à décrire. On tire la VRAIE fiche App Store publique de
  // l'app (sous-titre + description) via son App Store id, et on génère à partir de ça.
  let genre = '';
  let appDesc = '';
  if (ascAppId) {
    try {
      const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(ascAppId)}&country=us`, { headers: { 'User-Agent': 'Appolyn/1.0' } });
      const j = await r.json() as { results?: Record<string, unknown>[] };
      const app = (j.results ?? [])[0];
      if (app) {
        if (!appName) appName = (app.trackName as string) ?? '';
        genre = (app.primaryGenreName as string) ?? '';
        const subtitle = (app.subtitle as string) ?? '';
        const desc = ((app.description as string) ?? '').slice(0, 1500);
        appDesc = [subtitle, desc].filter(Boolean).join('\n');
      }
    } catch { /* géré ci-dessous */ }
  }
  if (!appDesc && !angle) return NextResponse.json({ error: "Connecte ton app à App Store Connect (avec son App ID) pour générer des idées automatiquement, ou ajoute un angle." }, { status: 400 });

  const system =
    'You are a short-form content strategist for indie app makers (TikTok, Reels, YouTube Shorts). ' +
    'From the app\'s real App Store listing, generate 8 distinct, scroll-stopping content ideas to promote it organically. ' +
    'For each idea: hook = the punchy first line or concept that stops the scroll (concrete, not generic), ' +
    'format = the video format/angle (e.g. "problème → solution", "POV", "avant/après", "j\'ai testé", ' +
    '"démo 15s", "storytime", "3 erreurs"). Be SPECIFIC to this app; avoid generic "téléchargez mon app". ' +
    'Vary the angles. Write in FRENCH. Return only the ideas array (exactly 8).';

  const userMsg =
    `App : ${appName || '(sans nom)'}${genre ? `\nCatégorie : ${genre}` : ''}` +
    `${appDesc ? `\nFiche App Store :\n${appDesc}` : ''}` +
    `${angle ? `\n\nAngle souhaité par le créateur : ${angle}` : ''}`;

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1800,
      thinking: { type: 'disabled' },
      system,
      messages: [{ role: 'user', content: userMsg }],
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA }, effort: 'low' },
    } as Anthropic.MessageCreateParamsNonStreaming);
    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) throw new Error('No content');
    const parsed: Ideas = Schema.parse(JSON.parse(textBlock.text));
    return NextResponse.json({ ideas: parsed.ideas.slice(0, 12) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Génération impossible' }, { status: 502 });
  }
}
