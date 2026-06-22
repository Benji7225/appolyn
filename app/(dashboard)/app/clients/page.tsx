'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDashboard } from '@/lib/app-context';
import { Copy, Check, Smartphone, Users, X, Download, BarChart3, TrendingUp, Megaphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FUNNEL_COLOR } from '@/lib/funnel';
import { SdkModal } from '@/components/dashboard/sdk-modal';
import { SdkStatusBanner } from '@/components/dashboard/sdk-status';

// New tables aren't in the generated DB types yet; access them untyped.
const db = supabase as unknown as { from: (t: string) => any };

type SdkClient = {
  id: string; idfv: string; platform: string | null;
  device_model: string | null; device_class: string | null;
  os_name: string | null; os_version: string | null; app_version: string | null;
  region: string | null; language: string | null; timezone: string | null;
  ip_country: string | null; ip_city: string | null;
  screen_w: number | null; screen_h: number | null;
  attributed_source: string | null; confidence: number | null;
  purchases: number; total_revenue: number; currency: string | null; has_purchased: boolean;
  install_date: string | null; first_seen: string; last_seen: string;
};
type SdkEvent = { event: string; value: number | null; currency: string | null; created_at: string; properties: Record<string, unknown> };

const flagEmoji = (code?: string | null) =>
  code && /^[A-Za-z]{2}$/.test(code)
    ? code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : '🌐';

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

// snake_case / camelCase -> libellé lisible ("adult_block" -> "Adult block").
const humanizeKey = (k: string) =>
  k.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, (c) => c.toUpperCase());
const fmtVal = (v: unknown): string =>
  typeof v === 'boolean' ? (v ? 'Oui' : 'Non')
    : Array.isArray(v) ? v.map(String).join(', ')
    : v == null ? '—' : String(v);

// Traduit un event SDK brut en phrase FR lisible (zéro jargon) pour le parcours
// utilisateur : on raconte ce que la personne a fait, pas le nom technique de l'event.
function describeEvent(e: SdkEvent): string {
  const p = (e.properties ?? {}) as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
  const money = e.value != null ? ` (${e.value} ${e.currency ?? '€'})` : '';
  switch (e.event) {
    case 'launch': return 'A ouvert l’app';
    case 'screen_view': { const n = s(p.name); return n ? `A vu l’écran « ${n} »` : 'A vu un écran'; }
    case 'paywall_view': { const id = s(p.id); return id ? `A vu le paywall « ${id} »` : 'A vu le paywall'; }
    case 'paywall_purchase': { const id = s(p.id); return `A acheté depuis le paywall${id ? ` « ${id} »` : ''}${money}`; }
    case 'purchase': return `A acheté${money}`;
    case 'subscribe': return `S’est abonné${money}`;
    case 'renewal': return `Abonnement renouvelé${money}`;
    case 'trial_start': return 'A démarré un essai gratuit';
    case 'source': { const ch = s(p.channel); return ch ? `Vient de ${ch}` : 'Source d’acquisition enregistrée'; }
    case 'notification_optin': return s(p.granted) === 'true' ? 'A accepté les notifications' : 'A refusé les notifications';
    case 'user_property': {
      const entry = Object.entries(p).find(([k]) => k !== '_ctx');
      return entry ? `${humanizeKey(entry[0])} : ${fmtVal(entry[1])}` : 'A renseigné une info';
    }
    default: return humanizeKey(e.event);
  }
}

const curSymbol = (cur?: string | null) => (cur === 'USD' ? '$' : cur === 'GBP' ? '£' : '€');
const fmtMoney = (n: number, cur?: string | null) => `${n.toFixed(2)} ${curSymbol(cur)}`;

