'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import {
  RefreshCw, Lock, DollarSign, Download, Tag, Trophy, TrendingUp, TrendingDown,
  Users, Repeat, Globe,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type SalesRow = { date: string; downloads: number; revenue: number };

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: n < 100 ? 2 : 0 }).format(n);
const fmtDay = (d: string) => { const p = d.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}` : d; };
const sum = (a: SalesRow[], f: 'revenue' | 'downloads') => a.reduce((s, r) => s + r[f], 0);
const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0);

function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-1.5 py-0.5 ${up ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function Kpi({ icon: Icon, label, value, delta, sub }: {
  icon: typeof DollarSign; label: string; value: string; delta?: number; sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        {delta !== undefined && <Delta value={delta} />}
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

const tooltipStyle = {
  background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
  borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 16px rgb(0 0 0 / 0.08)',
};

export default function AnalyticsPage() {
  const [hasCreds, setHasCreds] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SalesRow[]>([]);
  const [totals, setTotals] = useState<{ downloads: number; revenue: number }>({ downloads: 0, revenue: 0 });
  const [error, setError] = useState('');

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data: creds } = await supabase.from('asc_credentials').select('id').maybeSingle();
    setHasCreds(!!creds);
    if (creds) loadSales();
  };

  const loadSales = async () => {
    setLoading(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-sales`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const j = await r.json() as { rows?: SalesRow[]; totalDownloads?: number; totalRevenue?: number; error?: string };
      if (j.error) setError(j.error);
      else { setRows(j.rows ?? []); setTotals({ downloads: j.totalDownloads ?? 0, revenue: j.totalRevenue ?? 0 }); }
    } catch { setError('Connexion à App Store Connect impossible.'); }
    setLoading(false);
  };

  if (hasCreds === false) {
    return (
      <div className="p-8 max-w-6xl">
        <PageHeader title="Analytics" description="Tes revenus, abonnements et acquisition, en données réelles." />
        <EmptyState
          icon={Lock}
          title="Connecte App Store Connect"
          description="Ajoute ta clé API et ton numéro de vendeur dans les réglages pour charger tes vraies ventes, revenus et abonnements. Aucune donnée n'est inventée."
          action={<a href="/dashboard/settings" className="text-sm text-primary hover:underline">Aller aux réglages</a>}
        />
      </div>
    );
  }

  const last7 = rows.slice(-7);
  const prev7 = rows.slice(-14, -7);
  const revDelta = pct(sum(last7, 'revenue'), sum(prev7, 'revenue'));
  const dlDelta = pct(sum(last7, 'downloads'), sum(prev7, 'downloads'));
  const revPerDl = totals.downloads > 0 ? totals.revenue / totals.downloads : 0;
  const best = rows.reduce<SalesRow | null>((b, r) => (!b || r.revenue > b.revenue ? r : b), null);
  const hasData = rows.length > 0;

  return (
    <div className="p-8 max-w-6xl scrollbar-macos">
      <PageHeader
        title="Analytics"
        description="Données réelles sur 30 jours, depuis tes rapports App Store."
        actions={
          <button onClick={loadSales} disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Rafraîchir
          </button>
        }
      />

      {error && <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">{error}</div>}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Kpi icon={DollarSign} label="Revenu (30 j)" value={fmtMoney(totals.revenue)} delta={revDelta} sub="vs semaine passée" />
        <Kpi icon={Download} label="Téléchargements" value={totals.downloads.toLocaleString('fr-FR')} delta={dlDelta} sub="vs semaine passée" />
        <Kpi icon={Tag} label="Revenu / téléchargement" value={fmtMoney(revPerDl)} sub="Valeur moyenne par download" />
        <Kpi icon={Trophy} label="Meilleur jour" value={best ? fmtMoney(best.revenue) : '—'} sub={best ? fmtDay(best.date) : 'Aucune vente'} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium">Revenu journalier</h2>
              <p className="text-xs text-muted-foreground">30 derniers jours, proceeds développeur</p>
            </div>
          </div>
          {hasData ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={rows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={28} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtDay} formatter={(v: number) => [fmtMoney(v), 'Revenu']} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart loading={loading} />}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium mb-4">Téléchargements</h2>
          {hasData ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={28} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={fmtDay} formatter={(v: number) => [v, 'Téléchargements']} />
                <Bar dataKey="downloads" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart loading={loading} />}
        </div>
      </div>

      {/* Subscriptions + Geography (real once the report extension ships) */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Abonnements</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['MRR', 'Revenu mensuel récurrent'], ['ARR', 'Revenu annuel récurrent'], ['Abonnés actifs', 'En cours'], ['Churn', 'Taux de résiliation']].map(([k, d]) => (
              <div key={k}>
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="text-xl font-semibold tracking-tight mt-0.5">—</p>
                <p className="text-[11px] text-muted-foreground/70">{d}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-4 flex items-center gap-1.5">
            <Users className="h-3 w-3" /> Se débloque avec tes premiers abonnés (rapports d&apos;abonnement Apple).
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Revenu par pays</h2>
          </div>
          <div className="flex flex-col items-center justify-center text-center py-8">
            <Globe className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground max-w-xs">
              La carte mondiale se remplira par pays selon tes ventes réelles, dès que la répartition géographique sera activée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ loading }: { loading: boolean }) {
  return (
    <div className="h-[240px] flex items-center justify-center text-center">
      <p className="text-sm text-muted-foreground max-w-xs">
        {loading ? 'Chargement...' : 'Aucune vente sur 30 jours pour le moment. Les graphes se rempliront dès tes premières ventes.'}
      </p>
    </div>
  );
}
