import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { effectivePage, PAGE_DEFS, pageDef, type SitePages } from '@/lib/site-pages';

// Page annexe d'un site public (FAQ, contact, légales…), éditée par le dev et
// servie seulement si elle est activée. Indexable par Google.
export const revalidate = 60;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Snapshot = { title?: string; sellerName?: string; artworkUrl?: string; iconUrl?: string; description?: string };
type Site = { active?: boolean; pages: SitePages | null; content: Snapshot | null; overrides?: { title?: string; description?: string } | null };

async function getSite(slug: string): Promise<Site | null> {
  const { data } = await sb.from('published_sites').select('active, pages, content, overrides').eq('slug', slug).eq('status', 'published').maybeSingle();
  return (data as Site) ?? null;
}

function ctxOf(site: Site): { name: string; seller?: string; description?: string; icon: string } {
  const c = site.content ?? {};
  return {
    name: site.overrides?.title?.trim() || c.title || 'App',
    seller: c.sellerName,
    description: site.overrides?.description?.trim() || c.description,
    icon: c.artworkUrl || c.iconUrl || '',
  };
}

export async function generateMetadata({ params }: { params: { slug: string; page: string } }): Promise<Metadata> {
  const site = await getSite(params.slug);
  if (!site || site.active === false || !pageDef(params.page)) return { title: 'Page indisponible' };
  const ctx = ctxOf(site);
  const eff = effectivePage(params.page, site.pages, ctx);
  if (!eff || !eff.active) return { title: 'Page indisponible' };
  return {
    title: `${eff.title} · ${ctx.name}`,
    icons: ctx.icon ? { icon: ctx.icon } : undefined,
    alternates: { canonical: `/site/${params.slug}/${params.page}` },
  };
}

export default async function PublicSitePagePage({ params }: { params: { slug: string; page: string } }) {
  const site = await getSite(params.slug);
  if (!site || site.active === false || !pageDef(params.page)) notFound();
  const ctx = ctxOf(site);
  const eff = effectivePage(params.page, site.pages, ctx);
  if (!eff || !eff.active) notFound();

  // Autres pages actives, pour la navigation en pied de page.
  const others = PAGE_DEFS.filter((d) => d.key !== params.page && site.pages?.[d.key]?.active);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-3">
          {ctx.icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ctx.icon} alt={ctx.name} className="w-9 h-9 rounded-[10px]" />
          )}
          <Link href={`/site/${params.slug}`} className="text-sm font-medium hover:underline">{ctx.name}</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">{eff.title}</h1>
        <div className="text-[15px] leading-relaxed text-foreground/85 whitespace-pre-line">{eff.body}</div>
      </main>

      <footer className="border-t border-border/40 mt-8">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-3 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            <Link href={`/site/${params.slug}`} className="hover:text-foreground transition-colors">Accueil</Link>
            {others.map((d) => (
              <Link key={d.key} href={`/site/${params.slug}/${d.key}`} className="hover:text-foreground transition-colors">{d.label}</Link>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/30">
            <span>© {new Date().getFullYear()} {ctx.seller || ctx.name}</span>
            <a href="https://appolyn.io" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Site créé avec Appolyn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
