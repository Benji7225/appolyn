import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/components/public/shell';
import { ScreenshotSizeChecker } from '@/components/tools/screenshot-size-checker';

const PATH = '/tools/app-store-screenshot-sizes';
const TITLE = 'App Store Screenshot Sizes: Free Checker for iPhone & iPad (2026)';
const DESC = 'Every accepted App Store Connect screenshot size for iPhone and iPad, and a free checker: drop your images and see if the size, format and transparency are accepted. Runs in your browser.';

export const metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESC, type: 'website', url: PATH },
};

const FAQ = [
  { q: 'Which iPhone screenshot size is required?', a: 'App Store Connect requires at least one iPhone set: Dynamic Island (medium), at 1206 × 2622 or 1179 × 2556 pixels. If you do not provide the Dynamic Island (large) set, the Face ID (large) set is also required. Larger and smaller sets are optional.' },
  { q: 'Do I need iPad screenshots?', a: 'Only if your app runs on iPad. In that case the 13-inch set is required, at 2064 × 2752 or 2048 × 2732 pixels.' },
  { q: 'Why does App Store Connect reject my PNG?', a: 'Screenshots cannot contain an alpha channel or transparency. Export without transparency, or save as JPEG. The checker above flags PNG files with an alpha channel.' },
  { q: 'How many screenshots can I upload?', a: 'At least 1 and up to 10 per device size.' },
  { q: 'Do I need a different screenshot for every device?', a: 'No. If your UI is consistent across sizes, you only need the highest required resolution and App Store Connect scales it down.' },
  { q: 'Are my images uploaded?', a: 'No. The check runs entirely in your browser.' },
];

export default function Page() {
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'App Store Screenshot Size Checker', url: `https://appolyn.io${PATH}`, applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@type': 'Organization', name: 'Appolyn', url: 'https://appolyn.io' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <p className="text-sm text-muted-foreground"><Link href="/tools" className="hover:text-foreground">Free tools</Link> / App Store screenshot sizes</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">App Store screenshot sizes and free checker</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">The sizes App Store Connect accepts for iPhone and iPad, and a checker that tells you why a file would be rejected.</p>
        <div className="mt-8"><ScreenshotSizeChecker /></div>
        <section className="mt-16 max-w-2xl">
          <h2 className="text-xl font-semibold">Questions</h2>
          <dl className="mt-4 space-y-5">
            {FAQ.map((f) => (
              <div key={f.q}><dt className="font-medium">{f.q}</dt><dd className="mt-1 text-sm text-muted-foreground">{f.a}</dd></div>
            ))}
          </dl>
          <p className="mt-8 text-sm text-muted-foreground">Related: <Link className="underline" href="/tools/app-store-metadata-checker">App Store metadata checker</Link> · <Link className="underline" href="/blog/app-store-screenshot-sizes-2026-what-app-store-connect-requires">the full guide on screenshot sizes</Link>.</p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
