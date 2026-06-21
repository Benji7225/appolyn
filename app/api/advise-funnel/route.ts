import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Conseil IA sur un parcours (onboarding ou paywall) à partir des VRAIES données
// SDK. Renvoie un diagnostic + des leviers concrets + un PROMPT prêt à coller que
// le dev donne à SON IA pour appliquer le correctif. On ne pousse JAMAIS de code :
// Appolyn conseille, le dev (ou son IA) applique. Clé Anthropic côté serveur.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-4-6';

const Schema = z.object({
  diagnosis: z.string(),
  actions: z.array(z.string()),
  prompt: z.string(),
});
type Advice = z.infer<typeof Schema>;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    diagnosis: { type: 'string' },
    actions: { type: 'array', items: { type: 'string' } },
    prompt: { type: 'string' },
  },
  required: ['diagnosis', 'actions', 'prompt'],
  additionalProperties: false,
} as const;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Step = { name: string; reached: number; pct: number; dropFromPrev: number };
type Paywall = { id: string; viewers: number; buyers: number; conv: number };

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "L'IA n'est pas configurée sur le serveur." }, { status: 503 });

  let body: { kind?: string; appName?: string; steps?: Step[]; paywalls?: Paywall[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }); }

  const kind = body.kind === 'paywall' ? 'paywall' : 'onboarding';
  const appName = (body.appName ?? '').trim();

  // Décrit les VRAIES données du parcours pour l'IA (jamais de chiffre inventé).
  let dataDesc = '';
  if (kind === 'onboarding') {
    const steps = (body.steps ?? []).filter((s) => s && s.name);
    if (steps.length < 2) return NextResponse.json({ error: "Pas assez d'écrans suivis pour conseiller. Branche le SDK et marque tes écrans d'onboarding." }, { status: 400 });
    dataDesc =
      "Entonnoir d'onboarding réel (écrans dans l'ordre, % atteint relatif au 1er écran, décrochage vs écran précédent) :\n" +
      steps.map((s, i) => `${i + 1}. ${s.name} — ${s.pct}% atteints${i > 0 && s.dropFromPrev > 0 ? `, -${s.dropFromPrev}% vs écran précédent` : ''}`).join('\n');
  } else {
    const paywalls = (body.paywalls ?? []).filter((p) => p && p.id);
    if (paywalls.length === 0) return NextResponse.json({ error: 'Pas de données de paywall. Branche le SDK et signale les vues/achats de tes paywalls.' }, { status: 400 });
    dataDesc =
      'Conversion réelle des paywalls (vue → achat, par paywall) :\n' +
      paywalls.map((p) => `- ${p.id} : ${Math.round(p.conv * 100)}% (${p.buyers} achats / ${p.viewers} vues)`).join('\n');
  }

  const system =
    'You are a senior mobile growth & UX expert for indie app makers. ' +
    `From the maker's REAL ${kind === 'onboarding' ? 'onboarding funnel' : 'paywall conversion'} data, give: ` +
    'diagnosis = 1-2 sentences pinpointing WHERE the biggest leak is and a likely why (concrete, tied to the data, no fluff). ' +
    'actions = 2 to 4 concrete, prioritized levers to fix it (specific, not generic advice). ' +
    'prompt = a ready-to-paste prompt the maker can give to THEIR OWN AI coding assistant to implement the top fix in their app ' +
    '(describe the change to make, not the exact code; their AI will adapt it to their codebase). ' +
    'CRITICAL: never claim to change their code yourself; Appolyn advises, the maker (or their AI) applies. ' +
    'Write everything in FRENCH, simple and concrete, zero jargon. Tutoiement.';

  const userMsg =
    `App : ${appName || '(sans nom)'}\n\n${dataDesc}`;

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
    const parsed: Advice = Schema.parse(JSON.parse(textBlock.text));
    return NextResponse.json({ advice: { ...parsed, actions: parsed.actions.slice(0, 4) } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Conseil impossible' }, { status: 502 });
  }
}
