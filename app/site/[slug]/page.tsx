import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { StoreBadges } from '@/components/store-badges';
import { PhoneFrame } from '@/components/site/phone-frame';
import { SiteHeader, SiteFooter, type NavLink } from '@/components/site/site-chrome';
import { siteTheme } from '@/lib/site-theme';
import { PAGE_DEFS, effectivePage, type SitePages } from '@/lib/site-pages';

// Site marketing PUBLIC d'une app, publié en 1 clic depuis Appolyn. 100% réel :
// contenu capturé au moment de la publication (iTunes OU App Store Connect), donc le
// site s'affiche AVEC du vrai contenu même AVANT le lancement ; rafraîchi depuis
// l'App Store public quand l'app est en ligne. Indexable par Google.
export const revalidate = 60;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Overrides = { title?: string; tagline?: string; description?: string; accent?: string };
type Site = { asc_app_id: string; country: string; content: Record<string, unknown> | null; active?: boolean; overrides?: Overrides | null; pages?: SitePages | null };
type AppData = {
  trackName: string; description?: string;
  artworkUrl512?: string; artworkUrl100?: string;
  screenshotUrls?: string[]; ipadScreenshotUrls?: string[];
  averageUserRating?: number; userRatingCount?: number;
  sellerName?: string; primaryGenreName?: string; trackViewUrl?: string;
  languageCodesISO2A?: string[];
};
// Forme normalisée que la page rend, quelle que soit la source.
type SiteContent = {
  name: string; seller: string; genre: string;
  rating: number | null; ratingCount: number | null;
  description: string; screenshots: string[]; icon: string; url: string;
  languages: string[]; playUrl: string;
};

async function getSite(slug: string): Promise<Site | null> {
  const { data } = await sb.from('published_sites').select('asc_app_id, country, content, active, overrides, pages').eq('slug', slug).eq('status', 'published').maybeSingle();
  return (data as Site) ?? null;
}

// Applique les personnalisations du dev (titre/accroche/description) par-dessus le
// contenu auto. Vide = on garde la vraie fiche App Store.
function applyOverrides(c: SiteContent, ov: Overrides | null | undefined): SiteContent {
  if (!ov) return c;
  return {
    ...c,
    name: ov.title?.trim() || c.name,
    description: ov.description?.trim() || c.description,
  };
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
    languages: (a.languageCodesISO2A ?? []).slice(0, 40),
    playUrl: '',
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
    languages: arr(s.languages).slice(0, 40),
    playUrl: str(s.playUrl),
  };
}

async function resolveContent(site: Site): Promise<SiteContent | null> {
  const live = await getLive(site.asc_app_id, site.country);
  return (live ? fromLive(live, site.asc_app_id) : null) ?? fromSnapshot(site.content, site.asc_app_id);
}

// Découpe la VRAIE description App Store en : points forts (les lignes à puces que
// le dev a déjà écrites), paragraphes aérés, et une tagline (1re phrase). On
// n'invente RIEN : on ne fait que réorganiser le texte réel pour qu'il soit lisible.
function parseDescription(desc: string): { features: string[]; paragraphs: string[]; tagline: string } {
  const bulletRe = /^[\-•·●◦▪–—➤➔✓✔★✦*]+\s+/;
  const features: string[] = [];
  const paraLines: string[] = [];
  for (const raw of desc.split('\n')) {
    const l = raw.trim();
    if (!l) { paraLines.push(''); continue; }
    if (bulletRe.test(l)) features.push(l.replace(bulletRe, '').trim());
    else paraLines.push(l);
  }
  const paragraphs: string[] = [];
  let cur = '';
  for (const l of paraLines) {
    if (!l) { if (cur.trim()) paragraphs.push(cur.trim()); cur = ''; }
    else cur = cur ? `${cur} ${l}` : l;
  }
  if (cur.trim()) paragraphs.push(cur.trim());
  const first = paragraphs[0] ?? '';
  const m = first.match(/^(.{20,160}?[.!?])\s/);
  const tagline = (m ? m[1] : first).slice(0, 160).trim();
  return { features: features.slice(0, 6), paragraphs, tagline };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const site = await getSite(params.slug);
  if (!site || site.active === false) return { title: 'Site indisponible' };
  const base = await resolveContent(site);
  if (!base) return { title: 'Site' };
  const c = applyOverrides(base, site.overrides);
  const desc = c.description.slice(0, 160);
  const image = c.screenshots[0] ?? c.icon;
  return {
    title: c.name,
    description: desc,
    alternates: { canonical: `/site/${params.slug}` },
    // Favicon de l'onglet = l'icône de l'app (au lieu de celle d'Appolyn).
    icons: c.icon ? { icon: c.icon, apple: c.icon } : undefined,
    themeColor: site.overrides?.accent || '#4f46e5',
    openGraph: { title: c.name, description: desc, type: 'website', images: image ? [image] : undefined },
    twitter: { card: 'summary_large_image', title: c.name, description: desc },
  };
}

