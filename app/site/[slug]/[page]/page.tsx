import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { SiteHeader, SiteFooter, type NavLink } from '@/components/site/site-chrome';
import { siteTheme } from '@/lib/site-theme';
import { effectivePage, PAGE_DEFS, pageDef, type SitePages } from '@/lib/site-pages';

// Page annexe d'un site public (FAQ, contact, légales…), éditée par le dev et
// servie seulement si elle est activée. Même habillage que l'accueil (header +
// footer + thème de marque). Indexable par Google.
export const revalidate = 60;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Snapshot = { title?: string; sellerName?: string; artworkUrl?: string; iconUrl?: string; description?: string; url?: string; languages?: string[] };
type Overrides = { title?: string; description?: string; accent?: string; contactEmail?: string };
type Site = { asc_app_id: string; active?: boolean; pages: SitePages | null; content: Snapshot | null; overrides?: Overrides | null };

async function getSite(slug: string): Promise<Site | null> {
  const { data } = await sb.from('published_sites').select('asc_app_id, active, pages, content, overrides').eq('slug', slug).eq('status', 'published').maybeSingle();
  return (data as Site) ?? null;
}

type Live = { name?: string; seller?: string; description?: string; icon?: string; url?: string };

// L'app peut avoir changé (nom, description…) depuis la publication → on interroge
// l'App Store en direct (multi-storefront, lookup capricieux par pays) pour que les
// pages annexes reflètent l'état ACTUEL. Snapshot = repli.
async function resolveLive(ascAppId: string): Promise<Live | null> {
  for (const cc of ['fr', 'us', 'gb', 'de']) {
    try {
      const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(ascAppId)}&country=${cc}`, { next: { revalidate: 3600 } });
      const j = await r.json() as { results?: Record<string, unknown>[] };
      const a = (j.results ?? [])[0];
      if (a) return {
        name: a.trackName as string, seller: a.sellerName as string, description: a.description as string,
        icon: (a.artworkUrl512 as string) || (a.artworkUrl100 as string), url: a.trackViewUrl as string,
      };
    } catch { /* store suivant */ }
  }
  return null;
}

// Contexte des pages : overrides du dev > live (à jour) > snapshot (repli).
async function resolveCtx(site: Site) {
  const c = site.content ?? {};
  const live = await resolveLive(site.asc_app_id);
  return {
    name: site.overrides?.title?.trim() || live?.name || c.title || 'App',
    seller: live?.seller || c.sellerName,
    description: site.overrides?.description?.trim() || live?.description || c.description,
    icon: live?.icon || c.artworkUrl || c.iconUrl || '',
    url: live?.url || (typeof c.url === 'string' && c.url) || `https://apps.apple.com/app/id${site.asc_app_id}`,
    email: site.overrides?.contactEmail,
    languages: [] as string[],
  };
}

export async function generateMetadata({ params }: { params: { slug: string; page: string } }): Promise<Metadata> {
  const site = await getSite(params.slug);
  if (!site || site.active === false || !pageDef(params.page)) return { title: 'Page indisponible' };
  const ctx = await resolveCtx(site);
  const eff = effectivePage(params.page, site.pages, ctx);
  if (!eff || !eff.active) return { title: 'Page indisponible' };
  return {
    title: `${eff.title} · ${ctx.name}`,
    // Favicon = icône de l'app via ../icon.tsx (hérité du segment parent [slug]).
    themeColor: site.overrides?.accent || '#4f46e5',
    alternates: { canonical: `/site/${params.slug}/${params.page}` },
  };
}

export default async function PublicSitePagePage({ params }: { params: { slug: string; page: string } }) {
  const site = await getSite(params.slug);
  if (!site || site.active === false || !pageDef(params.page)) notFound();
  const ctx = await resolveCtx(site);
  const eff = effectivePage(params.page, site.pages, ctx);
  if (!eff || !eff.active) notFound();

  const theme = siteTheme(site.overrides?.accent);

  // Autres pages actives, pour la navigation en pied de page.
  const others: NavLink[] = PAGE_DEFS
    .filter((d) => d.key !== params.page && effectivePage(d.key, site.pages, ctx)?.active)
    .map((d) => ({ href: `/site/${params.slug}/${d.key}`, label: d.label }));

  return (
    <div style={theme.vars as unknown as CSSProperties} className="min-h-screen bg-[var(--surface)] text-[var(--ink)] antialiased">
      <SiteHeader name={ctx.name} icon={ctx.icon} homeHref={`/site/${params.slug}`} appStoreUrl={ctx.url} />

      <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ac-ink)]">{ctx.name}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{eff.title}</h1>
        <div className="mt-8 whitespace-pre-line text-[15px] leading-relaxed text-[var(--sub)]">{eff.body}</div>
      </main>

      <SiteFooter name={ctx.name} seller={ctx.seller} slug={params.slug} pages={others} languages={ctx.languages} />
    </div>
  );
}
