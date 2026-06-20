import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { getAppListing } from '@/lib/server/app-listing';

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
  const angle = (body.angle ?? '').trim();
  const ascAppId = (body.ascAppId ?? '').trim();

  // AUTO : fiche réelle de l'app — App Store public, sinon App Store Connect (marche
  // AVANT la sortie de l'app). Le dev n'a rien à décrire.
  const { appName: fetchedName, genre, listing: appDesc } = await getAppListing(ascAppId, token);
  const appName = (body.appName ?? '').trim() || fetchedName;
  if (!appDesc && !angle) return NextResponse.json({ error: "Impossible de lire la fiche de ton app (ni App Store public, ni App Store Connect). Vérifie ton App ID + ta clé ASC, ou ajoute un angle." }, { status: 400 });

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
