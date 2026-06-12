import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeKeywordMetrics, type RankedApp } from '@/lib/aso';

// Server-side proxy to Apple's PUBLIC iTunes Search/Lookup API (no key, no CORS
// in the browser). Used by Competitors to read real App Store listing data.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KW_STOP = new Set(['app', 'apps', 'the', 'and', 'for', 'with', 'your', 'free', 'pro', 'plus', 'lite', 'le', 'la', 'les', 'de', 'des', 'et', 'un', 'une', 'mon', 'ma']);

// Keywords a competitor visibly targets (from its own title/genre) and where it
// ranks, with the real difficulty/popularity of each term. All from public data.
async function rankedKeywordsFor(app: Record<string, unknown>, id: string, country: string) {
  const name = ((app.trackName as string) ?? '').toLowerCase();
  const genre = ((app.primaryGenreName as string) ?? '').toLowerCase();
  const words = `${name} ${genre}`.match(/[\p{L}\p{N}]+/gu) ?? [];
  const terms = Array.from(new Set(words)).filter((w) => w.length >= 3 && !KW_STOP.has(w)).slice(0, 8);
  const out: { term: string; rank: number | null; difficulty: number; popularity: number }[] = new Array(terms.length);
  let i = 0;
  const worker = async () => {
    while (i < terms.length) {
      const idx = i++;
      const term = terms[idx];
      try {
        const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=software&limit=50`, { headers: { 'User-Agent': 'Appolyn/1.0' } });
        const d = await r.json() as { results?: Record<string, unknown>[] };
        const apps: RankedApp[] = (d.results ?? []).map((a) => ({ trackId: a.trackId as number, trackName: a.trackName as string, userRatingCount: a.userRatingCount as number }));
        const m = computeKeywordMetrics(apps, term, id);
        out[idx] = { term, rank: m.appRanking, difficulty: m.difficulty, popularity: m.popularity };
      } catch { out[idx] = { term, rank: null, difficulty: 0, popularity: 0 }; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, terms.length) }, worker));
  return out.filter(Boolean).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Normalized = {
  itunesId: string;
  title: string;
  sellerName: string;
  genre: string;
  price: number;
  currency: string;
  averageRating: number | null;
  ratingCount: number | null;
  version: string;
  iconUrl: string;
  screenshotCount: number;
  url: string;
};

function normalize(r: Record<string, unknown>): Normalized {
  const screenshots = (r.screenshotUrls as string[] | undefined)?.length ?? 0;
  const ipad = (r.ipadScreenshotUrls as string[] | undefined)?.length ?? 0;
  return {
    itunesId: String(r.trackId ?? ''),
    title: (r.trackName as string) ?? '',
    sellerName: (r.sellerName as string) ?? '',
    genre: (r.primaryGenreName as string) ?? '',
    price: (r.price as number) ?? 0,
    currency: (r.currency as string) ?? '',
    averageRating: (r.averageUserRating as number) ?? null,
    ratingCount: (r.userRatingCount as number) ?? null,
    version: (r.version as string) ?? '',
    iconUrl: (r.artworkUrl100 as string) ?? (r.artworkUrl60 as string) ?? '',
    screenshotCount: screenshots + ipad,
    url: (r.trackViewUrl as string) ?? '',
  };
}

// Richer view for the competitor detail sheet. Everything here is real, public
// App Store listing data. (In-app subscription prices and ad/social accounts are
// NOT exposed by Apple's public API, so we don't fabricate them.)
type DetailResult = Normalized & {
  description: string;
  releaseNotes: string;
  releaseDate: string | null;
  currentVersionReleaseDate: string | null;
  fileSizeBytes: number | null;
  minimumOsVersion: string;
  contentRating: string;
  formattedPrice: string;
  genres: string[];
  languages: string[];
  screenshots: string[];
  ipadScreenshots: string[];
  artworkUrl: string;
};

function normalizeDetail(r: Record<string, unknown>): DetailResult {
  return {
    ...normalize(r),
    description: (r.description as string) ?? '',
    releaseNotes: (r.releaseNotes as string) ?? '',
    releaseDate: (r.releaseDate as string) ?? null,
    currentVersionReleaseDate: (r.currentVersionReleaseDate as string) ?? null,
    fileSizeBytes: r.fileSizeBytes ? Number(r.fileSizeBytes) : null,
    minimumOsVersion: (r.minimumOsVersion as string) ?? '',
    contentRating: (r.contentAdvisoryRating as string) ?? (r.trackContentRating as string) ?? '',
    formattedPrice: (r.formattedPrice as string) ?? '',
    genres: (r.genres as string[] | undefined) ?? [],
    languages: (r.languageCodesISO2A as string[] | undefined) ?? [],
    screenshots: (r.screenshotUrls as string[] | undefined) ?? [],
    ipadScreenshots: (r.ipadScreenshotUrls as string[] | undefined) ?? [],
    artworkUrl: (r.artworkUrl512 as string) ?? (r.artworkUrl100 as string) ?? '',
  };
}

type CompetitorReview = { id: string; author: string; rating: number; title: string; body: string; updated: string };

// Recent public reviews via Apple's RSS feed (free, no key). The first feed
// entry is app metadata, the rest are reviews; we keep entries that carry a rating.
async function fetchReviews(id: string, country: string): Promise<CompetitorReview[]> {
  try {
    const r = await fetch(
      `https://itunes.apple.com/${country}/rss/customerreviews/page=1/id=${id}/sortby=mostrecent/json`,
      { headers: { 'User-Agent': 'Appolyn/1.0' } },
    );
    if (!r.ok) return [];
    const data = await r.json() as { feed?: { entry?: Record<string, unknown>[] } };
    const entries = data.feed?.entry ?? [];
    const out: CompetitorReview[] = [];
    for (const e of entries) {
      const rating = (e['im:rating'] as { label?: string } | undefined)?.label;
      if (!rating) continue; // skip the app-info entry
      out.push({
        id: ((e.id as { label?: string } | undefined)?.label) ?? String(out.length),
        author: ((e.author as { name?: { label?: string } } | undefined)?.name?.label) ?? 'Anonyme',
        rating: parseInt(rating, 10) || 0,
        title: ((e.title as { label?: string } | undefined)?.label) ?? '',
        body: ((e.content as { label?: string } | undefined)?.label) ?? '',
        updated: ((e.updated as { label?: string } | undefined)?.label) ?? '',
      });
      if (out.length >= 8) break;
    }
    return out;
  } catch {
    return [];
  }
}

function extractId(input: string): string {
  const m = input.match(/id(\d+)/) ?? input.match(/(\d{6,})/);
  return m ? m[1] : input.trim();
}

export async function GET(req: NextRequest) {
  // Require a valid session to avoid an open proxy.
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const action = sp.get('action') ?? 'lookup';
  const country = (sp.get('country') ?? 'us').toLowerCase();

  try {
    if (action === 'search') {
      const term = (sp.get('term') ?? '').trim();
      if (!term) return NextResponse.json({ results: [] });
      const r = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=software&limit=8`,
        { headers: { 'User-Agent': 'Appolyn/1.0' } },
      );
      const data = await r.json() as { results?: Record<string, unknown>[] };
      return NextResponse.json({ results: (data.results ?? []).map(normalize) });
    }

    // availability: in which App Store countries does the app actually exist?
    // (a lookup only returns the app for storefronts where it is available)
    if (action === 'availability') {
      const aid = extractId(sp.get('id') ?? sp.get('url') ?? '');
      if (!aid) return NextResponse.json({ countries: [], count: 0 });
      const STORES = ['us', 'gb', 'ca', 'au', 'ie', 'nz', 'fr', 'de', 'es', 'it', 'nl', 'be', 'ch', 'at', 'pt', 'se', 'no', 'dk', 'fi', 'pl', 'cz', 'gr', 'ro', 'hu', 'br', 'mx', 'ar', 'cl', 'co', 'jp', 'kr', 'cn', 'hk', 'tw', 'sg', 'in', 'id', 'th', 'vn', 'ph', 'my', 'tr', 'ae', 'sa', 'il', 'za', 'ru', 'ua'];
      const checks = await Promise.all(STORES.map(async (cc) => {
        try {
          const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(aid)}&country=${cc}`, { headers: { 'User-Agent': 'Appolyn/1.0' } });
          const d = await r.json() as { resultCount?: number };
          return (d.resultCount ?? 0) > 0 ? cc : null;
        } catch { return null; }
      }));
      const countries = checks.filter((c): c is string => !!c);
      return NextResponse.json({ countries, count: countries.length });
    }

    // lookup / detail by id or App Store URL
    const id = extractId(sp.get('id') ?? sp.get('url') ?? '');
    if (!id) return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 });
    const r = await fetch(
      `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&country=${country}`,
      { headers: { 'User-Agent': 'Appolyn/1.0' } },
    );
    const data = await r.json() as { results?: Record<string, unknown>[] };
    const first = (data.results ?? [])[0];
    if (!first) return NextResponse.json({ error: 'App introuvable sur cet App Store.' }, { status: 404 });

    if (action === 'detail') {
      const [reviews, rankedKeywords] = await Promise.all([
        fetchReviews(id, country),
        rankedKeywordsFor(first, id, country),
      ]);
      return NextResponse.json({ result: normalizeDetail(first), reviews, rankedKeywords });
    }
    return NextResponse.json({ result: normalize(first) });
  } catch {
    return NextResponse.json({ error: 'Lookup iTunes impossible.' }, { status: 502 });
  }
}
