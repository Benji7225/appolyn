import Link from 'next/link';

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
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-xl backdrop-saturate-150">
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

        <a
          href={appStoreUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 shrink-0 items-center rounded-full bg-[var(--ac)] px-4 text-sm font-semibold text-[var(--ac-on)] shadow-sm transition-transform hover:scale-[1.03]"
        >
          Télécharger
        </a>
      </div>
    </header>
  );
}

export function SiteFooter({
  name, seller, slug, pages = [], languages = [],
}: {
  name: string; seller?: string; slug: string; pages?: NavLink[]; languages?: string[];
}) {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--panel)]">
      <div className="mx-auto max-w-6xl space-y-6 px-5 py-12 sm:px-8">
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
    </footer>
  );
}
