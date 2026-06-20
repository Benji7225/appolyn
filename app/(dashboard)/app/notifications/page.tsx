'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { Bell, Smartphone } from 'lucide-react';

// New tables aren't in the generated DB types yet; access them untyped.
const db = supabase as unknown as { from: (t: string) => any };

type OptIn = { granted: number; denied: number };

// Notifications : ton taux d'opt-in (qui accepte de recevoir des notifications).
// 100% réel : events SDK `notification_optin` (dernière réponse par utilisateur).
export default function NotificationsPage() {
  const { selectedApp } = useDashboard();
  const [stats, setStats] = useState<OptIn | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedApp?.id) { setStats(null); return; }
      setStats(null);
      const { data: clients } = await db.from('sdk_clients').select('id').eq('app_id', selectedApp.id).limit(2000);
      const ids = ((clients ?? []) as { id: string }[]).map((c) => c.id);
      if (ids.length === 0) { if (!cancelled) setStats({ granted: 0, denied: 0 }); return; }
      const { data: events } = await db.from('sdk_events').select('client_id, properties, created_at')
        .eq('event', 'notification_optin').in('client_id', ids).order('created_at', { ascending: true }).limit(8000);
      const rows = (events ?? []) as { client_id: string; properties: Record<string, unknown> | null }[];
      // Dernière réponse par utilisateur (l'ordre ascendant => la dernière écrase).
      const last: Record<string, boolean> = {};
      for (const e of rows) {
        const g = e.properties?.granted;
        last[e.client_id] = g === true || g === 'true' || g === 1 || g === '1';
      }
      let granted = 0, denied = 0;
      for (const v of Object.values(last)) { if (v) granted += 1; else denied += 1; }
      if (!cancelled) setStats({ granted, denied });
    })();
    return () => { cancelled = true; };
  }, [selectedApp?.id]);

  if (!selectedApp) {
    return (
      <div className="p-8">
        <PageHeader title="Notifications" description="Ton taux d'opt-in aux notifications." />
        <EmptyState icon={Smartphone} title="Ajoute d'abord une app"
          description="Sélectionne une app pour voir son taux d'opt-in aux notifications."
          action={<a href="/app/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>} />
      </div>
    );
  }

  const total = stats ? stats.granted + stats.denied : 0;
  const rate = total > 0 ? Math.round((stats!.granted / total) * 100) : 0;
  // Repère indicatif : un bon opt-in mobile tourne autour de 50-60 %+.
  const color = rate >= 55 ? 'text-emerald-600' : rate >= 35 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Notifications"
        description="Combien de tes utilisateurs acceptent de recevoir des notifications. Plus ton opt-in est haut, plus tu peux les faire revenir."
      />

      {stats === null ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground">Chargement…</div>
      ) : total === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl border border-border/40 flex items-center justify-center mx-auto mb-3"><Bell className="h-5 w-5 text-muted-foreground" /></div>
          <h3 className="text-sm font-medium mb-1">Ton taux d&apos;opt-in apparaîtra ici</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">Dès que ton app demande l&apos;autorisation d&apos;envoyer des notifications et remonte la réponse, tu vois ici ton taux d&apos;opt-in. Ton IA s&apos;en occupe avec le SDK, rien à régler.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <div className="bg-card border border-border/40 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground mb-1">Taux d&apos;opt-in</p>
            <p className={`text-4xl font-semibold tabular-nums ${color}`}>{rate}%</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">repère : 55 %+ visé</p>
          </div>
          <div className="bg-card border border-border/40 rounded-xl p-6 flex flex-col justify-center gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Autorisé</span>
              <span className="text-sm font-semibold tabular-nums">{stats!.granted.toLocaleString('fr-FR')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Refusé</span>
              <span className="text-sm font-semibold tabular-nums">{stats!.denied.toLocaleString('fr-FR')}</span>
            </div>
            <div className="h-2 rounded-full bg-accent overflow-hidden mt-1 flex">
              <div className="h-full bg-emerald-500" style={{ width: `${rate}%` }} />
              <div className="h-full bg-rose-400" style={{ width: `${100 - rate}%` }} />
            </div>
            <p className="text-[11px] text-muted-foreground">{total.toLocaleString('fr-FR')} utilisateur(s) ont répondu à la demande.</p>
          </div>
        </div>
      )}
    </div>
  );
}
