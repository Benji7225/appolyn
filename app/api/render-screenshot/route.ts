import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCanvas, loadImage, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';

// Renders one screenshot with its legend swapped for a translated one: erase the
// old legend (fill its box with the detected background colour) and redraw the
// translated text, auto-sized to fit the same box, in the same colour/alignment.
// The other pixels of the screenshot are untouched.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const FONT_FAMILY = 'AppolynLegend';
// The bundled bold font (Noto Sans) covers Latin, Cyrillic and Greek. Anything
// outside that (CJK, Arabic, Hebrew, Thai, Devanagari…) would render as tofu, so
// we report it unsupported instead and the UI keeps the translated text only.
const UNSUPPORTED_SCRIPT =
  /[぀-ヿ㐀-鿿가-힯؀-ۿݐ-ݿ֐-׿฀-๿ऀ-ॿঀ-৿஀-௿＀-￯]/;

let fontReady = false;
async function ensureFont(origin: string) {
  if (fontReady) return;
  const res = await fetch(`${origin}/fonts/NotoSans-Bold.ttf`);
  if (!res.ok) throw new Error('font fetch failed');
  const buf = Buffer.from(await res.arrayBuffer());
  GlobalFonts.register(buf, FONT_FAMILY);
  fontReady = true;
}

function wrap(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (!cur || ctx.measureText(test).width <= maxWidth) cur = test;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    imageUrl?: string;
    imageBase64?: string;
    text?: string;
    bbox?: { x: number; y: number; w: number; h: number };
    color?: string;
    background?: string;
    align?: 'left' | 'center' | 'right';
  };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const text = (body.text ?? '').trim();
  const bbox = body.bbox;
  if (!text || !bbox) return NextResponse.json({ error: 'text and bbox are required.' }, { status: 400 });
  if (!body.imageUrl && !body.imageBase64) return NextResponse.json({ error: 'An image is required.' }, { status: 400 });

  if (UNSUPPORTED_SCRIPT.test(text)) {
    return NextResponse.json({ supported: false, reason: 'script' });
  }

  try {
    await ensureFont(new URL(req.url).origin);

    const imgBuf = body.imageBase64
      ? Buffer.from(body.imageBase64, 'base64')
      : Buffer.from(await (await fetch(body.imageUrl!)).arrayBuffer());
    const img = await loadImage(imgBuf);
    const W = img.width;
    const H = img.height;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, W, H);

    const px = bbox.x * W;
    const py = bbox.y * H;
    const pw = bbox.w * W;
    const ph = bbox.h * H;

    // Erase the old legend.
    ctx.fillStyle = body.background || '#ffffff';
    ctx.fillRect(Math.round(px), Math.round(py), Math.round(pw), Math.round(ph));

    // Auto-fit the translated text inside the box.
    const align = body.align ?? 'center';
    const innerW = pw * 0.94;
    let size = Math.floor(Math.min(ph, pw * 0.6));
    let lines: string[] = [text];
    while (size > 8) {
      ctx.font = `${size}px ${FONT_FAMILY}`;
      lines = wrap(ctx, text, innerW);
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const totalH = lines.length * size * 1.18;
      if (widest <= innerW && totalH <= ph * 0.92) break;
      size -= 2;
    }

    ctx.fillStyle = body.color || '#000000';
    ctx.font = `${size}px ${FONT_FAMILY}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    const lineH = size * 1.18;
    const totalH = lines.length * lineH;
    let ty = py + (ph - totalH) / 2 + lineH / 2;
    const tx = align === 'center' ? px + pw / 2 : align === 'right' ? px + pw - pw * 0.03 : px + pw * 0.03;
    for (const line of lines) { ctx.fillText(line, tx, ty); ty += lineH; }

    const out = canvas.toBuffer('image/png').toString('base64');
    return NextResponse.json({ supported: true, image: out, mediaType: 'image/png' });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'render failed' }, { status: 500 });
  }
}
