'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { App } from '@/lib/database.types';

const SELECTED_APP_KEY = 'appolyn_selected_app_id';

type AppContextValue = {
  apps: App[];
  selectedApp: App | null;
  setSelectedApp: (app: App) => void;
  loading: boolean;
  reload: () => void;
};

const AppContext = createContext<AppContextValue>({
  apps: [],
  selectedApp: null,
  setSelectedApp: () => {},
  loading: true,
  reload: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedAppState] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('apps').select('*').order('created_at', { ascending: false });
    const rows = (data ?? []) as App[];
    setApps(rows);
    if (rows.length > 0) {
      const storedId = typeof window !== 'undefined' ? localStorage.getItem(SELECTED_APP_KEY) : null;
      const found = rows.find((a) => a.id === storedId) ?? rows[0];
      setSelectedAppState(found);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setSelectedApp = (app: App) => {
    setSelectedAppState(app);
    if (typeof window !== 'undefined') localStorage.setItem(SELECTED_APP_KEY, app.id);
  };

  return (
    <AppContext.Provider value={{ apps, selectedApp, setSelectedApp, loading, reload: load }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
