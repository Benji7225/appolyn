'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Plug, AppWindow, Hash, Code2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';

// Accès dynamique aux tables (même pattern typé que le dashboard, évite le bruit TS).
const db = supabase as unknown as { from: (t: string) => any };

const iconBtn =
  'h-8 w-8 rounded-lg flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 transition-colors';

type Notif = {
  id: string;
  title: string;
  desc: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Centre de notifications in-app : agrège les VRAIES alertes actionnables dérivées de l'état
// réel du compte (mêmes signaux que le SetupChecklist de l'accueil : ASC connecté, app ajoutée,
// App ID renseigné, SDK branché). Aucune donnée inventée. Quand tout est en place et qu'il n'y
// a rien à faire, on l'affiche clairement plutôt qu'un faux « aucune notification ».
export function NotificationsBell() {
  const { apps, selectedApp } = useDashboard();
  const [open, setOpen] = useState(false);
  const [hasCreds, setHasCreds] = useState<boolean | null>(null);
  const [hasSdk, setHasSdk] = useState<boolean | null>(null);

  useEffect(() => {
    db.from('asc_credentials').select('id').maybeSingle()
      .then((res: { data: unknown }) => setHasCreds(!!res.data));
  }, []);

  const appIds = apps.map((a) => a.id).join(',');
  useEffect(() => {
    if (!appIds) { setHasSdk(false); return; }
    db.from('sdk_clients').select('id', { count: 'exact', head: true })
      .in('app_id', appIds.split(','))
      .then((res: { count: number | null }) => setHasSdk((res.count ?? 0) > 0));
  }, [appIds]);

  const loading = hasCreds === null || hasSdk === null;
  const hasApp = apps.length > 0;
  const hasAscId = !!selectedApp?.asc_app_id;

  const notifs: Notif[] = [];
  if (hasCreds === false) {
    notifs.push({
      id: 'creds', icon: Plug,
      title: 'Connecte ton App Store Connect',
      desc: 'Colle ta clé .p8 pour débloquer tes données.',
      href: '/dashboard/settings/app-store-connect',
    });
  } else if (hasCreds === true) {
    if (!hasApp) {
      notifs.push({
        id: 'app', icon: AppWindow,
        title: 'Ajoute ta première app',
        desc: 'Pour commencer à suivre son ASO.',
        href: '/dashboard/settings/apps',
      });
    } else if (!hasAscId) {
      notifs.push({
        id: 'ascid', icon: Hash,
        title: `Renseigne l'App ID${selectedApp?.name ? ' de ' + selectedApp.name : ''}`,
        desc: 'Nécessaire pour récupérer tes données App Store Connect.',
        href: '/dashboard/settings/apps',
      });
    }
  }
  if (hasSdk === false) {
    notifs.push({
      id: 'sdk', icon: Code2,
      title: 'Branche le SDK Appolyn',
      desc: 'Une ligne de code pour capter tes clients et tes analytics.',
      href: '/dashboard/settings/connections',
    });
  }

  const count = notifs.length;

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className={iconBtn} title="Notifications">
        <Bell className="h-4 w-4" />
        {!loading && count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1.5 z-50 w-[300px] rounded-xl border border-border bg-popover text-popover-foreground shadow-xl shadow-black/10 py-1.5">
            <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Notifications
            </p>
            {loading && (
              <p className="px-3 py-3 text-[13px] text-muted-foreground">Chargement…</p>
            )}
            {!loading && count === 0 && (
              <div className="px-3 py-3 flex items-start gap-2 text-[13px] text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Tout est connecté. Tes données arrivent ici.</span>
              </div>
            )}
            {!loading && notifs.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent"
              >
                <n.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium leading-tight">{n.title}</span>
                  <span className="block text-[12px] text-muted-foreground leading-tight mt-0.5">{n.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
