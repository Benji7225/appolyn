import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Position de l'app dans les classements App Store (catégorie + général), via les
// flux RSS publics et gratuits d'Apple. Donnée 100% réelle ; "non classé" honnête
// si l'app n'est pas dans le top 200.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const LIMIT = 200;

type RssEntry = { id?: { attributes?: { 'im:id'?: string } } };

async function rankIn(url: string, appId: string): Promise<number | null> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Appolyn/1.0' } });
    if (!r.ok) return null;
    const j = await r.json() as { feed?: { entry?: RssEntry[] } };
    const entries = j.feed?.entry ?? [];
    const idx = entries.findIndex((e) => e.id?.attributes?.['im:id'] === appId);
    return idx >= 0 ? idx + 1 : null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const appId = (sp.get('id') ?? '').trim();
  const country = (sp.get('country') ?? 'us').toLowerCase();
  if (!appId) return NextResponse.json({ error: 'App manquante.' }, { status: 400 });

  // Lookup pour connaître la catégorie + si l'app est gratuite ou payante.
  let genreId = '';
  let genreName = '';
  let isFree = true;
  try {
    const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=${country}`, { headers: { 'User-Agent': 'Appolyn/1.0' } });
    const j = await r.json() as { results?: Record<string, unknown>[] };
    const app = (j.results ?? [])[0];
    if (!app) return NextResponse.json({ error: 'App introuvable sur cet App Store.' }, { status: 404 });
    genreId = String(app.primaryGenreId ?? '');
    genreName = String(app.primaryGenreName ?? '');
    isFree = Number(app.price ?? 0) === 0;
  } catch {
    return NextResponse.json({ error: 'Lookup impossible.' }, { status: 502 });
  }

  const chart = isFree ? 'topfreeapplications' : 'toppaidapplications';
  const base = `https://itunes.apple.com/${country}/rss/${chart}/limit=${LIMIT}`;
  const categoryUrl = genreId ? `${base}/genre=${genreId}/json` : `${base}/json`;
  const overallUrl = `${base}/json`;

  const [category, overall] = await Promise.all([
    rankIn(categoryUrl, appId),
    rankIn(overallUrl, appId),
  ]);

  return NextResponse.json({ type: isFree ? 'free' : 'paid', genreName, category, overall, of: LIMIT });
}
