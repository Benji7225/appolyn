import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { StoreBadges } from '@/components/store-badges';
import { PhoneFrame } from '@/components/site/phone-frame';
import { SiteHeader, SiteFooter, type NavLink } from '@/components/site/site-chrome';
import { siteTheme } from '@/lib/site-theme';
import { PAGE_DEFS, effectivePage, type SitePages, type SiteSection } from '@/lib/site-pages';

// Site marketing PUBLIC d'une app, publié en 1 clic depuis Appolyn. 100% réel :
// contenu capturé au moment de la publication (iTunes OU App Store Connect), donc le
// site s'affiche AVEC du vrai contenu même AVANT le lancement ; rafraîchi depuis
// l'App Store public quand l'app est en ligne. Indexable par Google.
export const revalidate = 60;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Overrides = { title?: string; tagline?: string; description?: string; accent?: string; heroImage?: string; sections?: SiteSection[]; domain?: string };
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
    const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(ascAppId)}&country=${encodeURIComponent(country || 'fr')}`, { next: { revalidate: 600 } });
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

// L'endpoint iTunes `lookup` est capricieux par storefront : il peut renvoyer 0 pour
// le pays stocké (ex. fr) alors que l'app EST live (et son icône dispo) sur d'autres
// stores (gb, de…). On interroge donc plusieurs storefronts EN PARALLÈLE et on garde
// la fiche la plus riche (celle qui a des screenshots si possible). La description
// reste en langue primaire (FR pour Vision) quel que soit le store interrogé.
const STOREFRONTS = (preferred: string) => Array.from(new Set([(preferred || 'fr').toLowerCase(), 'us', 'gb', 'de', 'fr']));

async function resolveLive(ascAppId: string, preferred: string): Promise<AppData | null> {
  const results = await Promise.all(STOREFRONTS(preferred).map((c) => getLive(ascAppId, c)));
  const found = results.filter((a): a is AppData => !!a);
  if (!found.length) return null;
  const shots = (a: AppData) => (a.screenshotUrls?.length ?? 0) + (a.ipadScreenshotUrls?.length ?? 0);
  return found.find((a) => shots(a) > 0) ?? found[0];
}

// Fusionne le live (frais) et le snapshot (capturé à la publication) en comblant les
// trous : ni l'un ni l'autre n'est forcément complet (le live peut avoir l'icône mais
// 0 screenshot ; le snapshot l'inverse). On préfère le live champ par champ, et on
// reprend du snapshot ce qui manque.
async function resolveContent(site: Site): Promise<SiteContent | null> {
  const live = await resolveLive(site.asc_app_id, site.country);
  const liveC = live ? fromLive(live, site.asc_app_id) : null;
  const snapC = fromSnapshot(site.content, site.asc_app_id);
  if (!liveC) return snapC;
  if (!snapC) return liveC;
  return {
    name: liveC.name || snapC.name,
    seller: liveC.seller || snapC.seller,
    genre: liveC.genre || snapC.genre,
    rating: liveC.rating || snapC.rating,
    ratingCount: liveC.ratingCount || snapC.ratingCount,
    description: liveC.description || snapC.description,
    screenshots: liveC.screenshots.length ? liveC.screenshots : snapC.screenshots,
    icon: liveC.icon || snapC.icon,
    url: liveC.url || snapC.url,
    languages: liveC.languages.length ? liveC.languages : snapC.languages,
    playUrl: liveC.playUrl || snapC.playUrl,
  };
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

// Marqueurs du modèle de page par défaut (instructions pour le dev). Leur présence
// = la FAQ n'a pas été rédigée → on ne la publie pas.
const PLACEHOLDER_RE = /\[[^\]]*\]|décris ici|explique ton|ajoute ici|remplace par|à compléter|ton email|ta société|tes vraies/i;

// Découpe une FAQ ÉDITÉE par le dev (blocs « question / réponse » séparés par une
// ligne vide) en paires Q/R, pour l'affichage on-page + le JSON-LD FAQPage.
function parseFaq(body: string): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  for (const block of body.split(/\n\s*\n/)) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    const q = lines[0];
    const a = lines.slice(1).join(' ');
    if (q.length >= 3 && a.length >= 3) out.push({ q, a });
  }
  return out.slice(0, 12);
}

// Paragraphes d'une section libre (séparés par une ligne vide, sinon par retour ligne).
const sectionParas = (body: string): string[] => {
  const byBlank = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return byBlank.length > 1 ? byBlank : body.split('\n').map((p) => p.trim()).filter(Boolean);
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const site = await getSite(params.slug);
  if (!site || site.active === false) return { title: 'Site indisponible' };
  const base = await resolveContent(site);
  if (!base) return { title: 'Site' };
  const c = applyOverrides(base, site.overrides);
  const desc = c.description.slice(0, 160);
  const image = c.screenshots[0] ?? c.icon;
  // Avec un domaine perso, le site est AUSSI servi sur ce domaine → on pointe le
  // canonical + l'URL OG vers LUI (évite le contenu dupliqué avec appolyn.io, qui
  // pénaliserait le référencement).
  const domain = site.overrides?.domain?.trim();
  const canonical = domain ? `https://${domain}` : `/site/${params.slug}`;
  return {
    title: c.name,
    description: desc,
    alternates: { canonical },
    // Favicon = icône de l'app, via la route-fichier ./icon.tsx (PAS metadata.icons,
    // qui casse l'émission de l'icône en 13.5 — voir le commentaire d'icon.tsx).
    themeColor: site.overrides?.accent || '#4f46e5',
    openGraph: { title: c.name, description: desc, type: 'website', url: canonical, images: image ? [image] : undefined },
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

  // FAQ on-page (SEO + rich results Google) : SEULEMENT si le dev a VRAIMENT rédigé
  // sa FAQ. Les pages sont pré-remplies avec un modèle d'instructions ; on ne publie
  // JAMAIS ces placeholders → si le moindre marqueur de modèle subsiste, on n'affiche
  // pas la FAQ (mieux vaut rien qu'une FAQ à moitié).
  const faqEff = effectivePage('faq', site.pages, pageCtx);
  const faqRaw = faqEff?.active && site.pages?.faq?.body?.trim() ? parseFaq(faqEff.body) : [];
  const faqItems = faqRaw.length >= 2 && !faqRaw.some((it) => PLACEHOLDER_RE.test(it.q) || PLACEHOLDER_RE.test(it.a)) ? faqRaw : [];

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'MobileApplication',
    name: c.name, operatingSystem: 'iOS', ...(c.genre ? { applicationCategory: c.genre } : {}),
    ...(c.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: c.rating, ratingCount: c.ratingCount ?? 0 } } : {}),
    offers: { '@type': 'Offer', url: c.url },
  };
  const faqLd = faqItems.length > 0 ? {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqItems.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: it.a } })),
  } : null;

  const subtitle = [c.genre, c.seller].filter(Boolean).join(' · ');
  const { features, paragraphs, tagline: autoTagline } = parseDescription(c.description);
  const tagline = ov.tagline?.trim() || autoTagline;

  const heroImage = ov.heroImage?.trim() || '';
  // Le héro n'affiche PLUS de capture brute (Benji : « on n'arrive pas sur un
  // screenshot »). Visuel de marque ou image perso du dev. La galerie « Aperçu »
  // ci-dessous montre TOUTES les vraies captures, à jour.
  const galleryShots = c.screenshots.slice(0, 8);

  // Sections de contenu LIBRES ajoutées par le dev (titre + texte + image).
  const customSections = (ov.sections ?? []).filter((s) => (s.title?.trim() || s.body?.trim()));

  // Ancres d'en-tête : seulement vers les sections réellement présentes.
  const anchors: NavLink[] = [
    galleryShots.length > 0 ? { href: '#apercu', label: 'Aperçu' } : null,
    features.length > 0 ? { href: '#fonctionnalites', label: 'Fonctionnalités' } : null,
    paragraphs.length > 0 ? { href: '#apropos', label: 'À propos' } : null,
    faqItems.length > 0 ? { href: '#faq', label: 'FAQ' } : null,
  ].filter(Boolean) as NavLink[];

  // Bande de confiance (uniquement les chiffres réels disponibles).
  const stats: { value: string; label: string }[] = [];
  if (c.rating != null && c.rating > 0) stats.push({ value: `★ ${c.rating.toFixed(1)}`, label: 'Note moyenne' });
  if (c.ratingCount) stats.push({ value: c.ratingCount.toLocaleString('fr-FR'), label: 'Avis' });
  if (c.genre) stats.push({ value: c.genre, label: 'Catégorie' });

  return (
    <div style={theme.vars as unknown as CSSProperties} className="min-h-screen bg-[var(--surface)] text-[var(--ink)] antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

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

            {/* Visuel — image perso du dev, sinon un écran de marque (icône + nom +
                note), JAMAIS une capture brute : les captures vivent dans « Aperçu ». */}
            <div className="flex justify-center lg:justify-end">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroImage} alt={c.name} className="w-full max-w-md rounded-3xl shadow-2xl ring-1 ring-black/5 object-cover" />
              ) : (
                <PhoneFrame priority className="w-[256px] sm:w-[300px]">
                  <div
                    className="flex aspect-[9/19.5] w-full flex-col items-center justify-center gap-6 px-7 text-center"
                    style={{ background: 'linear-gradient(165deg, var(--ac-softer) 0%, var(--ac-soft) 100%)' }}
                  >
                    {c.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.icon} alt={c.name} className="h-24 w-24 rounded-[1.6rem] shadow-xl ring-1 ring-black/5" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-[1.6rem] text-3xl font-bold shadow-xl" style={{ background: 'var(--ac)', color: 'var(--ac-on)' }}>{c.name.charAt(0)}</div>
                    )}
                    <div>
                      <div className="text-xl font-bold tracking-tight text-[var(--ink)]">{c.name}</div>
                      {subtitle && <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ac-ink)]">{subtitle}</div>}
                    </div>
                    {c.rating != null && c.rating > 0 && (
                      <div className="flex items-center gap-1.5">
                        <StarRating rating={c.rating} />
                        <span className="text-xs font-medium text-[var(--ink)]">{c.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </PhoneFrame>
              )}
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

      {/* 5a — Sections libres du dev (titre + texte + image), alternées */}
      {customSections.map((s, i) => (
        <section key={s.id} className={`py-16 sm:py-20 ${i % 2 ? 'bg-[var(--panel)]' : ''}`}>
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            {s.image ? (
              <div className="grid items-center gap-10 lg:grid-cols-2">
                <div className={i % 2 ? 'lg:order-2' : ''}>
                  {s.title && <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">{s.title}</h2>}
                  <div className="mt-5 space-y-4">{sectionParas(s.body).map((p, k) => <p key={k} className="text-[15px] leading-relaxed text-[var(--sub)]">{p}</p>)}</div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={s.title || ''} className={`w-full rounded-2xl object-cover shadow-lg ring-1 ring-black/5 ${i % 2 ? 'lg:order-1' : ''}`} />
              </div>
            ) : (
              <div className="mx-auto max-w-2xl text-center">
                {s.title && <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">{s.title}</h2>}
                <div className="mt-5 space-y-4">{sectionParas(s.body).map((p, k) => <p key={k} className="text-[15px] leading-relaxed text-[var(--sub)]">{p}</p>)}</div>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* 5b — FAQ (contenu éditable du dev) + rich results Google */}
      {faqItems.length > 0 && (
        <section id="faq" className="scroll-mt-20 bg-[var(--panel)] py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Questions fréquentes</h2>
            <div className="mt-10 space-y-3">
              {faqItems.map((it, i) => (
                <details key={i} className="group rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-[15px] font-medium text-[var(--ink)] [&::-webkit-details-marker]:hidden">
                    <span>{it.q}</span>
                    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[var(--sub)] transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 7.5 5 5 5-5" /></svg>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--sub)]">{it.a}</p>
                </details>
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

      <SiteFooter name={c.name} seller={c.seller} slug={params.slug} pages={navPages} />
    </div>
  );
}
