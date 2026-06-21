import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

// Site marketing PUBLIC d'une app, publié en 1 clic depuis Appolyn. 100% réel :
// contenu capturé au moment de la publication (iTunes OU App Store Connect), donc le
// site s'affiche AVEC du vrai contenu même AVANT le lancement ; rafraîchi depuis
// l'App Store public quand l'app est en ligne. Indexable par Google.
export const revalidate = 3600;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Site = { asc_app_id: string; country: string; content: Record<string, unknown> | null };
type AppData = {
  trackName: string; description?: string;
  artworkUrl512?: string; artworkUrl100?: string;
  screenshotUrls?: string[]; ipadScreenshotUrls?: string[];
  averageUserRating?: number; userRatingCount?: number;
  sellerName?: string; primaryGenreName?: string; trackViewUrl?: string;
};
// Forme normalisée que la page rend, quelle que soit la source.
type SiteContent = {
  name: string; seller: string; genre: string;
  rating: number | null; ratingCount: number | null;
  description: string; screenshots: string[]; icon: string; url: string;
};

async function getSite(slug: string): Promise<Site | null> {
  const { data } = await sb.from('published_sites').select('asc_app_id, country, content').eq('slug', slug).eq('status', 'published').maybeSingle();
  return (data as Site) ?? null;
}

async function getLive(ascAppId: string, country: string): Promise<AppData | null> {
  try {
    const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(ascAppId)}&country=${encodeURIComponent(country || 'fr')}`, { next: { revalidate: 3600 } });
    const j = await r.json() as { results?: AppData[] };
    return j.results?.[0] ?? null;
  } catch { return null; }
}

function fromLive(a: AppData, ascAppId: string): SiteContent {
  return {
    name: a.trackName, seller: a.sellerName ?? '', genre: a.primaryGenreName ?? '',
    rating: a.averageUserRating ?? null, ratingCount: a.userRatingCount ?? null,
    description: a.description ?? '',
    screenshots: [...(a.screenshotUrls ?? []), ...(a.ipadScreenshotUrls ?? [])].slice(0, 10),
    icon: a.artworkUrl512 ?? a.artworkUrl100 ?? '',
    url: a.trackViewUrl ?? `https://apps.apple.com/app/id${ascAppId}`,
  };
}

// Le contenu capturé à la publication suit la forme `Detail` du dashboard.
function fromSnapshot(c: Record<string, unknown> | null, ascAppId: string): SiteContent | null {
  if (!c || typeof c !== 'object') return null;
  const s = c as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const name = str(s.title);
  const description = str(s.description);
  if (!name && !description) return null;
  return {
    name: name || 'App', seller: str(s.sellerName), genre: str(s.genre),
    rating: typeof s.averageRating === 'number' ? s.averageRating : null,
    ratingCount: typeof s.ratingCount === 'number' ? s.ratingCount : null,
    description,
    screenshots: [...arr(s.screenshots), ...arr(s.ipadScreenshots)].slice(0, 10),
    icon: str(s.artworkUrl) || str(s.iconUrl),
    url: str(s.url) || `https://apps.apple.com/app/id${ascAppId}`,
  };
}

async function resolveContent(site: Site): Promise<SiteContent | null> {
  const live = await getLive(site.asc_app_id, site.country);
  return (live ? fromLive(live, site.asc_app_id) : null) ?? fromSnapshot(site.content, site.asc_app_id);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const site = await getSite(params.slug);
  if (!site) return { title: 'Site introuvable' };
  const c = await resolveContent(site);
  if (!c) return { title: 'Site' };
  const desc = c.description.slice(0, 160);
  const image = c.screenshots[0] ?? c.icon;
  return {
    title: c.name,
    description: desc,
    alternates: { canonical: `/site/${params.slug}` },
    openGraph: { title: c.name, description: desc, type: 'website', images: image ? [image] : undefined },
    twitter: { card: 'summary_large_image', title: c.name, description: desc },
  };
}

export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  const site = await getSite(params.slug);
  if (!site) notFound();
  const c = await resolveContent(site);
  if (!c) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background text-foreground">
        <h1 className="text-2xl font-semibold tracking-tight">Bientôt disponible</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">Cette app arrive très vite. Reviens dans quelques jours.</p>
        <a href="https://appolyn.io" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground mt-8 hover:text-foreground transition-colors">Site créé avec Appolyn</a>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'MobileApplication',
    name: c.name, operatingSystem: 'iOS', ...(c.genre ? { applicationCategory: c.genre } : {}),
    ...(c.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: c.rating, ratingCount: c.ratingCount ?? 0 } } : {}),
    offers: { '@type': 'Offer', url: c.url },
  };
  const subtitle = [c.genre, c.seller].filter(Boolean).join(' · ');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 1 — Héro */}
      <header className="px-6 pt-16 pb-12 bg-gradient-to-b from-accent/40 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          {c.icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.icon} alt={c.name} className="w-24 h-24 rounded-[22px] mx-auto shadow-lg mb-5" />
          )}
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{c.name}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          {c.rating != null && c.rating > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm">
              <span className="text-amber-500">★</span> {c.rating.toFixed(1)}
              {c.ratingCount ? <span className="text-muted-foreground">({c.ratingCount.toLocaleString('fr-FR')} avis)</span> : null}
            </p>
          )}
          <div className="mt-7">
            <a href={c.url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-6 h-12 bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
              Télécharger sur l&apos;App Store
            </a>
          </div>
        </div>
      </header>

      {/* 2 — Screenshots */}
      {c.screenshots.length > 0 && (
        <section className="px-6 py-4">
          <div className="max-w-5xl mx-auto flex gap-4 overflow-x-auto pb-4">
            {c.screenshots.map((s, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={s} alt={`${c.name} capture ${i + 1}`} className="h-[440px] w-auto rounded-2xl border border-border/40 shrink-0 object-contain bg-muted/30" loading="lazy" />
            ))}
          </div>
        </section>
      )}

      {/* 3 — Description */}
      {c.description && (
        <section className="px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight mb-4">À propos</h2>
            <p className="text-[15px] leading-relaxed text-foreground/85 whitespace-pre-line">{c.description}</p>
          </div>
        </section>
      )}

      {/* 4 — CTA bas */}
      <section className="px-6 py-12 text-center">
        <a href={c.url} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl px-6 h-12 bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
          Télécharger {c.name}
        </a>
      </section>

      {/* 5 — Footer (backlink Appolyn = bon pour le SEO) */}
      <footer className="border-t border-border/40 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} {c.seller || c.name}</span>
          <a href="https://appolyn.io" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Site créé avec Appolyn</a>
        </div>
      </footer>
    </div>
  );
}
