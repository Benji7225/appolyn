import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// On-demand semantic ASO review for ONE locale. Runs server-side so the Anthropic
// key stays private. Goes beyond the instant structural score: it judges semantic
// relevance AND real keyword competitiveness in the target market/language (e.g.
// "focus" is saturated in English, a long-tail term ranks better), and proposes a
// concrete, higher-scoring rewrite. It reasons qualitatively — no invented search
// volumes.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-4-6';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer' },
    verdict: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    issues: { type: 'array', items: { type: 'string' } },
    keyword_suggestions: { type: 'array', items: { type: 'string' } },
    suggested_title: { type: 'string' },
    suggested_subtitle: { type: 'string' },
    suggested_keywords: { type: 'string' },
  },
  required: ['score', 'verdict', 'strengths', 'issues', 'keyword_suggestions', 'suggested_title', 'suggested_subtitle', 'suggested_keywords'],
  additionalProperties: false,
} as const;

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI is not configured yet.' }, { status: 503 });

  let body: { locale?: string; appName?: string; title?: string; subtitle?: string; keywords?: string; description?: string; promotional_text?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const locale = body.locale ?? 'en-US';
  const system =
    'You are a senior App Store Optimization (ASO) strategist. Evaluate the metadata for ONE specific ' +
    `App Store locale: ${locale}. Judge it for THAT market and language, not in the abstract. Consider: ` +
    '(1) semantic relevance — do the title, subtitle and keywords describe what users actually search for; ' +
    '(2) real keyword competitiveness — flag terms that are too saturated/generic to realistically rank ' +
    'for in this market, and prefer specific, high-intent, lower-competition (often long-tail) terms; ' +
    '(3) coverage breadth and no wasted space (Apple indexes title + subtitle + keyword field, each word ' +
    'once); (4) conversion of the description. Be demanding and honest: reserve 90-100 only for metadata ' +
    'that is genuinely excellent and well-tuned to this market; most real listings sit 50-80. Never invent ' +
    'numeric search volumes; reason qualitatively. Then propose a concrete, higher-scoring rewrite that ' +
    'STRICTLY respects Apple limits: title <=30 chars, subtitle <=30, keywords <=100 chars total, ' +
    'comma-separated with NO spaces, no duplicates, no words already used in the title/subtitle. Write all ' +
    `suggestions in the language of ${locale}. Return only the schema fields.`;

  const u =
    `App: ${body.appName ?? '(unknown)'}\nLocale: ${locale}\n\n` +
    `Title: ${body.title ?? ''}\nSubtitle: ${body.subtitle ?? ''}\nKeywords: ${body.keywords ?? ''}\n` +
    `Description: ${(body.description ?? '').slice(0, 1500)}\nPromotional text: ${body.promotional_text ?? ''}\n\n` +
    'Score this metadata (0-100), give a one-sentence verdict, list concrete strengths and issues, ' +
    'suggest 6-10 better keyword ideas for this market, and provide an improved title, subtitle and ' +
    'keywords field.';

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      thinking: { type: 'disabled' },
      system,
      messages: [{ role: 'user', content: u }],
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA }, effort: 'low' },
    } as Anthropic.MessageCreateParamsNonStreaming);
    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) throw new Error('No content');
    const parsed = JSON.parse(textBlock.text);
    parsed.score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Review failed' }, { status: 502 });
  }
}
