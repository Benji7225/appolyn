'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import {
  Lock, DollarSign, Download, Tag, CalendarDays, TrendingUp, TrendingDown,
  Users, Repeat, Globe,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type SalesRow = { date: string; downloads: number; revenue: number };
type Country = { code: string; downloads: number; revenue: number };
type SubMetric = {
  activeSubscribers: number; mrr: number; arr: number;
  newSubscribers: number; cancellations: number; renewals: number;
  renewalRate: number | null; churnRate: number | null;
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: n < 100 ? 2 : 0 }).format(n);
const fmtDay = (d: string) => { const p = d.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}` : d; };
const sum = (a: SalesRow[], f: 'revenue' | 'downloads') => a.reduce((s, r) => s + r[f], 0);
const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0);

// Apple territory codes are ISO alpha-2; turn one into its flag emoji.
const flagEmoji = (code: string) =>
  /^[A-Za-z]{2}$/.test(code)
    ? code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : '🏳️';

const COUNTRY_NAMES: Record<string, string> = {
  FR: 'France', US: 'États-Unis', GB: 'Royaume-Uni', UK: 'Royaume-Uni', DE: 'Allemagne',
  CA: 'Canada', CH: 'Suisse', BE: 'Belgique', ES: 'Espagne', IT: 'Italie', NL: 'Pays-Bas',
  AU: 'Australie', JP: 'Japon', BR: 'Brésil', MX: 'Mexique', IN: 'Inde', CN: 'Chine',
  PT: 'Portugal', SE: 'Suède', NO: 'Norvège', DK: 'Danemark', FI: 'Finlande', IE: 'Irlande',
  AT: 'Autriche', PL: 'Pologne', RU: 'Russie', KR: 'Corée du Sud', TR: 'Turquie', AE: 'Émirats',
  SA: 'Arabie saoudite', ZA: 'Afrique du Sud', NZ: 'Nouvelle-Zélande', SG: 'Singapour', LU: 'Luxembourg',
};
const countryName = (code: string) => COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase();

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

function SubCell({ label, value, cur, prev, compare }: {
  label: string; value: string; cur?: number; prev?: number; compare: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <p className="text-xl font-semibold tracking-tight">{value}</p>
        {compare && cur !== undefined && prev !== undefined && <Delta value={pct(cur, prev)} />}
      </div>
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
  const [byCountry, setByCountry] = useState<Country[]>([]);
  const [windowDays, setWindowDays] = useState(90);
  const [rangeDays, setRangeDays] = useState(30);
  const [compare, setCompare] = useState<'prev' | 'none'>('prev');
  const [subs, setSubs] = useState<{ current: SubMetric; previous: SubMetric } | null>(null);
  const [subsReady, setSubsReady] = useState(false);
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
      const j = await r.json() as { rows?: SalesRow[]; totalDownloads?: number; totalRevenue?: number; byCountry?: Country[]; windowDays?: number; error?: string };
      if (j.error) setError(j.error);
      else { setRows(j.rows ?? []); setByCountry(j.byCountry ?? []); if (j.windowDays) setWindowDays(j.windowDays); }
    } catch { setError('Connexion à App Store Connect impossible.'); }
    setLoading(false);
  };

  // Real subscription metrics (active / new / lost / renewal + MRR/ARR) from
  // Apple's subscription reports. Stays empty (not faked) until the app has
  // subscribers; if the backend action isn't deployed yet we just hide the block.
  const loadSubs = async (range: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-subscriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rangeDays: range }),
      });
      const j = await r.json() as { current?: SubMetric; previous?: SubMetric };
      if (j.current && j.previous) { setSubs({ current: j.current, previous: j.previous }); setSubsReady(true); }
      else setSubsReady(false);
    } catch { setSubsReady(false); }
  };

  useEffect(() => {
    if (hasCreds) loadSubs(rangeDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCreds, rangeDays]);

  if (hasCreds === false) {
    return (
      <div className="p-8">
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

  const win = rows.slice(-rangeDays);
  const prev = rows.slice(-2 * rangeDays, -rangeDays);
  const hasPrev = prev.length > 0;
  const winRev = sum(win, 'revenue');
  const winDl = sum(win, 'downloads');
  const prevRev = sum(prev, 'revenue');
  const prevDl = sum(prev, 'downloads');
  const revDelta = pct(winRev, prevRev);
  const dlDelta = pct(winDl, prevDl);
  const revPerDl = winDl > 0 ? winRev / winDl : 0;
  const avgPerDay = win.length > 0 ? winRev / win.length : 0;
  const rangeLabel = rangeDays === 1 ? '24 h' : `${rangeDays} j`;
  const hasData = win.length > 0;

  // Country breakdown reflects the whole loaded window, not the day toggle.
  const topCountries = byCountry.slice(0, 8);
  const countryTotal = byCountry.reduce((s, c) => s + Math.max(c.revenue, 0), 0);

  // Subscription block: show real figures only when the report actually has any.
  const subC = subs?.current;
  const subP = subs?.previous;
  const subCmp = compare === 'prev' && !!subP;
  const hasSubs = subsReady && !!subC &&
    (subC.activeSubscribers > 0 || subC.newSubscribers > 0 || subC.cancellations > 0 || subC.renewals > 0);

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Analytics"
        description="Tes ventes réelles, depuis tes rapports App Store."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
              className="text-sm bg-card border border-border/40 rounded-lg px-3 h-9 text-foreground focus:outline-none"
              aria-label="Période"
            >
              <option value={1}>Hier</option>
              <option value={7}>7 derniers jours</option>
              <option value={30}>30 derniers jours</option>
              <option value={90}>90 derniers jours</option>
            </select>
            <select
              value={compare}
              onChange={(e) => setCompare(e.target.value as 'prev' | 'none')}
              className="text-sm bg-card border border-border/40 rounded-lg px-3 h-9 text-muted-foreground focus:outline-none"
              aria-label="Comparaison"
            >
              <option value="prev">vs période précédente</option>
              <option value="none">Pas de comparaison</option>
            </select>
          </div>
        }
      />

      {error && <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">{error}</div>}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Kpi icon={DollarSign} label={`Revenu (${rangeLabel})`} value={fmtMoney(winRev)} delta={hasPrev && compare === 'prev' ? revDelta : undefined} sub={hasPrev && compare === 'prev' ? `Avant : ${fmtMoney(prevRev)}` : 'sur la période'} />
        <Kpi icon={Download} label="Téléchargements" value={winDl.toLocaleString('fr-FR')} delta={hasPrev && compare === 'prev' ? dlDelta : undefined} sub={hasPrev && compare === 'prev' ? `Avant : ${prevDl.toLocaleString('fr-FR')}` : 'sur la période'} />
        <Kpi icon={Tag} label="Revenu / téléchargement" value={fmtMoney(revPerDl)} sub="Valeur moyenne" />
        <Kpi icon={CalendarDays} label="Revenu moyen / jour" value={fmtMoney(avgPerDay)} sub={`Sur ${rangeLabel}`} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium">Revenu journalier</h2>
              <p className="text-xs text-muted-foreground">Sur {rangeLabel}, proceeds développeur</p>
            </div>
          </div>
          {hasData ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={win} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
              <BarChart data={win} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
            <h2 className="text-sm font-medium">Abonnements ({rangeLabel})</h2>
          </div>
          {hasSubs && subC ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <SubCell label="Abonnés actifs" value={subC.activeSubscribers.toLocaleString('fr-FR')} cur={subC.activeSubscribers} prev={subP?.activeSubscribers} compare={subCmp} />
                <SubCell label="Nouveaux" value={subC.newSubscribers.toLocaleString('fr-FR')} cur={subC.newSubscribers} prev={subP?.newSubscribers} compare={subCmp} />
                <SubCell label="Perdus" value={subC.cancellations.toLocaleString('fr-FR')} cur={subC.cancellations} prev={subP?.cancellations} compare={subCmp} />
                <SubCell label="Renouvellement" value={subC.renewalRate != null ? `${subC.renewalRate}%` : '—'} cur={subC.renewalRate ?? undefined} prev={subP?.renewalRate ?? undefined} compare={subCmp} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/40">
                <SubCell label="MRR" value={fmtMoney(subC.mrr)} cur={subC.mrr} prev={subP?.mrr} compare={subCmp} />
                <SubCell label="ARR" value={fmtMoney(subC.arr)} cur={subC.arr} prev={subP?.arr} compare={subCmp} />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {['Abonnés actifs', 'Nouveaux', 'Perdus', 'Renouvellement'].map((k) => (
                  <div key={k}>
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="text-xl font-semibold tracking-tight mt-0.5">—</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-4 flex items-center gap-1.5">
                <Users className="h-3 w-3" /> Se débloque avec tes premiers abonnés (rapports d&apos;abonnement Apple).
              </p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">Revenu par pays</h2>
            </div>
            {byCountry.length > 0 && (
              <span className="text-[11px] text-muted-foreground">{windowDays} derniers jours</span>
            )}
          </div>
          {byCountry.length > 0 ? (
            <div className="space-y-2.5">
              {topCountries.map((c) => {
                const share = countryTotal > 0 ? Math.max(0, (c.revenue / countryTotal) * 100) : 0;
                return (
                  <div key={c.code} className="flex items-center gap-3">
                    <span className="text-base leading-none w-5 text-center" aria-hidden>{flagEmoji(c.code)}</span>
                    <span className="text-[13px] w-28 truncate" title={countryName(c.code)}>{countryName(c.code)}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-accent overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(share, 2)}%` }} />
                    </div>
                    <span className="text-[13px] tabular-nums w-16 text-right">{fmtMoney(c.revenue)}</span>
                  </div>
                );
              })}
              {byCountry.length > topCountries.length && (
                <p className="text-[11px] text-muted-foreground pt-1">+{byCountry.length - topCountries.length} autres pays</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <Globe className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground max-w-xs">
                La répartition par pays se remplira dès tes premières ventes, calculée sur tes rapports App Store réels.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ loading }: { loading: boolean }) {
  return (
    <div className="h-[240px] flex items-center justify-center text-center">
      <p className="text-sm text-muted-foreground max-w-xs">
        {loading ? 'Chargement...' : 'Aucune vente sur la période pour le moment. Les graphes se rempliront dès tes premières ventes.'}
      </p>
    </div>
  );
}
