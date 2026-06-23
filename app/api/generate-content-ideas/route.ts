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

// Idée RICHE : un package prêt à tourner/poster, pas un blob de 2 lignes. Tous les
// champs sont retournés (vides quand non pertinents pour le type) pour rester
// compatible avec le mode strict du json_schema.
const Schema = z.object({
  ideas: z.array(z.object({
    format: z.string(),
    duration: z.string(),
    hook: z.string(),
    beats: z.array(z.string()),
    onScreenText: z.string(),
    caption: z.string(),
    hashtags: z.array(z.string()),
    script: z.string(),
    whyItWorks: z.string(),
  })),
});
type Ideas = z.infer<typeof Schema>;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ideas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          format: { type: 'string' },
          duration: { type: 'string' },
          hook: { type: 'string' },
          beats: { type: 'array', items: { type: 'string' } },
          onScreenText: { type: 'string' },
          caption: { type: 'string' },
          hashtags: { type: 'array', items: { type: 'string' } },
          script: { type: 'string' },
          whyItWorks: { type: 'string' },
        },
        required: ['format', 'duration', 'hook', 'beats', 'onScreenText', 'caption', 'hashtags', 'script', 'whyItWorks'],
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

  let body: { ascAppId?: string; appName?: string; kind?: string; angle?: string; cible?: string; promo?: string; langue?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }); }
  const kind = body.kind === 'launch' ? 'launch' : 'content';
  const angle = (body.angle ?? '').trim();
  const cible = (body.cible ?? '').trim();
  const promo = (body.promo ?? '').trim();
  const langue = (body.langue ?? '').trim() || 'Français';
  const ascAppId = (body.ascAppId ?? '').trim();
  // Vraie URL App Store (jamais inventée) quand l'App ID est l'identifiant Apple numérique.
  const appStoreUrl = /^\d{5,}$/.test(ascAppId) ? `https://apps.apple.com/app/id${ascAppId}` : '';

  // AUTO : fiche réelle de l'app — App Store public, sinon App Store Connect (marche
  // AVANT la sortie de l'app). Le dev n'a rien à décrire.
  const { appName: fetchedName, genre, listing: appDesc } = await getAppListing(ascAppId, token);
  const appName = (body.appName ?? '').trim() || fetchedName;
  if (!appDesc) return NextResponse.json({ error: "Impossible de lire la fiche de ton app (ni App Store public, ni App Store Connect). Vérifie ton App ID + ta clé ASC." }, { status: 400 });

  const brief = [
    angle && angle !== 'auto' ? `Angle/format souhaité : ${angle}` : '',
    cible && cible !== 'auto' ? `Cible : ${cible}` : '',
    promo && promo !== 'aucune' ? `À mettre en avant : ${promo}` : '',
  ].filter(Boolean).join('\n');

  // Règles de qualité communes : on veut du PRÊT À POSTER, pas du texte d'IA.
  const quality =
    `Write EVERYTHING in ${langue} (titles, hooks, scripts) — natural, native-level. ` +
    'CRITICAL quality rules: ' +
    'plain text only, NO markdown, NO asterisks (** or *), NO bold/headings symbols, NO hashtags spam, NO emoji spam. ' +
    'Sound like a real indie maker talking, NOT like an AI. ' +
    'BANNED clichés: "Disponible dès maintenant", "Ne manquez pas", "Téléchargez dès aujourd\'hui", "Révolutionnez", "boostez", "game-changer", "in today\'s world". ' +
    'Be concrete and specific to THIS app (use real details from its listing). Every idea must be clearly DIFFERENT from the others, zero repetition of the same angle, hook or sentence. ' +
    (appStoreUrl
      ? `When you need the download link, use EXACTLY this URL: ${appStoreUrl} — never invent another URL, never write a placeholder.`
      : 'Do NOT invent an App Store URL or a placeholder link; if a link is needed, just say "lien dans la bio".');

  const system = kind === 'launch'
    ? 'You are a launch strategist for indie app makers. From the app\'s real App Store listing, write 4 ready-to-post launch announcements, one per platform. ' +
      'For each idea return these fields: ' +
      'format = the platform ("Product Hunt", "Reddit", "X / Twitter", "LinkedIn"); ' +
      'hook = a strong headline/first line; ' +
      'script = the FULL post ready to paste, adapted to that platform\'s tone and length, with a clear call to download; ' +
      'whyItWorks = one short line on why this post fits that platform and audience. ' +
      'Leave these fields EMPTY: duration = "", beats = [], onScreenText = "", caption = "", hashtags = []. ' +
      'Honest and human, no hype. Each post clearly different. Return exactly 4 ideas. ' + quality
    : 'You are a short-form content strategist for indie app makers (TikTok, Reels, YouTube Shorts). From the app\'s real App Store listing, ' +
      'generate 6 distinct, scroll-stopping video ideas to promote it organically. The maker\'s superpower is HOOKS, so make every hook outstanding and specific. ' +
      'For each idea return these fields: ' +
      'format = the video format (e.g. "problème → solution", "POV", "avant/après", "j\'ai testé", "démo 15s", "storytime", "3 erreurs"); ' +
      'duration = a suggested length like "15-20s"; ' +
      'hook = the punchy first 3 seconds that stops the scroll (concrete, specific to this app, never generic "téléchargez mon app"); ' +
      'beats = 3 to 5 SHORT shootable steps in order — a real shot list, each step says what to show AND what to say, so the maker films it right away; ' +
      'onScreenText = the big on-screen caption to overlay (short, punchy, the kind that keeps people watching); ' +
      'caption = the post caption ready to paste (1-2 natural sentences ending on a soft CTA); ' +
      'hashtags = 4 to 6 specific, relevant hashtags, lowercase, each starting with # (no spam, no generic #fyp stuffing); ' +
      'whyItWorks = one short line on why this hook/format converts. ' +
      'Leave script EMPTY ("") for video ideas. ' +
      'Vary the angles HARD — no two ideas share the same hook, format or angle. Return exactly 6 ideas. ' + quality;

  const userMsg =
    `App : ${appName || '(sans nom)'}${genre ? `\nCatégorie : ${genre}` : ''}` +
    `${appStoreUrl ? `\nLien App Store (à utiliser tel quel) : ${appStoreUrl}` : ''}` +
    `${appDesc ? `\nFiche App Store :\n${appDesc}` : ''}` +
    `${brief ? `\n\nContraintes du créateur :\n${brief}` : ''}`;

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 3500,
      thinking: { type: 'disabled' },
      system,
      messages: [{ role: 'user', content: userMsg }],
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA }, effort: 'low' },
    } as Anthropic.MessageCreateParamsNonStreaming);
    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) throw new Error('No content');
    const parsed: Ideas = Schema.parse(JSON.parse(textBlock.text));
    // Ceinture + bretelles : on retire tout reste de markdown gras (** ou *) que le
    // modèle aurait laissé, pour que ça ne fasse jamais "généré par une IA". On vide
    // aussi les champs non pertinents pour que le front les masque proprement.
    const clean = (s: string) => (s || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/(?<!\w)\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, '$1').trim();
    const ideas = parsed.ideas.slice(0, 12).map((i) => ({
      format: clean(i.format),
      duration: clean(i.duration),
      hook: clean(i.hook),
      beats: (i.beats ?? []).map(clean).filter(Boolean),
      onScreenText: clean(i.onScreenText),
      caption: clean(i.caption),
      hashtags: (i.hashtags ?? []).map((h) => clean(h).replace(/^#*/, '#')).filter((h) => h.length > 1),
      script: clean(i.script),
      whyItWorks: clean(i.whyItWorks),
    }));
    return NextResponse.json({ ideas });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Génération impossible' }, { status: 502 });
  }
}
