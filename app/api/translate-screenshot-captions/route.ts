import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// The "brain" of screenshot translation. Given one App Store screenshot, Claude
// (vision) locates the big marketing headline (the "legend") — and ONLY that, not
// the device status bar or the in-app UI text — reads its position/colour/style,
// then translates it into every target locale, ASO-adapted (not literal). The
// renderer uses the box + style to erase the old legend and redraw the translated
// one. Runs server-side so the Anthropic key never reaches the browser.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-4-6';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ResultSchema = z.object({
  found: z.boolean(),
  legend: z.string(),
  bbox: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  color: z.string(),
  background: z.string(),
  align: z.enum(['left', 'center', 'right']),
  weight: z.enum(['regular', 'medium', 'bold', 'heavy']),
  translations: z.array(z.object({ locale: z.string(), text: z.string() })),
});

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    found: { type: 'boolean' },
    legend: { type: 'string' },
    bbox: {
      type: 'object',
      properties: { x: { type: 'number' }, y: { type: 'number' }, w: { type: 'number' }, h: { type: 'number' } },
      required: ['x', 'y', 'w', 'h'],
      additionalProperties: false,
    },
    color: { type: 'string' },
    background: { type: 'string' },
    align: { type: 'string', enum: ['left', 'center', 'right'] },
    weight: { type: 'string', enum: ['regular', 'medium', 'bold', 'heavy'] },
    translations: {
      type: 'array',
      items: {
        type: 'object',
        properties: { locale: { type: 'string' }, text: { type: 'string' } },
        required: ['locale', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['found', 'legend', 'bbox', 'color', 'background', 'align', 'weight', 'translations'],
  additionalProperties: false,
} as const;

type Target = { code: string; label: string };

export async function POST(req: NextRequest) {
  // Auth: require a valid Supabase session (no anonymous use of the AI endpoint).
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI is not configured yet.' }, { status: 503 });

  let body: {
    imageUrl?: string;
    imageBase64?: string;
    mediaType?: string;
    appName?: string;
    sourceLabel?: string;
    targets?: Target[];
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const targets = body.targets ?? [];
  if (!body.imageUrl && !body.imageBase64) return NextResponse.json({ error: 'A screenshot image is required.' }, { status: 400 });
  if (targets.length === 0) return NextResponse.json({ error: 'No target languages provided.' }, { status: 400 });

  // Pass the image as base64 (works on every SDK version, and ASC image URLs can
  // expire). When given a URL we fetch it server-side and encode it ourselves.
  let imgData: string;
  let mediaType = body.mediaType ?? 'image/png';
  if (body.imageBase64) {
    imgData = body.imageBase64;
  } else {
    const imgRes = await fetch(body.imageUrl!);
    if (!imgRes.ok) return NextResponse.json({ error: 'Could not fetch the screenshot image.' }, { status: 400 });
    const ct = imgRes.headers.get('content-type') ?? '';
    if (/image\/(png|jpe?g|webp)/.test(ct)) mediaType = ct.split(';')[0];
    imgData = Buffer.from(await imgRes.arrayBuffer()).toString('base64');
  }
  const imageBlock: Anthropic.ImageBlockParam = {
    type: 'image',
    source: { type: 'base64', media_type: mediaType as 'image/png', data: imgData },
  };

  const system =
    'You are an App Store Optimization expert and a meticulous designer. You are given ONE App Store ' +
    'screenshot image. Your job: find the single BIG marketing headline (the "legend") overlaid on it ' +
    '— the large promotional text, usually one short line or two. IGNORE everything else: the iOS status ' +
    'bar, the time/battery, and any text that belongs to the app UI shown inside the phone. If there is no ' +
    'clear big headline, set found=false.\n\n' +
    'Report, for that headline only:\n' +
    '- legend: its exact text (source language).\n' +
    '- bbox: its bounding box as fractions of the image (x,y = top-left corner, w,h = width/height), each 0..1.\n' +
    '- color: the headline text colour as a #RRGGBB hex.\n' +
    '- background: the solid colour directly behind the headline as #RRGGBB (sample the band/area under the text, NOT the phone).\n' +
    '- align: left, center or right.\n' +
    '- weight: regular, medium, bold or heavy.\n\n' +
    'Then translate the headline into each target language. This is ASO copy, NOT a literal translation: ' +
    'localize naturally for that market, keep it punchy and SHORT (roughly the same length as the source so ' +
    'it fits the same space), prefer terms local users actually search, avoid awkward over-stuffed keywords, ' +
    'keep brand/product names intact. Return one translation per requested locale.';

  const userPrompt =
    `${body.appName ? `App: ${body.appName}\n` : ''}` +
    `Source language: ${body.sourceLabel ?? 'unknown'}\n` +
    `Target locales (code — name): ${targets.map((t) => `${t.code} — ${t.label}`).join(', ')}\n\n` +
    'Analyse the screenshot and produce the JSON.';

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      thinking: { type: 'disabled' },
      system,
      messages: [{ role: 'user', content: [imageBlock, { type: 'text', text: userPrompt }] }],
      output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA }, effort: 'low' },
    } as Anthropic.MessageCreateParamsNonStreaming);

    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) return NextResponse.json({ error: 'No content returned' }, { status: 502 });
    const parsed = ResultSchema.parse(JSON.parse(textBlock.text));
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Translation failed' }, { status: 500 });
  }
}
