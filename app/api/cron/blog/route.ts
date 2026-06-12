import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Daily SEO blog generator. Triggered by Supabase pg_cron (which sends the shared
// CRON_SECRET from the vault) and runs with the service role so it can insert a
// published post. One real, useful article about App Store Optimization / indie
// app growth, woven naturally around Appolyn. No fabricated stats — it's advice.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MODEL = 'claude-sonnet-4-6';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TOPICS = [
  'How the App Store actually ranks your app: title, subtitle and keyword field explained',
  'App Store keyword research without guessing: a practical method for indie developers',
  'Localizing your App Store listing into every language (and why it multiplies downloads)',
  'Your subtitle is probably wasted keyword space. Here is how to fix it',
  'Reading your App Store sales and proceeds reports like a pro',
  'Replying to App Store reviews to lift your rating and retention',
  'Competitor research on the App Store: what to track and why',
  'The indie developer ASO checklist before every release',
  'Promotional text: the App Store field you can change anytime without a review',
  'From zero to your first 100 downloads: an indie launch playbook',
  'Why keyword stuffing hurts you, and what to do instead',
  'Screenshots and first impressions: turning store visits into installs',
  'Singular vs plural keywords and other small ASO mistakes that cost you ranks',
  'Pricing and free trials for a small subscription app',
];

const GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-fuchsia-600',
];

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);

type Block = { type: 'heading' | 'paragraph' | 'list' | 'quote' | 'cta'; text?: string; items?: string[]; label?: string; href?: string };

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    excerpt: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    read_minutes: { type: 'integer' },
    body: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['heading', 'paragraph', 'list', 'quote', 'cta'] },
          text: { type: 'string' },
          items: { type: 'array', items: { type: 'string' } },
          label: { type: 'string' },
          href: { type: 'string' },
        },
        required: ['type'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'excerpt', 'tags', 'read_minutes', 'body'],
  additionalProperties: false,
} as const;

async function run(req: NextRequest) {
  if (!SERVICE_ROLE) return NextResponse.json({ error: 'Service role non configuré.' }, { status: 503 });
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // Auth: the expected secret lives in the vault; only the service role can read
  // it, so an anonymous caller cannot trigger generation.
  const { data: expected } = await sb.rpc('appolyn_cron_secret');
  const auth = req.headers.get('authorization');
  if (!expected || auth !== `Bearer ${expected}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Anthropic key not configured.' }, { status: 503 });

  // Rotate topics by how many posts already exist, so we cover the list.
  const { count } = await sb.from('blog_posts').select('id', { count: 'exact', head: true });
  const n = count ?? 0;
  const topic = TOPICS[n % TOPICS.length];
  const gradient = GRADIENTS[n % GRADIENTS.length];

  const system =
    'You write the official Appolyn blog. Appolyn is an all-in-one App Store Optimization (ASO) ' +
    'tool for indie iOS developers: it optimizes and publishes App Store metadata in every ' +
    'language in one click, shows real sales and subscription analytics from App Store Connect, ' +
    'tracks competitors, and helps reply to reviews. Write a genuinely useful, specific, ' +
    'non-generic article for indie developers. British/American English, confident and clear, no ' +
    'fluff, no fake statistics or made-up numbers. Mention Appolyn naturally once or twice where ' +
    'it truly helps, never spammy. Structure the article as typed blocks: use "heading" for ' +
    'section titles, "paragraph" for prose, "list" with items for steps/bullet points, "quote" ' +
    'for a key takeaway, and exactly ONE "cta" block near the end with a short label inviting the ' +
    'reader to try Appolyn (set href to "/"). Aim for 700-1100 words. Return only the schema fields.';

  const user =
    `Write today's article on this topic: "${topic}".\n` +
    'Give it a compelling, specific title (you may rephrase the topic), a one-sentence excerpt, ' +
    '3-5 lowercase tags, an integer read_minutes, and the body blocks. Start with a strong ' +
    'opening paragraph (this is shown as the preview), then well-structured sections.';

  const client = new Anthropic({ apiKey });
  let parsed: { title: string; excerpt: string; tags: string[]; read_minutes: number; body: Block[] };
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      thinking: { type: 'disabled' },
      system,
      messages: [{ role: 'user', content: user }],
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA }, effort: 'low' },
    } as Anthropic.MessageCreateParamsNonStreaming);
    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) throw new Error('No content');
    parsed = JSON.parse(textBlock.text);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Generation failed' }, { status: 502 });
  }

  // Unique slug (append a counter if the base is taken).
  const base = slugify(parsed.title) || `post-${Date.now()}`;
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const { data: clash } = await sb.from('blog_posts').select('id').eq('slug', slug).maybeSingle();
    if (!clash) break;
    slug = `${base}-${i}`;
  }

  const { data: inserted, error } = await sb.from('blog_posts').insert({
    slug,
    title: parsed.title,
    excerpt: parsed.excerpt ?? '',
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
    cover_gradient: gradient,
    body: parsed.body ?? [],
    read_minutes: Math.max(2, Math.min(20, parsed.read_minutes || 4)),
    status: 'published',
    published_at: new Date().toISOString(),
  }).select('slug').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ created: inserted?.slug, topic });
}

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest) { return run(req); }
