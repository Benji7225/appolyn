'use client';

// ── Trésorerie ────────────────────────────────────────────────────────────────
// « Quand Apple me paie, et combien ? » : calendrier fiscal Apple (versement 33 jours
// après la fin du mois fiscal), avec le revenu réel (proceeds des rapports de ventes
// App Store Connect) de chaque mois fiscal. Compte entier, pas une app : Apple verse
// par compte développeur. Les montants sont des ESTIMATIONS issues des rapports de
// ventes, jamais le montant exact du virement (change, retenues, seuils par pays).
//
// Plus bas : l'idée d'avance de trésorerie via un partenaire (asset-light, Appolyn ne
// prête jamais son propre argent). Toujours « en préparation », chiffres indicatifs.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, ShieldCheck, Info, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCache, setCache } from '@/lib/cache';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { upcomingPayouts, payoutStatus, daysUntil, type FiscalMonth } from '@/lib/apple-payouts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: Math.abs(n) < 100 ? 2 : 0 }).format(n);
const dayFr = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const dayShort = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

type Amounts = Record<string, number | null>; // clé du mois fiscal → proceeds (null = indisponible)

export default function FinancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const months = upcomingPayouts(today, 3);
  const monthsKey = months.map((m) => m.key).join(',');

  const [hasCreds, setHasCreds] = useState<boolean | null>(null);
  const [amounts, setAmounts] = useState<Amounts>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: creds } = await supabase.from('asc_credentials').select('id').maybeSingle();
      setHasCreds(!!creds);
    })();
  }, []);

  useEffect(() => {
    if (!hasCreds) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const results = await Promise.all(months.map(async (m) => {
          const cacheKey = `payout:${m.key}:${today}`;
          const cached = getCache<{ totalRevenue?: number }>(cacheKey);
          if (cached) return [m.key, cached.totalRevenue ?? 0] as const;
          const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-sales`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
            // Pas d'ascAppId : Apple verse pour tout le compte. Fin plafonnée à hier côté serveur.
            body: JSON.stringify({ range: 'custom', compare: 'none', from: m.start, to: m.end }),
          });
          const j = await r.json() as { totalRevenue?: number; error?: string };
          if (j.error) throw new Error(j.error);
          setCache(cacheKey, j);
          return [m.key, j.totalRevenue ?? 0] as const;
        }));
        if (!cancelled) setAmounts(Object.fromEntries(results));
      } catch {
        if (!cancelled) setError('Impossible de lire tes rapports de ventes App Store Connect pour le moment. Réessaie dans quelques minutes.');
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCreds, monthsKey]);

  const next = months.find((m) => payoutStatus(m, today) === 'pending') ?? months[0];
  const awaiting = months.filter((m) => payoutStatus(m, today) === 'pending')
    .reduce((s, m) => s + (amounts[m.key] ?? 0), 0);

  if (hasCreds === false) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="Trésorerie" description="Quand Apple te paie, et combien." />
        <EmptyState
          icon={Lock}
          title="Connecte App Store Connect"
          description="Appolyn lit tes rapports de ventes pour estimer le prochain versement d'Apple. Ajoute ta clé API et ton numéro de fournisseur (Sales and Trends) dans les réglages."
          action={<Link href="/app/settings/app-store-connect" className="text-sm font-medium underline underline-offset-4">Ouvrir les réglages</Link>}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <PageHeader title="Trésorerie" description="Quand Apple te paie, et combien. Calculé sur tes ventes réelles, pour tout ton compte développeur." />

      {/* Prochain versement */}
      {next && (
        <div className="rounded-xl border border-border bg-card card-pop p-5 md:p-6 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <CalendarClock className="h-4 w-4" /> Prochain versement d&apos;Apple
          </div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="text-2xl md:text-3xl font-semibold tracking-tight">{dayFr(next.payDate)}</p>
            <p className="text-sm text-muted-foreground">
              {(() => {
                const n = daysUntil(next.payDate, today);
                return n === 0 ? "aujourd'hui" : n === 1 ? 'demain' : `dans ${n} jours`;
              })()}
            </p>
          </div>
          <p className="text-sm mt-3">
            Pour le mois fiscal {next.label} ({dayShort(next.start)} → {dayShort(next.end)}) :{' '}
            {loading ? <Loader2 className="inline h-3.5 w-3.5 animate-spin align-[-2px]" /> :
              amounts[next.key] != null ? <strong className="tabular-nums">environ {eur(amounts[next.key]!)}</strong> : 'montant indisponible'}
          </p>
          {!next.confirmed && (
            <p className="text-[11px] text-amber-600 mt-2 flex items-start gap-1">
              <Info className="h-3 w-3 mt-0.5 shrink-0" /> Date estimée : Apple ne publie pas son calendrier au-delà de l&apos;année en cours, vérifie-le dans App Store Connect (Paiements et rapports financiers).
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Calendrier */}
      <div className="rounded-xl border border-border bg-card card-pop mb-4 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-sm font-medium">Mois fiscaux à venir</h2>
          {awaiting > 0 && <span className="text-xs text-muted-foreground">En attente de versement : <strong className="tabular-nums text-foreground">{eur(awaiting)}</strong></span>}
        </div>
        <ul className="divide-y divide-border/40">
          {months.map((m) => <MonthRow key={m.key} m={m} today={today} amount={amounts[m.key]} loading={loading} />)}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed mb-8">
        <p className="font-medium text-foreground mb-1">Comment lire ces chiffres</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Apple verse environ 33 jours après la fin de chaque mois fiscal (mois de 4 ou 5 semaines, pas des mois civils).</li>
          <li>Les montants viennent de tes rapports de ventes (proceeds après commission Apple). Le virement réel peut différer : taux de change, retenues fiscales, remboursements, et seuil minimum de versement par pays ou région.</li>
          <li>Le mois en cours est partiel : il s&apos;arrête à hier, Apple n&apos;a pas encore publié aujourd&apos;hui.</li>
        </ul>
      </div>

      <AdvanceSection pendingEstimate={awaiting} />
    </div>
  );
}

function MonthRow({ m, today, amount, loading }: { m: FiscalMonth; today: string; amount: number | null | undefined; loading: boolean }) {
  const status = payoutStatus(m, today);
  const badge = status === 'running'
    ? { text: 'En cours', cls: 'bg-blue-500/10 text-blue-600' }
    : { text: 'Versement en attente', cls: 'bg-amber-500/10 text-amber-600' };
  return (
    <li className="px-5 py-3 flex items-center gap-3 flex-wrap">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium capitalize">{m.label}</p>
        <p className="text-[11px] text-muted-foreground">
          Ventes du {dayShort(m.start)} au {dayShort(m.end)} · versé le {dayShort(m.payDate)}{m.confirmed ? '' : ' (estimé)'}
        </p>
      </div>
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.text}</span>
      <span className="text-sm font-semibold tabular-nums w-24 text-right">
        {loading && amount === undefined ? '…' : amount != null ? eur(amount) : '—'}
      </span>
    </li>
  );
}

// Avance de trésorerie : idée en préparation, non active. Chiffres purement indicatifs.
function AdvanceSection({ pendingEstimate }: { pendingEstimate: number }) {
  const [pending, setPending] = useState<number | null>(null);
  const value = pending ?? Math.min(50000, Math.max(500, Math.round(pendingEstimate / 500) * 500 || 5000));
  const advance = Math.round(value * 0.85);
  const fee = Math.round(value * 0.02);

  return (
    <div>
      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 mb-3">
        <Info className="h-3 w-3" /> En préparation : pas encore disponible
      </div>
      <h2 className="text-lg font-semibold tracking-tight">Avancer ta trésorerie</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-2xl">
        Apple te paie 30 à 60 jours après tes ventes. À terme, un partenaire de financement pourrait avancer une partie du montant en attente, remboursé sur tes versements Apple. Rien n&apos;est actif : ce simulateur est indicatif.
      </p>

      <div className="rounded-xl border border-border bg-card card-pop p-5 mb-4">
        <label className="text-xs text-muted-foreground" htmlFor="pending">Montant Apple en attente</label>
        <input
          id="pending" type="range" min={500} max={50000} step={500} value={value}
          onChange={(e) => setPending(Number(e.target.value))}
          className="w-full mt-2 accent-[hsl(var(--primary))]"
        />
        <div className="text-xl font-semibold tracking-tight tabular-nums mt-1">{eur(value)}</div>
        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-border/40">
          <div>
            <p className="text-xs text-muted-foreground">Avance estimée</p>
            <p className="text-xl font-semibold tabular-nums text-emerald-600">{eur(advance)}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">≈ 85 % du montant, hypothèse</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Frais estimés</p>
            <p className="text-xl font-semibold tabular-nums">{eur(fee)}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">≈ 2 % / mois, hypothèse</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-foreground/60 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Appolyn ne prête jamais son propre argent (activité régulée). Un partenaire agréé porterait le capital et le risque ;
          le module ne s&apos;ouvrira qu&apos;une fois un partenaire signé.
        </p>
      </div>
    </div>
  );
}
