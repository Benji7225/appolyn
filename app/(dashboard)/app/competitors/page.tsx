'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { getCache, setCache } from '@/lib/cache';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { MetricRing } from '@/components/dashboard/metric-ring';
import { Swords, Plus, RefreshCw, Star, Heart, ArrowUpRight, Search, X, ChevronDown, Sparkles, Target, Lightbulb, Check } from 'lucide-react';

// New tables aren't in the generated Database types yet; use an untyped view.
const db = supabase as unknown as { from: (t: string) => any };

const SEARCH_COUNTRY = 'us'; // default store for the name search

// App Store countries offered in the detail view (to see the localized listing).
const COUNTRIES: { code: string; name: string }[] = [
  { code: 'us', name: 'États-Unis' }, { code: 'fr', name: 'France' }, { code: 'gb', name: 'Royaume-Uni' },
  { code: 'de', name: 'Allemagne' }, { code: 'es', name: 'Espagne' }, { code: 'it', name: 'Italie' },
  { code: 'ca', name: 'Canada' }, { code: 'br', name: 'Brésil' }, { code: 'mx', name: 'Mexique' },
  { code: 'jp', name: 'Japon' }, { code: 'kr', name: 'Corée du Sud' }, { code: 'cn', name: 'Chine' },
  { code: 'nl', name: 'Pays-Bas' }, { code: 'se', name: 'Suède' }, { code: 'au', name: 'Australie' },
];
// French names for every storefront the geo heatmap can return.
const COUNTRY_NAMES: Record<string, string> = {
  us: 'États-Unis', gb: 'Royaume-Uni', ca: 'Canada', au: 'Australie', ie: 'Irlande',
  fr: 'France', de: 'Allemagne', es: 'Espagne', it: 'Italie', nl: 'Pays-Bas', be: 'Belgique',
  ch: 'Suisse', at: 'Autriche', pt: 'Portugal', se: 'Suède', no: 'Norvège', dk: 'Danemark',
  fi: 'Finlande', pl: 'Pologne', cz: 'Tchéquie', gr: 'Grèce', ro: 'Roumanie', hu: 'Hongrie',
  br: 'Brésil', mx: 'Mexique', ar: 'Argentine', jp: 'Japon', kr: 'Corée du Sud', cn: 'Chine',
  hk: 'Hong Kong', tw: 'Taïwan', sg: 'Singapour', in: 'Inde', id: 'Indonésie', th: 'Thaïlande',
  vn: 'Vietnam', tr: 'Turquie', ae: 'Émirats', sa: 'Arabie saoudite', za: 'Afrique du Sud',
  ru: 'Russie', ua: 'Ukraine',
};
const countryName = (code: string) => COUNTRY_NAMES[code] ?? COUNTRIES.find((c) => c.code === code)?.name ?? code.toUpperCase();
const flagEmoji = (code: string) =>
  /^[A-Za-z]{2}$/.test(code) ? code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : '🏳️';

// App Store language code (ISO-639-1, from iTunes) -> a representative storefront
// country, so we can show only the markets where the app is actually localized.
const LANG_TO_COUNTRY: Record<string, string> = {
  EN: 'us', FR: 'fr', DE: 'de', ES: 'es', IT: 'it', PT: 'br', NL: 'nl', SV: 'se', DA: 'dk', FI: 'fi',
  NB: 'no', NO: 'no', PL: 'pl', RU: 'ru', TR: 'tr', AR: 'sa', JA: 'jp', KO: 'kr', ZH: 'cn', HI: 'in',
  TH: 'th', VI: 'vn', ID: 'id', MS: 'my', HE: 'il', EL: 'gr', CS: 'cz', HU: 'hu', RO: 'ro', UK: 'ua',
  CA: 'es', HR: 'hr', SK: 'sk',
};
const langToCountry = (lang: string) => LANG_TO_COUNTRY[lang.toUpperCase().split('-')[0]] ?? '';
// Distinct, relevant storefronts derived from the app's localizations.
const relevantCountries = (languages: string[], current: string): string[] => {
  const set = new Set<string>();
  set.add(current);
  for (const l of languages) { const cc = langToCountry(l); if (cc) set.add(cc); }
  if (set.size === 0) set.add('us');
  return Array.from(set);
};
const fmtCompact = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return String(Math.round(n));
};