// Note en 5 étoiles avec remplissage PROPORTIONNEL à la vraie note (honnête : on ne
// montre pas 5 étoiles pleines pour une note de 4,1).
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="relative inline-block align-middle text-base leading-none" aria-label={`Note ${rating.toFixed(1)} sur 5`}>
      <span className="text-neutral-300">★★★★★</span>
      <span className="absolute inset-0 overflow-hidden text-amber-500" style={{ width: `${Math.max(0, Math.min(1, rating / 5)) * 100}%` }}>★★★★★</span>
    </span>
  );
}

// Petit bloc « chiffre + libellé » pour la bande de confiance (uniquement du réel).
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--sub)]">{label}</div>
    </div>
  );
}

export default async function PublicSitePage({ params }: { params: { slug: string } }) {
  const site = await getSite(params.slug);
  if (!site || site.active === false) notFound();
  const base = await resolveContent(site);

  if (!base) {
    const theme = siteTheme(site.overrides?.accent);
    return (
      <div style={theme.vars as unknown as CSSProperties} className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface)] px-6 text-center text-[var(--ink)]">
        <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ac-soft)] text-[var(--ac-ink)]">✦</span>
        <h1 className="text-2xl font-semibold tracking-tight">Bientôt disponible</h1>
        <p className="mt-2 max-w-sm text-[var(--sub)]">Cette app arrive très vite. Reviens dans quelques jours.</p>
        <a href="https://appolyn.io" target="_blank" rel="noreferrer" className="mt-10 text-xs text-[var(--sub)] transition-colors hover:text-[var(--ink)]">Site créé avec Appolyn</a>
      </div>
    );
  }

  const c = applyOverrides(base, site.overrides);
  const ov = site.overrides ?? {};
  const theme = siteTheme(ov.accent);

  // Pages annexes activées (FAQ, contact, légales…) à lier dans le footer.
  const pageCtx = { name: c.name, seller: c.seller, description: c.description };
  const navPages: NavLink[] = PAGE_DEFS
    .filter((d) => effectivePage(d.key, site.pages, pageCtx)?.active)
    .map((d) => ({ href: `/site/${params.slug}/${d.key}`, label: d.label }));

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'MobileApplication',
    name: c.name, operatingSystem: 'iOS', ...(c.genre ? { applicationCategory: c.genre } : {}),
    ...(c.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: c.rating, ratingCount: c.ratingCount ?? 0 } } : {}),
    offers: { '@type': 'Offer', url: c.url },
  };

  const subtitle = [c.genre, c.seller].filter(Boolean).join(' · ');
  const { features, paragraphs, tagline: autoTagline } = parseDescription(c.description);
  const tagline = ov.tagline?.trim() || autoTagline;

  const heroShot = c.screenshots[0] ?? '';
  const galleryShots = c.screenshots.slice(1, 7);

  // Ancres d'en-tête : seulement vers les sections réellement présentes.
  const anchors: NavLink[] = [
    galleryShots.length > 0 ? { href: '#apercu', label: 'Aperçu' } : null,
    features.length > 0 ? { href: '#fonctionnalites', label: 'Fonctionnalités' } : null,
    paragraphs.length > 0 ? { href: '#apropos', label: 'À propos' } : null,
  ].filter(Boolean) as NavLink[];

  // Bande de confiance (uniquement les chiffres réels disponibles).
  const stats: { value: string; label: string }[] = [];
  if (c.rating != null && c.rating > 0) stats.push({ value: `★ ${c.rating.toFixed(1)}`, label: 'Note moyenne' });
  if (c.ratingCount) stats.push({ value: c.ratingCount.toLocaleString('fr-FR'), label: 'Avis' });
  if (c.languages.length) stats.push({ value: String(c.languages.length), label: c.languages.length > 1 ? 'Langues' : 'Langue' });
  if (c.genre) stats.push({ value: c.genre, label: 'Catégorie' });

  return (
    <div style={theme.vars as unknown as CSSProperties} className="min-h-screen bg-[var(--surface)] text-[var(--ink)] antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader name={c.name} icon={c.icon} homeHref={`/site/${params.slug}`} appStoreUrl={c.url} anchors={anchors} />

      {/* 1 — Héro */}
      <section className="relative overflow-hidden">
        {/* Halo de marque, dérivé de la couleur d'accent. */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 60% at 85% 0%, var(--ac-glow) 0%, transparent 60%), linear-gradient(180deg, var(--ac-softer) 0%, var(--surface) 65%)' }} />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Texte */}
            <div className="text-center lg:text-left">
              {c.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.icon} alt={c.name} className="mx-auto mb-6 h-20 w-20 rounded-[1.25rem] shadow-lg ring-1 ring-black/5 lg:mx-0" />
              )}
              {subtitle && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ac-ink)]">{subtitle}</p>}
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">{c.name}</h1>
              {tagline && <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[var(--sub)] lg:mx-0">{tagline}</p>}
              {c.rating != null && c.rating > 0 && (
                <p className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--sub)]">
                  <StarRating rating={c.rating} />
                  <span className="font-medium text-[var(--ink)]">{c.rating.toFixed(1)}</span>
                  {c.ratingCount ? <span>· {c.ratingCount.toLocaleString('fr-FR')} avis sur l&apos;App Store</span> : null}
                </p>
              )}
              <div className="mt-8">
                <StoreBadges appStoreUrl={c.url} playUrl={c.playUrl || undefined} className="justify-center lg:justify-start" />
              </div>
            </div>

            {/* Visuel */}
            <div className="flex justify-center lg:justify-end">
              {heroShot ? (
                <PhoneFrame src={heroShot} alt={`${c.name} aperçu`} priority className="w-[256px] sm:w-[300px]" />
              ) : c.icon ? (
                <div className="flex h-[300px] w-[256px] items-center justify-center rounded-[2rem] border border-[var(--line)] bg-[var(--panel)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.icon} alt={c.name} className="h-32 w-32 rounded-[1.75rem] shadow-xl ring-1 ring-black/5" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Bande de confiance (réel uniquement) */}
      {stats.length > 0 && (
        <section className="border-y border-[var(--line)] bg-[var(--panel)]">
          <div className="mx-auto grid max-w-4xl gap-6 px-5 py-8 sm:grid-cols-2 sm:px-8 md:grid-cols-4">
            {stats.map((s, i) => <Stat key={i} value={s.value} label={s.label} />)}
          </div>
        </section>
      )}

      {/* 3 — Aperçu (galerie de captures en cadre iPhone) */}
      {galleryShots.length > 0 && (
        <section id="apercu" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Un aperçu de {c.name}</h2>
            <div className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 pb-6 scrollbar-macos">
              {galleryShots.map((s, i) => (
                <PhoneFrame key={i} src={s} alt={`${c.name} capture ${i + 2}`} className="w-[180px] snap-center sm:w-[210px]" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4 — Fonctionnalités (les puces réelles de la fiche) */}
      {features.length > 0 && (
        <section id="fonctionnalites" className="scroll-mt-20 bg-[var(--panel)] py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Ce que tu peux faire</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ac-soft)] text-[var(--ac-ink)]">
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 10 3.5 3.5L15 6.5" /></svg>
                  </span>
                  <p className="text-[15px] leading-relaxed text-[var(--ink)]/90">{f}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5 — À propos (paragraphes aérés) */}
      {paragraphs.length > 0 && (
        <section id="apropos" className="scroll-mt-20 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-5 sm:px-8">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">À propos</h2>
            <div className="mt-6 space-y-4">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-[var(--sub)]">{p}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6 — Appel à l'action (bandeau de marque) */}
      <section className="px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[var(--ac)] px-6 py-14 text-center shadow-xl">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-90" style={{ background: 'radial-gradient(80% 120% at 50% -20%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />
          <div className="relative">
            {c.icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.icon} alt={c.name} className="mx-auto mb-5 h-16 w-16 rounded-[1.1rem] shadow-lg ring-1 ring-black/10" />
            )}
            <h2 className="text-2xl font-bold tracking-tight text-[var(--ac-on)] sm:text-3xl">Prêt à essayer {c.name} ?</h2>
            <p className="mx-auto mt-2 max-w-md text-[var(--ac-on)]/80">Télécharge l&apos;app et commence dès maintenant.</p>
            {/* Carte blanche derrière les badges : garantit la lisibilité quelle que
                soit la couleur d'accent (y compris un accent très sombre). */}
            <div className="mt-7 flex justify-center">
              <div className="inline-flex rounded-2xl bg-white p-2.5 shadow-lg ring-1 ring-black/5">
                <StoreBadges appStoreUrl={c.url} playUrl={c.playUrl || undefined} className="justify-center" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter name={c.name} seller={c.seller} slug={params.slug} pages={navPages} languages={c.languages} />
    </div>
  );
}
