import { ImageResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { siteTheme } from '@/lib/site-theme';
import { frCategory } from '@/lib/site-pages';

// Image de PARTAGE (Open Graph) dynamique du site public d'une app : une carte
// premium (icône + nom + accroche + note) sur la couleur de marque du dev, générée à
// la volée. Les liens partagés (iMessage, X, Slack…) affichent alors une vraie
// vignette soignée, pas un aperçu vide. ImageResponse vient de `next/server` (et non
// `next/og`, absent en 13.5). Satori ne gère pas les variables CSS → on passe des
// couleurs concrètes (hex/rgba) calculées par siteTheme().

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;
export const alt = "Aperçu de l'app";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const STOREFRONTS = (preferred: string) => Array.from(new Set([(preferred || 'fr').toLowerCase(), 'us', 'gb', 'de', 'fr']));

type Resolved = {
  name: string; genre: string; icon: string | null; tagline: string;
  rating: number | null; ratingCount: number | null;
  accent: string; accentInk: string; onAccent: string; softer: string; letter: string;
};

// 1re phrase de la description (accroche), sans rien inventer.
function firstSentence(desc: string): string {
  const para = (desc || '').split(/\n\s*\n/)[0]?.replace(/\s+/g, ' ').trim() ?? '';
  const m = para.match(/^(.{20,150}?[.!?])\s/);
  const s = (m ? m[1] : para).trim();
  return s.length > 150 ? `${s.slice(0, 147).replace(/\s+\S*$/, '')}…` : s;
}

async function resolve(slug: string): Promise<Resolved | null> {
  const { data } = await sb.from('published_sites')
    .select('asc_app_id, country, content, overrides, active, status')
    .eq('slug', slug).eq('status', 'published').maybeSingle();
  const row = data as { asc_app_id: string; country: string; content: Record<string, unknown> | null; overrides: { title?: string; tagline?: string; description?: string; accent?: string } | null; active?: boolean } | null;
  if (!row || row.active === false) return null;

  const c = (row.content ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');

  // App Store public (frais) multi-storefront, sinon la capture stockée.
  let live: { name?: string; genre?: string; icon?: string; description?: string; rating?: number; ratingCount?: number } | null = null;
  for (const cc of STOREFRONTS(row.country)) {
    try {
      const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(row.asc_app_id)}&country=${cc}`, { next: { revalidate: 3600 } });
      const j = await r.json() as { results?: Record<string, unknown>[] };
      const a = (j.results ?? [])[0];
      if (a) { live = { name: a.trackName as string, genre: a.primaryGenreName as string, icon: (a.artworkUrl512 as string) || (a.artworkUrl100 as string), description: a.description as string, rating: a.averageUserRating as number, ratingCount: a.userRatingCount as number }; break; }
    } catch { /* store suivant */ }
  }

  const ov = row.overrides ?? {};
  const name = ov.title?.trim() || live?.name || str(c.title) || 'App';
  const description = ov.description?.trim() || live?.description || str(c.description);
  const tagline = ov.tagline?.trim() || firstSentence(description);
  const theme = siteTheme(ov.accent);
  const rgb = theme.vars['--ac-softer']; // rgba(r,g,b,0.05)
  return {
    name,
    genre: frCategory(live?.genre || str(c.genre)),
    icon: live?.icon || str(c.artworkUrl) || str(c.iconUrl) || null,
    tagline,
    rating: typeof live?.rating === 'number' && live.rating > 0 ? live.rating : (typeof c.averageRating === 'number' ? c.averageRating : null),
    ratingCount: typeof live?.ratingCount === 'number' ? live.ratingCount : (typeof c.ratingCount === 'number' ? c.ratingCount : null),
    accent: theme.accent, accentInk: theme.accentInk, onAccent: theme.onAccent, softer: rgb,
    letter: name.trim().charAt(0).toUpperCase() || 'A',
  };
}

export default async function OgImage({ params }: { params: { slug: string } }) {
  const r = await resolve(params.slug);
  const accent = r?.accent ?? '#4f46e5';
  const name = r?.name ?? 'App';
  const tagline = r?.tagline ?? '';
  const genre = r?.genre ?? '';
  const softer = r?.softer ?? 'rgba(79,70,229,0.06)';

  return new ImageResponse(
    (
      <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', justifyContent: 'center', width: '100%', height: '100%', padding: 84, background: `linear-gradient(135deg, ${softer} 0%, #ffffff 58%)`, fontFamily: 'sans-serif' }}>
        {/* Barre d'accent en haut */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 12, background: accent, display: 'flex' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          {r?.icon ? (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img src={r.icon} width={176} height={176} style={{ borderRadius: 40 }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 176, height: 176, borderRadius: 40, background: accent, color: r?.onAccent ?? '#fff', fontSize: 92, fontWeight: 800 }}>{r?.letter ?? 'A'}</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 66, fontWeight: 800, color: '#0e1525', letterSpacing: -1.5 }}>{name}</div>
            {genre ? <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, color: r?.accentInk ?? accent, marginTop: 6 }}>{genre}</div> : <div style={{ display: 'flex' }} />}
          </div>
        </div>

        {tagline ? <div style={{ display: 'flex', fontSize: 38, color: '#54607a', marginTop: 44, maxWidth: 1020, lineHeight: 1.3 }}>{tagline}</div> : <div style={{ display: 'flex' }} />}

        <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginTop: 52 }}>
          <div style={{ display: 'flex', background: '#000', color: '#fff', borderRadius: 16, padding: '16px 30px', fontSize: 28, fontWeight: 600 }}>Télécharger sur l&apos;App Store</div>
          {r?.rating != null && r.rating > 0 ? (
            <div style={{ display: 'flex', fontSize: 30, color: '#0e1525', fontWeight: 700 }}>★ {r.rating.toFixed(1)}{r.ratingCount ? ` · ${r.ratingCount.toLocaleString('fr-FR')} avis` : ''}</div>
          ) : <div style={{ display: 'flex' }} />}
        </div>
      </div>
    ),
    { ...size },
  );
}
