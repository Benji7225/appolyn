'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getCache, setCache } from '@/lib/cache';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import {
  Lock, Download, TrendingUp, TrendingDown,
  Users, Repeat, Globe, Eye, Target, ArrowDown, Filter,
  Pencil, Check, Plus, X, GripVertical, Tag,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
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

// Default visible KPIs (user can reorder / hide / add, persisted in localStorage).
const DEFAULT_KPIS = ['revenue', 'downloads', 'revPerDl', 'activeSubs', 'mrr', 'renewalRate', 'arpu', 'arppu', 'ltv'];

// Tuiles "gros blocs" : label + largeur (col-span sur une grille de 12). Les KPIs
// sont AUSSI des tuiles (plus petites) dans le MÊME espace de drag. Chaque graphe
// et chaque tableau est un bloc individuel, déplaçable seul.
// Grille à cases standard : chaque tuile occupe N colonnes (sur 12) ET M rangées
// (hauteur = un multiple d'une rangée fixe). Avec `grid-flow-row-dense`, les
// petites tuiles viennent boucher les trous à côté des grandes (plus d'espace vide).
const BLOCK_META: Record<string, { label: string; span: string }> = {
  'chart-revenue':   { label: 'Revenu (graphe)',          span: 'col-span-12 lg:col-span-6 row-span-3' },
  'chart-downloads': { label: 'Téléchargements (graphe)', span: 'col-span-12 lg:col-span-6 row-span-3' },
  'funnel':          { label: 'Entonnoir de conversion',  span: 'col-span-12 row-span-3' },
  'subs':            { label: 'Abonnements',               span: 'col-span-12 sm:col-span-6 row-span-2' },
  'geo':             { label: 'Revenu par pays',           span: 'col-span-12 sm:col-span-6 row-span-2' },
  // Revenu par produit/prix, dérivé des achats StoreKit captés par le SDK. Fait
  // ressortir AUTOMATIQUEMENT l'A/B testing de prix (un même produit à 2,99 et 4,99
  // apparaît en deux lignes distinctes), sans rien configurer.
  'products':        { label: 'Revenu par produit',        span: 'col-span-12 sm:col-span-6 row-span-2' },
  // Entonnoir d'onboarding auto-adaptatif : dérivé des events `screen_view` du SDK.
  // Appolyn ordonne les écrans (par 1re apparition) et calcule le décrochage tout seul ;
  // si le dev ajoute/retire un écran, l'entonnoir s'adapte sans config.
  'onboarding-funnel': { label: "Entonnoir d'onboarding",  span: 'col-span-12 sm:col-span-6 row-span-2' },
};
const BLOCK_IDS: string[] = Object.keys(BLOCK_META);
// Un KPI = 1 case standard (hauteur 1 rangée).
const KPI_SPAN = 'col-span-6 sm:col-span-4 lg:col-span-2 row-span-1';
// Disposition par défaut : les KPIs puis les gros blocs, tout dans un seul flux.
const DEFAULT_LAYOUT: string[] = [...DEFAULT_KPIS, ...BLOCK_IDS];

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: Math.abs(n) < 100 ? 2 : 0 }).format(n);
// Formate un montant dans la devise réelle de l'achat (le SDK capte la devise StoreKit).
const fmtCur = (n: number, cur: string) => {
  try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur || 'EUR', maximumFractionDigits: 2 }).format(n); }
  catch { return `${n.toFixed(2)} ${cur || ''}`.trim(); }
};
// Dates lisibles dans les graphes : "22 juin" plutôt que "22/06" (moins scolaire).
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_FR_FULL = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const fmtDay = (d: string) => { const p = d.split('-'); const m = Number(p[1]) - 1; return p.length === 3 && m >= 0 && m < 12 ? `${Number(p[2])} ${MONTHS_FR[m]}` : d; };
const fmtDayFull = (d: string) => { const p = d.split('-'); const m = Number(p[1]) - 1; return p.length === 3 && m >= 0 && m < 12 ? `${Number(p[2])} ${MONTHS_FR_FULL[m]}` : d; };
const fmtMonth = (d: string) => { const p = d.split('-'); const m = Number(p[1]) - 1; return p.length >= 2 && m >= 0 && m < 12 ? `${MONTHS_FR[m]} ${p[0].slice(2)}` : d; };
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
    <div className="h-full flex flex-col justify-center rounded-xl border border-border bg-card card-pop px-4 py-3">
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
  // Revenu par produit/prix, dérivé des achats StoreKit captés par le SDK.
  const [products, setProducts] = useState<{ key: string; productId: string; price: number; currency: string; count: number; revenue: number }[]>([]);
  // Étapes de l'entonnoir d'onboarding, dérivées des events `screen_view` du SDK.
  const [funnelSteps, setFunnelSteps] = useState<{ name: string; users: number }[]>([]);
  // Agrégats clients (SDK) pour ARPU / ARPPU / LTV réalisée.
  const [clientStats, setClientStats] = useState<{ users: number; paying: number; revenue: number }>({ users: 0, paying: 0, revenue: 0 });
  const [error, setError] = useState('');

  // Disposition UNIFIÉE : les indicateurs (KPIs) ET les gros blocs sont des
  // "tuiles" dans UN SEUL espace de drag (réordonner / masquer / réafficher),
  // persistée localement. Une tuile peut donc se placer n'importe où, et des
  // petites et des grosses peuvent cohabiter sur une même ligne.
  const [editingKpis, setEditingKpis] = useState(false);
  const [layout, setLayout] = useState<string[]>(DEFAULT_LAYOUT);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  useEffect(() => {
    try {
      const savedHidden = localStorage.getItem('analytics:hidden');
      if (savedHidden) setHidden(new Set(JSON.parse(savedHidden)));
      const savedLayout = localStorage.getItem('analytics:layout');
      if (savedLayout) {
        const saved = JSON.parse(savedLayout) as string[];
        // Ajoute les nouveaux blocs/KPIs pas encore dans la disposition sauvegardée
        // (sinon un bloc ajouté plus tard n'apparaîtrait jamais chez un user existant).
        setLayout([...saved, ...DEFAULT_LAYOUT.filter((id) => !saved.includes(id))]);
      }
    } catch { /* ignore */ }
  }, []);
  const saveLayout = (ids: string[]) => {
    setLayout(ids);
    try { localStorage.setItem('analytics:layout', JSON.stringify(ids)); } catch { /* ignore */ }
  };
  const toggleHidden = (id: string) => {
    setHidden((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      try { localStorage.setItem('analytics:hidden', JSON.stringify(Array.from(n))); } catch { /* ignore */ }
      return n;
    });
  };

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

  // Revenu par produit depuis les events StoreKit du SDK (value = prix réel payé,
  // currency = devise réelle). On groupe par produit + prix : un même produit vendu
  // à 2,99 ET 4,99 (A/B test du dev) ressort en deux lignes, automatiquement.
  const loadProducts = async () => {
    try {
      const { data } = await supabase
        .from('sdk_events')
        .select('event, value, currency, properties')
        .in('event', ['subscribe', 'renewal', 'purchase'])
        .not('value', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5000);
      const evs = (data ?? []) as { value: number | null; currency: string | null; properties: Record<string, unknown> | null }[];
      const map = new Map<string, { productId: string; price: number; currency: string; count: number; revenue: number }>();
      for (const r of evs) {
        const v = typeof r.value === 'number' ? r.value : 0;
        if (v <= 0) continue;
        const pid = r.properties && typeof r.properties.product_id === 'string' ? r.properties.product_id : 'inconnu';
        const cur = r.currency ?? 'EUR';
        const price = Math.round(v * 100) / 100;
        const key = `${pid}@@${price}@@${cur}`;
        const ex = map.get(key);
        if (ex) { ex.count += 1; ex.revenue += v; }
        else map.set(key, { productId: pid, price, currency: cur, count: 1, revenue: v });
      }
      setProducts(Array.from(map.entries()).map(([key, val]) => ({ key, ...val })).sort((a, b) => b.revenue - a.revenue));
    } catch { setProducts([]); }
  };
  useEffect(() => { loadProducts(); }, []);

  // Entonnoir d'onboarding : distinct utilisateurs (idfv) ayant vu chaque écran,
  // ordonnés par 1re apparition (l'écran de bienvenue arrive en premier). Le décrochage
  // se calcule côté rendu. Auto-adaptatif : un nouvel écran instrumenté apparaît tout seul.
  const loadFunnel = async () => {
    try {
      const { data } = await supabase
        .from('sdk_events')
        .select('idfv, properties, created_at')
        .eq('event', 'screen_view')
        .order('created_at', { ascending: true })
        .limit(5000);
      const evs = (data ?? []) as { idfv: string | null; properties: Record<string, unknown> | null; created_at: string }[];
      const map = new Map<string, Set<string>>();
      const order: string[] = [];
      for (const r of evs) {
        const name = r.properties && typeof r.properties.name === 'string' ? r.properties.name : null;
        if (!name) continue;
        if (!map.has(name)) { map.set(name, new Set()); order.push(name); }
        if (r.idfv) map.get(name)!.add(r.idfv);
      }
      setFunnelSteps(order.map((name) => ({ name, users: map.get(name)!.size })));
    } catch { setFunnelSteps([]); }
  };
  useEffect(() => { loadFunnel(); }, []);

  // ARPU / ARPPU / LTV : agrégés sur les clients SDK (revenu cumulé + payeurs). Source
  // unique cohérente (le SDK voit les users ET leurs achats), gère l'A/B de prix de fait.
  const loadClientStats = async () => {
    try {
      const { data } = await supabase.from('sdk_clients').select('total_revenue, has_purchased').limit(10000);
      const rows = (data ?? []) as { total_revenue: number | null; has_purchased: boolean | null }[];
      let users = 0, paying = 0, revenue = 0;
      for (const r of rows) { users += 1; if (r.has_purchased) paying += 1; revenue += Number(r.total_revenue ?? 0); }
      setClientStats({ users, paying, revenue });
    } catch { setClientStats({ users: 0, paying: 0, revenue: 0 }); }
  };
  useEffect(() => { loadClientStats(); }, []);

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
    granularity === 'month' ? `Mois ${fmtMonth(v)}` : granularity === 'week' ? `Semaine du ${fmtDayFull(v)}` : fmtDayFull(v);

  // Country breakdown reflects the whole loaded window.
  const topCountries = byCountry.slice(0, 8);
  const countryTotal = byCountry.reduce((s, c) => s + Math.max(c.revenue, 0), 0);
  const topProducts = products.slice(0, 8);
  const productTotal = products.reduce((s, p) => s + Math.max(p.revenue, 0), 0);
  const hasClients = clientStats.users > 0;
  const arpu = clientStats.users > 0 ? clientStats.revenue / clientStats.users : 0;
  const arppu = clientStats.paying > 0 ? clientStats.revenue / clientStats.paying : 0;

  // Subscription block: show real figures only when the report actually has any.
  const subC = subs?.current;
  const subP = subs?.previous;
  const subCmp = compare !== 'none' && !!subP;
  const hasSubs = subsReady && !!subC &&
    (subC.activeSubscribers > 0 || subC.newSubscribers > 0 || subC.cancellations > 0 || subC.renewals > 0);

  // Full KPI catalog — every value derived from real data. The user picks which
  // ones show and in which order (see kpiOrder).
  const kpiCatalog: { id: string; label: string; value: string; delta?: number; sub?: string }[] = [
    { id: 'revenue', label: 'Revenu', value: fmtMoney(winRev), delta: showDelta ? revDelta : undefined, sub: showDelta ? `${prevWord} : ${fmtMoney(prevRev)}` : undefined },
    { id: 'downloads', label: 'Téléchargements', value: winDl.toLocaleString('fr-FR'), delta: showDelta ? dlDelta : undefined, sub: showDelta ? `${prevWord} : ${prevDl.toLocaleString('fr-FR')}` : undefined },
    { id: 'revPerDl', label: 'Revenu / téléch.', value: fmtMoney(revPerDl), sub: 'Valeur moyenne' },
    { id: 'avgPerDay', label: 'Revenu / jour', value: fmtMoney(avgPerDay) },
    { id: 'activeSubs', label: 'Abonnés actifs', value: hasSubs && subC ? subC.activeSubscribers.toLocaleString('fr-FR') : '—', delta: hasSubs && subCmp && subC && subP ? pct(subC.activeSubscribers, subP.activeSubscribers) : undefined, sub: hasSubs ? undefined : 'Dès tes 1ers abonnés' },
    { id: 'mrr', label: 'MRR', value: hasSubs && subC ? fmtMoney(subC.mrr) : '—', delta: hasSubs && subCmp && subC && subP ? pct(subC.mrr, subP.mrr) : undefined, sub: hasSubs ? 'Récurrent / mois' : 'Dès tes 1ers abonnés' },
    { id: 'arr', label: 'ARR', value: hasSubs && subC ? fmtMoney(subC.arr) : '—', sub: hasSubs ? 'Annualisé' : 'Dès tes 1ers abonnés' },
    { id: 'newSubs', label: 'Nouveaux abonnés', value: hasSubs && subC ? subC.newSubscribers.toLocaleString('fr-FR') : '—', delta: hasSubs && subCmp && subC && subP ? pct(subC.newSubscribers, subP.newSubscribers) : undefined, sub: `Sur ${rangeLabel}` },
    { id: 'cancels', label: 'Résiliations', value: hasSubs && subC ? subC.cancellations.toLocaleString('fr-FR') : '—', sub: `Sur ${rangeLabel}` },
    { id: 'renewalRate', label: 'Renouvellement', value: hasSubs && subC && subC.renewalRate != null ? `${subC.renewalRate}%` : '—', sub: 'Visé ≥ 50 %' },
    { id: 'churnRate', label: 'Résiliation (churn)', value: hasSubs && subC && subC.churnRate != null ? `${subC.churnRate}%` : '—', sub: 'Visé ≤ 5 %' },
    { id: 'arpu', label: 'ARPU', value: hasClients ? fmtMoney(arpu) : '—', sub: hasClients ? 'Revenu / utilisateur' : 'Dès tes 1res installs (SDK)' },
    { id: 'arppu', label: 'ARPPU', value: clientStats.paying > 0 ? fmtMoney(arppu) : '—', sub: clientStats.paying > 0 ? 'Revenu / payeur' : 'Dès tes 1ers achats (SDK)' },
    { id: 'ltv', label: 'LTV réalisée', value: clientStats.paying > 0 ? fmtMoney(arppu) : '—', sub: clientStats.paying > 0 ? 'Revenu cumulé / payeur' : 'Dès tes 1ers achats (SDK)' },
    { id: 'topCountry', label: 'Meilleur pays', value: byCountry.length ? countryName(byCountry[0].code) : '—', sub: byCountry.length ? fmtMoney(byCountry[0].revenue) : undefined },
    { id: 'countries', label: 'Pays actifs', value: byCountry.length ? String(byCountry.length) : '—', sub: 'Avec des ventes' },
  ];
  const kpiById = Object.fromEntries(kpiCatalog.map((k) => [k.id, k]));
  // Toutes les tuiles connues (KPIs + gros blocs) = le même espace.
  const allTileIds = [...kpiCatalog.map((k) => k.id), ...BLOCK_IDS];
  const tileLabel = (id: string) => kpiById[id]?.label ?? BLOCK_META[id]?.label ?? id;
  const tileSpan = (id: string) => (BLOCK_META[id] ? BLOCK_META[id].span : KPI_SPAN);
  // Réconcilie la disposition : ordre sauvegardé d'abord, on retire l'inconnu et on
  // ajoute à la fin les nouvelles tuiles (mises à jour produit).
  const orderedTiles = [
    ...layout.filter((id) => allTileIds.includes(id)),
    ...allTileIds.filter((id) => !layout.includes(id)),
  ];
  const visibleTiles = orderedTiles.filter((id) => !hidden.has(id));
  const hiddenTiles = orderedTiles.filter((id) => hidden.has(id));
  const dropOnTile = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    const next = orderedTiles.filter((x) => x !== dragId);
    next.splice(next.indexOf(targetId), 0, dragId);
    saveLayout(next);
    setDragId(null);
  };

  // Contenu d'une tuile : un KPI, ou l'un des gros blocs individuels.
  const tileBody = (id: string): ReactNode => {
    const k = kpiById[id];
    if (k) return <Kpi label={k.label} value={k.value} delta={k.delta} sub={k.sub} />;
    switch (id) {
      case 'chart-revenue':
        return (
          <div className="h-full flex flex-col rounded-xl border border-border bg-card card-pop p-5">
            <div className="mb-4 shrink-0">
              <h2 className="text-sm font-medium">{chartTitle}</h2>
              <p className="text-xs text-muted-foreground">Sur {rangeLabel}, proceeds développeur</p>
            </div>
            <div className="flex-1 min-h-0">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={tickFmt} minTickGap={28} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={tipLabel} formatter={(v: number) => [fmtMoney(v), 'Revenu']} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyChart loading={loading} />}
            </div>
          </div>
        );
      case 'chart-downloads':
        return (
          <div className="h-full flex flex-col rounded-xl border border-border bg-card card-pop p-5">
            <div className="mb-4 shrink-0">
              <h2 className="text-sm font-medium">Téléchargements</h2>
              <p className="text-xs text-muted-foreground">Sur {rangeLabel}</p>
            </div>
            <div className="flex-1 min-h-0">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tickFormatter={tickFmt} minTickGap={28} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={tipLabel} formatter={(v: number) => [v, 'Téléchargements']} />
                    <Bar dataKey="downloads" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart loading={loading} />}
            </div>
          </div>
        );
      case 'funnel':
        return (
          <ConversionFunnel
            downloads={winDl}
            newSubs={subC?.newSubscribers ?? 0}
            hasSubs={hasSubs}
            renewalRate={subC?.renewalRate ?? null}
            churnRate={subC?.churnRate ?? null}
            isLive={hasCreds === true}
          />
        );
      case 'subs':
        return (
          <div className="h-full rounded-xl border border-border bg-card card-pop p-5">
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
                  {['Abonnés actifs', 'Nouveaux', 'Perdus', 'Renouvellement'].map((kk) => (
                    <div key={kk}>
                      <p className="text-xs text-muted-foreground">{kk}</p>
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
        );
      case 'geo':
        return (
          <div className="h-full rounded-xl border border-border bg-card card-pop p-5">
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
        );
      case 'products':
        return (
          <div className="h-full rounded-xl border border-border bg-card card-pop p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Revenu par produit</h2>
              </div>
              {products.length > 0 && (
                <span className="text-[11px] text-muted-foreground">A/B de prix inclus</span>
              )}
            </div>
            {products.length > 0 ? (
              <div className="space-y-2.5">
                {topProducts.map((p) => {
                  const share = productTotal > 0 ? Math.max(0, (p.revenue / productTotal) * 100) : 0;
                  return (
                    <div key={p.key} className="flex items-center gap-3">
                      <span className="text-[13px] flex-1 min-w-0 truncate" title={p.productId}>
                        {p.productId}
                        <span className="ml-1.5 text-[11px] tabular-nums text-muted-foreground">{fmtCur(p.price, p.currency)}</span>
                      </span>
                      <span className="text-[11px] tabular-nums text-muted-foreground w-12 text-right">{p.count.toLocaleString('fr-FR')}×</span>
                      <div className="w-20 h-1.5 rounded-full bg-accent overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(share, 2)}%` }} />
                      </div>
                      <span className="text-[13px] tabular-nums w-16 text-right">{fmtCur(p.revenue, p.currency)}</span>
                    </div>
                  );
                })}
                {products.length > topProducts.length && (
                  <p className="text-[11px] text-muted-foreground pt-1">+{products.length - topProducts.length} autres lignes</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <Tag className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground max-w-xs">
                  Le revenu par produit (et tes A/B de prix) se remplit dès tes premiers achats, capté automatiquement par le SDK. Rien à configurer.
                </p>
              </div>
            )}
          </div>
        );
      case 'onboarding-funnel': {
        const first = funnelSteps[0]?.users ?? 0;
        return (
          <div className="h-full rounded-xl border border-border bg-card card-pop p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Entonnoir d&apos;onboarding</h2>
              </div>
              {funnelSteps.length > 0 && (
                <span className="text-[11px] text-muted-foreground">auto-adaptatif</span>
              )}
            </div>
            {funnelSteps.length > 0 ? (
              <div className="space-y-2.5">
                {funnelSteps.map((s, i) => {
                  const share = first > 0 ? Math.max(0, (s.users / first) * 100) : 0;
                  const prev = i > 0 ? funnelSteps[i - 1].users : s.users;
                  const drop = prev > 0 ? Math.round(((prev - s.users) / prev) * 100) : 0;
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-[13px] flex-1 min-w-0 truncate" title={s.name}>{s.name}</span>
                      {i > 0 && drop > 0 && (
                        <span className="text-[11px] tabular-nums text-red-500/80 w-12 text-right">-{drop}%</span>
                      )}
                      {(i === 0 || drop === 0) && <span className="w-12" />}
                      <div className="w-24 h-1.5 rounded-full bg-accent overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(share, 2)}%` }} />
                      </div>
                      <span className="text-[13px] tabular-nums w-20 text-right">
                        {s.users.toLocaleString('fr-FR')}
                        <span className="text-[11px] text-muted-foreground ml-1">{Math.round(share)}%</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <ArrowDown className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground max-w-xs">
                  L&apos;entonnoir se remplit dès que ton app envoie ses écrans d&apos;onboarding (SwiftUI : <code className="text-[11px]">.appolynScreen(&quot;welcome&quot;)</code> ; UIKit : <code className="text-[11px]">Appolyn.screen(&quot;Welcome&quot;)</code>). Appolyn ordonne les écrans et calcule le décrochage automatiquement.
                </p>
              </div>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  const periodControls = (
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
  );

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Analytics"
        description="Tes ventes réelles, depuis tes rapports App Store."
        actions={
          <>
            {periodControls}
            <button
              onClick={() => setEditingKpis((v) => !v)}
              title={editingKpis ? 'Terminer' : 'Modifier la disposition'}
              className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border transition-colors ${editingKpis ? 'bg-foreground text-background border-foreground' : 'bg-card border-border/40 text-foreground hover:bg-accent'}`}
            >
              {editingKpis ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </button>
          </>
        }
      />

      {error && <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">{error}</div>}

      {editingKpis && hiddenTiles.length > 0 && (
        <div className="mb-4 p-3 rounded-xl border border-dashed border-border bg-card/50">
          <p className="text-xs text-muted-foreground mb-2">Réafficher une tuile (indicateur ou bloc)</p>
          <div className="flex flex-wrap gap-1.5">
            {hiddenTiles.map((id) => (
              <button
                key={id}
                onClick={() => toggleHidden(id)}
                className="text-xs px-2.5 h-7 rounded-lg border border-border bg-card hover:bg-accent flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> {tileLabel(id)}
              </button>
            ))}
          </div>
        </div>
      )}

      {editingKpis && (
        <p className="mb-3 text-xs text-muted-foreground">
          Indicateurs et blocs sont dans le même espace : glisse n&apos;importe quelle tuile pour la déplacer, × pour la masquer.
        </p>
      )}

      {/* Espace UNIFIÉ : KPIs (petites tuiles) ET gros blocs (larges) dans une seule
          grille 12 colonnes ; l'ordre du tableau = l'ordre affiché (drag pour changer). */}
      <div className="grid grid-cols-12 auto-rows-[7rem] gap-3 grid-flow-row-dense">
        {visibleTiles.map((id) => (
          <div
            key={id}
            draggable={editingKpis}
            onDragStart={() => setDragId(id)}
            onDragOver={(e) => { if (editingKpis) e.preventDefault(); }}
            onDrop={() => dropOnTile(id)}
            className={`relative ${tileSpan(id)} ${editingKpis ? 'cursor-move' : ''} ${dragId === id ? 'opacity-40' : ''}`}
          >
            {editingKpis && (
              <>
                <button
                  onClick={() => toggleHidden(id)}
                  className="absolute -top-2 -right-2 z-20 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center shadow"
                  aria-label={`Masquer ${tileLabel(id)}`}
                >
                  <X className="h-3 w-3" />
                </button>
                <GripVertical className="absolute top-2 right-2 z-20 h-3.5 w-3.5 text-muted-foreground/40" />
              </>
            )}
            {tileBody(id)}
          </div>
        ))}
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
    <div className="h-full rounded-xl border border-border bg-card card-pop p-5">
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
    <div className="h-full min-h-[160px] flex items-center justify-center text-center">
      <p className="text-sm text-muted-foreground max-w-xs">
        {loading ? 'Chargement...' : 'Aucune vente sur la période pour le moment. Les graphes se rempliront dès tes premières ventes.'}
      </p>
    </div>
  );
}
