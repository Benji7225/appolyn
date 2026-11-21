import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/components/public/shell';

const DESC = 'Free tools for indie iOS developers: App Store metadata checker and more. No signup.';
export const metadata = {
  title: 'Free App Store Tools for Indie Developers — Appolyn',
  description: DESC,
  alternates: { canonical: '/tools' },
  openGraph: { title: 'Free tools for indie iOS developers', description: DESC, type: 'website', url: '/tools' },
};

const TOOLS = [
  { href: '/tools/app-store-metadata-checker', name: 'App Store metadata checker', desc: 'Check title, subtitle, keywords and promo text against Apple’s limits, and clean up wasted keywords.' },
];

export default function ToolsIndex() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Free tools for indie iOS developers</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Small, useful, no signup.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="rounded-xl border border-border p-5 hover:bg-muted/40 transition-colors">
              <h2 className="font-medium">{t.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
            </Link>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
