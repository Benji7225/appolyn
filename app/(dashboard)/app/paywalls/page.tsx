'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { CreditCard, Smartphone, Eye, Sparkles, Copy, Check, Download, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { aggregate, verdict, toCsv, rangeStart, MIN_VIEWERS, type PwStat, type PwEvent } from '@/lib/paywall-stats';
import { FUNNEL_COLOR } from '@/lib/funnel';
import { SdkEmptyState } from '@/components/dashboard/sdk-empty';

// New tables aren't in the generated DB types yet; access them untyped.
const db = supabase as unknown as { from: (t: string) => any };

type Paywall = PwStat;
const RANGES: { label: string; days: number | null }[] = [
  { label: '7 jours', days: 7 }, { label: '30 jours', days: 30 }, { label: '90 jours', days: 90 }, { label: 'Tout', days: null },
];
const money = (n: number, cur: string) => { try { return n.toLocaleString('fr-FR', { style: 'currency', currency: cur, maximumFractionDigits: 2 }); } catch { return `${n.toFixed(2)} ${cur}`; } };
type Advice = { diagnosis: string; actions: string[]; prompt: string };

// Paywalls : conversion vue → achat de chaque écran d'abonnement de ton app.
// 100% réel : events SDK `paywall_view` / `paywall_purchase` (par utilisateur).
export default function PaywallsPage() {
  const { selectedApp } = useDashboard();
  const [paywalls, setPaywalls] = useState<Paywall[] | null>(null);
  const [prev, setPrev] = useState<Paywall[]>([]);
  const [days, setDays] = useState<number | null>(30);
  const [loadError, setLoadError] = useState('');
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
      const fetchWindow = async (from: string | null, to: string | null): Promise<PwEvent[]> => {
        let q = db.from('sdk_events').select('client_id, event, properties, value, currency, created_at')
          .in('event', ['paywall_view', 'paywall_purchase']).in('client_id', ids).order('created_at', { ascending: false }).limit(8000);
        if (from) q = q.gte('created_at', from);
        if (to) q = q.lt('created_at', to);
        const { data, error } = await q;
        if (error) throw error;
        return (data ?? []) as PwEvent[];
      };
      try {
        const start = rangeStart(days);
        const cur = await fetchWindow(start, null);
        const before = days === null ? [] : await fetchWindow(rangeStart(days, 1), start);
        if (cancelled) return;
        setLoadError('');
        setPrev(aggregate(before));
        setPaywalls(aggregate(cur));
      } catch { if (!cancelled) { setLoadError('Impossible de charger les paywalls pour le moment. Réessaie dans un instant.'); setPaywalls([]); setPrev([]); } }
    })();
    return () => { cancelled = true; };
  }, [selectedApp?.id, days]);

  const exportCsv = () => {
    if (!paywalls) return;
    const blob = new Blob(['\uFEFF' + toCsv(paywalls)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `paywalls-${selectedApp?.name ?? 'app'}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedApp) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="Paywalls" description="La conversion de tes écrans d'abonnement." />
        <EmptyState icon={Smartphone} title="Ajoute d'abord une app"
          description="Sélectionne une app pour voir la conversion de ses paywalls."
          action={<a href="/app/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 scrollbar-macos">
      <PageHeader
        title="Paywalls"
        description="Quel écran d'abonnement convertit le mieux, sur tes vrais utilisateurs. Repère celui qui transforme le plus de vues en achats."
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex rounded-lg border border-border/40 bg-card p-0.5" role="group" aria-label="Période">
          {RANGES.map((r) => (
            <button key={r.label} onClick={() => setDays(r.days)} aria-pressed={days === r.days}
              className={`text-xs px-3 h-8 rounded-md transition-colors ${days === r.days ? 'bg-foreground text-background font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
              {r.label}
            </button>
          ))}
        </div>
        {paywalls && paywalls.length > 0 && (
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-3 rounded-lg border border-border/40 bg-card">
            <Download className="h-3.5 w-3.5" /> Exporter en CSV
          </button>
        )}
      </div>

      {loadError && <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-500 mb-3">{loadError}</div>}

      {paywalls === null ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground">Chargement…</div>
      ) : paywalls.length === 0 && days !== null && !loadError && prev.length > 0 ? (
        <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
          <p className="text-sm font-medium">Aucun paywall vu sur cette période</p>
          <p className="text-xs text-muted-foreground mt-1">Il y en avait avant : élargis la période pour les retrouver.</p>
          <button onClick={() => setDays(null)} className="mt-3 text-sm text-primary hover:underline">Voir toute la période →</button>
        </div>
      ) : paywalls.length === 0 && loadError ? null : paywalls.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card">
          <SdkEmptyState
            icon={CreditCard}
            title="Tes paywalls apparaîtront ici"
            what="Dès que ton app signale l'affichage de tes paywalls et les achats, tu vois lequel convertit le mieux, et lequel te coûte des abonnés."
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {(() => {
            const v = verdict(paywalls);
            if (!v) return null;
            const Icon = v.tone === 'ok' ? CheckCircle2 : v.tone === 'warn' ? AlertTriangle : Info;
            const color = v.tone === 'ok' ? 'text-emerald-500' : v.tone === 'warn' ? 'text-amber-500' : 'text-primary';
            return (
              <div className="rounded-xl border border-border/40 bg-card p-4 flex gap-3 mb-3">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                <div><p className="text-sm font-medium">En bref</p><p className="text-sm text-muted-foreground mt-0.5">{v.text}</p></div>
              </div>
            );
          })()}
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
            const before = prev.find((x) => x.id === p.id);
            const delta = before && before.viewers >= MIN_VIEWERS && p.viewers >= MIN_VIEWERS ? (p.conv - before.conv) * 100 : null;
            return (
              <div key={p.id} className="bg-card border border-border/40 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium truncate">{p.id}</p>
                  <div className="flex items-center gap-4 shrink-0 text-sm tabular-nums">
                    <span className="text-muted-foreground inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{p.viewers.toLocaleString('fr-FR')}</span>
                    {delta !== null && Math.abs(delta) >= 0.1 && (
                      <span className={`inline-flex items-center gap-0.5 text-xs ${delta > 0 ? 'text-emerald-500' : 'text-rose-500'}`} title="Écart avec la période précédente de même durée">
                        {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {delta > 0 ? '+' : ''}{delta.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} pt
                      </span>
                    )}
                    <span className="font-semibold" style={{ color: FUNNEL_COLOR.payers }}>{p.conv < 0.1 && p.conv > 0 ? (p.conv * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-accent overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: FUNNEL_COLOR.payers }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">{p.buyers.toLocaleString('fr-FR')} achat(s) sur {p.viewers.toLocaleString('fr-FR')} vue(s)
                  {p.revPerViewer !== null && p.currency && <> · {money(p.revPerViewer, p.currency)} par personne ayant vu le paywall</>}
                  {p.viewers < MIN_VIEWERS && <span className="text-amber-500"> · pas assez de vues pour conclure</span>}</p>
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground mt-1">Conversion = utilisateurs ayant acheté ÷ utilisateurs ayant vu le paywall, sur la période choisie. La flèche compare avec la période précédente de même durée (affichée au-delà de 100 vues des deux côtés). Le revenu par personne n&apos;apparaît que si ton SDK envoie le montant de l&apos;achat. Le vert = achats, comme l&apos;étape « Payants » de ton entonnoir.</p>
        </div>
      )}
    </div>
  );
}
