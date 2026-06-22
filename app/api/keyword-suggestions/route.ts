import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeKeywordMetrics, type RankedApp } from '@/lib/aso';

// Suggestions de mots-clés GAGNABLES (reverse-ASO), 100% réel : on extrait des
// candidats de la VRAIE fiche App Store de l'app (titre + description + catégorie) et
// des noms de ses concurrents suivis, on score chacun sur la concurrence iTunes RÉELLE
// (par pays), et on ne renvoie que des termes peu concurrentiels, demandés, et PAS
// déjà suivis. Aucune invention.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const STOP = new Set([
  'app', 'apps', 'application', 'avec', 'pour', 'vous', 'votre', 'vos', 'tous', 'toutes', 'tout', 'toute',
  'des', 'les', 'une', 'un', 'and', 'the', 'for', 'with', 'your', 'you', 'this', 'that', 'from', 'are', 'our',
  'plus', 'sans', 'dans', 'sur', 'par', 'est', 'son', 'ses', 'qui', 'que', 'aux', 'leur', 'leurs', 'free', 'best',
  'top', 'new', 'now', 'get', 'can', 'all', 'plus', 'pro', 'mode', 'temps', 'jour', 'jours', 'chaque', 'plein',
  'not', 'day', 'days', 'non', 'off', 'out', 'via', 'set', 'use', 'etc', 'fait', 'faire', 'être', 'avoir', 'when', 'will',
]);

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const ok = (w: string) => w.length >= 3 && w.length <= 20 && !STOP.has(w) && !/^\d+$/.test(w);

// Extrait des candidats (uni + bigrammes) d'un texte, pondérés par fréquence.
function candidatesFrom(text: string, weight: number, acc: Map<string, number>) {
  const words = (norm(text).match(/[a-z0-9]+/g) ?? []).filter((w) => w.length >= 3);
  for (let i = 0; i < words.length; i++) {
    if (ok(words[i])) acc.set(words[i], (acc.get(words[i]) ?? 0) + weight);
    if (i + 1 < words.length && ok(words[i]) && ok(words[i + 1])) {
      const bg = `${words[i]} ${words[i + 1]}`;
      acc.set(bg, (acc.get(bg) ?? 0) + weight * 1.4); // un bigramme précis vaut plus
    }
  }
}

async function searchITunes(term: string, country: string): Promise<RankedApp[]> {
  try {
    const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=software&limit=50`, { headers: { 'User-Agent': 'Appolyn/1.0' } });
    if (!r.ok) return [];
    const j = await r.json() as { results?: Record<string, unknown>[] };
    return (j.results ?? []).map((a) => ({ trackId: a.trackId as number, trackName: a.trackName as string, userRatingCount: a.userRatingCount as number }));
  } catch { return []; }
}

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { appId?: string; ascAppId?: string; country?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const appId = (body.appId ?? '').trim();
  const ascAppId = (body.ascAppId ?? '').trim();
  const country = (body.country ?? 'fr').toLowerCase();
  if (!ascAppId) return NextResponse.json({ error: 'App ID manquant.' }, { status: 400 });

  // 1) Fiche App Store réelle (titre + description + catégorie).
  let appData: { trackName?: string; description?: string; primaryGenreName?: string } | null = null;
  for (const cc of Array.from(new Set([country, 'us', 'gb']))) {
    try {
      const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(ascAppId)}&country=${cc}`, { headers: { 'User-Agent': 'Appolyn/1.0' } });
      const j = await r.json() as { results?: { trackName?: string; description?: string; primaryGenreName?: string }[] };
      if (j.results?.[0]) { appData = j.results[0]; break; }
    } catch { /* store suivant */ }
  }

  // 2) Mots-clés déjà suivis (à exclure) + concurrents (source de termes).
  const db = sb as unknown as { from: (t: string) => any };
  const [{ data: tracked }, { data: comps }] = await Promise.all([
    appId ? db.from('keyword_searches').select('keyword').eq('app_id', appId) : Promise.resolve({ data: [] }),
    appId ? db.from('competitors').select('name').eq('app_id', appId) : Promise.resolve({ data: [] }),
  ]);
  const trackedSet = new Set(((tracked ?? []) as { keyword: string }[]).map((k) => norm(k.keyword).trim()));

  // 3) Construction des candidats.
  const acc = new Map<string, number>();
  if (appData?.trackName) candidatesFrom(appData.trackName, 3, acc);
  if (appData?.primaryGenreName) candidatesFrom(appData.primaryGenreName, 2, acc);
  if (appData?.description) candidatesFrom(appData.description.slice(0, 2000), 1, acc);
  for (const c of (comps ?? []) as { name: string }[]) if (c.name) candidatesFrom(c.name, 2, acc);

  // Marque de l'app (1er mot du titre) à ne pas suggérer comme mot-clé.
  const brand = norm(appData?.trackName ?? '').split(/[^a-z0-9]+/).filter(Boolean)[0] ?? '';

  const candidates = Array.from(acc.entries())
    .filter(([term]) => !trackedSet.has(term) && term !== brand && !(term.split(' ').length === 1 && term === brand))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([term]) => term);

  if (candidates.length === 0) return NextResponse.json({ suggestions: [] });

  // 4) Score réel de chaque candidat (concurrence iTunes), concurrence bornée.
  type Scored = { term: string; difficulty: number; popularity: number };
  const scored: Scored[] = new Array(candidates.length);
  let idx = 0;
  const worker = async () => {
    while (idx < candidates.length) {
      const i = idx++;
      const term = candidates[i];
      const apps = await searchITunes(term, country);
      const m = computeKeywordMetrics(apps, term, ascAppId);
      scored[i] = { term, difficulty: m.difficulty, popularity: m.popularity };
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, candidates.length) }, worker));

  // 5) On garde les GAGNABLES (peu concurrentiels) et DEMANDÉS, triés par valeur.
  const suggestions = scored
    .filter((s) => s && s.difficulty <= 55 && s.popularity >= 6)
    .map((s) => ({ ...s, value: Math.round(s.popularity * (1 - s.difficulty / 100)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return NextResponse.json({ suggestions, country });
}
