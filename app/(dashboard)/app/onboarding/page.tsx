'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { Workflow, Smartphone, TrendingDown, Sparkles, Copy, Check } from 'lucide-react';

// New tables aren't in the generated DB types yet; access them untyped.
const db = supabase as unknown as { from: (t: string) => any };

type Step = { name: string; reached: number; pct: number; dropFromPrev: number };

// Entonnoir d'onboarding : où tes utilisateurs décrochent. 100% réel, lit les
// events SDK `screen_view` (marque tes écrans avec Appolyn.screen / .appolynScreen).
// Écrans ordonnés par portée (du plus vu au moins vu = forme d'entonnoir).
type Advice = { diagnosis: string; actions: string[]; prompt: string };

export default function OnboardingPage() {
  const { selectedApp } = useDashboard();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [advLoading, setAdvLoading] = useState(false);
  const [advError, setAdvError] = useState('');
  const [copied, setCopied] = useState(false);

  // Conseil IA : on envoie l'entonnoir RÉEL à /api/advise-funnel et on reçoit un
  // diagnostic + des leviers + un prompt prêt à coller pour l'IA du dev. On ne
  // pousse jamais de code : Appolyn conseille, le dev applique.
  const askAdvice = async () => {
    if (!steps || steps.length < 2) return;
    setAdvLoading(true); setAdvError(''); setAdvice(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/advise-funnel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'onboarding', appName: selectedApp?.name, steps }),
      });
      const j = await r.json();
      if (j.error) setAdvError(j.error); else setAdvice(j.advice as Advice);
    } catch { setAdvError('Conseil indisponible pour le moment.'); }
    setAdvLoading(false);
  };
  useEffect(() => { setAdvice(null); setAdvError(''); }, [selectedApp?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedApp?.id) { setSteps(null); return; }
      setSteps(null);
      const { data: clients } = await db.from('sdk_clients').select('id').eq('app_id', selectedApp.id).limit(2000);
      const ids = ((clients ?? []) as { id: string }[]).map((c) => c.id);
      if (ids.length === 0) { if (!cancelled) { setSteps([]); setTotalUsers(0); } return; }
      const { data: events } = await db.from('sdk_events').select('client_id, properties')
        .eq('event', 'screen_view').in('client_id', ids).order('created_at', { ascending: true }).limit(8000);
      const rows = (events ?? []) as { client_id: string; properties: Record<string, unknown> | null }[];
      const seen: Record<string, Set<string>> = {};
      for (const e of rows) {
        const name = String(e.properties?.name ?? '').trim();
        if (!name) continue;
        (seen[e.client_id] ??= new Set()).add(name);
      }
      const count: Record<string, number> = {};
      for (const cid of Object.keys(seen)) seen[cid].forEach((s) => { count[s] = (count[s] ?? 0) + 1; });
      const ordered = Object.keys(count).sort((a, b) => count[b] - count[a]);
      const base = ordered.length ? count[ordered[0]] : 0;
      const out: Step[] = ordered.map((name, i) => {
        const reached = count[name];
        const prev = i === 0 ? reached : count[ordered[i - 1]];
        return { name, reached, pct: base ? Math.round((reached / base) * 100) : 0, dropFromPrev: prev ? Math.round((1 - reached / prev) * 100) : 0 };
      });
      if (!cancelled) { setSteps(out); setTotalUsers(Object.keys(seen).length); }
    })();
    return () => { cancelled = true; };
  }, [selectedApp?.id]);

  if (!selectedApp) {
    return (
      <div className="p-8">
        <PageHeader title="Onboarding" description="Où tes utilisateurs décrochent dans ton onboarding." />
        <EmptyState icon={Smartphone} title="Ajoute d'abord une app"
          description="Sélectionne une app pour voir l'entonnoir de son onboarding."
          action={<a href="/app/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>} />
      </div>
    );
  }

  // Plus gros décrochage (hors 1re marche) = le levier à corriger en priorité.
  const worst = (steps ?? []).slice(1).reduce<Step | null>((m, s) => (!m || s.dropFromPrev > m.dropFromPrev ? s : m), null);

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Onboarding"
        description="L'entonnoir de ton onboarding, calculé sur tes vrais utilisateurs (SDK). Repère l'écran où ça décroche pour le corriger."
      />

      {steps === null ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground">Chargement de l&apos;entonnoir…</div>
      ) : steps.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl border border-border/40 flex items-center justify-center mx-auto mb-3"><Workflow className="h-5 w-5 text-muted-foreground" /></div>
          <h3 className="text-sm font-medium mb-1">Ton parcours d&apos;onboarding apparaîtra ici</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">Une fois le SDK Appolyn branché dans ton app, on te montre à quel écran tes utilisateurs décrochent pendant l&apos;onboarding. Rien à régler ici : donne le SDK à ton IA, elle s&apos;occupe du reste et Appolyn calcule l&apos;ordre et le décrochage tout seul.</p>
        </div>
      ) : (
        <>
          {worst && worst.dropFromPrev > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 mb-6 flex items-start gap-2.5">
              <TrendingDown className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm">Plus gros décrochage : <strong>{worst.dropFromPrev}%</strong> des utilisateurs quittent avant l&apos;écran « {worst.name} ». C&apos;est le levier à corriger en priorité.</p>
            </div>
          )}
          {/* Conseil IA : diagnostic + leviers + prompt prêt à donner à ton IA */}
          <div className="mb-5">
            {!advice ? (
              <div>
                <button onClick={askAdvice} disabled={advLoading}
                  className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                  <Sparkles className="h-4 w-4" /> {advLoading ? 'Analyse…' : 'Conseil IA pour corriger'}
                </button>
                {advError && <p className="text-xs text-rose-500 mt-2">{advError}</p>}
              </div>
            ) : (
              <div className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
                <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h3 className="text-sm font-medium">Conseil IA</h3></div>
                <p className="text-sm">{advice.diagnosis}</p>
                {advice.actions.length > 0 && (
                  <ul className="space-y-1.5">
                    {advice.actions.map((a, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-primary shrink-0">•</span><span>{a}</span></li>)}
                  </ul>
                )}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium">Prompt à donner à ton IA</p>
                    <button onClick={() => { navigator.clipboard?.writeText(advice.prompt); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                  <pre className="text-xs bg-accent/40 rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed">{advice.prompt}</pre>
                </div>
                <p className="text-[11px] text-muted-foreground/70">Appolyn te conseille, ton IA applique. On ne touche jamais à ton code tout seul.</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-3">{totalUsers.toLocaleString('fr-FR')} utilisateur(s) avec au moins un écran suivi.</p>
          <div className="space-y-2">
            {steps.map((s, i) => (
              <div key={s.name} className="bg-card border border-border/40 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium truncate"><span className="text-muted-foreground tabular-nums mr-2">{i + 1}.</span>{s.name}</p>
                  <div className="flex items-center gap-3 shrink-0 text-sm tabular-nums">
                    {i > 0 && s.dropFromPrev > 0 && <span className="text-[11px] text-rose-500 inline-flex items-center gap-0.5"><TrendingDown className="h-3 w-3" />{s.dropFromPrev}%</span>}
                    <span className="text-muted-foreground">{s.reached.toLocaleString('fr-FR')}</span>
                    <span className="font-semibold w-10 text-right">{s.pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-accent overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(s.pct, 2)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">Écrans ordonnés par portée (du plus atteint au moins atteint). Le % est relatif au 1er écran (= 100%).</p>
        </>
      )}
    </div>
  );
}
