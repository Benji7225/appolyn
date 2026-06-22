import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { PAGE_KEYS } from '@/lib/site-pages';

const BASE = 'https://appolyn.io';

// Le sitemap se régénère chaque heure : les nouveaux articles de blog publiés
// apparaissent tout seuls (lus depuis Supabase, RLS = seulement les publiés).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/docs`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/legal/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/legal/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/legal/data-deletion`, changeFrequency: 'yearly', priority: 0.3 },
  ];
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data } = await sb
      .from('blog_posts')
      .select('slug, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(500);
    const posts = (data ?? []) as { slug: string; published_at: string | null }[];
    const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
    // Sites publiés par les devs : accueil + pages annexes ACTIVES (FAQ, contact,
    // légales…), pour que Google crawle toute la surface. Les sites désactivés
    // (active=false → 404) sont exclus du sitemap.
    const { data: sitesData } = await sb
      .from('published_sites')
      .select('slug, updated_at, active, pages')
      .eq('status', 'published')
      .limit(2000);
    type SiteRow = { slug: string; updated_at: string | null; active: boolean | null; pages: Record<string, { active?: boolean }> | null };
    const siteRoutes: MetadataRoute.Sitemap = [];
    for (const s of (sitesData ?? []) as SiteRow[]) {
      if (s.active === false) continue;
      const lastModified = s.updated_at ? new Date(s.updated_at) : undefined;
      siteRoutes.push({ url: `${BASE}/site/${s.slug}`, lastModified, changeFrequency: 'weekly', priority: 0.5 });
      for (const key of PAGE_KEYS) {
        // Pages annexes actives par défaut (désactivée seulement si active === false).
        if (s.pages?.[key]?.active !== false) {
          siteRoutes.push({ url: `${BASE}/site/${s.slug}/${key}`, lastModified, changeFrequency: 'monthly', priority: 0.3 });
        }
      }
    }
    return [...staticRoutes, ...blogRoutes, ...siteRoutes];
  } catch {
    return staticRoutes;
  }
}