function CopyRow({ text, id, copied, onCopy }: {
  text: string; id: string; copied: string | null; onCopy: (t: string, id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-background border border-border/40 rounded-lg pl-3 pr-1.5 h-10">
      <code className="text-xs font-mono flex-1 truncate">{text}</code>
      <button onClick={() => onCopy(text, id)} title="Copier"
        className="h-7 w-7 flex items-center justify-center rounded-md border border-border/40 hover:bg-accent shrink-0">
        {copied === id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default function UsersPage() {
  const { selectedApp } = useDashboard();
  const [copied, setCopied] = useState<string | null>(null);

  const [sdkClients, setSdkClients] = useState<SdkClient[]>([]);
  const [sdkKey, setSdkKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<SdkClient | null>(null);
  const [detailEvents, setDetailEvents] = useState<SdkEvent[]>([]);
  const [showSetup, setShowSetup] = useState(false);

  // Real users captured by the Appolyn SDK, scoped to the selected app + the
  // app's SDK key (for the one-line setup snippet shown until data arrives).
  const loadClients = useCallback(async () => {
    if (!selectedApp?.id) { setSdkClients([]); setSdkKey(null); return; }
    const [{ data: clientsData }, { data: appRow }] = await Promise.all([
      db.from('sdk_clients').select('*').eq('app_id', selectedApp.id).order('last_seen', { ascending: false }).limit(200),
      db.from('apps').select('sdk_key').eq('id', selectedApp.id).maybeSingle(),
    ]);
    setSdkClients((clientsData ?? []) as SdkClient[]);
    setSdkKey((appRow?.sdk_key as string) ?? null);
  }, [selectedApp?.id]);
  useEffect(() => { loadClients(); }, [loadClients]);

  // Segmentation : la répartition de TES utilisateurs par propriété qu'ils ont
  // choisie dans ton app (niveau, genre, objectif…). On prend la valeur la plus
  // récente de chaque utilisateur par clé, puis on agrège. 100% réel (SDK), on ne
  // garde que les propriétés catégorielles (peu de valeurs distinctes).
  const [segments, setSegments] = useState<{ key: string; total: number; values: { value: string; count: number }[] }[]>([]);
  // Valeur (formatée) de chaque propriété par utilisateur, pour filtrer la table.
  const [clientProps, setClientProps] = useState<Record<string, Record<string, string>>>({});
  const [filter, setFilter] = useState<{ key: string; value: string } | null>(null);
  useEffect(() => { setFilter(null); }, [selectedApp?.id]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = sdkClients.map((c) => c.id);
      if (ids.length === 0) { setSegments([]); setClientProps({}); return; }
      const { data } = await db.from('sdk_events').select('client_id, properties').in('client_id', ids).order('created_at', { ascending: false }).limit(5000);
      if (cancelled) return;
      const rows = (data ?? []) as { client_id: string; properties: Record<string, unknown> | null }[];
      const latest: Record<string, Record<string, unknown>> = {};
      for (const r of rows) {
        if (!r.properties || typeof r.properties !== 'object') continue;
        const cur = latest[r.client_id] ?? (latest[r.client_id] = {});
        for (const [k, v] of Object.entries(r.properties)) {
          if (!(k in cur) && v != null && v !== '') cur[k] = v;
        }
      }
      const counts: Record<string, Record<string, number>> = {};
      for (const cid of Object.keys(latest)) {
        for (const [k, v] of Object.entries(latest[cid])) {
          const vs = fmtVal(v);
          counts[k] = counts[k] ?? {};
          counts[k][vs] = (counts[k][vs] ?? 0) + 1;
        }
      }
      const segs = Object.entries(counts).map(([key, vc]) => {
        const values = Object.entries(vc).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
        const total = values.reduce((s, v) => s + v.count, 0);
        return { key, total, values };
      }).filter((s) => s.values.length >= 1 && s.values.length <= 12).sort((a, b) => b.total - a.total);
      setSegments(segs);
      const cpf: Record<string, Record<string, string>> = {};
      for (const cid of Object.keys(latest)) { cpf[cid] = {}; for (const [k, v] of Object.entries(latest[cid])) cpf[cid][k] = fmtVal(v); }
      setClientProps(cpf);
    })();
    return () => { cancelled = true; };
  }, [sdkClients]);

  // Croisement propriété × revenu : pour chaque choix collecté dans l'app, le
  // revenu moyen par utilisateur (ARPU) et le taux de payants. Répond à « est-ce
  // que mes "Engagé" paient plus ? ». 100% réel : revenu SDK × propriété SDK.
  const domCur = useMemo(() => {
    const c: Record<string, number> = {};
    for (const x of sdkClients) if (x.currency) c[x.currency] = (c[x.currency] ?? 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'EUR';
  }, [sdkClients]);
  const totalRevenue = useMemo(() => sdkClients.reduce((s, c) => s + (Number(c.total_revenue) || 0), 0), [sdkClients]);
  const overallArpu = sdkClients.length ? totalRevenue / sdkClients.length : 0;
  const incomeByProp = useMemo(() => {
    type Cell = { value: string; users: number; payers: number; revenue: number };
    const byKey: Record<string, Record<string, Cell>> = {};
    for (const c of sdkClients) {
      const props = clientProps[c.id];
      if (!props) continue;
      const rev = Number(c.total_revenue) || 0;
      const paid = !!c.has_purchased || rev > 0;
      for (const [k, v] of Object.entries(props)) {
        const bucket = (byKey[k] ??= {});
        const cell = bucket[v] ?? (bucket[v] = { value: v, users: 0, payers: 0, revenue: 0 });
        cell.users += 1; if (paid) cell.payers += 1; cell.revenue += rev;
      }
    }
    return Object.entries(byKey).map(([key, cells]) => {
      const values = Object.values(cells)
        .map((c) => ({ ...c, arpu: c.users ? c.revenue / c.users : 0, payRate: c.users ? c.payers / c.users : 0 }))
        .sort((a, b) => b.arpu - a.arpu);
      const payers = values.reduce((s, v) => s + v.payers, 0);
      return { key, values, payers, maxArpu: values[0]?.arpu ?? 0 };
    }).filter((g) => g.values.length >= 2 && g.values.length <= 12 && g.payers >= 1)
      .sort((a, b) => b.payers - a.payers);
  }, [sdkClients, clientProps]);
  // Le segment le plus rentable (≥2 utilisateurs, nettement au-dessus de la moyenne).
  const topInsight = useMemo(() => {
    let best: { key: string; value: string; arpu: number } | null = null;
    for (const g of incomeByProp) for (const v of g.values) {
      if (v.users >= 2 && (!best || v.arpu > best.arpu)) best = { key: g.key, value: v.value, arpu: v.arpu };
    }
    return best && overallArpu > 0 && best.arpu > overallArpu * 1.2 ? best : null;
  }, [incomeByProp, overallArpu]);

  // Revenu par SOURCE d'acquisition : quel canal ramène les utilisateurs qui
  // paient. La source vit directement sur sdk_clients (attributed_source), pas
  // dans les properties. 100% réel : revenu SDK × source SDK.
  const incomeBySource = useMemo(() => {
    const m: Record<string, { users: number; payers: number; revenue: number }> = {};
    for (const c of sdkClients) {
      const src = (c.attributed_source && c.attributed_source.trim()) || 'Organique';
      const rev = Number(c.total_revenue) || 0;
      const paid = !!c.has_purchased || rev > 0;
      const cell = (m[src] ??= { users: 0, payers: 0, revenue: 0 });
      cell.users += 1; if (paid) cell.payers += 1; cell.revenue += rev;
    }
    const rows = Object.entries(m).map(([source, v]) => ({
      source, ...v, arpu: v.users ? v.revenue / v.users : 0, payRate: v.users ? v.payers / v.users : 0,
    })).sort((a, b) => b.arpu - a.arpu);
    return { rows, maxArpu: rows[0]?.arpu ?? 0, payers: rows.reduce((s, x) => s + x.payers, 0) };
  }, [sdkClients]);

  const keyForSnippet = sdkKey ?? 'appolyn_live_xxxxxxxx';
  const snippet = `Appolyn.start(key: "${keyForSnippet}")`;

  // Download the SDK with THIS app's key already baked into its setup comment, so
  // the dev just hands the file to their AI (or drops it in Xcode) and is done.
  const downloadSdk = async () => {
    try {
      const res = await fetch('/sdk/Appolyn.swift');
      let text = await res.text();
      if (sdkKey) text = text.split('appolyn_live_xxxxxxxx').join(sdkKey);
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'Appolyn.swift';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.location.href = '/sdk/Appolyn.swift';
    }
  };

  const openDetail = async (c: SdkClient) => {
    setDetail(c);
    setDetailEvents([]);
    const { data } = await db.from('sdk_events').select('event, value, currency, created_at, properties').eq('client_id', c.id).order('created_at', { ascending: false }).limit(50);
    setDetailEvents((data ?? []) as SdkEvent[]);
  };

  const copy = (url: string, id: string) => {
    navigator.clipboard?.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  };

  // Profil personnalisé : tout ce que CE dev a collecté dans SON app remonte via
  // les `properties` des events SDK (genre, lunettes, objectif, niveau, série…).
  // 100% dynamique : on n'affiche que ce qui existe vraiment, jamais de champ inventé.
  // Events triés du + récent au + ancien -> la 1re valeur vue par clé = la + récente.
  const userProps = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const e of detailEvents) {
      if (e.properties && typeof e.properties === 'object') {
        for (const [k, v] of Object.entries(e.properties)) {
          if (!(k in out) && v != null && v !== '') out[k] = v;
        }
      }
    }
    return out;
  }, [detailEvents]);
  const propEntries = Object.entries(userProps);

  // Table filtrée par segment cliqué (ex : niveau = Engagé).
  const displayed = filter ? sdkClients.filter((c) => clientProps[c.id]?.[filter.key] === filter.value) : sdkClients;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">Les vrais utilisateurs de ton app : qui installe, depuis où, ce qu&apos;ils paient, et leurs choix dans ton app.</p>
        </div>
        <button onClick={() => setShowSetup(true)}
          className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity shrink-0">
          <Download className="h-4 w-4" /> Connecter mes utilisateurs
        </button>
      </div>

      {/* Segmentation : répartition par propriété collectée dans l'app */}
      {segments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-3 inline-flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" /> Répartition de tes utilisateurs <span className="text-muted-foreground font-normal">· d&apos;après ce que ton app collecte</span></h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((s) => (
              <div key={s.key} className="bg-card border border-border/40 rounded-xl p-4">
                <p className="text-xs font-medium mb-2.5">{humanizeKey(s.key)} <span className="text-muted-foreground font-normal">· {s.total}</span></p>
                <div className="space-y-2">
                  {s.values.slice(0, 6).map((v) => {
                    const pct = Math.round((v.count / s.total) * 100);
                    const active = filter?.key === s.key && filter?.value === v.value;
                    return (
                      <button key={v.value} type="button"
                        onClick={() => setFilter(active ? null : { key: s.key, value: v.value })}
                        title={active ? 'Retirer le filtre' : `Filtrer : ${humanizeKey(s.key)} = ${v.value}`}
                        className={`w-full text-left rounded-md px-1.5 py-1 -mx-1.5 transition-colors ${active ? 'bg-primary/10' : 'hover:bg-accent/50'}`}>
                        <div className="flex items-center justify-between text-xs mb-0.5 gap-2">
                          <span className={`truncate ${active ? 'text-primary font-medium' : ''}`}>{v.value}</span>
                          <span className="text-muted-foreground tabular-nums shrink-0">{pct}% · {v.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-accent overflow-hidden">
                          <div className={`h-full rounded-full ${active ? 'bg-primary' : 'bg-primary/60'}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                        </div>
                      </button>
                    );
                  })}
                  {s.values.length > 6 && <p className="text-[11px] text-muted-foreground">+{s.values.length - 6} autres valeurs</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Croisement propriété × revenu : qui paie le plus, par choix dans l'app */}
      {incomeByProp.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-3 inline-flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /> Revenu par profil <span className="text-muted-foreground font-normal">· qui paie le plus, selon les choix dans ton app</span></h2>
          {topInsight && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 mb-4 flex items-start gap-2.5">
              <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm">Tes utilisateurs « {topInsight.value} » ({humanizeKey(topInsight.key)}) rapportent <strong>{fmtMoney(topInsight.arpu, domCur)}</strong> en moyenne, soit <strong>{(topInsight.arpu / overallArpu).toFixed(1)}×</strong> la moyenne de l&apos;app. C&apos;est ton segment le plus rentable, donne-lui la priorité.</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomeByProp.map((g) => (
              <div key={g.key} className="bg-card border border-border/40 rounded-xl p-4">
                <p className="text-xs font-medium mb-2.5">{humanizeKey(g.key)} <span className="text-muted-foreground font-normal">· revenu moyen / utilisateur</span></p>
                <div className="space-y-2.5">
                  {g.values.slice(0, 6).map((v) => {
                    const pct = g.maxArpu ? Math.round((v.arpu / g.maxArpu) * 100) : 0;
                    const active = filter?.key === g.key && filter?.value === v.value;
                    return (
                      <button key={v.value} type="button"
                        onClick={() => setFilter(active ? null : { key: g.key, value: v.value })}
                        title={active ? 'Retirer le filtre' : `Filtrer : ${humanizeKey(g.key)} = ${v.value}`}
                        className={`w-full text-left rounded-md px-1.5 py-1 -mx-1.5 transition-colors ${active ? 'bg-primary/10' : 'hover:bg-accent/50'}`}>
                        <div className="flex items-center justify-between text-xs mb-0.5 gap-2">
                          <span className={`truncate ${active ? 'text-primary font-medium' : ''}`}>{v.value}</span>
                          <span className="text-foreground font-medium tabular-nums shrink-0">{fmtMoney(v.arpu, domCur)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-accent overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: FUNNEL_COLOR.payers, opacity: active ? 1 : 0.6 }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">{v.users} utilisateur(s) · {Math.round(v.payRate * 100)}% payants</p>
                      </button>
                    );
                  })}
                  {g.values.length > 6 && <p className="text-[11px] text-muted-foreground">+{g.values.length - 6} autres valeurs</p>}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">Revenu moyen par utilisateur (ARPU) = total encaissé ÷ nombre d&apos;utilisateurs ayant ce choix. Clique une valeur pour filtrer la liste ci-dessous.</p>
        </div>
      )}

      {/* Revenu par source d'acquisition : quel canal ramène les payants */}
      {incomeBySource.payers > 0 && incomeBySource.rows.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-3 inline-flex items-center gap-2"><Megaphone className="h-4 w-4 text-muted-foreground" /> Revenu par source d&apos;acquisition <span className="text-muted-foreground font-normal">· quel canal ramène les payants</span></h2>
          <div className="bg-card border border-border/40 rounded-xl p-4">
            <div className="space-y-3">
              {incomeBySource.rows.slice(0, 8).map((r) => {
                const pct = incomeBySource.maxArpu ? Math.round((r.arpu / incomeBySource.maxArpu) * 100) : 0;
                return (
                  <div key={r.source}>
                    <div className="flex items-center justify-between text-xs mb-1 gap-2">
                      <span className="truncate font-medium">{r.source}</span>
                      <span className="tabular-nums shrink-0">{fmtMoney(r.arpu, domCur)} <span className="text-muted-foreground font-normal">/ utilisateur</span></span>
                    </div>
                    <div className="h-1.5 rounded-full bg-accent overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: FUNNEL_COLOR.payers }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">{r.users} utilisateur(s) · {Math.round(r.payRate * 100)}% payants · {r.revenue.toFixed(2)} {curSymbol(domCur)} encaissés</p>
                  </div>
                );
              })}
            </div>
            {incomeBySource.rows.length > 8 && <p className="text-[11px] text-muted-foreground mt-3">+{incomeBySource.rows.length - 8} autres sources</p>}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">Source détectée automatiquement (Apple Search Ads + la question d&apos;où viens-tu de ton onboarding). Le vert = revenu, comme l&apos;étape « Payants » de ton entonnoir.</p>
        </div>
      )}

      {/* Users table — the whole page, basically */}
      <div className="bg-card border border-border/40 card-pop rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <h2 className="text-sm font-medium truncate">Utilisateurs{selectedApp?.name ? ` · ${selectedApp.name}` : ''}</h2>
            {filter && (
              <button onClick={() => setFilter(null)} title="Retirer le filtre"
                className="inline-flex items-center gap-1.5 text-[11px] rounded-full bg-primary/10 text-primary px-2 py-0.5 hover:bg-primary/20 transition-colors shrink-0">
                {humanizeKey(filter.key)} : {filter.value} <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{filter ? `${displayed.length} / ${sdkClients.length}` : sdkClients.length}</span>
        </div>
        {sdkClients.length > 0 && (
          <div className="grid items-center gap-4 px-5 py-2.5 border-b border-border/40 text-xs font-medium text-muted-foreground uppercase tracking-wide overflow-x-auto"
            style={{ gridTemplateColumns: '1.1fr 1.2fr 0.7fr 1fr 0.8fr 0.8fr 0.9fr' }}>
            <span>Utilisateur</span><span>Appareil</span><span>Pays</span><span>Source</span><span>Confiance</span><span>Revenu</span><span>Installé</span>
          </div>
        )}
        {sdkClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-12 h-12 rounded-2xl border border-border/40 flex items-center justify-center mb-3"><Users className="h-5 w-5 text-muted-foreground" /></div>
            <h3 className="text-sm font-medium mb-1">Aucun utilisateur pour l&apos;instant</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">Branche le SDK et chaque installation, achat, source et choix de tes utilisateurs apparaît ici, tout seul.</p>
            <div className="w-full max-w-sm mb-4"><SdkStatusBanner appId={selectedApp?.id} /></div>
            <button onClick={() => setShowSetup(true)}
              className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
              Brancher le SDK
            </button>
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Aucun utilisateur pour ce filtre.{' '}
            <button onClick={() => setFilter(null)} className="text-primary hover:underline">Retirer le filtre</button>
          </div>
        ) : (
          displayed.map((c) => (
            <button key={c.id} onClick={() => openDetail(c)}
              className="w-full text-left grid items-center gap-4 px-5 py-3 border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors"
              style={{ gridTemplateColumns: '1.1fr 1.2fr 0.7fr 1fr 0.8fr 0.8fr 0.9fr' }}>
              <span className="text-sm font-mono truncate">{c.idfv.slice(0, 8).toUpperCase()}{c.has_purchased && <span style={{ color: FUNNEL_COLOR.payers }}> ★</span>}</span>
              <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5 truncate"><Smartphone className="h-3.5 w-3.5 shrink-0" />{c.device_model ?? c.platform ?? '—'}</span>
              <span className="text-sm text-muted-foreground"><span aria-hidden>{flagEmoji(c.ip_country ?? c.region)}</span> {c.ip_country ?? c.region ?? '—'}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-foreground w-fit truncate">{c.attributed_source ?? 'Organic'}</span>
              <span className="text-sm text-muted-foreground">{c.confidence != null ? `${Math.round(Number(c.confidence) * 100)}%` : '—'}</span>
              <span className="text-sm tabular-nums">{Number(c.total_revenue) > 0 ? `${Number(c.total_revenue).toFixed(2)} ${c.currency ?? '€'}` : '—'}</span>
              <span className="text-sm text-muted-foreground">{timeAgo(c.install_date ?? c.first_seen)}</span>
            </button>
          ))
        )}
      </div>

      {/* Setup modal — one file, that's it */}
      {/* Pop-up SDK partagée (package SPM + statut « branché ? »), cohérente partout. */}
      <SdkModal open={showSetup} onClose={() => setShowSetup(false)} />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-auto rounded-2xl bg-background border border-border shadow-2xl scrollbar-macos">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 sticky top-0 bg-background z-10">
              <div className="flex items-center gap-2">
                <span className="text-base" aria-hidden>{flagEmoji(detail.region)}</span>
                <h3 className="text-sm font-semibold font-mono">{detail.idfv.slice(0, 8).toUpperCase()}</h3>
                {detail.has_purchased && <span className="text-[10px] rounded px-1.5 py-0.5" style={{ backgroundColor: 'rgba(22,163,74,0.12)', color: FUNNEL_COLOR.payers }}>utilisateur payant</span>}
              </div>
              <button onClick={() => setDetail(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-5">
              {/* Profil : ce que TON app a collecté (dynamique, propre à chaque app) */}
              <div>
                <p className="text-xs font-medium mb-2">Profil <span className="text-muted-foreground font-normal">· ce que ton app a collecté</span></p>
                {propEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune donnée perso encore. Dès que ton app envoie les choix de tes utilisateurs (genre, objectif, niveau…), ils apparaissent ici, propres à ton app. Ton IA s&apos;en occupe avec le SDK.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/40 bg-accent/20 p-3">
                    {propEntries.map(([k, v]) => (
                      <div key={k} className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">{humanizeKey(k)}</p>
                        <p className="text-sm font-medium truncate" title={fmtVal(v)}>{fmtVal(v)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {([
                  ['Source', detail.attributed_source ?? 'Direct'],
                  ['Confiance', detail.confidence != null ? `${Math.round(Number(detail.confidence) * 100)} %` : '—'],
                  ['Revenu', Number(detail.total_revenue) > 0 ? `${Number(detail.total_revenue).toFixed(2)} ${detail.currency ?? '€'}` : '0'],
                  ['Achats', String(detail.purchases ?? 0)],
                  ['Appareil', detail.device_model ?? '—'],
                  ['Type', detail.device_class ?? detail.platform ?? '—'],
                  ['OS', `${detail.os_name ?? 'iOS'} ${detail.os_version ?? ''}`.trim()],
                  ['Version app', detail.app_version ?? '—'],
                  ['Pays', detail.ip_country ?? detail.region ?? '—'],
                  ['Ville', detail.ip_city ?? '—'],
                  ['Langue', detail.language ?? '—'],
                  ['Fuseau', detail.timezone ?? '—'],
                  ['Écran', detail.screen_w && detail.screen_h ? `${detail.screen_w}×${detail.screen_h}` : '—'],
                  ['Installé', detail.install_date ? new Date(detail.install_date).toLocaleString('fr-FR') : '—'],
                  ['Vu en dernier', new Date(detail.last_seen).toLocaleString('fr-FR')],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">{k}</p>
                    <p className="text-sm font-medium truncate" title={v}>{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium mb-2">Historique ({detailEvents.length})</p>
                <div className="space-y-1.5">
                  {detailEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun event.</p>
                  ) : detailEvents.map((e, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-xs border-b border-border/20 pb-1.5 last:border-0">
                      <span className="font-medium">{describeEvent(e)}</span>
                      <span className="text-muted-foreground shrink-0">{new Date(e.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
