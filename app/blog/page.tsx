import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { PublicHeader, PublicFooter } from '@/components/public/shell';

// Public, SEO-facing blog index. Read-only via the anon key (RLS exposes only
// published posts). Rendered dynamically so a freshly generated post shows up
// immediately (the index is light; articles themselves are cached per slug).
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Blog — Appolyn',
  description: 'App Store Optimization, ASO and indie app growth tactics, by Appolyn.',
  alternates: { canonical: '/blog' },
  openGraph: { title: 'The Appolyn blog', description: 'App Store Optimization, ASO and indie app growth tactics, by Appolyn.', type: 'website', url: '/blog' },
};

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type PostCard = {
  slug: string; title: string; excerpt: string; tags: string[];
  cover_gradient: string; read_minutes: number; published_at: string;
};

const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function BlogIndex() {
  const { data } = await sb
    .from('blog_posts')
    .select('slug,title,excerpt,tags,cover_gradient,read_minutes,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(60);
  const posts = (data ?? []) as PostCard[];

  // JSON-LD Blog : aide Google à comprendre l'index + ses articles (machine SEO Appolyn).
  const BASE = 'https://appolyn.io';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'The Appolyn blog',
    description: 'App Store Optimization, ASO and indie app growth tactics, by Appolyn.',
    url: `${BASE}/blog`,
    publisher: { '@type': 'Organization', name: 'Appolyn', url: BASE },
    blogPost: posts.slice(0, 30).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.excerpt,
      url: `${BASE}/blog/${p.slug}`,
      datePublished: p.published_at,
      ...(p.tags?.length ? { keywords: p.tags.join(', ') } : {}),
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">The Appolyn blog</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Practical App Store Optimization and growth tactics for indie iOS developers. New articles regularly.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">No articles yet. Check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`}
                className="group rounded-2xl border border-border/50 overflow-hidden bg-card hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200">
                <div className={`h-28 bg-gradient-to-br ${p.cover_gradient}`} />
                <div className="p-5">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(p.tags ?? []).slice(0, 3).map((t) => (
                      <span key={t} className="text-[11px] rounded-full bg-accent px-2 py-0.5 text-muted-foreground">{t}</span>
                    ))}
                  </div>
                  <h2 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors">{p.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3">{p.excerpt}</p>
                  <p className="text-xs text-muted-foreground/70 mt-3">{fmtDate(p.published_at)} · {p.read_minutes} min read</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
