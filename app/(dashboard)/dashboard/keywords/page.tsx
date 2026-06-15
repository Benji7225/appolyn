'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trash2, ChevronDown, ChevronUp, Star, ExternalLink, Heart, RefreshCw } from 'lucide-react';
import type { KeywordSearch } from '@/lib/database.types';
import { useDashboard } from '@/lib/app-context';
import { MetricRing } from '@/components/dashboard/metric-ring';
import { getCache, setCache } from '@/lib/cache';
import { computeKeywordMetrics, type KeywordMetrics } from '@/lib/aso';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// competitors table isn't in the generated types yet.
const db = supabase as unknown as { from: (t: string) => any };

const flagEmoji = (code: string) =>
  /^[A-Za-z]{2}$/.test(code) ? code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : '🏳️';

// How many ranking apps we pull per term. Enough to (a) gauge real competitor
// strength, (b) estimate demand, and (c) locate the user's app for its rank.
const RANKED_LIMIT = 50;

const COUNTRIES = [
  { code: 'us', name: 'États-Unis' },
  { code: 'gb', name: 'Royaume-Uni' },
  { code: 'de', name: 'Allemagne' },
  { code: 'fr', name: 'France' },
  { code: 'jp', name: 'Japon' },
  { code: 'au', name: 'Australie' },
  { code: 'ca', name: 'Canada' },
  { code: 'br', name: 'Brésil' },
  { code: 'in', name: 'Inde' },
  { code: 'kr', name: 'Corée du Sud' },
];
const countryNameOf = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code.toUpperCase();

// Tri par colonne (remplace l'ancien menu « trier par »). On clique une colonne :
// 1er clic = sa direction par défaut, 2e = inverse, 3e = retour à « récents ».
type SortCol = 'recent' | 'keyword' | 'popularity' | 'difficulty' | 'rank';
const SORT_DEFAULT_DIR: Record<Exclude<SortCol, 'recent'>, 'asc' | 'desc'> = {
  keyword: 'asc', popularity: 'desc', difficulty: 'asc', rank: 'asc',
};

type ItunesApp = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  trackViewUrl?: string;
  averageUserRating?: number;
  userRatingCount?: number;
};

type ExpandedData = {
  loading: boolean;
  apps: ItunesApp[];
  error?: string;
};

function AppIconSmall({ url, name }: { url: string; name: string }) {
  const [error, setError] = useState(false);
  if (error || !url) {
    return (
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium shrink-0">
        {name.charAt(0)}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name}
      width={28}
      height={28}
      className="w-7 h-7 rounded-lg object-cover shrink-0"
      onError={() => setError(true)}
    />
  );
}

