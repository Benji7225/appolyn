import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCanvas, loadImage, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';

// Renders one screenshot with its legend swapped for a translated one: erase the
// old legend (fill its box with the detected background colour) and redraw the
// translated text, auto-sized to fit the same box, in the same colour/alignment.
// The other pixels of the screenshot are untouched. The right font is chosen per
// script (Latin/Cyrillic/Greek bundled; Arabic/Hebrew/Thai/Devanagari/CJK fetched
// on demand and cached) so non-Latin languages render instead of showing tofu.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const LATIN_FAMILY = 'AppolynLatin';
const CDN = 'https://cdn.jsdelivr.net/gh';
// Script → font. First match wins; order matters (kana before Han so Japanese
// uses the JP face). CJK files are large and jsDelivr may refuse them — in that
// case registration fails gracefully and the caller is told it's unsupported.
const SCRIPT_FONTS: { test: RegExp; family: string; url: string }[] = [
  { test: /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/, family: 'AppolynArabic', url: `${CDN}/googlefonts/noto-fonts/hinted/ttf/NotoSansArabic/NotoSansArabic-Bold.ttf` },
  { test: /[֐-׿יִ-ﭏ]/, family: 'AppolynHebrew', url: `${CDN}/googlefonts/noto-fonts/hinted/ttf/NotoSansHebrew/NotoSansHebrew-Bold.ttf` },
  { test: /[฀-๿]/, family: 'AppolynThai', url: `${CDN}/googlefonts/noto-fonts/hinted/ttf/NotoSansThai/NotoSansThai-Bold.ttf` },
  { test: /[ऀ-ॿ]/, family: 'AppolynDeva', url: `${CDN}/googlefonts/noto-fonts/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Bold.ttf` },
  { test: /[぀-ヿ]/, family: 'AppolynJP', url: `${CDN}/notofonts/noto-cjk/Sans/OTF/Japanese/NotoSansCJKjp-Bold.otf` },
  { test: /[가-힯ᄀ-ᇿ]/, family: 'AppolynKR', url: `${CDN}/notofonts/noto-cjk/Sans/OTF/Korean/NotoSansCJKkr-Bold.otf` },
  { test: /[一-鿿㐀-䶿豈-﫿]/, family: 'AppolynSC', url: `${CDN}/notofonts/noto-cjk/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Bold.otf` },
];

const fontCache = new Map<string, Buffer>();
const registered = new Set<string>();

async function registerFont(family: string, url: string, origin: string): Promise<boolean> {
  if (registered.has(family)) return true;
  try {
    let buf = fontCache.get(family);
    if (!buf) {
      const res = await fetch(url.startsWith('/') ? `${origin}${url}` : url);
      if (!res.ok) return false;
      buf = Buffer.from(await res.arrayBuffer());
      fontCache.set(family, buf);
    }
    GlobalFonts.register(buf, family);
    registered.add(family);
    return true;
  } catch { return false; }
}

// Returns the font family to use for this text, registering it if needed. null
// means the script has no usable font (e.g. a CJK file that couldn't be fetched).
async function resolveFont(text: string, origin: string): Promise<string | null> {
  for (const f of SCRIPT_FONTS) {
    if (f.test.test(text)) return (await registerFont(f.family, f.url, origin)) ? f.family : null;
  }
  return (await registerFont(LATIN_FAMILY, '/fonts/NotoSans-Bold.ttf', origin)) ? LATIN_FAMILY : null;
}

// Word-wrap that also breaks by character, so scripts without spaces (CJK, Thai)
// still wrap inside the box instead of overflowing.
function wrap(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const seg of text.split(/(\s+)/)) {
    if (seg === '') continue;
    if (/^\s+$/.test(seg)) { if (cur && ctx.measureText(`${cur} `).width <= maxWidth) cur += ' '; continue; }
    let word = seg;
    while (word) {
      if (ctx.measureText(cur + word).width <= maxWidth) { cur += word; word = ''; }
      else if (!cur) {
        let i = 1;
        while (i < word.length && ctx.measureText(word.slice(0, i + 1)).width <= maxWidth) i++;
        lines.push(word.slice(0, i));
        word = word.slice(i);
      } else { lines.push(cur.trimEnd()); cur = ''; }
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.length ? lines : [text];
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

  try {
    const family = await resolveFont(text, new URL(req.url).origin);
    if (!family) return NextResponse.json({ supported: false, reason: 'font' });

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
      ctx.font = `${size}px ${family}`;
      lines = wrap(ctx, text, innerW);
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const totalH = lines.length * size * 1.18;
      if (widest <= innerW && totalH <= ph * 0.92) break;
      size -= 2;
    }

    ctx.fillStyle = body.color || '#000000';
    ctx.font = `${size}px ${family}`;
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
