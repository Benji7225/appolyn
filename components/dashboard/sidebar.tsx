'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid, LineChart, Store, Star, Swords, Megaphone,
  Settings, Banknote, Users, Globe, Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Leaf = { href: string; label: string };
type Entry =
  | { kind: 'item'; href: string; label: string; icon: typeof LayoutGrid; exact?: boolean }
  | { kind: 'group'; label: string; icon: typeof LayoutGrid; href: string; children: Leaf[] };

// Menu volontairement simple (façon Shopify) : pas de titres de section, pas de
// flèches. Un groupe = une entrée cliquable qui mène à sa page principale ; ses
// sous-pages n'apparaissent en dessous QUE quand on est dans cette section.
const nav: Entry[] = [
  { kind: 'item', href: '/app', label: 'Accueil', icon: LayoutGrid, exact: true },
  { kind: 'item', href: '/app/analytics', label: 'Analytics', icon: LineChart },
  { kind: 'item', href: '/app/clients', label: 'Utilisateurs', icon: Users },
  {
    kind: 'group', label: 'ASO', icon: Store, href: '/app/store', children: [
      { href: '/app/localization', label: 'Localisation' },
      { href: '/app/screenshots', label: 'Screenshots' },
      { href: '/app/keywords', label: 'Mots-clés' },
    ],
  },
  {
    kind: 'group', label: 'Application', icon: Smartphone, href: '/app/application', children: [
      { href: '/app/onboarding', label: 'Onboarding' },
      { href: '/app/paywalls', label: 'Paywalls' },
      { href: '/app/notifications', label: 'Notifications' },
    ],
  },
  {
    kind: 'group', label: 'Marketing', icon: Megaphone, href: '/app/marketing', children: [
      { href: '/app/marketing/organic', label: 'Organique' },
      { href: '/app/marketing/paid', label: 'Publicité' },
      { href: '/app/content-ideas', label: 'Idées de contenu' },
      { href: '/app/share', label: 'Kit de partage' },
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

export function Sidebar() {
  const pathname = usePathname();
  const childActive = (children: Leaf[]) => children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'));

  return (
    <aside className="w-60 shrink-0 bg-sidebar border-r border-border flex flex-col h-full scrollbar-macos">
      <nav className="flex-1 overflow-auto px-2.5 py-3 space-y-0.5 scrollbar-macos">
        {nav.map((e) => {
          if (e.kind === 'item') {
            const active = e.exact ? pathname === e.href : pathname === e.href || pathname.startsWith(e.href + '/');
            return (
              <Link key={e.href} href={e.href}
                className={cn(rowBase, active ? 'bg-accent text-foreground font-medium' : 'text-sidebar-foreground hover:bg-accent/60 hover:text-foreground')}>
                <e.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
                <span className="truncate">{e.label}</span>
              </Link>
            );
          }
          // Groupe (façon Shopify) : entrée parent cliquable qui mène à la VRAIE
          // page de section (hub), + sous-pages visibles uniquement quand on est
          // dans la section (page parent ou enfants). Aucune flèche.
          const onParent = pathname === e.href || pathname.startsWith(e.href + '/');
          const groupActive = onParent || childActive(e.children);
          return (
            <div key={e.label}>
              <Link href={e.href}
                className={cn(rowBase, groupActive ? 'bg-accent text-foreground font-medium' : 'text-sidebar-foreground hover:bg-accent/60 hover:text-foreground')}>
                <e.icon className={cn('h-4 w-4 shrink-0', groupActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className="truncate">{e.label}</span>
              </Link>
              {groupActive && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-border space-y-0.5">
                  {e.children.map((c) => {
                    const active = pathname === c.href || pathname.startsWith(c.href + '/');
                    return (
                      <Link key={c.href} href={c.href}
                        className={cn('flex items-center h-8 px-2.5 rounded-lg text-[13px] transition-colors',
                          active ? 'bg-accent text-foreground font-medium' : 'text-sidebar-foreground hover:bg-accent/60 hover:text-foreground')}>
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
            <Link key={b.href} href={b.href}
              className={cn(rowBase, active ? 'bg-accent text-foreground font-medium' : 'text-sidebar-foreground hover:bg-accent/60 hover:text-foreground')}>
              <b.icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
              <span className="truncate">{b.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
