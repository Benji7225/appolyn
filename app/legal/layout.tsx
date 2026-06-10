import Link from 'next/link';

// Public legal pages (no auth). Shared chrome: header back to home + footer with
// cross-links. Kept deliberately simple and readable.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">Appolyn</Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Retour au site</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <article className="text-[15px] leading-relaxed
          [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1]:mb-1
          [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-2
          [&_p]:text-muted-foreground [&_p]:mb-3
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:text-muted-foreground [&_ul]:mb-3
          [&_a]:text-primary [&_a]:underline
          [&_strong]:text-foreground [&_strong]:font-medium">{children}</article>

        <footer className="mt-16 pt-6 border-t border-border flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link href="/legal/privacy" className="hover:text-foreground">Politique de confidentialité</Link>
          <Link href="/legal/terms" className="hover:text-foreground">Conditions d&apos;utilisation</Link>
          <Link href="/legal/data-deletion" className="hover:text-foreground">Suppression des données</Link>
        </footer>
      </main>
    </div>
  );
}
