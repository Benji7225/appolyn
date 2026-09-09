'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutGrid, LineChart, Store, Star, Swords, Megaphone,
  Settings, Banknote, Users, Globe, Smartphone, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Leaf = { href: string; label: string };
type Entry =
  | { kind: 'item'; href: string; label: string; icon: typeof LayoutGrid; exact?: boolean }
  | { kind: 'group'; label: string; icon: typeof LayoutGrid; children: Leaf[] };

// Un groupe DÉPLIE ses sous-pages, il ne navigue pas. Les anciennes pages hub
// (/app/store, /app/application, /app/marketing) ne faisaient que réafficher ce
// menu sous forme de cartes : elles ont été supprimées.
const nav: Entry[] = [
  { kind: 'item', href: '/app', label: 'Accueil', icon: LayoutGrid, exact: true },
  { kind: 'item', href: '/app/analytics', label: 'Analytics', icon: LineChart },
  { kind: 'item', href: '/app/clients', label: 'Utilisateurs', icon: Users },
  {
    kind: 'group', label: 'ASO', icon: Store, children: [
      { href: '/app/localization', label: 'Localisation' },
      { href: '/app/screenshots', label: 'Screenshots' },
      { href: '/app/keywords', label: 'Mots-clés' },
    ],
  },
  {
    kind: 'group', label: 'Application', icon: Smartphone, children: [
      { href: '/app/onboarding', label: 'Onboarding' },
      { href: '/app/paywalls', label: 'Paywalls' },
      { href: '/app/notifications', label: 'Notifications' },
    ],
  },
  {
    kind: 'group', label: 'Marketing', icon: Megaphone, children: [
      { href: '/app/marketing/organic', label: 'Organique' },
      { href: '/app/marketing/paid', label: 'Publicité' },
      { href: '/app/content-ideas', label: 'Idées de contenu' },
    ],
  },
  { kind: 'item', href: '/app/site', label: 'Site', icon: Globe },
  { kind: 'item', href: '/app/reviews', label: 'Avis', icon: Star },
  { kind: 'item', href: '/app/competitors', label: 'Concurrents', icon: Swords },
  { kind: 'item', href: '/app/finance', label: 'Trésorerie', icon: Banknote },
];

const bottom: { href: string; label: string; icon: typeof LayoutGrid }[] = [
  { href: '/app/settings', label: 'Réglages', icon: Settings },
];

const rowBase = 'flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-[13px] transition-colors';
const OPEN_KEY = 'appolyn.sidebar.open';

export function Sidebar() {
  const pathname = usePathname();
  const inGroup = (children: Leaf[]) =>
    children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'));

  // Sur mobile, la barre occupait 240 px sur les ~390 px d'un iPhone : il restait
  // 150 px pour le contenu, donc le dashboard etait inutilisable au telephone.
  // Elle devient un tiroir, ferme par defaut, ouvert par le bouton de la Topbar.
  // C'est ce qui rend Appolyn consultable sur mobile sans application native,
  // alors que ses deux concurrents directs sont des applications macOS.
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    const open = () => setDrawer((v) => !v);
    window.addEventListener('appolyn:toggle-sidebar', open);
    return () => window.removeEventListener('appolyn:toggle-sidebar', open);
  }, []);
  // Toute navigation referme le tiroir : sinon il masque la page qu'on vient d'ouvrir.
  useEffect(() => { setDrawer(false); }, [pathname]);

  // Ouvert par défaut pour la section où l'on se trouve. Le choix de l'utilisateur
  // est ensuite mémorisé, pour que le menu ne se referme pas dans son dos.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let saved: Record<string, boolean> = {};
    try {
      saved = JSON.parse(localStorage.getItem(OPEN_KEY) || '{}');
    } catch {
      saved = {};
    }
    setOpen(saved);
    setReady(true);
  }, []);

  const toggle = (label: string, isOpen: boolean) => {
    const next = { ...open, [label]: !isOpen };
    setOpen(next);
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(next));
    } catch {
      /* navigation privée : on garde l'état en mémoire seulement */
    }
  };

  return (
    <>
      {/* Voile, uniquement quand le tiroir mobile est ouvert */}
      {drawer && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setDrawer(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'w-60 shrink-0 bg-sidebar border-r border-border flex flex-col scrollbar-macos',
          // Mobile : tiroir superpose, glisse depuis la gauche.
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:transition-none',
          drawer ? 'translate-x-0' : '-translate-x-full',
          // Desktop : colonne normale dans le flux, toujours visible.
          'md:static md:translate-x-0 md:h-full md:z-auto',
        )}
      >
      <nav className="flex-1 overflow-auto px-2.5 py-3 space-y-0.5 scrollbar-macos">
        {nav.map((e) => {
          if (e.kind === 'item') {
            const active = e.exact
              ? pathname === e.href
              : pathname === e.href || pathname.startsWith(e.href + '/');
            return (
              <Link
                key={e.href}
                href={e.href}
                className={cn(
                  rowBase,
                  active
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <e.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
                <span className="truncate">{e.label}</span>
              </Link>
            );
          }

          const here = inGroup(e.children);
          // Avant l'hydratation, on n'ouvre que la section courante : pas de saut
          // visuel au chargement.
          const isOpen = ready ? (open[e.label] ?? here) : here;

          return (
            <div key={e.label}>
              <button
                type="button"
                onClick={() => toggle(e.label, isOpen)}
                aria-expanded={isOpen}
                className={cn(
                  rowBase,
                  'w-full text-left',
                  here
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <e.icon className={cn('h-4 w-4 shrink-0', here ? 'text-primary' : 'text-muted-foreground')} />
                <span className="truncate flex-1">{e.label}</span>
                <ChevronRight
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                    isOpen && 'rotate-90',
                  )}
                />
              </button>
              {isOpen && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-border space-y-0.5">
                  {e.children.map((c) => {
                    const active = pathname === c.href || pathname.startsWith(c.href + '/');
                    return (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={cn(
                          'flex items-center h-8 px-2.5 rounded-lg text-[13px] transition-colors',
                          active
                            ? 'bg-accent text-foreground font-medium'
                            : 'text-sidebar-foreground hover:bg-accent/60 hover:text-foreground',
                        )}
                      >
                        <span className="truncate">{c.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-2.5 py-3 border-t border-border space-y-0.5">
        {bottom.map((b) => {
          const active = pathname === b.href || pathname.startsWith(b.href + '/');
          return (
            <Link
              key={b.href}
              href={b.href}
              className={cn(
                rowBase,
                active
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-accent/60 hover:text-foreground',
              )}
            >
              <b.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
              <span className="truncate">{b.label}</span>
            </Link>
          );
        })}
        </div>
      </aside>
    </>
  );
}
