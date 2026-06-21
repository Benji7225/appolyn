import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

// Site marketing PUBLIC d'une app, publié en 1 clic depuis Appolyn. 100% réel :
// les données viennent de l'App Store public (iTunes lookup), aucune donnée inventée.
// Indexable par Google (URL propre appolyn.io/site/<slug>).
export const revalidate = 3600;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Site = { asc_app_id: string; country: string };
type AppData = {
  trackName: string; description?: string;
  artworkUrl512?: string; artworkUrl100?: string;
  screenshotUrls?: string[]; ipadScreenshotUrls?: string[];
  averageUserRating?: number; userRatingCount?: number;
  sellerName?: string; primaryGenreName?: string; trackViewUrl?: string;
};

async function getSite(slug: string): Promise<Site | null> {
  const { data } = await sb.from('published_sites').select('asc_app_id, country').eq('slug', slug).eq('status', 'published').maybeSingle();
  return (data as Site) ?? null;
}

async function getApp(ascAppId: string, country: string): Promise<AppData | null> {
  try {
    const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(ascAppId)}&country=${encodeURIComponent(country || 'fr')}`, { next: { revalidate: 3600 } });
    const j = await r.json() as { results?: AppData[] };
    return j.results?.[0] ?? null;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const site = await getSite(params.slug);
  if (!site) return { title: 'Site introuvable' };
  const app = await getApp(site.asc_app_id, site.country);
  if (!app) return { title: 'Site' };
  const desc = (app.description ?? '').slice(0, 160);
  const image = app.screenshotUrls?.[0] ?? app.artworkUrl512;
  return {
    title: app.trackName,
    description: desc,
    alternates: { canonical: `/site/${params.slug}` },
    openGraph: { title: app.trackName, description: desc, type: 'website', images: image ? [image] : undefined },
    twitter: { card: 'summary_large_image', title: app.trackName, description: desc },
  };
}

export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  const site = await getSite(params.slug);
  if (!site) notFound();
  const app = await getApp(site.asc_app_id, site.country);
  // App publiée dans Appolyn mais pas encore visible sur l'App Store (pré-lancement) :
  // page propre « bientôt » plutôt qu'un 404.
  if (!app) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background text-foreground">
        <h1 className="text-2xl font-semibold tracking-tight">Bientôt disponible</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">Cette app arrive très vite sur l&apos;App Store. Reviens dans quelques jours.</p>
        <a href="https://appolyn.io" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground mt-8 hover:text-foreground transition-colors">Site créé avec Appolyn</a>
      </div>
    );
  }

  const shots = [...(app.screenshotUrls ?? []), ...(app.ipadScreenshotUrls ?? [])].slice(0, 10);
  const storeUrl = app.trackViewUrl ?? `https://apps.apple.com/app/id${site.asc_app_id}`;
  const icon = app.artworkUrl512 ?? app.artworkUrl100;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'MobileApplication',
    name: app.trackName, operatingSystem: 'iOS', applicationCategory: app.primaryGenreName,
    ...(app.averageUserRating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: app.averageUserRating, ratingCount: app.userRatingCount ?? 0 } } : {}),
    offers: { '@type': 'Offer', url: storeUrl },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Héro */}
      <header className="px-6 pt-16 pb-12 bg-gradient-to-b from-accent/40 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          {icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} alt={app.trackName} className="w-24 h-24 rounded-[22px] mx-auto shadow-lg mb-5" />
          )}
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{app.trackName}</h1>
          {(app.sellerName || app.primaryGenreName) && (
            <p className="text-muted-foreground mt-2">{[app.primaryGenreName, app.sellerName].filter(Boolean).join(' · ')}</p>
          )}
          {app.averageUserRating != null && app.averageUserRating > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm">
              <span className="text-amber-500">★</span> {app.averageUserRating.toFixed(1)}
              {app.userRatingCount ? <span className="text-muted-foreground">({app.userRatingCount.toLocaleString('fr-FR')} avis)</span> : null}
            </p>
          )}
          <div className="mt-7">
            <a href={storeUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-6 h-12 bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
              Télécharger sur l&apos;App Store
            </a>
          </div>
        </div>
      </header>

      {/* Screenshots */}
      {shots.length > 0 && (
        <section className="px-6 py-4">
          <div className="max-w-5xl mx-auto flex gap-4 overflow-x-auto pb-4">
            {shots.map((s, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={s} alt={`${app.trackName} capture ${i + 1}`} className="h-[440px] w-auto rounded-2xl border border-border/40 shrink-0 object-contain bg-muted/30" loading="lazy" />
            ))}
          </div>
        </section>
      )}

      {/* Description */}
      {app.description && (
        <section className="px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold tracking-tight mb-4">À propos</h2>
            <p className="text-[15px] leading-relaxed text-foreground/85 whitespace-pre-line">{app.description}</p>
          </div>
        </section>
      )}

      {/* CTA bas */}
      <section className="px-6 py-12 text-center">
        <a href={storeUrl} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl px-6 h-12 bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
          Télécharger {app.trackName}
        </a>
      </section>

      {/* Footer (backlink Appolyn = bon pour le SEO) */}
      <footer className="border-t border-border/40 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} {app.sellerName || app.trackName}</span>
          <a href="https://appolyn.io" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Site créé avec Appolyn</a>
        </div>
      </footer>
    </div>
  );
}