type Snap = {
  id: string; competitor_id: string; captured_at: string; title: string | null;
  price: number | null; currency: string | null; average_rating: number | null;
  rating_count: number | null; version: string | null; icon_url: string | null; screenshot_count: number | null;
};
type Competitor = { id: string; itunes_id: string; country: string; name: string | null };
type ITunesResult = {
  itunesId: string; title: string; sellerName: string; genre: string; price: number; currency: string;
  averageRating: number | null; ratingCount: number | null; version: string; iconUrl: string; screenshotCount: number; url: string;
};
type DetailResult = ITunesResult & {
  description: string; releaseNotes: string; releaseDate: string | null; currentVersionReleaseDate: string | null;
  fileSizeBytes: number | null; minimumOsVersion: string; contentRating: string; formattedPrice: string;
  genres: string[]; languages: string[]; screenshots: string[]; ipadScreenshots: string[]; artworkUrl: string;
};
type CompReview = { id: string; author: string; rating: number; title: string; body: string; updated: string };
type RankedKw = { term: string; rank: number | null; difficulty: number; popularity: number };
type GeoCountry = { code: string; ratingCount: number; rating: number | null };

function fmtPrice(p: number | null, cur: string | null) {
  if (p == null) return '—';
  if (p === 0) return 'Gratuit';
  return `${p} ${cur ?? ''}`.trim();
}

// Notable changes between the two latest snapshots.
function changes(cur: Snap, prev?: Snap): string[] {
  if (!prev) return [];
  const out: string[] = [];
  if ((cur.title ?? '') !== (prev.title ?? '')) out.push(`Titre : « ${prev.title} » → « ${cur.title} »`);
  if ((cur.price ?? 0) !== (prev.price ?? 0)) out.push(`Prix : ${fmtPrice(prev.price, prev.currency)} → ${fmtPrice(cur.price, cur.currency)}`);
  if ((cur.version ?? '') !== (prev.version ?? '')) out.push(`Version : ${prev.version} → ${cur.version}`);
  if ((cur.screenshot_count ?? 0) !== (prev.screenshot_count ?? 0)) out.push(`Captures : ${prev.screenshot_count} → ${cur.screenshot_count}`);
  const dr = (cur.rating_count ?? 0) - (prev.rating_count ?? 0);
  if (dr) out.push(`Avis : ${dr > 0 ? '+' : ''}${dr}`);
  return out;
}

type Cached = { competitors: Competitor[]; snaps: Record<string, Snap[]> };

