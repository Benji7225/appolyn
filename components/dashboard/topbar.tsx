'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronDown, Bot, Bell, Check, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { App } from '@/lib/database.types';

const SELECTED_APP_KEY = 'appolyn_selected_app_id';

function getStoredAppId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SELECTED_APP_KEY);
}

function setStoredAppId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SELECTED_APP_KEY, id);
}

type Props = { onCopilotOpen?: () => void };

export function TopBar({ onCopilotOpen }: Props) {
  const pathname = usePathname();
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('apps')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const list = (data ?? []) as App[];
        setApps(list);
        if (list.length > 0) {
          const storedId = getStoredAppId();
          const found = list.find((a) => a.id === storedId) ?? list[0];
          setSelectedApp(found);
        }
      });
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (app: App) => {
    setSelectedApp(app);
    setStoredAppId(app.id);
    setOpen(false);
  };

  // Compute page title from pathname
  const segments = pathname.replace('/dashboard', '').split('/').filter(Boolean);
  const pageTitle = segments.length === 0
    ? 'Dashboard'
    : segments[segments.length - 1]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30 flex items-center px-6 gap-4 shrink-0">
      {/* Page title */}
      <span className="text-sm font-medium text-foreground/70 truncate flex-1">{pageTitle}</span>

      {/* Right section */}
      <div className="flex items-center gap-2 shrink-0">
        {/* App selector */}
        {apps.length > 0 && (
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-lg border border-border bg-card hover:border-border/80 hover:bg-accent/60 transition-all text-sm"
            >
              {selectedApp?.icon_url ? (
                <Image src={selectedApp.icon_url} alt="" width={18} height={18} className="rounded-[4px] shrink-0" />
              ) : (
                <div className="h-[18px] w-[18px] rounded-[4px] bg-accent flex items-center justify-center shrink-0">
                  <Layers className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              <span className="font-medium truncate max-w-[140px]">{selectedApp?.name ?? 'Mon app'}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0', open && 'rotate-180')} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-1.5">
                  {apps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleSelect(app)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      {app.icon_url ? (
                        <Image src={app.icon_url} alt="" width={24} height={24} className="rounded-lg shrink-0" />
                      ) : (
                        <div className="h-6 w-6 rounded-lg bg-accent flex items-center justify-center shrink-0">
                          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm truncate flex-1">{app.name}</span>
                      {selectedApp?.id === app.id && (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-border p-1.5">
                  <Link
                    href="/dashboard/apps"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent transition-colors text-sm text-muted-foreground"
                  >
                    Gérer les apps
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications (decorative for now) */}
        <button className="relative h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
        </button>

        {/* Copilot trigger */}
        <button
          onClick={onCopilotOpen}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Ouvrir le Copilote"
        >
          <Bot className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
