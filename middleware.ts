import { NextRequest, NextResponse } from 'next/server';

// Sert le site public d'une app sur le DOMAINE PERSO du dev : si la requête arrive
// sur un domaine custom (PAS appolyn.io ni *.vercel.app), on le mappe vers
// /site/<slug>. 100% DÉFENSIF : les hôtes connus repartent immédiatement (aucune
// requête, zéro impact sur le dashboard et la landing) ; si la résolution échoue ou
// si le chemin est déjà une route /site, on laisse passer tel quel.
export const config = {
  matcher: ['/((?!_next/|api/|favicon|robots.txt|sitemap.xml|icon.png|apple-icon.png).*)'],
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const KNOWN = new Set(['appolyn.io', 'www.appolyn.io', 'localhost', '127.0.0.1']);

async function slugForHost(host: string): Promise<string | null> {
  try {
    const u = `${SUPABASE_URL}/rest/v1/published_sites?overrides->>domain=eq.${encodeURIComponent(host)}&status=eq.published&select=slug&limit=1`;
    const r = await fetch(u, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, next: { revalidate: 60 } });
    if (!r.ok) return null;
    const rows = await r.json() as { slug?: string }[];
    return rows[0]?.slug ?? null;
  } catch { return null; }
}

export async function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').split(':')[0].toLowerCase();
  if (!host || KNOWN.has(host) || host.endsWith('.vercel.app')) return NextResponse.next();

  // Sur un domaine custom, les assets/sous-pages sont déjà servis en /site/<slug>/…
  // (liens absolus) → on ne re-réécrit pas, on sert tel quel.
  if (req.nextUrl.pathname.startsWith('/site/')) return NextResponse.next();

  const slug = await slugForHost(host);
  if (!slug) return NextResponse.next();

  const url = req.nextUrl.clone();
  const sub = url.pathname === '/' ? '' : url.pathname;
  url.pathname = `/site/${slug}${sub}`;
  return NextResponse.rewrite(url);
}
