import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Génère des annonces de lancement prêtes à poster (Product Hunt, X, Reddit) à
// partir du nom de l'app, d'un pitch et du lien App Store. Clé Anthropic serveur.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-4-6';

const Schema = z.object({
  product_hunt_tagline: z.string(),
  product_hunt_comment: z.string(),
  x_post: z.string(),
  reddit_title: z.string(),
  reddit_body: z.string(),
});
type Posts = z.infer<typeof Schema>;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    product_hunt_tagline: { type: 'string' },
    product_hunt_comment: { type: 'string' },
    x_post: { type: 'string' },
    reddit_title: { type: 'string' },
    reddit_body: { type: 'string' },
  },
  required: ['product_hunt_tagline', 'product_hunt_comment', 'x_post', 'reddit_title', 'reddit_body'],
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

  let body: { ascAppId?: string; appName?: string; angle?: string; url?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }); }

  let appName = (body.appName ?? '').trim();
  const angle = (body.angle ?? '').trim();
  const ascAppId = (body.ascAppId ?? '').trim();
  let url = (body.url ?? '').trim();

  // AUTO : on tire la VRAIE fiche App Store de l'app (FR si dispo, sinon US) pour
  // que le dev n'ait rien à décrire. La langue des posts suit celle de la fiche.
  let listing = '';
  if (ascAppId) {
    for (const country of ['fr', 'us']) {
      try {
        const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(ascAppId)}&country=${country}`, { headers: { 'User-Agent': 'Appolyn/1.0' } });
        const j = await r.json() as { results?: Record<string, unknown>[] };
        const app = (j.results ?? [])[0];
        if (app) {
          if (!appName) appName = (app.trackName as string) ?? '';
          if (!url) url = (app.trackViewUrl as string) ?? '';
          const subtitle = (app.subtitle as string) ?? '';
          const desc = ((app.description as string) ?? '').slice(0, 1500);
          listing = [subtitle, desc].filter(Boolean).join('\n');
          if (listing) break;
        }
      } catch { /* essaie le pays suivant */ }
    }
  }
  if (!listing && !angle) return NextResponse.json({ error: "Connecte ton app à App Store Connect (avec son App ID) pour générer tes annonces automatiquement, ou ajoute un angle." }, { status: 400 });

  const system =
    'You are a launch copywriter for indie mobile apps (Product Hunt, X/Twitter, Reddit). ' +
    'From the app\'s real App Store listing, write ready-to-post launch copy. ' +
    'Authentic indie-maker tone, concise, benefit-first, NO buzzwords, NO hype, NO emojis spam (1-2 max). ' +
    'Write in the SAME LANGUAGE as the listing (default French if unclear). ' +
    'Constraints: product_hunt_tagline <= 60 characters (one punchy line). ' +
    'product_hunt_comment = the maker\'s first comment (2-4 short sentences: the problem, why you built it, what it does). ' +
    'x_post <= 270 characters, include the App Store link if provided. ' +
    'reddit_title = honest and specific (no clickbait), reddit_body = a short authentic post for an indie/maker subreddit ' +
    '(what it is, who it\'s for, ask for feedback), include the link. Return only the requested fields.';

  const userMsg =
    `App name: ${appName || '(unknown)'}\n` +
    `App Store link: ${url || '(none)'}\n` +
    `${listing ? `App Store listing:\n${listing}` : ''}` +
    `${angle ? `\n\nCreator's angle: ${angle}` : ''}`;

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
    const posts: Posts = Schema.parse(JSON.parse(textBlock.text));
    return NextResponse.json({ posts });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Génération impossible' }, { status: 502 });
  }
}
