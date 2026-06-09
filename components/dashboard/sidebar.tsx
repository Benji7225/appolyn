'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, ChartLine as LineChart, Store, Star, Swords, Megaphone, Settings, LogOut, ChevronRight, Chrome as Home, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@supabase/supabase-js';

type Leaf = { href: string; label: string };
type Entry =
  | { kind: 'item'; href: string; label: string; icon: typeof LayoutGrid; exact?: boolean }
  | { kind: 'group'; href: string; label: string; icon: typeof LayoutGrid; children: Leaf[] };

const nav: Entry[] = [
  { kind: 'item', href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { kind: 'item', href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
  {
    kind: 'group', href: '/dashboard/metadata', label: 'ASO', icon: Store, children: [
      { href: '/dashboard/keywords', label: 'Keywords' },
      { href: '/dashboard/audit', label: 'Audit' },
      { href: '/dashboard/store/screenshots', label: 'Screenshots' },
    ],
  },
  { kind: 'item', href: '/dashboard/reviews', label: 'Reviews', icon: Star },
  { kind: 'item', href: '/dashboard/competitors', label: 'Competitors', icon: Swords },
  {
    kind: 'group', href: '/dashboard/marketing', label: 'Marketing', icon: Megaphone, children: [
      { href: '/dashboard/marketing/organic', label: 'Organique' },
      { href: '/dashboard/marketing/paid', label: 'Publicité' },
    ],
  },
];

const rowBase = 'flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-[13px] transition-colors';

export function Sidebar({ user }: { user: UserType | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const childActive = (children: Leaf[]) => children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'));
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const e of nav) if (e.kind === 'group') init[e.label] = childActive(e.children);
    return init;
  });

  // Also open the group if the group href itself is active
  useEffect(() => {
    for (const e of nav) {
      if (e.kind === 'group') {
        const groupActive = pathname === e.href || pathname.startsWith(e.href + '/') || childActive(e.children);
        if (groupActive) {
          setOpen((o) => ({ ...o, [e.label]: true }));
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close settings popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <aside className="w-56 shrink-0 bg-sidebar border-r border-border flex flex-col h-screen sticky top-0 scrollbar-macos">
      {/* Nav */}
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
          const groupActive = pathname === e.href || pathname.startsWith(e.href + '/') || childActive(e.children);

          return (
            <div key={e.label}>
              <div className={cn(rowBase, 'w-full pr-0', groupActive ? 'text-foreground font-medium' : 'text-sidebar-foreground')}>
                <Link
                  href={e.href}
                  onClick={() => setOpen((o) => ({ ...o, [e.label]: true }))}
                  className="flex items-center gap-2.5 flex-1 min-w-0 hover:text-foreground transition-colors"
                >
                  <e.icon className={cn('h-4 w-4 shrink-0', groupActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="truncate">{e.label}</span>
                </Link>
                <button
                  onClick={() => setOpen((o) => ({ ...o, [e.label]: !o[e.label] }))}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent/60 transition-colors shrink-0"
                >
                  <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                </button>
              </div>
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

      {/* Bottom — Settings with popover */}
      <div className="px-2.5 py-3 border-t border-border">
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className={cn(rowBase, 'w-full', settingsOpen ? 'bg-accent text-foreground' : 'text-sidebar-foreground hover:bg-accent/60 hover:text-foreground')}
          >
            <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-[11px] font-medium text-muted-foreground shrink-0">
              {(user?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <span className="text-[13px] truncate flex-1 text-left">{(user?.email ?? '').split('@')[0] || 'Compte'}</span>
            <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0', settingsOpen && 'rotate-90')} />
          </button>

          {settingsOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-[13px] font-medium shrink-0">
                    {(user?.email ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">{(user?.email ?? '').split('@')[0]}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-1.5">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent transition-colors text-[13px]"
                >
                  <Settings className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  Paramètres
                </Link>
                <Link
                  href="/"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent transition-colors text-[13px]"
                >
                  <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  Page d&apos;accueil
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent transition-colors text-[13px] text-left text-destructive hover:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
