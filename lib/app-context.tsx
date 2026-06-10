'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { App } from '@/lib/database.types';

// Global dashboard state: the currently selected app (shared by the top bar and
// every page, so there's a single app switcher) and the copilot panel state.
type DashboardCtx = {
  apps: App[];
  selectedApp: App | null;
  selectedAppId: string;
  setSelectedAppId: (id: string) => void;
  reloadApps: () => Promise<void>;
  loadingApps: boolean;
  copilotOpen: boolean;
  setCopilotOpen: (v: boolean) => void;
};

const Ctx = createContext<DashboardCtx | null>(null);
const STORAGE_KEY = 'appolyn.selectedAppId';

export function useDashboard(): DashboardCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDashboard must be used within DashboardProvider');
  return v;
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<App[]>([]);
  const [selectedAppId, setIdState] = useState('');
  const [loadingApps, setLoadingApps] = useState(true);
  const [copilotOpen, setCopilotOpen] = useState(false);

  const setSelectedAppId = useCallback((id: string) => {
    setIdState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  }, []);

  const reloadApps = useCallback(async () => {
    const { data } = await supabase.from('apps').select('*').order('created_at', { ascending: false });
    const rows = (data ?? []) as App[];
    setApps(rows);
    setIdState((prev) => {
      if (prev && rows.some((a) => a.id === prev)) return prev;
      let saved = '';
      try { saved = localStorage.getItem(STORAGE_KEY) ?? ''; } catch { /* ignore */ }
      if (saved && rows.some((a) => a.id === saved)) return saved;
      return rows[0]?.id ?? '';
    });
    setLoadingApps(false);
  }, []);

  useEffect(() => { reloadApps(); }, [reloadApps]);

  const selectedApp = apps.find((a) => a.id === selectedAppId) ?? null;

  return (
    <Ctx.Provider value={{ apps, selectedApp, selectedAppId, setSelectedAppId, reloadApps, loadingApps, copilotOpen, setCopilotOpen }}>
      {children}
    </Ctx.Provider>
  );
}