export default function CompetitorsPage() {
  const { selectedApp } = useDashboard();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [snaps, setSnaps] = useState<Record<string, Snap[]>>({});
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ITunesResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Detail sheet
  const [detailFor, setDetailFor] = useState<Competitor | null>(null);
  const [detailCountry, setDetailCountry] = useState('us');
  const [detail, setDetail] = useState<DetailResult | null>(null);
  const [detailReviews, setDetailReviews] = useState<CompReview[]>([]);
  const [detailKeywords, setDetailKeywords] = useState<RankedKw[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailGeo, setDetailGeo] = useState<GeoCountry[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (!selectedApp?.id) { setCompetitors([]); setSnaps({}); setLoaded(true); return; }
    const cached = getCache<Cached>(`competitors:list:${selectedApp.id}`);
    if (cached) { setCompetitors(cached.competitors); setSnaps(cached.snaps); setLoaded(true); }
    else { setCompetitors([]); setSnaps({}); }
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp?.id]);

  // Live search as you type (debounced). A URL/id resolves to one result, a name
  // searches the store. Click "+" to add. No search button, no country picker.
  useEffect(() => {
    const v = input.trim();
    if (!v) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(() => { runSearch(v); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const authHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' };
  };

  const STALE_MS = 6 * 60 * 60 * 1000;

  const load = async (autoRefresh = false) => {
    if (!selectedApp?.id) { setCompetitors([]); setSnaps({}); setLoaded(true); return; }
    // Concurrents SPÉCIFIQUES à l'app sélectionnée (chaque app a ses concurrents).
    const { data: comps } = await db.from('competitors').select('*').eq('app_id', selectedApp.id).order('created_at', { ascending: true });
    const list = (comps ?? []) as Competitor[];
    const ids = list.map((c) => c.id);
    const { data: ss } = ids.length
      ? await db.from('competitor_snapshots').select('*').in('competitor_id', ids).order('captured_at', { ascending: false })
      : { data: [] as Snap[] };
    const grouped: Record<string, Snap[]> = {};
    for (const s of (ss ?? []) as Snap[]) (grouped[s.competitor_id] ??= []).push(s);
    setCompetitors(list); setSnaps(grouped); setLoaded(true);
    setCache<Cached>(`competitors:list:${selectedApp.id}`, { competitors: list, snaps: grouped });
    if (autoRefresh && list.length > 0) {
      let newest = 0;
      for (const c of list) { const t = grouped[c.id]?.[0]?.captured_at; if (t) newest = Math.max(newest, new Date(t).getTime()); }
      const anyMissing = list.some((c) => !(grouped[c.id]?.length));
      if (anyMissing || Date.now() - newest > STALE_MS) refreshAll();
    }
  };

  const lookup = async (idOrUrl: string, country: string): Promise<ITunesResult | null> => {
    const r = await fetch(`/api/itunes?action=lookup&id=${encodeURIComponent(idOrUrl)}&country=${country}`, { headers: await authHeader() });
    const j = await r.json();
    if (j.error) { setError(j.error); return null; }
    return j.result as ITunesResult;
  };

  const captureSnapshot = async (competitorId: string, res: ITunesResult) => {
    const { data: { user } } = await supabase.auth.getUser();
    await db.from('competitor_snapshots').insert({
      competitor_id: competitorId, user_id: user?.id,
      title: res.title, price: res.price, currency: res.currency,
      average_rating: res.averageRating, rating_count: res.ratingCount,
      version: res.version, icon_url: res.iconUrl, screenshot_count: res.screenshotCount,
    });
  };

  const addByResult = async (res: ITunesResult) => {
    setError(''); setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: inserted, error: insErr } = await db.from('competitors')
        .insert({ user_id: user?.id, app_id: selectedApp?.id, itunes_id: res.itunesId, country: SEARCH_COUNTRY, name: res.title })
        .select().single();
      if (insErr) { setError(insErr.message.includes('duplicate') ? 'Ce concurrent est déjà suivi pour cette app.' : insErr.message); setBusy(false); return; }
      await captureSnapshot(inserted.id, res);
      setInput(''); setResults([]);
      await load();
    } catch { setError('Ajout impossible.'); }
    setBusy(false);
  };

  const runSearch = async (v: string) => {
    setError('');
    try {
      if (/id\d{6,}/.test(v) || /^\d{6,}$/.test(v) || v.includes('apps.apple.com')) {
        const res = await lookup(v, SEARCH_COUNTRY);
        setResults(res ? [res] : []);
      } else {
        const r = await fetch(`/api/itunes?action=search&term=${encodeURIComponent(v)}&country=${SEARCH_COUNTRY}`, { headers: await authHeader() });
        const j = await r.json();
        if (j.error) { setError(j.error); setResults([]); }
        else setResults((j.results ?? []) as ITunesResult[]);
      }
    } catch { setError('Recherche impossible.'); }
    setSearching(false);
  };

  const refreshAll = async () => {
    setRefreshing(true); setError('');
    for (const c of competitors) {
      const res = await lookup(c.itunes_id, c.country);
      if (res) await captureSnapshot(c.id, res);
    }
    await load(false);
    setRefreshing(false);
  };

  const remove = async (id: string) => {
    await db.from('competitors').delete().eq('id', id);
    await load();
  };

  const loadDetail = async (c: Competitor, country: string) => {
    setDetailCountry(country); setDetailError('');
    // Detail (localized) cached per app+country so re-opening is instant.
    const key = `compdetail:${c.itunes_id}:${country}`;
    const cached = getCache<{ detail: DetailResult; reviews: CompReview[]; keywords: RankedKw[] }>(key);
    if (cached) {
      setDetail(cached.detail); setDetailReviews(cached.reviews); setDetailKeywords(cached.keywords); setDetailLoading(false);
    } else {
      setDetail(null); setDetailReviews([]); setDetailKeywords([]); setDetailLoading(true);
      try {
        const r = await fetch(`/api/itunes?action=detail&id=${encodeURIComponent(c.itunes_id)}&country=${country}`, { headers: await authHeader() });
        const j = await r.json();
        if (j.error) setDetailError(j.error);
        else {
          const payload = { detail: j.result as DetailResult, reviews: (j.reviews ?? []) as CompReview[], keywords: (j.rankedKeywords ?? []) as RankedKw[] };
          setDetail(payload.detail); setDetailReviews(payload.reviews); setDetailKeywords(payload.keywords);
          setCache(key, payload);
        }
      } catch { setDetailError('Chargement de la fiche impossible.'); }
      setDetailLoading(false);
    }
  };
  // Per-country popularity (rating volume). Depends only on the app id, not the
  // localized country, so it's loaded once per app and cached.
  const loadGeo = async (itunesId: string) => {
    const key = `compgeo:${itunesId}`;
    const cached = getCache<GeoCountry[]>(key);
    if (cached) { setDetailGeo(cached); setGeoLoading(false); return; }
    setDetailGeo([]); setGeoLoading(true);
    try {
      const r = await fetch(`/api/itunes?action=geo&id=${encodeURIComponent(itunesId)}`, { headers: await authHeader() });
      const j = await r.json();
      const arr = (j.countries ?? []) as GeoCountry[];
      setDetailGeo(arr); setCache(key, arr);
    } catch { setDetailGeo([]); }
    setGeoLoading(false);
  };

  const openDetail = (c: Competitor) => { setDetailFor(c); loadDetail(c, c.country); loadGeo(c.itunes_id); };

  const showEmpty = loaded && competitors.length === 0 && results.length === 0;

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Concurrents"
        description="Suis autant d'apps concurrentes que tu veux. Données réelles de l'App Store, mises à jour automatiquement, changements détectés tout seuls."
        actions={refreshing && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Mise à jour...
          </span>
        )}
      />

      <AddBar input={input} setInput={setInput} searching={searching} />
      {error && <p className="text-xs text-destructive mt-3">{error}</p>}
      <SearchResults results={results} onPick={addByResult} busy={busy} />

      {showEmpty ? (
        <div className="mt-6">
          <EmptyState
            icon={Swords}
            title="Ajoute ton premier concurrent"
            description="Tape le nom d'une app concurrente (ou colle son lien App Store) : la recherche se fait toute seule. Clique le + pour la suivre. Appolyn prend un instantané réel et détecte les changements."
          />
        </div>
      ) : (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map((c) => {
            const list = snaps[c.id] ?? [];
            const cur = list[0];
            const diff = cur ? changes(cur, list[1]) : [];
            return (
              <div
                key={c.id}
                onClick={() => openDetail(c)}
                className="group relative cursor-pointer rounded-xl border border-border/50 bg-card card-pop p-4 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); remove(c.id); }}
                  className="absolute top-3 right-3 transition-colors"
                  title="Retirer de mes concurrents"
                >
                  <Heart className="h-4 w-4 fill-rose-500 text-rose-500 hover:fill-rose-400" />
                </button>

                <div className="flex items-center gap-3 pr-7">
                  {cur?.icon_url
                    ? <Image src={cur.icon_url} alt="" width={52} height={52} className="rounded-2xl shrink-0" />
                    : <div className="w-[52px] h-[52px] rounded-2xl bg-accent shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{cur?.title ?? c.name ?? c.itunes_id}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{cur?.average_rating != null ? cur.average_rating.toFixed(2) : '—'}</span>
                        <span className="text-muted-foreground">({(cur?.rating_count ?? 0).toLocaleString('fr-FR')})</span>
                      </span>
                      {diff.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {diff.length} chgt
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailFor && (
        <CompetitorDetail
          competitor={detailFor}
          detail={detail}
          reviews={detailReviews}
          keywords={detailKeywords}
          geo={detailGeo}
          geoLoading={geoLoading}
          loading={detailLoading}
          error={detailError}
          country={detailCountry}
          onCountry={(code) => loadDetail(detailFor, code)}
          onClose={() => setDetailFor(null)}
        />
      )}
    </div>
  );
}

function AddBar({ input, setInput, searching }: { input: string; setInput: (v: string) => void; searching: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 h-10 w-full">
      {searching ? <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" /> : <Search className="h-4 w-4 text-muted-foreground shrink-0" />}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Tape un nom d'app, un lien App Store ou un identifiant..."
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

function SearchResults({ results, onPick, busy }: { results: ITunesResult[]; onPick: (r: ITunesResult) => void; busy: boolean }) {
  if (results.length === 0) return null;
  return (
    <div className="mt-4 rounded-xl border border-border/50 bg-card divide-y divide-border/40">
      {results.map((res) => (
        <button key={res.itunesId} onClick={() => onPick(res)} disabled={busy}
          className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/40 transition-colors disabled:opacity-50">
          {res.iconUrl && <Image src={res.iconUrl} alt="" width={36} height={36} className="rounded-lg shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{res.title}</p>
            <p className="text-xs text-muted-foreground truncate">{res.sellerName} · {res.genre}</p>
          </div>
          <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      ))}
    </div>
  );
}

function fmtBytes(b: number | null) {
  if (!b) return null;
  const mb = b / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} Go` : `${Math.round(mb)} Mo`;
}
function fmtDate(s: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Collapsible({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-lg border border-border/40">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left">
        <span className="text-sm font-medium">{title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function CompetitorDetail({ competitor, detail, reviews, keywords, geo, geoLoading, loading, error, country, onCountry, onClose }: {
  competitor: Competitor; detail: DetailResult | null; reviews: CompReview[]; keywords: RankedKw[];
  geo: GeoCountry[]; geoLoading: boolean;
  loading: boolean; error: string;
  country: string; onCountry: (code: string) => void; onClose: () => void;
}) {
  const shots = detail ? [...detail.screenshots, ...detail.ipadScreenshots] : [];
  const langs = detail?.languages ?? [];
  const dropdownCountries = detail ? relevantCountries(langs, country) : [country];
  // Rough order-of-magnitude estimates from the rating volume (the only public
  // signal). Revenue uses the price for paid apps, a small per-install value for
  // free apps (IAP figures aren't public). Clearly approximate, not exact.
  const estDl = detail?.ratingCount != null ? detail.ratingCount * 40 : null;
  const estRev = estDl != null && detail ? Math.round(estDl * (detail.price > 0 ? detail.price : 0.2)) : null;
  const shown = keywords.slice(0, 16);
  const kwHalf = Math.ceil(shown.length / 2);
  const kwCols = [shown.slice(0, kwHalf), shown.slice(kwHalf)];

  // Analyse stratégique IA, à la demande (pas à chaque ouverture, pour ne pas
  // dépenser l'IA inutilement). Dépend de la fiche du pays affiché.
  const [teardown, setTeardown] = useState<{ positioning: string; strengths: string[]; keyword_angle: string; differentiation: string[] } | null>(null);
  const [tdLoading, setTdLoading] = useState(false);
  const [tdError, setTdError] = useState('');
  // Sauvegardée par concurrent + pays (cache session) : une fois générée, elle se
  // ré-affiche telle quelle sans relancer l'IA quand tu rouvres le concurrent.
  const tdKey = `teardown:${competitor.itunes_id}:${country}`;
  useEffect(() => { setTdError(''); setTeardown(getCache<{ positioning: string; strengths: string[]; keyword_angle: string; differentiation: string[] }>(tdKey) ?? null); }, [tdKey]);
  const runTeardown = async () => {
    setTdLoading(true); setTdError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/competitor-teardown', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: competitor.itunes_id, country }),
      });
      const j = await r.json() as { teardown?: { positioning: string; strengths: string[]; keyword_angle: string; differentiation: string[] }; error?: string };
      if (j.error || !j.teardown) { setTdError(j.error ?? 'Analyse impossible.'); setTdLoading(false); return; }
      setTeardown(j.teardown);
      setCache(tdKey, j.teardown);
    } catch { setTdError('Analyse impossible (réseau).'); }
    setTdLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl scrollbar-macos">
        <div className="sticky top-0 z-10 flex items-center gap-3 p-5 bg-background/95 backdrop-blur border-b border-border">
          {detail?.artworkUrl
            ? <Image src={detail.artworkUrl} alt="" width={48} height={48} className="rounded-xl shrink-0" />
            : <div className="w-12 h-12 rounded-xl bg-accent shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{detail?.title ?? competitor.name ?? competitor.itunes_id}</p>
            <p className="text-xs text-muted-foreground truncate">{detail?.sellerName ?? ''}{detail?.genre ? ` · ${detail.genre}` : ''}</p>
          </div>
          <select
            value={country}
            onChange={(e) => onCountry(e.target.value)}
            className="text-xs bg-card border border-border/50 rounded-lg px-2 h-8 text-foreground focus:outline-none shrink-0"
            title="Voir la fiche dans une langue publiée"
            onClick={(e) => e.stopPropagation()}
          >
            {dropdownCountries.map((cc) => <option key={cc} value={cc}>{flagEmoji(cc)} {countryName(cc)}</option>)}
          </select>
          <a href={`https://apps.apple.com/${country}/app/id${competitor.itunes_id}`} target="_blank" rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0">
            App Store <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5">
          {loading && <p className="text-sm text-muted-foreground py-8 text-center">Chargement de la fiche ({countryName(country)})...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {detail && (
            <div className="space-y-5">
              {/* Key numbers (revenue/downloads are what you look at first) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Note" value={detail.averageRating != null ? `${detail.averageRating.toFixed(2)}★` : '—'} sub={detail.ratingCount != null ? `${detail.ratingCount.toLocaleString('fr-FR')} avis` : undefined} />
                <Stat label="Téléchargements estimés" value={estDl != null ? `≈ ${fmtCompact(estDl)}` : '—'} sub="environ" />
                <Stat label="Revenus estimés" value={estRev != null ? `≈ ${fmtCompact(estRev)} ${detail.currency || ''}`.trim() : '—'} sub="environ" />
                <Stat label="Langues" value={`${langs.length}`} sub={langs.length ? 'localisé' : undefined} />
              </div>

              {/* Analyse stratégique IA, intégrée à la fiche du concurrent (ex-page Analyse IA) */}
              <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
                <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
                  <h3 className="text-sm font-medium inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Analyse stratégique IA</h3>
                  {!teardown && (
                    <button onClick={runTeardown} disabled={tdLoading}
                      className="inline-flex items-center gap-2 text-xs rounded-lg px-3 h-8 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0">
                      {tdLoading ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analyse…</> : <><Sparkles className="h-3.5 w-3.5" /> Analyser</>}
                    </button>
                  )}
                </div>
                {!teardown && !tdLoading && <p className="text-xs text-muted-foreground">Positionnement, forces, angle ASO et comment te différencier, sur ses vraies données App Store ({countryName(country)}).</p>}
                {tdError && <p className="text-xs text-destructive mt-1">{tdError}</p>}
                {teardown && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <h4 className="text-xs font-medium mb-1.5 inline-flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-muted-foreground" /> Positionnement</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{teardown.positioning}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium mb-1.5 inline-flex items-center gap-1.5"><Swords className="h-3.5 w-3.5 text-muted-foreground" /> Son angle ASO</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{teardown.keyword_angle}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium mb-1.5 inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-muted-foreground" /> Ses forces</h4>
                      <ul className="space-y-1">{teardown.strengths.map((s, i) => <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground"><Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />{s}</li>)}</ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium mb-1.5 inline-flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5 text-muted-foreground" /> Comment te différencier</h4>
                      <ul className="space-y-1">{teardown.differentiation.map((s, i) => <li key={i} className="flex items-start gap-1.5 text-xs"><Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" /><span className="text-foreground">{s}</span></li>)}</ul>
                    </div>
                  </div>
                )}
              </div>

              {shots.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Captures d&apos;écran · {countryName(country)}</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-macos">
                    {shots.slice(0, 12).map((s, i) => (
                      <Image key={i} src={s} alt="" width={150} height={325}
                        className="rounded-xl border border-border/40 shrink-0 h-[325px] w-auto object-contain bg-muted/30" unoptimized />
                    ))}
                  </div>
                </div>
              )}

              {detail.description && (
                <Collapsible title="Description">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{detail.description}</p>
                </Collapsible>
              )}

              <Collapsible title={`Avis récents · ${countryName(country)}`}>
                {reviews.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucun avis public récent pour ce pays.</p>
                ) : (
                  <div className="space-y-2.5">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="rounded-lg border border-border/40 bg-card p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => <Star key={i} className={`h-3 w-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />)}
                          </div>
                          <span className="text-xs font-medium truncate">{rev.title || rev.author}</span>
                          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{rev.author}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{rev.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Collapsible>

              {/* Secondary facts, kept at the bottom */}
              <div className="flex flex-wrap gap-2 text-xs">
                <Pill>Prix : {detail.formattedPrice || (detail.price === 0 ? 'Gratuit' : `${detail.price} ${detail.currency}`)}</Pill>
                <Pill>v{detail.version || '—'}{fmtDate(detail.currentVersionReleaseDate) ? ` · ${fmtDate(detail.currentVersionReleaseDate)}` : ''}</Pill>
                {fmtBytes(detail.fileSizeBytes) && <Pill>{fmtBytes(detail.fileSizeBytes)}</Pill>}
                {detail.minimumOsVersion && <Pill>iOS {detail.minimumOsVersion}+</Pill>}
                {detail.contentRating && <Pill>{detail.contentRating}</Pill>}
                {fmtDate(detail.releaseDate) && <Pill>Sortie : {fmtDate(detail.releaseDate)}</Pill>}
                {detail.genres.slice(0, 3).map((g) => <Pill key={g}>{g}</Pill>)}
              </div>

              {/* Where the competitor ranks: header once, two columns with a divider */}
              <div className="rounded-xl border border-border/40 bg-card p-4">
                <h3 className="text-sm font-medium mb-3">Mots-clés où il se positionne · {countryName(country)}</h3>
                {keywords.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Analyse en cours...</p>
                ) : (
                  <div className="grid sm:grid-cols-2 sm:divide-x divide-border/40">
                    {kwCols.map((col, ci) => (
                      <div key={ci} className={ci === 0 ? 'sm:pr-6' : 'sm:pl-6 mt-4 sm:mt-0'}>
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground pb-1.5 mb-1.5 border-b border-border/40">
                          <span className="flex-1">Mot-clé</span>
                          <span className="w-16 text-center shrink-0">Popularité</span>
                          <span className="w-16 text-center shrink-0">Difficulté</span>
                          <span className="w-12 text-right shrink-0">Rang</span>
                        </div>
                        <div className="space-y-2">
                          {col.map((k) => (
                            <div key={k.term} className="flex items-center gap-2 text-sm">
                              <span className="flex-1 truncate">{k.term}</span>
                              <span className="w-16 flex justify-center shrink-0"><MetricRing score={k.popularity} tone="popularity" diameter={28} /></span>
                              <span className="w-16 flex justify-center shrink-0"><MetricRing score={k.difficulty} tone="difficulty" diameter={28} /></span>
                              <span className={`w-12 text-right tabular-nums font-semibold shrink-0 ${k.rank && k.rank <= 10 ? 'text-emerald-600' : k.rank && k.rank <= 30 ? 'text-amber-600' : 'text-muted-foreground'}`}>{k.rank ? `#${k.rank}` : '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Where it's most popular, coloured by real per-country rating volume */}
              <WorldHeatmap geo={geo} loading={geoLoading} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Heatmap of where the app is most popular, coloured grey -> blue by the real
// per-country rating volume (free signal; not exact download counts).
function WorldHeatmap({ geo, loading }: { geo: GeoCountry[]; loading: boolean }) {
  const top = geo.filter((g) => g.ratingCount > 0).slice(0, 16);
  const max = top[0]?.ratingCount ?? 0;
  const total = geo.reduce((s, g) => s + g.ratingCount, 0);
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4">
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h3 className="text-sm font-medium">Où il est le plus téléchargé</h3>
        {!loading && top[0] && (
          <span className="text-[11px] text-muted-foreground">Marché n°1 : {flagEmoji(top[0].code)} {countryName(top[0].code)}</span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Popularité par pays estimée d&apos;après le volume d&apos;avis sur chaque App Store national (signal réel, gratuit). Ce n&apos;est pas le nombre exact de téléchargements.
      </p>
      {loading ? (
        <p className="text-xs text-muted-foreground py-3">Analyse pays par pays...</p>
      ) : top.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3">Pas assez de signaux publics pour estimer la répartition par pays.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {top.map((g) => {
            const intensity = max > 0 ? g.ratingCount / max : 0;
            const share = total > 0 ? Math.round((g.ratingCount / total) * 100) : 0;
            return (
              <div key={g.code} className="flex items-center gap-2.5">
                <span className="text-base leading-none shrink-0" aria-hidden>{flagEmoji(g.code)}</span>
                <span className="text-xs w-24 shrink-0 truncate">{countryName(g.code)}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(4, intensity * 100)}%`, backgroundColor: `rgba(37, 99, 235, ${(0.3 + intensity * 0.6).toFixed(2)})` }} />
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums w-20 text-right shrink-0">
                  {fmtCompact(g.ratingCount)}{share >= 1 ? ` · ${share}%` : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tracking-tight mt-0.5 truncate">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-border/50 bg-card px-2.5 py-1 text-muted-foreground">{children}</span>;
}
