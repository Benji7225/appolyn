import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Adapts one content idea / script into platform-native copy (hook + caption +
// hashtags) for each selected social platform. Runs server-side so the Anthropic
// key never reaches the browser. One Claude call per platform, bounded.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-4-6';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook';

// Per-platform copywriting brief. Kept terse: it is injected into the system prompt.
const PLATFORM_SPEC: Record<Platform, string> = {
  tiktok:
    'TikTok. Hook ultra court et percutant en première ligne (le scroll se décide en 1s). ' +
    'Légende de 1 à 2 lignes max, ton direct et natif TikTok, pas corporate. ' +
    '3 à 5 hashtags pertinents mélangeant 1-2 gros volumes et 2-3 de niche.',
  instagram:
    'Instagram Reels. Première ligne = hook qui arrête le scroll. Légende un peu plus développée ' +
    'que TikTok, avec sauts de ligne aérés et 1 émoji max par idée. ' +
    'Termine par un appel à l\'action léger. 4 à 8 hashtags pertinents.',
  youtube:
    'YouTube Shorts. La PREMIÈRE LIGNE de la légende sert de TITRE de la vidéo (max 100 caractères, ' +
    'accrocheur, orienté recherche). Les lignes suivantes = description courte. ' +
    'Ajoute #Shorts et 2 à 4 hashtags pertinents.',
  facebook:
    'Facebook. Ton conversationnel et un peu plus posé, légende qui peut être un peu plus longue, ' +
    'storytelling court qui donne envie de regarder la vidéo. 1 à 3 hashtags maximum.',
};

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    caption: { type: 'string' },
    hashtags: { type: 'string' },
  },
  required: ['caption', 'hashtags'],
  additionalProperties: false,
} as const;

const CaptionSchema = z.object({ caption: z.string(), hashtags: z.string() });
type CaptionFields = z.infer<typeof CaptionSchema>;

async function adaptForPlatform(
  client: Anthropic,
  platform: Platform,
  ctx: { title: string; script: string; app: string },
): Promise<CaptionFields> {
  const system =
    'Tu es un copywriter social media expert pour le marketing d\'applications mobiles. ' +
    'On te donne une idée ou un script de vidéo, tu produis une copy native pour UNE plateforme. ' +
    'Écris dans la langue du script (français par défaut). Sois concret, jamais creux, jamais corporate. ' +
    'Renvoie "caption" (le texte du post, hook en première ligne) et "hashtags" (séparés par des espaces, ' +
    'chacun commençant par #). Ne mets pas les hashtags dans la caption, ils vont dans le champ dédié. ' +
    `Plateforme cible: ${PLATFORM_SPEC[platform]}`;

  const user =
    (ctx.app ? `Application promue: ${ctx.app}\n` : '') +
    (ctx.title ? `Titre interne du post: ${ctx.title}\n` : '') +
    `Idée / script source:\n${ctx.script}\n\n` +
    `Produis la copy ${platform} maintenant.`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    thinking: { type: 'disabled' },
    system,
    messages: [{ role: 'user', content: user }],
    output_config: {
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
      effort: 'low',
    },
  } as Anthropic.MessageCreateParamsNonStreaming);

  const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  if (!textBlock) throw new Error('Aucun contenu renvoyé');
  return CaptionSchema.parse(JSON.parse(textBlock.text));
}

const ALL_PLATFORMS: Platform[] = ['instagram', 'tiktok', 'youtube', 'facebook'];

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'L\'IA n\'est pas encore configurée (clé Anthropic manquante côté serveur).' },
      { status: 503 },
    );
  }

  let body: { title?: string; script?: string; app?: string; platforms?: Platform[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  const script = (body.script ?? '').trim();
  if (!script) {
    return NextResponse.json({ error: 'Ajoute d\'abord une idée ou un script à adapter.' }, { status: 400 });
  }
  const platforms = (body.platforms ?? []).filter((p): p is Platform => ALL_PLATFORMS.includes(p));
  if (platforms.length === 0) {
    return NextResponse.json({ error: 'Choisis au moins une plateforme.' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const ctx = { title: (body.title ?? '').trim(), script, app: (body.app ?? '').trim() };

  const settled = await Promise.allSettled(platforms.map((p) => adaptForPlatform(client, p, ctx)));

  const results: Record<string, CaptionFields> = {};
  const errors: Record<string, string> = {};
  settled.forEach((r, idx) => {
    const p = platforms[idx];
    if (r.status === 'fulfilled') results[p] = r.value;
    else errors[p] = r.reason instanceof Error ? r.reason.message : 'Échec de génération';
  });

  return NextResponse.json({ results, errors });
}
