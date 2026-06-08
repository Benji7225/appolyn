import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side proxy to Apple's PUBLIC iTunes Search/Lookup API (no key, no CORS
// in the browser). Used by Competitors to read real App Store listing data.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // lookup by id or App Store URL
    const id = extractId(sp.get('id') ?? sp.get('url') ?? '');
    if (!id) return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 });
    const r = await fetch(
      `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&country=${country}`,
      { headers: { 'User-Agent': 'Appolyn/1.0' } },
    );
    const data = await r.json() as { results?: Record<string, unknown>[] };
    const first = (data.results ?? [])[0];
    if (!first) return NextResponse.json({ error: 'App introuvable sur cet App Store.' }, { status: 404 });
    return NextResponse.json({ result: normalize(first) });
  } catch {
    return NextResponse.json({ error: 'Lookup iTunes impossible.' }, { status: 502 });
  }
}
