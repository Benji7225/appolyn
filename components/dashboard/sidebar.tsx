'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid, LineChart, Store, Star, Swords, Megaphone,
  AppWindow, Settings, LogOut,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

type Item = { href: string; label: string; icon: typeof LayoutGrid; exact?: boolean };

const groups: { title?: string; items: Item[] }[] = [
  {
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutGrid, exact: true },
      { href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
    ],
  },
  {
    title: 'Optimisation',
    items: [
      { href: '/dashboard/store', label: 'Store Optimization', icon: Store },
      { href: '/dashboard/reviews', label: 'Reviews', icon: Star },
      { href: '/dashboard/competitors', label: 'Competitors', icon: Swords },
    ],
  },
  {
    title: 'Croissance',
    items: [
      { href: '/dashboard/marketing', label: 'Marketing', icon: Megaphone },
    ],
  },
];

const bottomItems: Item[] = [
  { href: '/dashboard/apps', label: 'Apps', icon: AppWindow },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function NavRow({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[13px] transition-colors',
        active
          ? 'bg-primary text-primary-foreground font-medium shadow-sm'
          : 'text-sidebar-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary-foreground' : 'text-muted-foreground')} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (item: Item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <aside className="w-60 shrink-0 vibrancy border-r border-border/60 flex flex-col h-screen sticky top-0 scrollbar-macos">
      {/* Title bar */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border/40">
        <Image src="/logo_3MN_(1).png" alt="Appolyn" width={26} height={26} className="rounded-[7px]" />
        <span className="font-semibold text-sm tracking-tight">Appolyn</span>
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-auto px-2.5 py-3 space-y-4 scrollbar-macos">
        {groups.map((group, gi) => (
          <div key={gi} className="space-y-0.5">
            {group.title && (
              <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <NavRow key={item.href} item={item} active={isActive(item)} />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: apps, settings, account */}
      <div className="px-2.5 py-3 border-t border-border/40 space-y-0.5">
        {bottomItems.map((item) => (
          <NavRow key={item.href} item={item} active={isActive(item)} />
        ))}
        <div className="flex items-center gap-2 px-2.5 pt-2 mt-1">
          <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-[11px] font-medium text-muted-foreground shrink-0">
            {(user?.email ?? '?').charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground truncate flex-1">{user?.email}</span>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
