'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { getCache, setCache } from '@/lib/cache';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { Swords, Plus, RefreshCw, Star, Trash2, ArrowUpRight, Search, X } from 'lucide-react';

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
const countryName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code.toUpperCase();
const flagEmoji = (code: string) =>
  /^[A-Za-z]{2}$/.test(code) ? code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : '🏳️';

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
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    const cached = getCache<Cached>('competitors:list');
    if (cached) { setCompetitors(cached.competitors); setSnaps(cached.snaps); setLoaded(true); }
    load(true);
  }, []);

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
    const { data: comps } = await db.from('competitors').select('*').order('created_at', { ascending: true });
    const list = (comps ?? []) as Competitor[];
    const { data: ss } = await db.from('competitor_snapshots').select('*').order('captured_at', { ascending: false });
    const grouped: Record<string, Snap[]> = {};
    for (const s of (ss ?? []) as Snap[]) (grouped[s.competitor_id] ??= []).push(s);
    setCompetitors(list); setSnaps(grouped); setLoaded(true);
    setCache<Cached>('competitors:list', { competitors: list, snaps: grouped });
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
      if (competitors.length >= 5) { setError('Limite de 5 concurrents atteinte.'); setBusy(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      const { data: inserted, error: insErr } = await db.from('competitors')
        .insert({ user_id: user?.id, itunes_id: res.itunesId, country: SEARCH_COUNTRY, name: res.title })
        .select().single();
      if (insErr) { setError(insErr.message.includes('duplicate') ? 'Ce concurrent est déjà suivi.' : insErr.message); setBusy(false); return; }
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
    setDetailCountry(country); setDetail(null); setDetailReviews([]); setDetailError(''); setDetailLoading(true);
    try {
      const r = await fetch(`/api/itunes?action=detail&id=${encodeURIComponent(c.itunes_id)}&country=${country}`, { headers: await authHeader() });
      const j = await r.json();
      if (j.error) setDetailError(j.error);
      else { setDetail(j.result as DetailResult); setDetailReviews((j.reviews ?? []) as CompReview[]); }
    } catch { setDetailError('Chargement de la fiche impossible.'); }
    setDetailLoading(false);
  };
  const openDetail = (c: Competitor) => { setDetailFor(c); loadDetail(c, c.country); };

  const showEmpty = loaded && competitors.length === 0 && results.length === 0;

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Concurrents"
        description="Suis jusqu'à 5 apps concurrentes. Données réelles de l'App Store, mises à jour automatiquement, changements détectés tout seuls."
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
                  className="absolute top-3 right-3 text-muted-foreground/60 hover:text-destructive transition-colors"
                  title="Retirer ce concurrent"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1.5 mb-3 pr-7">
                  <span className="text-sm leading-none" aria-hidden>{flagEmoji(c.country)}</span>
                  <span className="text-xs text-muted-foreground">{countryName(c.country)}</span>
                  {diff.length > 0 && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {diff.length} chgt
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {cur?.icon_url
                    ? <Image src={cur.icon_url} alt="" width={52} height={52} className="rounded-2xl shrink-0" />
                    : <div className="w-[52px] h-[52px] rounded-2xl bg-accent shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{cur?.title ?? c.name ?? c.itunes_id}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {fmtPrice(cur?.price ?? null, cur?.currency ?? null)} · v{cur?.version ?? '—'} · {cur?.screenshot_count ?? 0} captures
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{cur?.average_rating != null ? cur.average_rating.toFixed(2) : '—'}</span>
                      <span className="text-muted-foreground">({(cur?.rating_count ?? 0).toLocaleString('fr-FR')})</span>
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
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 h-10 max-w-xl">
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
    <div className="mt-4 rounded-xl border border-border/50 bg-card divide-y divide-border/40 max-w-xl">
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

function CompetitorDetail({ competitor, detail, reviews, loading, error, country, onCountry, onClose }: {
  competitor: Competitor; detail: DetailResult | null; reviews: CompReview[]; loading: boolean; error: string;
  country: string; onCountry: (code: string) => void; onClose: () => void;
}) {
  const shots = detail ? [...detail.screenshots, ...detail.ipadScreenshots] : [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl scrollbar-macos">
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
            title="Voir la fiche par pays"
            onClick={(e) => e.stopPropagation()}
          >
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>)}
          </select>
          <a href={`https://apps.apple.com/${country}/app/id${competitor.itunes_id}`} target="_blank" rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0">
            App Store <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-6">
          {loading && <p className="text-sm text-muted-foreground py-8 text-center">Chargement de la fiche ({countryName(country)})...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {detail && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Note" value={detail.averageRating != null ? `${detail.averageRating.toFixed(2)}★` : '—'} sub={detail.ratingCount != null ? `${detail.ratingCount.toLocaleString('fr-FR')} avis` : undefined} />
                <Stat label="Prix" value={detail.formattedPrice || (detail.price === 0 ? 'Gratuit' : `${detail.price} ${detail.currency}`)} />
                <Stat label="Version" value={detail.version || '—'} sub={fmtDate(detail.currentVersionReleaseDate) ?? undefined} />
                <Stat label="Taille" value={fmtBytes(detail.fileSizeBytes) ?? '—'} sub={detail.minimumOsVersion ? `iOS ${detail.minimumOsVersion}+` : undefined} />
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

              {detail.releaseNotes && (
                <div>
                  <h3 className="text-sm font-medium mb-1.5">Nouveautés {fmtDate(detail.currentVersionReleaseDate) ? `· ${fmtDate(detail.currentVersionReleaseDate)}` : ''}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-6">{detail.releaseNotes}</p>
                </div>
              )}

              {detail.description && (
                <div>
                  <h3 className="text-sm font-medium mb-1.5">Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-[12]">{detail.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                {detail.contentRating && <Pill>{detail.contentRating}</Pill>}
                {fmtDate(detail.releaseDate) && <Pill>Sortie : {fmtDate(detail.releaseDate)}</Pill>}
                {detail.genres.slice(0, 3).map((g) => <Pill key={g}>{g}</Pill>)}
                {detail.languages.length > 0 && <Pill>{detail.languages.length} langues</Pill>}
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Avis récents · {countryName(country)}</h3>
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
              </div>

              <p className="text-[11px] text-muted-foreground/70 border-t border-border/40 pt-3">
                Change de pays en haut pour voir la fiche et les captures localisées. Les prix d&apos;abonnement in-app et les comptes pub/réseaux ne sont pas exposés par Apple.
              </p>
            </>
          )}
        </div>
      </div>
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
