'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { CreditCard, Smartphone, Eye, Sparkles, Copy, Check } from 'lucide-react';
import { FUNNEL_COLOR } from '@/lib/funnel';

// New tables aren't in the generated DB types yet; access them untyped.
const db = supabase as unknown as { from: (t: string) => any };

type Paywall = { id: string; viewers: number; buyers: number; conv: number };
type Advice = { diagnosis: string; actions: string[]; prompt: string };

// Paywalls : conversion vue → achat de chaque écran d'abonnement de ton app.
// 100% réel : events SDK `paywall_view` / `paywall_purchase` (par utilisateur).
export default function PaywallsPage() {
  const { selectedApp } = useDashboard();
  const [paywalls, setPaywalls] = useState<Paywall[] | null>(null);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [advLoading, setAdvLoading] = useState(false);
  const [advError, setAdvError] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => { setAdvice(null); setAdvError(''); }, [selectedApp?.id]);

  // Conseil IA : on envoie la conversion RÉELLE des paywalls et on reçoit un
  // diagnostic + leviers + un prompt prêt à coller pour l'IA du dev (jamais de
  // push auto : Appolyn conseille, le dev applique).
  const askAdvice = async () => {
    if (!paywalls || paywalls.length === 0) return;
    setAdvLoading(true); setAdvError(''); setAdvice(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/advise-funnel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'paywall', appName: selectedApp?.name, paywalls }),
      });
      const j = await r.json();
      if (j.error) setAdvError(j.error); else setAdvice(j.advice as Advice);
    } catch { setAdvError('Conseil indisponible pour le moment.'); }
    setAdvLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedApp?.id) { setPaywalls(null); return; }
      setPaywalls(null);
      const { data: clients } = await db.from('sdk_clients').select('id').eq('app_id', selectedApp.id).limit(2000);
      const ids = ((clients ?? []) as { id: string }[]).map((c) => c.id);
      if (ids.length === 0) { if (!cancelled) setPaywalls([]); return; }
      const { data: events } = await db.from('sdk_events').select('client_id, event, properties')
        .in('event', ['paywall_view', 'paywall_purchase']).in('client_id', ids).limit(8000);
      const rows = (events ?? []) as { client_id: string; event: string; properties: Record<string, unknown> | null }[];
      const views: Record<string, Set<string>> = {};
      const buys: Record<string, Set<string>> = {};
      for (const e of rows) {
        const id = String(e.properties?.id ?? '').trim() || 'Paywall';
        if (e.event === 'paywall_view') (views[id] ??= new Set()).add(e.client_id);
        else (buys[id] ??= new Set()).add(e.client_id);
      }
      const keys = Array.from(new Set([...Object.keys(views), ...Object.keys(buys)]));
      const out: Paywall[] = keys.map((id) => {
        const viewers = views[id]?.size ?? 0;
        const buyers = buys[id]?.size ?? 0;
        return { id, viewers, buyers, conv: viewers ? buyers / viewers : 0 };
      }).sort((a, b) => b.viewers - a.viewers);
      if (!cancelled) setPaywalls(out);
    })();
    return () => { cancelled = true; };
  }, [selectedApp?.id]);

  if (!selectedApp) {
    return (
      <div className="p-8">
        <PageHeader title="Paywalls" description="La conversion de tes écrans d'abonnement." />
        <EmptyState icon={Smartphone} title="Ajoute d'abord une app"
          description="Sélectionne une app pour voir la conversion de ses paywalls."
          action={<a href="/app/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>} />
      </div>
    );
  }

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Paywalls"
        description="Quel écran d'abonnement convertit le mieux, sur tes vrais utilisateurs. Repère celui qui transforme le plus de vues en achats."
      />

      {paywalls === null ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground">Chargement…</div>
      ) : paywalls.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl border border-border/40 flex items-center justify-center mx-auto mb-3"><CreditCard className="h-5 w-5 text-muted-foreground" /></div>
          <h3 className="text-sm font-medium mb-1">Tes paywalls apparaîtront ici</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">Dès que ton app signale l&apos;affichage de tes paywalls et les achats, tu vois ici lequel convertit le mieux. Ton IA s&apos;en occupe avec le SDK, rien à régler.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Conseil IA : diagnostic + leviers + prompt prêt à donner à ton IA */}
          <div className="mb-3">
            {!advice ? (
              <div>
                <button onClick={askAdvice} disabled={advLoading}
                  className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                  <Sparkles className="h-4 w-4" /> {advLoading ? 'Analyse…' : 'Conseil IA pour mieux convertir'}
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
          {paywalls.map((p) => {
            const pct = Math.round(p.conv * 100);
            return (
              <div key={p.id} className="bg-card border border-border/40 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium truncate">{p.id}</p>
                  <div className="flex items-center gap-4 shrink-0 text-sm tabular-nums">
                    <span className="text-muted-foreground inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{p.viewers.toLocaleString('fr-FR')}</span>
                    <span className="font-semibold" style={{ color: FUNNEL_COLOR.payers }}>{pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-accent overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: FUNNEL_COLOR.payers }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">{p.buyers.toLocaleString('fr-FR')} achat(s) sur {p.viewers.toLocaleString('fr-FR')} vue(s)</p>
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground mt-1">Conversion = utilisateurs ayant acheté ÷ utilisateurs ayant vu le paywall. Le vert = achats, comme l&apos;étape « Payants » de ton entonnoir.</p>
        </div>
      )}
    </div>
  );
}
