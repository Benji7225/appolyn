'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { getCache, setCache } from '@/lib/cache';
import { LAUNCH_PHASES, LAUNCH_KEYS } from '@/lib/launch-checklist';
import { Rocket, CheckCircle2, Circle, ArrowRight, Smartphone } from 'lucide-react';

export default function LaunchPage() {
  const { selectedApp } = useDashboard();
  const appId = selectedApp?.id ?? '';

  const [done, setDone] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!appId) { setDone(new Set()); return; }
    const key = `launch:${appId}`;
    const cached = getCache<string[]>(key);
    if (cached) setDone(new Set(cached));
    const { data } = await supabase.from('launch_checklist').select('task_key,done').eq('app_id', appId);
    const set = new Set(((data ?? []) as { task_key: string; done: boolean }[]).filter((r) => r.done).map((r) => r.task_key));
    setDone(set);
    setCache(key, Array.from(set));
  }, [appId]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (taskKey: string) => {
    if (!appId) return;
    const isDone = done.has(taskKey);
    const next = new Set(done);
    if (isDone) next.delete(taskKey); else next.add(taskKey);
    setDone(next);
    setCache(`launch:${appId}`, Array.from(next));
    setSaving(taskKey);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('launch_checklist').upsert(
        { user_id: user.id, app_id: appId, task_key: taskKey, done: !isDone, updated_at: new Date().toISOString() },
        { onConflict: 'app_id,task_key' },
      );
    }
    setSaving(null);
  };

  if (!appId) {
    return (
      <div className="p-8">
        <PageHeader title="Lancement" description="Ta checklist guidée pour lancer ton app et en faire un succès." />
        <EmptyState
          icon={Smartphone}
          title="Ajoute d'abord une app"
          description="Sélectionne ou ajoute une app pour suivre ta checklist de lancement, étape par étape."
          action={<a href="/dashboard/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>}
        />
      </div>
    );
  }

  const total = LAUNCH_KEYS.length;
  const doneCount = LAUNCH_KEYS.filter((k) => done.has(k)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Lancement"
        description="Ta checklist guidée pour lancer ton app et en faire un succès. Coche au fur et à mesure, la progression est sauvegardée par app."
      />

      {/* Progression globale */}
      <div className="bg-card border border-border/50 card-pop rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Préparation du lancement{selectedApp?.name ? ` · ${selectedApp.name}` : ''}</p>
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">{doneCount}/{total} · {pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-accent overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(pct, 2)}%` }} />
        </div>
        {pct === 100 && <p className="text-xs text-emerald-600 mt-3">🚀 Tout est coché. Beau lancement, maintenant place à la croissance.</p>}
      </div>

      <div className="space-y-6">
        {LAUNCH_PHASES.map((phase) => {
          const phaseDone = phase.items.filter((i) => done.has(i.key)).length;
          return (
            <div key={phase.phase} className="bg-card border border-border/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium">{phase.phase}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">{phaseDone}/{phase.items.length}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{phase.subtitle}</p>
              <ol className="space-y-1">
                {phase.items.map((item) => {
                  const isDone = done.has(item.key);
                  return (
                    <li key={item.key} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-accent/40 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggle(item.key)}
                        disabled={saving === item.key}
                        className="mt-0.5 shrink-0"
                        aria-label={isDone ? 'Décocher' : 'Cocher'}
                      >
                        {isDone
                          ? <CheckCircle2 className="h-5 w-5 text-primary" />
                          : <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-primary transition-colors" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${isDone ? 'text-muted-foreground line-through' : ''}`}>{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      {item.href && (
                        <Link href={item.href} className="shrink-0 mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap">
                          Ouvrir <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}
