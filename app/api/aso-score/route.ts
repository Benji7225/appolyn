import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { auditMetadata, computeKeywordMetrics, type RankedApp } from '@/lib/aso';

// Automatic, FREE ASO score for one locale. No AI: it combines the structural
// audit with the REAL keyword competitiveness from Apple's public iTunes Search
// API (per country). A keyword that is saturated and the app can't realistically
// rank for drags the score down — so a perfect 100 needs both perfect structure
// AND relevant, winnable keywords. Cached by content hash so iTunes is only hit
// when a locale's metadata changes.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const WASTEFUL = new Set(['app', 'apps', 'the', 'and', 'for', 'with', 'your', 'free', 'best', 'top', 'a', 'an', 'of', 'to', 'in', 'on', 'is', 'it', 'le', 'la', 'les', 'de', 'des', 'et', 'un', 'une']);

type KwBreak = { term: string; difficulty: number; popularity: number; ranks: boolean; verdict: string };

// 0..1 value of a keyword for THIS app, from real competition data.
function termValue(difficulty: number, popularity: number, ranks: boolean): { v: number; verdict: string } {
  let v: number;
  let verdict: string;
  if (difficulty <= 35) { v = 1.0; verdict = 'jouable'; }
  else if (difficulty <= 55) { v = 0.7; verdict = 'accessible'; }
  else if (difficulty <= 70) { v = 0.45; verdict = 'difficile'; }
  else if (difficulty <= 85) { v = 0.25; verdict = 'très difficile'; }
  else { v = 0.1; verdict = 'saturé'; }
  if (ranks) { v = Math.min(1, v + 0.2); verdict = 'tu rankes'; }
  if (popularity < 8) { v = Math.min(v, 0.5); verdict = 'peu recherché'; } // ranking for something nobody searches
  return { v, verdict };
}

async function searchITunes(term: string, country: string): Promise<RankedApp[]> {
  try {
    const r = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=software&limit=50`,
      { headers: { 'User-Agent': 'Appolyn/1.0' } },
    );
    if (!r.ok) return [];
    const data = await r.json() as { results?: Record<string, unknown>[] };
    return (data.results ?? []).map((a) => ({
      trackId: a.trackId as number, trackName: a.trackName as string, userRatingCount: a.userRatingCount as number,
    }));
  } catch { return []; }
}

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { locale?: string; country?: string; ascAppId?: string | null; title?: string; subtitle?: string; keywords?: string; description?: string; promotional_text?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const locale = body.locale ?? 'en-US';
  const country = (body.country ?? locale.split('-')[1] ?? 'us').toLowerCase();
  const fields = {
    title: (body.title ?? '').trim(), subtitle: (body.subtitle ?? '').trim(),
    keywords: (body.keywords ?? '').trim(), description: (body.description ?? '').trim(),
    promotional_text: (body.promotional_text ?? '').trim(),
  };

  if (!fields.title && !fields.subtitle && !fields.keywords && !fields.description) {
    return NextResponse.json({ score: 0, verdict: 'Cette langue est vide.', issues: ['Aucun contenu à analyser.'], keywords: [], weak: [], cached: false });
  }

  const hash = createHash('sha256')
    .update([locale, country, body.ascAppId ?? '', fields.title, fields.subtitle, fields.keywords, fields.description.slice(0, 2000), fields.promotional_text].join(''))
    .digest('hex').slice(0, 32);

  const { data: cached } = await supabase
    .from('aso_scores').select('score,verdict,issues,keyword_suggestions')
    .eq('locale', locale).eq('content_hash', hash).maybeSingle();
  if (cached) {
    const c = cached as Record<string, unknown>;
    const kws = (c.keyword_suggestions ?? []) as KwBreak[];
    return NextResponse.json({ score: c.score, verdict: c.verdict, issues: c.issues ?? [], keywords: kws, weak: kws.filter((k) => k.verdict === 'saturé' || k.verdict === 'très difficile').map((k) => k.term), cached: true });
  }

  // Structural audit (free, instant).
  const audit = auditMetadata(fields);

  // Keyword terms to test against real competition.
  let terms = fields.keywords.split(',').map((t) => t.trim().toLowerCase()).filter((t) => t.length >= 2 && !WASTEFUL.has(t));
  if (terms.length === 0) {
    const words = `${fields.title} ${fields.subtitle}`.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    terms = Array.from(new Set(words)).filter((w) => w.length >= 3 && !WASTEFUL.has(w));
  }
  terms = Array.from(new Set(terms)).slice(0, 10);

  // Evaluate each term against the live store, bounded concurrency.
  const breakdown: KwBreak[] = new Array(terms.length);
  let i = 0;
  const worker = async () => {
    while (i < terms.length) {
      const idx = i++;
      const term = terms[idx];
      const apps = await searchITunes(term, country);
      const m = computeKeywordMetrics(apps, term, body.ascAppId ?? null);
      const { v, verdict } = termValue(m.difficulty, m.popularity, m.appRanking != null);
      breakdown[idx] = { term, difficulty: m.difficulty, popularity: m.popularity, ranks: m.appRanking != null, verdict };
      // stash value via closure map
      (breakdown[idx] as KwBreak & { _v?: number })._v = v;
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, terms.length) }, worker));

  const K = breakdown.length
    ? breakdown.reduce((s, b) => s + ((b as KwBreak & { _v?: number })._v ?? 0.5), 0) / breakdown.length
    : 0.5;
  for (const b of breakdown) delete (b as KwBreak & { _v?: number })._v;

  // Final: keyword effectiveness gates the structural score. K=1 -> full; K=0 -> 40%.
  const score = Math.max(0, Math.min(100, Math.round(audit.score * (0.4 + 0.6 * K))));

  const weak = breakdown.filter((b) => b.verdict === 'saturé' || b.verdict === 'très difficile').map((b) => b.term);
  const winnable = breakdown.filter((b) => b.verdict === 'jouable' || b.verdict === 'accessible' || b.verdict === 'tu rankes').length;
  const verdict = breakdown.length
    ? `${winnable}/${breakdown.length} mots-clés réellement jouables sur ${country.toUpperCase()}`
    : 'Aucun mot-clé à évaluer.';

  const issues = [
    ...audit.findings.slice(0, 4).map((f) => f.message),
    ...weak.map((t) => {
      const b = breakdown.find((x) => x.term === t)!;
      return `Mot-clé trop concurrentiel : « ${t} » (difficulté ${b.difficulty}/100 sur ${country.toUpperCase()}). Vise un terme plus précis.`;
    }),
  ];

  await supabase.from('aso_scores').upsert({
    user_id: user.id, locale, content_hash: hash, score, verdict,
    issues, keyword_suggestions: breakdown, suggested_title: '', suggested_subtitle: '', suggested_keywords: '',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,locale,content_hash' });

  return NextResponse.json({ score, verdict, issues, keywords: breakdown, weak, cached: false });
}
