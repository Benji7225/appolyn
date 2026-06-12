'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronDown, Bell, Sparkles, LogOut, Check, AppWindow } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import type { User } from '@supabase/supabase-js';

// Lightweight dropdown: a trigger + an absolutely-positioned panel, closed by a
// full-screen transparent backdrop. No external menu lib needed.
function Dropdown({ open, onClose, children }: {
  open: boolean; onClose: () => void; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full right-0 mt-1.5 z-50 min-w-[240px] rounded-xl border border-border bg-popover text-popover-foreground shadow-xl shadow-black/10 py-1.5">
        {children}
      </div>
    </>
  );
}

const iconBtn = 'h-8 w-8 rounded-lg flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 transition-colors';

export function Topbar({ user }: { user: User | null }) {
  const router = useRouter();
  const { apps, selectedApp, setSelectedAppId, setCopilotOpen } = useDashboard();
  const [appOpen, setAppOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const signOut = async () => { await supabase.auth.signOut(); router.push('/'); };

  return (
    <header className="h-14 shrink-0 bg-neutral-950 text-neutral-100 flex items-center justify-between px-4 z-30">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <Image src="/logo_3MN_(1).png" alt="Appolyn" width={26} height={26} className="rounded-[7px]" />
        <span className="font-semibold text-sm tracking-tight">Appolyn</span>
      </Link>

      {/* Right controls */}
      <div className="flex items-center gap-1.5">
        {/* Appylot (AI) */}
        <button onClick={() => setCopilotOpen(true)} className={iconBtn} title="Appylot">
          <Sparkles className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setBellOpen((v) => !v)} className={iconBtn} title="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <Dropdown open={bellOpen} onClose={() => setBellOpen(false)}>
            <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Notifications</p>
            <p className="px-3 py-3 text-[13px] text-muted-foreground">Aucune notification pour le moment.</p>
          </Dropdown>
        </div>

        {/* App switcher (far right) — also holds the account menu */}
        <div className="relative ml-0.5">
          <button onClick={() => setAppOpen((v) => !v)}
            className="flex items-center gap-2 h-8 pl-2 pr-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors max-w-[220px]">
            <AppWindow className="h-4 w-4 text-neutral-300 shrink-0" />
            <span className="text-[13px] truncate">{selectedApp?.name ?? 'Aucune app'}</span>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          </button>
          <Dropdown open={appOpen} onClose={() => setAppOpen(false)}>
            <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Applications</p>
            {apps.length === 0 && <p className="px-3 py-2 text-[13px] text-muted-foreground">Aucune application</p>}
            {apps.map((a) => (
              <button key={a.id}
                onClick={() => { setSelectedAppId(a.id); setAppOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-accent text-left">
                <span className="flex-1 truncate">{a.name}</span>
                {selectedApp?.id === a.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>
            ))}
            <Link href="/dashboard/settings/apps" onClick={() => setAppOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-accent text-primary">
              <AppWindow className="h-3.5 w-3.5" /> Gérer mes apps
            </Link>
            <div className="my-1 border-t border-border" />
            <p className="px-3 py-1.5 text-[12px] text-muted-foreground truncate">{user?.email}</p>
            <button onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-accent text-left text-destructive">
              <LogOut className="h-3.5 w-3.5" /> Se déconnecter
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
