'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCache, setCache } from '@/lib/cache';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import {
  Lock, Download, TrendingUp, TrendingDown,
  Users, Repeat, Globe, Eye, Target, ArrowDown, Filter,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Bucket = { date: string; downloads: number; revenue: number };
type Country = { code: string; downloads: number; revenue: number };
type Granularity = 'day' | 'week' | 'month';
type Range = 'today' | '7d' | '30d' | '90d' | '365d' | 'all' | 'custom';
type Compare = 'prev' | 'year' | 'none';
type SubMetric = {
  activeSubscribers: number; mrr: number; arr: number;
  newSubscribers: number; cancellations: number; renewals: number;
  renewalRate: number | null; churnRate: number | null;
};

type SalesResponse = {
  granularity?: Granularity; rangeDays?: number;
  rows?: Bucket[]; totalDownloads?: number; totalRevenue?: number;
  previous?: { downloads: number; revenue: number } | null;
  windowDays?: number; byCountry?: Country[]; error?: string;
};

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'today', label: 'Dernières 24 h' },
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '90 derniers jours' },
  { value: '365d', label: '365 derniers jours' },
  { value: 'all', label: 'Depuis le début' },
  { value: 'custom', label: 'Plage personnalisée' },
];
const RANGE_SHORT: Record<Range, string> = {
  today: '24 h', '7d': '7 j', '30d': '30 j', '90d': '90 j', '365d': '365 j', all: 'depuis le début', custom: 'plage perso',
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: Math.abs(n) < 100 ? 2 : 0 }).format(n);
const fmtDay = (d: string) => { const p = d.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}` : d; };
const fmtMonth = (d: string) => { const p = d.split('-'); return p.length >= 2 ? `${p[1]}/${p[0].slice(2)}` : d; };
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

function Kpi({ label, value, delta, sub }: {
  label: string; value: string; delta?: number; sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card card-pop px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground/70 truncate">{label}</span>
        {delta !== undefined && <Delta value={delta} />}
      </div>
      <div className="text-xl font-semibold tracking-tight tabular-nums mt-1">{value}</div>
      {sub && <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">{sub}</p>}
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
  const [rows, setRows] = useState<Bucket[]>([]);
  const [byCountry, setByCountry] = useState<Country[]>([]);
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [totals, setTotals] = useState({ revenue: 0, downloads: 0 });
  const [previous, setPrevious] = useState<{ downloads: number; revenue: number } | null>(null);
  const [spanDays, setSpanDays] = useState(30);

  const [range, setRange] = useState<Range>('30d');
  const [compare, setCompare] = useState<Compare>('prev');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [subs, setSubs] = useState<{ current: SubMetric; previous: SubMetric } | null>(null);
  const [subsReady, setSubsReady] = useState(false);
  const [error, setError] = useState('');

  // Apple's freshest report is yesterday; cap the custom date pickers there.
  const maxDay = (() => { const d = new Date(); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); })();

  useEffect(() => {
    (async () => {
      const { data: creds } = await supabase.from('asc_credentials').select('id').maybeSingle();
      setHasCreds(!!creds);
    })();
  }, []);

  const applySales = (j: SalesResponse) => {
    setRows(j.rows ?? []);
    setByCountry(j.byCountry ?? []);
    setGranularity(j.granularity ?? 'day');
    setTotals({ revenue: j.totalRevenue ?? 0, downloads: j.totalDownloads ?? 0 });
    setPrevious(j.previous ?? null);
    setSpanDays(j.rangeDays ?? j.windowDays ?? 30);
  };

  const loadSales = async () => {
    if (range === 'custom' && (!from || !to)) return;
    const key = `sales:${range}:${compare}:${from}:${to}`;
    const cached = getCache<SalesResponse>(key);
    if (cached) applySales(cached);          // instant from the last real response
    if (!cached) setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-sales`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ range, compare, from, to }),
      });
      const j = await r.json() as SalesResponse;
      if (j.error) setError(j.error);
      else { applySales(j); setCache(key, j); }
    } catch { setError('Connexion à App Store Connect impossible.'); }
    setLoading(false);
  };

  // Real subscription metrics (active / new / lost / renewal + MRR/ARR) from
  // Apple's subscription reports. Stays empty (not faked) until the app has
  // subscribers; the backend caps the sub window at 90 days.
  const loadSubs = async (days: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-subscriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rangeDays: Math.min(days, 90) }),
      });
      const j = await r.json() as { current?: SubMetric; previous?: SubMetric };
      if (j.current && j.previous) { setSubs({ current: j.current, previous: j.previous }); setSubsReady(true); }
      else setSubsReady(false);
    } catch { setSubsReady(false); }
  };

  useEffect(() => {
    if (hasCreds) loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCreds, range, compare, from, to]);

  useEffect(() => {
    if (hasCreds) loadSubs(spanDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCreds, spanDays]);

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

  const winRev = totals.revenue;
  const winDl = totals.downloads;
  const hasPrev = previous != null && compare !== 'none';
  const showDelta = hasPrev;
  const prevRev = previous?.revenue ?? 0;
  const prevDl = previous?.downloads ?? 0;
  const revDelta = pct(winRev, prevRev);
  const dlDelta = pct(winDl, prevDl);
  const revPerDl = winDl > 0 ? winRev / winDl : 0;
  const avgPerDay = spanDays > 0 ? winRev / spanDays : 0;
  const rangeLabel = RANGE_SHORT[range];
  const hasData = rows.length > 0;
  const prevWord = compare === 'year' ? 'Il y a 1 an' : 'Avant';

  const chartTitle = granularity === 'month' ? 'Revenu mensuel' : granularity === 'week' ? 'Revenu hebdomadaire' : 'Revenu journalier';
  const tickFmt = (v: string) => (granularity === 'month' ? fmtMonth(v) : fmtDay(v));
  const tipLabel = (v: string) =>
    granularity === 'month' ? `Mois ${fmtMonth(v)}` : granularity === 'week' ? `Semaine du ${fmtDay(v)}` : fmtDay(v);

  // Country breakdown reflects the whole loaded window.
  const topCountries = byCountry.slice(0, 8);
  const countryTotal = byCountry.reduce((s, c) => s + Math.max(c.revenue, 0), 0);

  // Subscription block: show real figures only when the report actually has any.
  const subC = subs?.current;
  const subP = subs?.previous;
  const subCmp = compare !== 'none' && !!subP;
  const hasSubs = subsReady && !!subC &&
    (subC.activeSubscribers > 0 || subC.newSubscribers > 0 || subC.cancellations > 0 || subC.renewals > 0);

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Analytics"
        description="Tes ventes réelles, depuis tes rapports App Store."
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {range === 'custom' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date" value={from} max={to || maxDay} onChange={(e) => setFrom(e.target.value)}
                  className="text-sm bg-card border border-border/40 rounded-lg px-2 h-9 text-foreground focus:outline-none"
                  aria-label="Date de début"
                />
                <span className="text-muted-foreground text-sm">→</span>
                <input
                  type="date" value={to} min={from} max={maxDay} onChange={(e) => setTo(e.target.value)}
                  className="text-sm bg-card border border-border/40 rounded-lg px-2 h-9 text-foreground focus:outline-none"
                  aria-label="Date de fin"
                />
              </div>
            )}
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as Range)}
              className="text-sm bg-card border border-border/40 rounded-lg px-3 h-9 text-foreground focus:outline-none"
              aria-label="Période"
            >
              {RANGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={compare}
              onChange={(e) => setCompare(e.target.value as Compare)}
              className="text-sm bg-card border border-border/40 rounded-lg px-3 h-9 text-muted-foreground focus:outline-none"
              aria-label="Comparaison"
            >
              <option value="prev">vs période précédente</option>
              <option value="year">vs année précédente</option>
              <option value="none">Pas de comparaison</option>
            </select>
          </div>
        }
      />

      {error && <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">{error}</div>}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        <Kpi label="Revenu" value={fmtMoney(winRev)} delta={showDelta ? revDelta : undefined} sub={showDelta ? `${prevWord} : ${fmtMoney(prevRev)}` : undefined} />
        <Kpi label="Téléchargements" value={winDl.toLocaleString('fr-FR')} delta={showDelta ? dlDelta : undefined} sub={showDelta ? `${prevWord} : ${prevDl.toLocaleString('fr-FR')}` : undefined} />
        <Kpi label="Revenu / téléch." value={fmtMoney(revPerDl)} sub="Valeur moyenne" />
        <Kpi label="Revenu / jour" value={fmtMoney(avgPerDay)} />
        <Kpi label="Abonnés actifs" value={hasSubs && subC ? subC.activeSubscribers.toLocaleString('fr-FR') : '—'} delta={hasSubs && subCmp && subC && subP ? pct(subC.activeSubscribers, subP.activeSubscribers) : undefined} sub={hasSubs ? undefined : 'Dès tes 1ers abonnés'} />
        <Kpi label="MRR" value={hasSubs && subC ? fmtMoney(subC.mrr) : '—'} delta={hasSubs && subCmp && subC && subP ? pct(subC.mrr, subP.mrr) : undefined} sub={hasSubs ? 'Récurrent / mois' : 'Dès tes 1ers abonnés'} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card card-pop p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium">{chartTitle}</h2>
              <p className="text-xs text-muted-foreground">Sur {rangeLabel}, proceeds développeur</p>
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
                <XAxis dataKey="date" tickFormatter={tickFmt} minTickGap={28} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={tipLabel} formatter={(v: number) => [fmtMoney(v), 'Revenu']} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart loading={loading} />}
        </div>

        <div className="rounded-xl border border-border bg-card card-pop p-5">
          <h2 className="text-sm font-medium mb-4">Téléchargements</h2>
          {hasData ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tickFormatter={tickFmt} minTickGap={28} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={tipLabel} formatter={(v: number) => [v, 'Téléchargements']} />
                <Bar dataKey="downloads" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart loading={loading} />}
        </div>
      </div>

      {/* Conversion funnel — real where data exists, locked (never faked) above downloads */}
      <ConversionFunnel
        downloads={winDl}
        newSubs={subC?.newSubscribers ?? 0}
        hasSubs={hasSubs}
        renewalRate={subC?.renewalRate ?? null}
        churnRate={subC?.churnRate ?? null}
        isLive={hasCreds === true}
      />

      {/* Subscriptions + Geography (real once the report extension ships) */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card card-pop p-5">
          <div className="flex items-center gap-2 mb-4">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Abonnements</h2>
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

        <div className="rounded-xl border border-border bg-card card-pop p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">Revenu par pays</h2>
            </div>
            {byCountry.length > 0 && (
              <span className="text-[11px] text-muted-foreground">{rangeLabel}</span>
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

// Industry reference bands — clearly labelled as indicative, never the user's data.
function convVerdict(rate: number, good: number, mid: number) {
  if (rate >= good) return { color: 'text-emerald-600', label: 'bon' };
  if (rate >= mid) return { color: 'text-amber-600', label: 'à améliorer' };
  return { color: 'text-rose-600', label: 'faible' };
}

type FunnelState = 'locked' | 'real' | 'pending';

function ConversionFunnel({
  downloads, newSubs, hasSubs, renewalRate, churnRate, isLive,
}: {
  downloads: number; newSubs: number; hasSubs: boolean;
  renewalRate: number | null; churnRate: number | null; isLive: boolean;
}) {
  const max = Math.max(downloads, newSubs, 1);
  const installToSub = downloads > 0 && hasSubs ? (newSubs / downloads) * 100 : null;

  const steps: { key: string; label: string; icon: typeof Eye; state: FunnelState; value: number | null; hint?: string }[] = [
    { key: 'impr', label: 'Impressions', icon: Eye, state: 'locked', value: null,
      hint: "Se débloque avec les rapports App Analytics d'Apple : le nombre de fois où ta fiche apparaît dans l'App Store." },
    { key: 'views', label: 'Vues de la page produit', icon: Target, state: 'locked', value: null,
      hint: "Se débloque avec les rapports App Analytics d'Apple : les visites de ta page produit." },
    { key: 'dl', label: 'Téléchargements', icon: Download, state: isLive ? 'real' : 'pending', value: isLive ? downloads : null,
      hint: isLive ? undefined : 'Connecte App Store Connect et ton numéro de vendeur pour voir tes téléchargements.' },
    { key: 'sub', label: 'Abonnements démarrés', icon: Users, state: hasSubs ? 'real' : 'pending', value: hasSubs ? newSubs : null,
      hint: hasSubs ? undefined : 'Se débloque avec tes premiers abonnés.' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card card-pop p-5 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">Entonnoir de conversion</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        De la découverte de ta fiche à l&apos;abonnement. Chaque taux est comparé à un repère indicatif du secteur pour voir où tu perds des utilisateurs.
      </p>

      <div className="space-y-1.5">
        {steps.map((s) => {
          const widthPct = s.value != null ? Math.max(5, (s.value / max) * 100) : 100;
          const locked = s.state !== 'real';
          return (
            <div key={s.key}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-44 shrink-0">
                  <s.icon className={`h-4 w-4 ${locked ? 'text-muted-foreground/40' : 'text-foreground/70'}`} />
                  <span className={`text-[13px] ${locked ? 'text-muted-foreground/60' : ''}`}>{s.label}</span>
                </div>
                <div className="flex-1 h-7 rounded-md bg-accent/60 overflow-hidden">
                  {s.state === 'real' ? (
                    <div className="h-full rounded-md bg-primary/80" style={{ width: `${widthPct}%` }} />
                  ) : (
                    <div className="h-full w-full flex items-center px-2 gap-1.5 text-muted-foreground/50" title={s.hint}>
                      <Lock className="h-3 w-3 shrink-0" />
                      <span className="text-[11px] truncate">{s.state === 'locked' ? 'App Analytics requise' : 'À débloquer'}</span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold tabular-nums w-16 text-right">
                  {s.value != null ? s.value.toLocaleString('fr-FR') : '—'}
                </span>
              </div>
              {s.key === 'dl' && installToSub != null && (
                <div className="flex items-center gap-2 pl-44 py-1.5">
                  <ArrowDown className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                  <span className={`text-xs font-medium ${convVerdict(installToSub, 5, 2).color}`}>
                    {Math.round(installToSub * 10) / 10}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    des téléchargements démarrent un abonnement · repère 5 %+ ({convVerdict(installToSub, 5, 2).label})
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasSubs && (renewalRate != null || churnRate != null) && (
        <div className="mt-5 pt-4 border-t border-border/40 grid grid-cols-2 gap-4">
          {renewalRate != null && (
            <RetentionStat label="Taux de renouvellement" value={renewalRate} band="≥ 50 % visé"
              verdict={convVerdict(renewalRate, 50, 30)} />
          )}
          {churnRate != null && (
            <RetentionStat label="Taux de résiliation (churn)" value={churnRate} band="≤ 5 % visé"
              verdict={churnRate <= 5 ? { color: 'text-emerald-600', label: 'bon' } : churnRate <= 10 ? { color: 'text-amber-600', label: 'à surveiller' } : { color: 'text-rose-600', label: 'élevé' }} />
          )}
        </div>
      )}
    </div>
  );
}

function RetentionStat({ label, value, band, verdict }: {
  label: string; value: number; band: string; verdict: { color: string; label: string };
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2 mt-0.5">
        <span className="text-xl font-semibold tabular-nums">{value}%</span>
        <span className={`text-xs font-medium ${verdict.color}`}>{verdict.label}</span>
      </div>
      <p className="text-[11px] text-muted-foreground/70 mt-0.5">Repère : {band}</p>
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
