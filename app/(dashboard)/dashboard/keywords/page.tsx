'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trash2, ChevronDown, ChevronUp, Star, ExternalLink } from 'lucide-react';
import type { KeywordSearch } from '@/lib/database.types';
import { useDashboard } from '@/lib/app-context';
import { computeKeywordMetrics, type KeywordMetrics } from '@/lib/aso';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// How many ranking apps we pull per term. Enough to (a) gauge real competitor
// strength, (b) estimate demand, and (c) locate the user's app for its rank.
const RANKED_LIMIT = 50;

const COUNTRIES = [
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'de', name: 'Germany' },
  { code: 'fr', name: 'France' },
  { code: 'jp', name: 'Japan' },
  { code: 'au', name: 'Australia' },
  { code: 'ca', name: 'Canada' },
  { code: 'br', name: 'Brazil' },
  { code: 'in', name: 'India' },
  { code: 'kr', name: 'South Korea' },
];

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

function MetricBar({ score, tone }: { score?: number; tone: 'difficulty' | 'popularity' }) {
  if (score == null) {
    // Real value not computed yet (apps still loading). Never show a fake number.
    return <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden animate-pulse" />;
  }
  const color =
    tone === 'popularity'
      ? 'bg-foreground/60'
      : score >= 70 ? 'bg-red-400' : score >= 40 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs tabular-nums">{score}</span>
    </div>
  );
}

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

  useEffect(() => { loadSearches(); }, [loadSearches]);

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Keyword Research</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live metrics computed from the App Store. Exact search volume requires Apple Search Ads (coming soon).
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Enter keywords, comma-separated..."
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
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
        <Button type="submit" disabled={searching} className="h-10">
          {searching ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {searches.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid items-center gap-4 px-5 py-3 border-b border-border/40 text-xs font-medium text-muted-foreground uppercase tracking-wide"
            style={{ gridTemplateColumns: '1fr 130px 130px 90px 1fr 36px' }}>
            <span>Keyword</span>
            <span title="Estimated demand, from the aggregate traction (rating volume) of the apps ranking for this term. Real App Store data.">Popularity</span>
            <span title="How entrenched the top competitors are: their rating volume plus how many target the keyword in their title. Real App Store data.">Difficulty</span>
            <span title="Your app's real position for this term, among the top results.">Ranking</span>
            <span>Top apps</span>
            <span />
          </div>

          {searches.map((s) => {
            const topData = expandedData[s.id];
            const m = metrics[s.id];
            const isExpanded = expanded === s.id;

            return (
              <div key={s.id}>
                {/* Row */}
                <div
                  className="grid items-center gap-4 px-5 py-3.5 border-b border-border/40 last:border-0 hover:bg-accent/20 transition-colors"
                  style={{ gridTemplateColumns: '1fr 130px 130px 90px 1fr 36px' }}
                >
                  {/* Keyword */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">{s.keyword}</span>
                    <span className="text-xs text-muted-foreground uppercase shrink-0">{s.country_code}</span>
                  </div>

                  {/* Popularity (real) */}
                  <MetricBar score={m?.popularity} tone="popularity" />

                  {/* Difficulty (real) */}
                  <MetricBar score={m?.difficulty} tone="difficulty" />

                  {/* Ranking (real) */}
                  <div className="text-sm">
                    {!m ? (
                      <span className="text-muted-foreground">…</span>
                    ) : m.appRanking ? (
                      <span className="font-medium">#{m.appRanking}</span>
                    ) : (
                      <span className="text-muted-foreground" title={`Not in the top ${RANKED_LIMIT}`}>—</span>
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
                      className="ml-1 flex items-center justify-center w-6 h-6 rounded-md text-emerald-400 hover:bg-emerald-400/10 transition-colors shrink-0"
                      title={isExpanded ? 'Collapse' : 'Show details'}
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
                        Top apps — &ldquo;{s.keyword}&rdquo; in {COUNTRIES.find((c) => c.code === s.country_code)?.name ?? s.country_code}
                      </p>
                      {m && m.sampleSize > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {m.sampleSize} ranking apps analysed
                        </span>
                      )}
                    </div>
                    <TopAppsDetail data={topData} />
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

function TopAppsDetail({ data }: { data?: ExpandedData }) {
  if (!data || data.loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        Loading top apps...
      </div>
    );
  }
  if (data.error) return <p className="text-sm text-destructive">{data.error}</p>;
  if (data.apps.length === 0) return <p className="text-sm text-muted-foreground">No results found.</p>;

  return (
    <div className="space-y-2">
      {data.apps.slice(0, 10).map((app, i) => (
        <a
          key={app.trackId}
          href={app.trackViewUrl ?? `https://apps.apple.com/app/id${app.trackId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 group hover:bg-accent/30 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
        >
          <span className="w-5 text-center text-xs text-muted-foreground tabular-nums shrink-0">#{i + 1}</span>
          <AppIconSmall url={app.artworkUrl100} name={app.trackName} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate group-hover:text-foreground">{app.trackName}</p>
            <p className="text-xs text-muted-foreground truncate">{app.artistName}</p>
          </div>
          {app.userRatingCount != null && (
            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
              {app.userRatingCount.toLocaleString()} ratings
            </span>
          )}
          {app.averageUserRating != null && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Star className="h-3 w-3 fill-current" />
              {app.averageUserRating.toFixed(1)}
            </div>
          )}
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors" />
        </a>
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
      <h2 className="text-lg font-medium mb-2">No keyword searches yet</h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        Search a keyword to see real difficulty and demand, computed from the apps actually ranking for it on the App Store, plus your app&apos;s position.
      </p>
    </div>
  );
}
