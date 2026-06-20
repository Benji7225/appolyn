import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

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
    return [...staticRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
