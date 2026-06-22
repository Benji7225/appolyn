import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { PublicHeader, PublicFooter } from '@/components/public/shell';

export const revalidate = 600;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Block = { type: 'heading' | 'paragraph' | 'list' | 'quote' | 'cta'; text?: string; items?: string[]; label?: string; href?: string };
type Post = {
  slug: string; title: string; excerpt: string; tags: string[];
  cover_gradient: string; read_minutes: number; published_at: string; body: Block[];
};

const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data } = await sb.from('blog_posts').select('title,excerpt,published_at,tags').eq('slug', params.slug).eq('status', 'published').maybeSingle();
  if (!data) return { title: 'Article — Appolyn' };
  const d = data as { title: string; excerpt: string; published_at: string; tags: string[] };
  return {
    title: `${d.title} — Appolyn`,
    description: d.excerpt,
    alternates: { canonical: `/blog/${params.slug}` },
    keywords: d.tags,
    openGraph: { title: d.title, description: d.excerpt, type: 'article', url: `/blog/${params.slug}`, publishedTime: d.published_at },
    twitter: { card: 'summary_large_image', title: d.title, description: d.excerpt },
  };
}

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case 'heading':
      return <h2 className="text-xl font-semibold tracking-tight mt-9 mb-3">{b.text}</h2>;
    case 'list':
      return (
        <ul className="my-4 space-y-2 pl-5 list-disc marker:text-muted-foreground/50">
          {(b.items ?? []).map((it, i) => <li key={i} className="text-[15px] leading-relaxed text-foreground/90">{it}</li>)}
        </ul>
      );
    case 'quote':
      return <blockquote className="my-6 border-l-2 border-primary/50 pl-4 text-[15px] italic text-foreground/80">{b.text}</blockquote>;
    case 'cta':
      return (
        <div className="my-8 rounded-2xl border border-border/50 bg-card p-6 text-center">
          <p className="text-[15px] text-foreground/90 mb-4">{b.text}</p>
          <Link href={b.href || '/'} className="inline-flex items-center rounded-lg bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity">
            {b.label || 'Try Appolyn'}
          </Link>
        </div>
      );
    default:
      return <p className="my-4 text-[15px] leading-relaxed text-foreground/90">{b.text}</p>;
  }
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const { data } = await sb
    .from('blog_posts')
    .select('slug,title,excerpt,tags,cover_gradient,read_minutes,published_at,body')
    .eq('slug', params.slug).eq('status', 'published').maybeSingle();
  if (!data) notFound();
  const post = data as Post;

  // JSON-LD BlogPosting : éligibilité aux rich results Google sur la machine SEO d'Appolyn.
  const BASE = 'https://appolyn.io';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: { '@type': 'Organization', name: 'Appolyn', url: BASE },
    publisher: { '@type': 'Organization', name: 'Appolyn', url: BASE, logo: { '@type': 'ImageObject', url: `${BASE}/icon.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE}/blog/${post.slug}` },
    ...(post.tags?.length ? { keywords: post.tags.join(', ') } : {}),
    url: `${BASE}/blog/${post.slug}`,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Blog</Link>

        <div className={`h-40 rounded-2xl bg-gradient-to-br ${post.cover_gradient} mt-4 mb-7`} />

        <div className="flex flex-wrap gap-1.5 mb-3">
          {(post.tags ?? []).map((t) => (
            <span key={t} className="text-[11px] rounded-full bg-accent px-2 py-0.5 text-muted-foreground">{t}</span>
          ))}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight leading-tight">{post.title}</h1>
        <p className="text-xs text-muted-foreground mt-3">{fmtDate(post.published_at)} · {post.read_minutes} min read</p>

        <article className="mt-6">
          {(post.body ?? []).map((b, i) => <BlockView key={i} b={b} />)}
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
