'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid, LineChart, Store, Star, Swords, Megaphone,
  Settings, ChevronRight, Banknote, Users, Rocket, HeartPulse, Sparkles, Sprout, Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Leaf = { href: string; label: string };
type Entry =
  | { kind: 'item'; href: string; label: string; icon: typeof LayoutGrid; exact?: boolean }
  | { kind: 'group'; label: string; icon: typeof LayoutGrid; children: Leaf[] };

const nav: Entry[] = [
  { kind: 'item', href: '/dashboard', label: 'Accueil', icon: LayoutGrid, exact: true },
  { kind: 'item', href: '/dashboard/health', label: 'Santé', icon: HeartPulse },
  { kind: 'item', href: '/dashboard/launch', label: 'Lancement', icon: Rocket },
  { kind: 'item', href: '/dashboard/growth', label: 'Croissance', icon: Sprout },
  { kind: 'item', href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
  { kind: 'item', href: '/dashboard/charts', label: 'Classements', icon: Trophy },
  { kind: 'item', href: '/dashboard/clients', label: 'Clients', icon: Users },
  {
    kind: 'group', label: 'Store Optimization', icon: Store, children: [
      { href: '/dashboard/metadata', label: 'App Store Page' },
      { href: '/dashboard/keywords', label: 'Keywords' },
      { href: '/dashboard/screenshots', label: 'Screenshots' },
      { href: '/dashboard/localization', label: 'Localisation' },
      { href: '/dashboard/release-notes', label: 'Notes de version' },
    ],
  },
  { kind: 'item', href: '/dashboard/reviews', label: 'Reviews', icon: Star },
  { kind: 'item', href: '/dashboard/competitors', label: 'Competitors', icon: Swords },
  { kind: 'item', href: '/dashboard/competitor-analysis', label: 'Analyse IA', icon: Sparkles },
  {
    kind: 'group', label: 'Marketing', icon: Megaphone, children: [
      { href: '/dashboard/marketing/organic', label: 'Organique' },
      { href: '/dashboard/marketing/paid', label: 'Publicité' },
      { href: '/dashboard/content-ideas', label: 'Idées de contenu' },
      { href: '/dashboard/press-kit', label: 'Press-kit' },
      { href: '/dashboard/launch-posts', label: 'Annonces de lancement' },
      { href: '/dashboard/share', label: 'Kit de partage' },
    ],
  },
  { kind: 'item', href: '/dashboard/finance', label: 'Trésorerie', icon: Banknote },
];

const bottom: { href: string; label: string; icon: typeof LayoutGrid }[] = [
  { href: '/dashboard/settings', label: 'Réglages', icon: Settings },
];

const rowBase = 'flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-[13px] transition-colors';

export function Sidebar() {
  const pathname = usePathname();
  const childActive = (children: Leaf[]) => children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'));
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const e of nav) if (e.kind === 'group') init[e.label] = childActive(e.children);
    return init;
  });

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
          const isOpen = open[e.label];
          const groupActive = childActive(e.children);
          return (
            <div key={e.label}>
              <button
                onClick={() => setOpen((o) => ({ ...o, [e.label]: !o[e.label] }))}
                className={cn(rowBase, 'w-full', groupActive ? 'text-foreground font-medium' : 'text-sidebar-foreground hover:bg-accent/60 hover:text-foreground')}
              >
                <e.icon className={cn('h-4 w-4 shrink-0', groupActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className="truncate flex-1 text-left">{e.label}</span>
                <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
              </button>
              {isOpen && (
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