export default function KeywordsPage() {
  const { selectedApp, apps } = useDashboard();
  const [country, setCountry] = useState('us');
  const [query, setQuery] = useState('');
  const [searches, setSearches] = useState<KeywordSearch[]>([]);
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<Record<string, ExpandedData>>({});
  // Real, computed-from-live-data metrics, keyed by search id. We render from
  // these (never from the stored row) so a fake value can never be shown.
  const [metrics, setMetrics] = useState<Record<string, KeywordMetrics>>({});
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [likeMsg, setLikeMsg] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('recent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Clic sur une colonne : applique sa direction par défaut, puis l'inverse, puis revient à « récents ».
  const onSort = (col: Exclude<SortCol, 'recent'>) => {
    if (sortCol !== col) { setSortCol(col); setSortDir(SORT_DEFAULT_DIR[col]); }
    else if (sortDir === SORT_DEFAULT_DIR[col]) { setSortDir(SORT_DEFAULT_DIR[col] === 'asc' ? 'desc' : 'asc'); }
    else { setSortCol('recent'); }
  };

  // The App Store id (== iTunes trackId) of the app a given search belongs to,
  // used to find that app's real position in the results.
  const ascAppIdFor = useCallback(
    (appId: string | null): string | null => {
      if (!appId) return null;
      return apps.find((a) => a.id === appId)?.asc_app_id ?? null;
    },
    [apps],
  );

  // Persist corrected scores so older rows (which held fabricated values) are
  // cleaned in the database too, not just on screen.
  const persistIfChanged = useCallback(async (s: KeywordSearch, m: KeywordMetrics) => {
    if (
      s.popularity_score === m.popularity &&
      s.difficulty_score === m.difficulty &&
      s.app_ranking === m.appRanking
    ) return;
    await supabase
      .from('keyword_searches')
      .update({
        popularity_score: m.popularity,
        difficulty_score: m.difficulty,
        app_ranking: m.appRanking,
      })
      .eq('id', s.id);
  }, []);

  // Fetch the apps that actually rank for a term, compute real metrics from them,
  // and cache both the display list (top apps) and the metrics.
  const loadFor = useCallback(async (s: KeywordSearch) => {
    setExpandedData((prev) => ({ ...prev, [s.id]: { loading: true, apps: prev[s.id]?.apps ?? [] } }));
    try {
      const r = await fetch(
        `${SUPABASE_URL}/functions/v1/itunes-search?term=${encodeURIComponent(s.keyword)}&country=${s.country_code}&limit=${RANKED_LIMIT}`,
        { headers: { apikey: SUPABASE_ANON_KEY } },
      );
      const json = (await r.json()) as { results?: ItunesApp[]; error?: string };
      if (json.error) {
        setExpandedData((prev) => ({ ...prev, [s.id]: { loading: false, apps: [], error: json.error } }));
        return;
      }
      const ranked = json.results ?? [];
      setExpandedData((prev) => ({ ...prev, [s.id]: { loading: false, apps: ranked } }));
      const m = computeKeywordMetrics(ranked, s.keyword, ascAppIdFor(s.app_id));
      setMetrics((prev) => ({ ...prev, [s.id]: m }));
      void persistIfChanged(s, m);
    } catch {
      setExpandedData((prev) => ({ ...prev, [s.id]: { loading: false, apps: [], error: 'Failed to fetch.' } }));
    }
  }, [ascAppIdFor, persistIfChanged]);

  // Re-fetch live metrics for every keyword on screen.
  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all(searches.map((s) => loadFor(s)));
    setRefreshing(false);
  };

  // Heart a ranking app to start tracking it as a competitor.
  const addCompetitor = async (app: ItunesApp, countryCode: string) => {
    setLikeMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await db.from('competitors').insert({ user_id: user.id, itunes_id: String(app.trackId), country: countryCode, name: app.trackName });
    if (!error || (error.message ?? '').toLowerCase().includes('duplicate')) {
      setLiked((p) => ({ ...p, [app.trackId]: true }));
    } else {
      setLikeMsg(error.message);
    }
  };

  const loadSearches = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('keyword_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setSearches((data ?? []) as KeywordSearch[]);
  }, []);

  // Seed instantly from the session cache so revisiting the page shows the
  // keywords + their rings with no spinner, then refresh in the background.
  useEffect(() => {
    const c = getCache<{ searches: KeywordSearch[]; metrics: Record<string, KeywordMetrics>; expandedData: Record<string, ExpandedData> }>('keywords:state');
    if (c) { setSearches(c.searches); setMetrics(c.metrics); setExpandedData(c.expandedData); }
  }, []);

  useEffect(() => { loadSearches(); }, [loadSearches]);

  // Persist the computed state so the next visit is instant.
  useEffect(() => {
    if (searches.length) setCache('keywords:state', { searches, metrics, expandedData });
  }, [searches, metrics, expandedData]);

  // Compute real metrics for every search once it's on screen (also backfills
  // old rows). Runs when the list changes or the app catalogue finishes loading.
  useEffect(() => {
    searches.forEach((s) => {
      if (!expandedData[s.id]) void loadFor(s);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searches, apps.length]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSearching(false); return; }

    const keywords = query.split(',').map((k) => k.trim()).filter(Boolean);
    const inserted: KeywordSearch[] = [];

    for (const keyword of keywords) {
      // Real ranking apps for this exact term + country, fetched once.
      let ranked: ItunesApp[] = [];
      try {
        const r = await fetch(
          `${SUPABASE_URL}/functions/v1/itunes-search?term=${encodeURIComponent(keyword)}&country=${country}&limit=${RANKED_LIMIT}`,
          { headers: { apikey: SUPABASE_ANON_KEY } },
        );
        const json = (await r.json()) as { results?: ItunesApp[] };
        ranked = json.results ?? [];
      } catch { /* leave empty; metrics will reflect "no data" honestly */ }

      const m = computeKeywordMetrics(ranked, keyword, selectedApp?.asc_app_id ?? null);
      const { data } = await supabase.from('keyword_searches').insert({
        user_id: user.id,
        app_id: selectedApp?.id ?? null,
        keyword,
        country_code: country,
        popularity_score: m.popularity,
        difficulty_score: m.difficulty,
        app_ranking: m.appRanking,
      }).select().maybeSingle();
      if (data) {
        const row = data as KeywordSearch;
        inserted.push(row);
        setExpandedData((prev) => ({ ...prev, [row.id]: { loading: false, apps: ranked } }));
        setMetrics((prev) => ({ ...prev, [row.id]: m }));
      }
    }

    setQuery('');
    setSearching(false);
    loadSearches();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('keyword_searches').delete().eq('id', id);
    setSearches((prev) => prev.filter((s) => s.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const handleToggleExpand = (s: KeywordSearch) => {
    if (!expandedData[s.id]) void loadFor(s);
    setExpanded(expanded === s.id ? null : s.id);
  };

  // Trie les mots-clés selon la colonne cliquée (valeurs réelles de `metrics`).
  const sortedSearches = sortCol === 'recent' ? searches : [...searches].sort((a, b) => {
    const ma = metrics[a.id]; const mb = metrics[b.id];
    const dir = sortDir === 'asc' ? 1 : -1;
    let cmp = 0;
    switch (sortCol) {
      case 'keyword': cmp = a.keyword.localeCompare(b.keyword); break;
      case 'popularity': cmp = (ma?.popularity ?? -1) - (mb?.popularity ?? -1); break;
      case 'difficulty': cmp = (ma?.difficulty ?? 999) - (mb?.difficulty ?? 999); break;
      case 'rank': cmp = (ma?.appRanking ?? 9999) - (mb?.appRanking ?? 9999); break;
    }
    return cmp * dir;
  });

  // En-tête de colonne cliquable : libellé + flèche quand la colonne est active.
  const sortHeader = (col: Exclude<SortCol, 'recent'>, label: string, title?: string) => {
    const active = sortCol === col;
    return (
      <button type="button" onClick={() => onSort(col)} title={title}
        className={`flex items-center gap-1 uppercase tracking-wide hover:text-foreground transition-colors ${active ? 'text-foreground' : ''}`}>
        <span>{label}</span>
        {active && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
      </button>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Recherche de mots-clés</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Métriques calculées en direct depuis l&apos;App Store. Le volume de recherche exact nécessite Apple Search Ads (à venir).
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tape des mots-clés, séparés par des virgules..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <select
          className="text-sm bg-card border border-border/40 rounded-lg px-3 h-10 text-foreground focus:outline-none"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>
          ))}
        </select>
        <Button type="submit" disabled={searching} className="h-10">
          {searching ? 'Recherche...' : 'Rechercher'}
        </Button>
        {searches.length > 0 && (
          <button type="button" onClick={refreshAll} disabled={refreshing} title="Recharger les métriques"
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shrink-0">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </form>

      {likeMsg && <p className="text-xs text-amber-600 -mt-4 mb-6">{likeMsg}</p>}

      {searches.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid items-center gap-4 px-5 py-3 border-b border-border/40 text-xs font-medium text-muted-foreground uppercase tracking-wide"
            style={{ gridTemplateColumns: '1fr 84px 84px 72px 1fr 36px' }}>
            {sortHeader('keyword', 'Mot-clé')}
            {sortHeader('popularity', 'Popularité', "Demande estimée, d'après la traction cumulée (volume d'avis) des apps qui rankent pour ce terme. Donnée App Store réelle.")}
            {sortHeader('difficulty', 'Difficulté', "À quel point les meilleurs concurrents sont installés : leur volume d'avis + combien ciblent le mot-clé dans leur titre. Donnée App Store réelle.")}
            {sortHeader('rank', 'Rang', 'Ta position réelle sur ce terme, parmi les meilleurs résultats.')}
            <span>Apps en tête</span>
            <span />
          </div>

          {sortedSearches.map((s) => {
            const topData = expandedData[s.id];
            const m = metrics[s.id];
            const isExpanded = expanded === s.id;

            return (
              <div key={s.id}>
                {/* Row */}
                <div
                  className="grid items-center gap-4 px-5 py-3.5 border-b border-border/40 last:border-0 hover:bg-accent/20 transition-colors"
                  style={{ gridTemplateColumns: '1fr 84px 84px 72px 1fr 36px' }}
                >
                  {/* Keyword */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">{s.keyword}</span>
                    <span className="text-xs text-muted-foreground shrink-0 inline-flex items-center gap-1">{flagEmoji(s.country_code)} <span className="hidden sm:inline">{countryNameOf(s.country_code)}</span></span>
                  </div>

                  {/* Popularity (real) */}
                  <MetricRing score={m?.popularity} tone="popularity" diameter={40} />

                  {/* Difficulty (real) */}
                  <MetricRing score={m?.difficulty} tone="difficulty" diameter={40} />

                  {/* Ranking (real) */}
                  <div className="text-sm">
                    {!m ? (
                      <span className="text-muted-foreground">…</span>
                    ) : m.appRanking ? (
                      <span className="font-medium">#{m.appRanking}</span>
                    ) : (
                      <span className="text-muted-foreground" title={`Hors du top ${RANKED_LIMIT}`}>—</span>
                    )}
                  </div>

                  {/* Top app logos + expand button */}
                  <div className="flex items-center gap-1.5">
                    {topData?.loading ? (
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-7 h-7 rounded-lg bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : topData?.apps && topData.apps.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {topData.apps.slice(0, 5).map((app) => (
                          <AppIconSmall key={app.trackId} url={app.artworkUrl100} name={app.trackName} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    <button
                      onClick={() => handleToggleExpand(s)}
                      className="ml-1 flex items-center justify-center w-6 h-6 rounded-md text-primary hover:bg-primary/10 transition-colors shrink-0"
                      title={isExpanded ? 'Réduire' : 'Voir le détail'}
                    >
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors justify-self-center"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="px-5 py-4 bg-muted/20 border-b border-border/40">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Top apps — &ldquo;{s.keyword}&rdquo; · {COUNTRIES.find((c) => c.code === s.country_code)?.name ?? s.country_code}
                      </p>
                      {m && m.sampleSize > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {m.sampleSize} apps classées analysées
                        </span>
                      )}
                    </div>
                    <TopAppsDetail data={topData} liked={liked} onLike={(app) => addCompetitor(app, s.country_code)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TopAppsDetail({ data, liked, onLike }: { data?: ExpandedData; liked: Record<number, boolean>; onLike: (app: ItunesApp) => void }) {
  if (!data || data.loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        Chargement des top apps...
      </div>
    );
  }
  if (data.error) return <p className="text-sm text-destructive">{data.error}</p>;
  if (data.apps.length === 0) return <p className="text-sm text-muted-foreground">Aucun résultat.</p>;

  return (
    <div className="space-y-1">
      {data.apps.slice(0, 10).map((app, i) => (
        <div key={app.trackId} className="flex items-center gap-3 group hover:bg-accent/30 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
          <span className="w-5 text-center text-xs text-muted-foreground tabular-nums shrink-0">#{i + 1}</span>
          <AppIconSmall url={app.artworkUrl100} name={app.trackName} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{app.trackName}</p>
            <p className="text-xs text-muted-foreground truncate">{app.artistName}</p>
          </div>
          {app.userRatingCount != null && (
            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 hidden sm:inline">
              {app.userRatingCount.toLocaleString()} avis
            </span>
          )}
          {app.averageUserRating != null && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {app.averageUserRating.toFixed(1)}
            </div>
          )}
          <button
            onClick={() => onLike(app)}
            title={liked[app.trackId] ? 'Ajouté aux concurrents' : 'Suivre comme concurrent'}
            className="shrink-0 p-1 rounded-md hover:bg-accent transition-colors"
          >
            <Heart className={`h-4 w-4 ${liked[app.trackId] ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`} />
          </button>
          <a href={app.trackViewUrl ?? `https://apps.apple.com/app/id${app.trackId}`} target="_blank" rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors" title="Ouvrir sur l'App Store">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl border border-border/40 flex items-center justify-center mb-4">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium mb-2">Aucune recherche pour l&apos;instant</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Cherche un mot-clé pour voir sa difficulté et sa demande réelles, calculées sur les apps qui rankent vraiment dessus sur l&apos;App Store, ainsi que ta position.
      </p>
    </div>
  );
}
