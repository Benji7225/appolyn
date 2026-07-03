'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppStoreBadge } from '@/components/store-badges';

// En-tête + pied de page PARTAGÉS du site public d'une app (accueil + pages
// annexes), pour un rendu cohérent. Présentationnels et server-safe : ils ne
// reçoivent que des données déjà résolues. Les couleurs viennent des variables CSS
// posées par siteTheme() sur le conteneur racine.

export type NavLink = { href: string; label: string };

const LANG_NAMES: Record<string, string> = {
  EN: 'Anglais', FR: 'Français', DE: 'Allemand', ES: 'Espagnol', IT: 'Italien',
  PT: 'Portugais', NL: 'Néerlandais', JA: 'Japonais', KO: 'Coréen', ZH: 'Chinois',
  RU: 'Russe', AR: 'Arabe', TR: 'Turc', PL: 'Polonais', SV: 'Suédois', DA: 'Danois',
  FI: 'Finnois', NB: 'Norvégien', NO: 'Norvégien', CS: 'Tchèque', EL: 'Grec',
  HE: 'Hébreu', HI: 'Hindi', ID: 'Indonésien', MS: 'Malais', RO: 'Roumain',
  SK: 'Slovaque', TH: 'Thaï', UK: 'Ukrainien', VI: 'Vietnamien', HU: 'Hongrois',
  CA: 'Catalan', HR: 'Croate',
};
export const langName = (code: string) => LANG_NAMES[code.toUpperCase().split('-')[0]] ?? code.toUpperCase();

export function SiteHeader({
  name, icon, homeHref, appStoreUrl, anchors = [],
}: {
  name: string; icon: string; homeHref: string; appStoreUrl: string; anchors?: NavLink[];
}) {
  // Ombre + bordure qui apparaissent une fois qu'on scrolle (détail premium, DA).
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={`sticky top-0 z-40 border-b bg-[var(--surface)]/80 backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-300 ${scrolled ? 'border-[var(--line)] shadow-[0_1px_20px_-8px_rgba(15,23,42,0.25)]' : 'border-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href={homeHref} className="flex items-center gap-2.5 min-w-0">
          {icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} alt={name} className="h-9 w-9 shrink-0 rounded-[10px] ring-1 ring-black/5" />
          )}
          <span className="truncate text-[15px] font-semibold tracking-tight text-[var(--ink)]">{name}</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {anchors.map((a) => (
            <a key={a.href} href={a.href} className="text-sm font-medium text-[var(--sub)] transition-colors hover:text-[var(--ink)]">
              {a.label}
            </a>
          ))}
        </nav>

        {/* Vrai badge « Download on the App Store » (comme Headspace/Opal), pas un
            bouton texte : c'est ce que le dev veut mettre en avant pour son app. */}
        <div className="shrink-0 transition-transform hover:scale-[1.03]">
          <AppStoreBadge href={appStoreUrl} compact />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({
  name, seller, slug, pages = [], languages = [], icon, appStoreUrl,
}: {
  name: string; seller?: string; slug: string; pages?: NavLink[]; languages?: string[]; icon?: string; appStoreUrl?: string;
}) {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--panel)]">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {/* Rangée marque + téléchargement : réassurance cohérente sur toutes les pages
            (utile surtout sur les pages annexes, qui n'ont pas la bannière d'appel). */}
        {(icon || appStoreUrl) && (
          <div className="mb-8 flex flex-col items-center justify-between gap-5 border-b border-[var(--line)] pb-8 sm:flex-row">
            <div className="flex items-center gap-3">
              {icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={icon} alt={name} className="h-11 w-11 rounded-[12px] ring-1 ring-black/5" />
              )}
              <div>
                <div className="text-sm font-semibold text-[var(--ink)]">{name}</div>
                {seller && <div className="text-xs text-[var(--sub)]">{seller}</div>}
              </div>
            </div>
            {appStoreUrl && <AppStoreBadge href={appStoreUrl} compact />}
          </div>
        )}
      <div className="space-y-6">
        {pages.length > 0 && (
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link href={`/site/${slug}`} className="text-[var(--sub)] transition-colors hover:text-[var(--ink)]">Accueil</Link>
            {pages.map((p) => (
              <Link key={p.href} href={p.href} className="text-[var(--sub)] transition-colors hover:text-[var(--ink)]">{p.label}</Link>
            ))}
          </nav>
        )}

        {languages.length > 0 && (
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sub)]">
              Disponible en {languages.length} langue{languages.length > 1 ? 's' : ''}
            </p>
            <p className="mx-auto mt-1.5 max-w-2xl text-xs text-[var(--sub)]/75">
              {languages.map(langName).join(' · ')}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--line)] pt-6 text-sm text-[var(--sub)] sm:flex-row">
          <span>© {new Date().getFullYear()} {seller || name}</span>
          <a href="https://appolyn.io" target="_blank" rel="noreferrer" className="transition-colors hover:text-[var(--ink)]">
            Site créé avec Appolyn
          </a>
        </div>
      </div>
      </div>
    </footer>
  );
}
