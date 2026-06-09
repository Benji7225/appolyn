'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bot, Bell, Check, Layers, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/app-context';
import type { App } from '@/lib/database.types';

type Props = { onCopilotOpen?: () => void };

export function TopBar({ onCopilotOpen }: Props) {
  const { apps, selectedApp, setSelectedApp } = useApp();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleSelect = (app: App) => {
    setSelectedApp(app);
    setOpen(false);
  };

  // Close on outside click
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
  };

  return (
    <header className="h-12 bg-[#0f0f0f] border-b border-white/[0.08] sticky top-0 z-40 flex items-center px-4 gap-4 shrink-0">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0 mr-2">
        <Image src="/logo_3MN_(1).png" alt="Appolyn" width={22} height={22} className="rounded-[6px]" />
        <span className="font-semibold text-[13px] tracking-tight text-white">Appolyn</span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* App selector */}
        {apps.length > 0 && (
          <div className="relative" ref={dropRef} onBlur={handleBlur} tabIndex={-1}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5 h-7 pl-2 pr-1.5 rounded-md bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.10] transition-all text-[13px] text-white"
            >
              {selectedApp?.icon_url ? (
                <Image src={selectedApp.icon_url} alt="" width={16} height={16} className="rounded-[4px] shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-[4px] bg-white/10 flex items-center justify-center shrink-0">
                  <Layers className="h-2.5 w-2.5 text-white/60" />
                </div>
              )}
              <span className="font-medium truncate max-w-[130px] text-white/90">{selectedApp?.name ?? 'Mon app'}</span>
              <ChevronDown className={cn('h-3 w-3 text-white/50 transition-transform shrink-0', open && 'rotate-180')} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#1a1a1a] border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-1.5">
                  {apps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleSelect(app)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.07] transition-colors text-left"
                    >
                      {app.icon_url ? (
                        <Image src={app.icon_url} alt="" width={22} height={22} className="rounded-lg shrink-0" />
                      ) : (
                        <div className="h-[22px] w-[22px] rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                          <Layers className="h-3 w-3 text-white/50" />
                        </div>
                      )}
                      <span className="text-[13px] text-white/80 truncate flex-1">{app.name}</span>
                      {selectedApp?.id === app.id && (
                        <Check className="h-3.5 w-3.5 text-white/60 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-white/[0.08] p-1.5">
                  <Link
                    href="/dashboard/apps"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.07] transition-colors text-[13px] text-white/50"
                  >
                    Gérer les apps
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <button className="h-7 w-7 flex items-center justify-center rounded-md bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.10] transition-colors text-white/50 hover:text-white/80">
          <Bell className="h-3.5 w-3.5" />
        </button>

        {/* Appylot trigger */}
        <button
          onClick={onCopilotOpen}
          className="h-7 w-7 flex items-center justify-center rounded-md bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.10] transition-colors text-white/50 hover:text-white/80"
          title="Appylot"
        >
          <Bot className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
