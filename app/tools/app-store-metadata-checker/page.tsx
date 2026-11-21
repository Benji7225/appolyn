import Link from 'next/link';
import { PublicHeader, PublicFooter } from '@/components/public/shell';
import { MetadataChecker } from '@/components/tools/metadata-checker';

const TITLE = 'Free App Store Metadata Checker: Character Limits & Keyword Cleanup';
const DESC = 'Check your App Store title, subtitle, keyword field and promotional text against Apple’s limits. Finds duplicate and wasted keywords. Free, no signup, runs in your browser.';

export const metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/tools/app-store-metadata-checker' },
  openGraph: { title: TITLE, description: DESC, type: 'website', url: '/tools/app-store-metadata-checker' },
};

const FAQ = [
  { q: 'What are the App Store character limits?', a: 'On iOS, the app name and the subtitle are limited to 30 characters each, the keyword field to 100 characters (commas included) and the promotional text to 170 characters.' },
  { q: 'Should I put spaces after commas in the keyword field?', a: 'No. Every character counts toward the 100-character limit, and Apple treats the commas as separators, so “fitness,workout” uses fewer characters than “fitness, workout”.' },
  { q: 'Should I repeat title words in the keyword field?', a: 'No. Words already in your title and subtitle are indexed, so repeating them in the keyword field wastes space you can use for other terms.' },
  { q: 'Is my text sent to a server?', a: 'No. The check runs entirely in your browser. Nothing you type is sent or stored.' },
];

export default function Page() {
  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'App Store Metadata Checker', url: 'https://appolyn.io/tools/app-store-metadata-checker', applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@type': 'Organization', name: 'Appolyn', url: 'https://appolyn.io' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <p className="text-sm text-muted-foreground"><Link href="/tools" className="hover:text-foreground">Free tools</Link> / App Store metadata checker</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Free App Store metadata checker</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Paste your title, subtitle and keywords. See instantly what is over Apple’s limits and which keywords waste space.</p>
        <div className="mt-8"><MetadataChecker /></div>
        <section className="mt-16 max-w-2xl">
          <h2 className="text-xl font-semibold">Questions</h2>
          <dl className="mt-4 space-y-5">
            {FAQ.map((f) => (
              <div key={f.q}><dt className="font-medium">{f.q}</dt><dd className="mt-1 text-sm text-muted-foreground">{f.a}</dd></div>
            ))}
          </dl>
          <p className="mt-8 text-sm text-muted-foreground">Related: <Link className="underline" href="/blog">the Appolyn blog</Link> on App Store optimization.</p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
