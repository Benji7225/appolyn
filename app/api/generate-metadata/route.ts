import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// AI metadata localization runs server-side so the Anthropic key is never
// exposed to the browser. One Claude call per target locale, in parallel
// (bounded), each returning structured fields validated against the schema.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-4-6';

// Apple App Store metadata limits (characters).
const LIMITS = { title: 30, subtitle: 30, keywords: 100, description: 4000, promotional_text: 170 };

const LocaleFieldsSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  keywords: z.string(),
  description: z.string(),
  promotional_text: z.string(),
});

type LocaleFields = z.infer<typeof LocaleFieldsSchema>;

// JSON Schema for the structured output (Apple metadata fields).
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    subtitle: { type: 'string' },
    keywords: { type: 'string' },
    description: { type: 'string' },
    promotional_text: { type: 'string' },
  },
  required: ['title', 'subtitle', 'keywords', 'description', 'promotional_text'],
  additionalProperties: false,
} as const;

type Base = LocaleFields & { locale: string };
type Target = { code: string; label: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function clamp(value: string, max: number): string {
  return value.length > max ? value.slice(0, max).trim() : value;
}

// Keep keywords under the 100-char cap by dropping whole terms from the end,
// never cutting a word mid-way.
function clampKeywords(raw: string, max: number): string {
  const terms = raw.split(',').map((t) => t.trim()).filter(Boolean);
  const seen = new Set<string>();
  const unique = terms.filter((t) => {
    const k = t.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  let out = '';
  for (const term of unique) {
    const next = out ? `${out},${term}` : term;
    if (next.length > max) break;
    out = next;
  }
  return out;
}

function enforceLimits(f: LocaleFields): LocaleFields {
  return {
    title: clamp(f.title, LIMITS.title),
    subtitle: clamp(f.subtitle, LIMITS.subtitle),
    keywords: clampKeywords(f.keywords, LIMITS.keywords),
    description: clamp(f.description, LIMITS.description),
    promotional_text: clamp(f.promotional_text, LIMITS.promotional_text),
  };
}

async function generateForLocale(
  client: Anthropic,
  base: Base,
  target: Target,
): Promise<LocaleFields> {
  const system =
    'You are an App Store Optimization (ASO) localization expert. ' +
    'Given an app\'s base metadata, produce metadata for a target App Store locale. ' +
    'Do not translate literally: localize naturally for the target market and adapt the ' +
    'keywords to the terms local users actually search for. Keep brand/product names intact. ' +
    'Respect Apple limits STRICTLY: title <=30 characters, subtitle <=30, keywords <=100 ' +
    'characters total (comma-separated, NO spaces after commas, no duplicates, prefer singular ' +
    'forms, do not repeat words already in the title/subtitle), description <=4000, ' +
    'promotional_text <=170. Return only the requested fields.';

  const user =
    `Base locale: ${base.locale}\n` +
    `Target locale: ${target.label} (${target.code})\n\n` +
    `Base title: ${base.title}\n` +
    `Base subtitle: ${base.subtitle}\n` +
    `Base keywords: ${base.keywords}\n` +
    `Base description: ${base.description}\n` +
    `Base promotional text: ${base.promotional_text}\n\n` +
    `Produce the localized metadata for ${target.label}.`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: 'disabled' },
    system,
    messages: [{ role: 'user', content: user }],
    output_config: {
      format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
      effort: 'low',
    },
  } as Anthropic.MessageCreateParamsNonStreaming);

  const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  if (!textBlock) throw new Error('No content returned');
  const parsed = LocaleFieldsSchema.parse(JSON.parse(textBlock.text));
  return enforceLimits(parsed);
}

// Run async tasks with a bounded concurrency so a low API tier doesn't get
// rate-limited by 22 simultaneous requests.
async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = { status: 'fulfilled', value: await fn(items[idx]) };
      } catch (e) {
        results[idx] = { status: 'rejected', reason: e };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

export async function POST(req: NextRequest) {
  // Auth: require a valid Supabase session (avoids anonymous abuse of the AI endpoint).
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI is not configured yet. An Anthropic API key needs to be set on the server.' },
      { status: 503 },
    );
  }

  let body: { base?: Base; targetLocales?: Target[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const base = body.base;
  const targets = body.targetLocales ?? [];
  if (!base || !base.title?.trim()) {
    return NextResponse.json({ error: 'Fill in the base metadata first (at least a title).' }, { status: 400 });
  }
  if (targets.length === 0) {
    return NextResponse.json({ error: 'No target languages provided.' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const settled = await pool(targets, 6, (t) => generateForLocale(client, base, t));

  const localizations: Record<string, LocaleFields> = {};
  const errors: Record<string, string> = {};
  settled.forEach((r, idx) => {
    const code = targets[idx].code;
    if (r.status === 'fulfilled') localizations[code] = r.value;
    else errors[code] = r.reason instanceof Error ? r.reason.message : 'Generation failed';
  });

  return NextResponse.json({ localizations, errors });
}
