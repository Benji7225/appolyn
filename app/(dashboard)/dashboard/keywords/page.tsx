'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trash2, ChevronDown, ChevronUp, Star, ExternalLink } from 'lucide-react';
import type { App, KeywordSearch } from '@/lib/database.types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

function generateMetrics(keyword: string) {
  const hash = keyword.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    popularity: 30 + (hash % 65),
    difficulty: 20 + ((hash * 3) % 70),
    ranking: Math.random() > 0.4 ? Math.floor(1 + (hash % 150)) : null,
  };
}

function DifficultyBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-red-400' : score >= 40 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs tabular-nums">{score}</span>
    </div>
  );
}

function PopularityBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-foreground/60" style={{ width: `${score}%` }} />
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
  const [apps, setApps] = useState<App[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [country, setCountry] = useState('us');
  const [query, setQuery] = useState('');
  const [searches, setSearches] = useState<KeywordSearch[]>([]);
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<Record<string, ExpandedData>>({});

  useEffect(() => {
    loadApps();
    loadSearches();
  }, []);

  const loadApps = async () => {
    const { data } = await supabase.from('apps').select('*').order('created_at', { ascending: false });
    const rows = (data ?? []) as App[];
    setApps(rows);
    if (rows.length > 0) setSelectedAppId(rows[0].id);
  };

  const loadSearches = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('keyword_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setSearches((data ?? []) as KeywordSearch[]);
  };

  const fetchTopApps = async (s: KeywordSearch): Promise<ExpandedData> => {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/functions/v1/itunes-search?term=${encodeURIComponent(s.keyword)}&country=${s.country_code}&limit=5`,
        { headers: { 'apikey': SUPABASE_ANON_KEY } }
      );
      const json = await r.json() as { results?: ItunesApp[]; error?: string };
      if (json.error) return { loading: false, apps: [], error: json.error };
      return { loading: false, apps: json.results ?? [] };
    } catch {
      return { loading: false, apps: [], error: 'Failed to fetch.' };
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const keywords = query.split(',').map((k) => k.trim()).filter(Boolean);
    const inserted: KeywordSearch[] = [];

    for (const keyword of keywords) {
      const metrics = generateMetrics(keyword + country);
      const { data } = await supabase.from('keyword_searches').insert({
        user_id: user.id,
        app_id: selectedAppId || null,
        keyword,
        country_code: country,
        popularity_score: metrics.popularity,
        difficulty_score: metrics.difficulty,
        app_ranking: metrics.ranking,
      }).select().maybeSingle();
      if (data) inserted.push(data as KeywordSearch);
    }

    setQuery('');
    setSearching(false);

    // Pre-fetch top apps for newly inserted keywords
    for (const s of inserted) {
      setExpandedData((prev) => ({ ...prev, [s.id]: { loading: true, apps: [] } }));
      fetchTopApps(s).then((result) => {
        setExpandedData((prev) => ({ ...prev, [s.id]: result }));
      });
    }

    loadSearches();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('keyword_searches').delete().eq('id', id);
    setSearches((prev) => prev.filter((s) => s.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const ensureFetched = (s: KeywordSearch) => {
    if (!expandedData[s.id]) {
      setExpandedData((prev) => ({ ...prev, [s.id]: { loading: true, apps: [] } }));
      fetchTopApps(s).then((result) => {
        setExpandedData((prev) => ({ ...prev, [s.id]: result }));
      });
    }
  };

  const handleToggleExpand = (s: KeywordSearch) => {
    ensureFetched(s);
    setExpanded(expanded === s.id ? null : s.id);
  };

  // Pre-fetch top apps for existing searches on load
  useEffect(() => {
    if (searches.length === 0) return;
    searches.forEach((s) => {
      if (!expandedData[s.id]) {
        setExpandedData((prev) => ({ ...prev, [s.id]: { loading: true, apps: [] } }));
        fetchTopApps(s).then((result) => {
          setExpandedData((prev) => ({ ...prev, [s.id]: result }));
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searches.length]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Keyword Research</h1>
        <p className="text-sm text-muted-foreground mt-1">Search keywords and analyze their ASO potential.</p>
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
        {apps.length > 0 && (
          <select
            className="text-sm bg-card border border-border/40 rounded-lg px-3 h-10 text-foreground focus:outline-none"
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
          >
            <option value="">No app</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>{app.name}</option>
            ))}
          </select>
        )}
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
            <span>Popularity</span>
            <span>Difficulty</span>
            <span>Ranking</span>
            <span>Top 5</span>
            <span />
          </div>

          {searches.map((s) => {
            const topData = expandedData[s.id];
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

                  {/* Popularity */}
                  <PopularityBar score={s.popularity_score} />

                  {/* Difficulty */}
                  <DifficultyBar score={s.difficulty_score} />

                  {/* Ranking */}
                  <div className="text-sm">
                    {s.app_ranking
                      ? <span className="font-medium">#{s.app_ranking}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </div>

                  {/* Top 5 logos + expand button */}
                  <div className="flex items-center gap-1.5">
                    {topData?.loading ? (
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-7 h-7 rounded-lg bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : topData?.apps && topData.apps.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {topData.apps.map((app) => (
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
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                      Top Apps — &ldquo;{s.keyword}&rdquo; in {COUNTRIES.find((c) => c.code === s.country_code)?.name ?? s.country_code}
                    </p>
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
      {data.apps.map((app, i) => (
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
        Search for keywords above to see popularity scores, difficulty ratings, and the top 5 ranked apps from the App Store.
      </p>
    </div>
  );
}
