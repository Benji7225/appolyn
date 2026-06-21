import Link from 'next/link';
import Image from 'next/image';

export function PublicHeader() {
  return (
    <header className="h-14 border-b border-border/40 flex items-center justify-between px-6 max-w-5xl mx-auto w-full">
      <Link href="/" className="flex items-center gap-2.5">
        <Image src="/logo_3MN_(1).png" alt="Appolyn" width={24} height={24} className="rounded-[6px]" />
        <span className="font-semibold text-sm tracking-tight">Appolyn</span>
      </Link>
      <nav className="flex items-center gap-5 text-sm">
        <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
        <Link href="/app" className="rounded-lg bg-foreground text-background px-3 py-1.5 text-[13px] font-medium hover:opacity-90 transition-opacity">
          Ouvrir l&apos;app
        </Link>
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border/40 mt-16">
      <div className="max-w-5xl mx-auto w-full px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} Appolyn. Conçu pour les développeurs indé.</span>
        <div className="flex items-center gap-5">
          <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">Conditions</Link>
          <a href="mailto:contact@appolyn.io" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
