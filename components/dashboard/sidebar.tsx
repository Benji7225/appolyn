'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, ChartLine as LineChart, Store, Star, Swords, Megaphone, AppWindow, Settings, LogOut, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

type Leaf = { href: string; label: string };
type Entry =
  | { kind: 'item'; href: string; label: string; icon: typeof LayoutGrid; exact?: boolean }
  | { kind: 'group'; href: string; label: string; icon: typeof LayoutGrid; children: Leaf[] };

const nav: Entry[] = [
  { kind: 'item', href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { kind: 'item', href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
  {
    kind: 'group', href: '/dashboard/store', label: 'Store Optimization', icon: Store, children: [
      { href: '/dashboard/metadata', label: 'App Store Page' },
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

const bottom: { href: string; label: string; icon: typeof LayoutGrid }[] = [
  { href: '/dashboard/apps', label: 'Apps', icon: AppWindow },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const rowBase = 'flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-[13px] transition-colors';

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const childActive = (children: Leaf[]) => children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'));
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const e of nav) if (e.kind === 'group') init[e.label] = childActive(e.children);
    return init;
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <aside className="w-60 shrink-0 bg-sidebar border-r border-border flex flex-col h-screen sticky top-0 scrollbar-macos">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
        <Image src="/logo_3MN_(1).png" alt="Appolyn" width={26} height={26} className="rounded-[7px]" />
        <span className="font-semibold text-sm tracking-tight text-foreground">Appolyn</span>
      </div>

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
          const groupActive = childActive(e.children);

          return (
            <div key={e.label}>
              {/* Group header: Link navigates, separate button toggles */}
              <div className={cn(rowBase, 'w-full pr-0', groupActive ? 'text-foreground font-medium' : 'text-sidebar-foreground')}>
                <Link
                  href={e.href}
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

      {/* Bottom */}
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
        <div className="flex items-center gap-2 px-2.5 pt-2 mt-1">
          <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-[11px] font-medium text-muted-foreground shrink-0">
            {(user?.email ?? '?').charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground truncate flex-1">{user?.email}</span>
          <button onClick={handleSignOut} title="Sign out" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
