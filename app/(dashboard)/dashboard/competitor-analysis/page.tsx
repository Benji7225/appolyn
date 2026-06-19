'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/dashboard/shell';
import { Search, RefreshCw, Sparkles, Star, Target, Lightbulb, Swords, Check } from 'lucide-react';

type Result = { trackId: number; trackName: string; artistName?: string; artworkUrl100?: string };
type Teardown = { positioning: string; strengths: string[]; keyword_angle: string; differentiation: string[] };
type AppInfo = { name: string; genre: string; rating: number | null; ratingCount: number | null; icon: string };

const authHeader = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' };
};

// Analyse concurrentielle IA : cherche un concurrent et obtiens un teardown
// stratégique (positionnement, forces, angle ASO, comment te différencier) sur
// ses vraies données App Store.
export default function CompetitorAnalysisPage() {
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [teardown, setTeardown] = useState<{ data: Teardown; app: AppInfo } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setSearching(true); setError(null); setResults([]); setTeardown(null);
    try {
      const r = await fetch(`/api/itunes?action=search&term=${encodeURIComponent(q)}&country=us`, { headers: await authHeader() });
      const j = await r.json() as { results?: Result[]; error?: string };
      if (j.error) setError(j.error);
      else setResults(j.results ?? []);
    } catch { setError('Recherche impossible.'); }
    setSearching(false);
  };

  const analyze = async (app: Result) => {
    setAnalyzing(app.trackId); setError(null); setTeardown(null);
    try {
      const r = await fetch('/api/competitor-teardown', {
        method: 'POST',
        headers: await authHeader(),
        body: JSON.stringify({ id: String(app.trackId), country: 'us' }),
      });
      const j = await r.json() as { teardown?: Teardown; app?: AppInfo; error?: string };
      if (j.error || !j.teardown || !j.app) { setError(j.error ?? 'Analyse impossible.'); setAnalyzing(null); return; }
      setTeardown({ data: j.teardown, app: j.app });
    } catch { setError('Analyse impossible (réseau).'); }
    setAnalyzing(null);
  };

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Analyse concurrentielle IA"
        description="Cherche un concurrent : l'IA décortique son positionnement, ses forces, son angle ASO et te dit comment te différencier."
      />

      <form onSubmit={search} className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom d'une app concurrente..."
            className="w-full pl-9 h-10 text-sm bg-card border border-border/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button type="submit" disabled={searching} className="h-10 px-4 text-sm rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          {searching ? 'Recherche...' : 'Chercher'}
        </button>
      </form>

      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive mb-6">{error}</div>}

      {results.length > 0 && !teardown && (
        <div className="space-y-1.5 mb-6">
          {results.slice(0, 8).map((app) => (
            <button key={app.trackId} onClick={() => analyze(app)} disabled={analyzing !== null}
              className="w-full flex items-center gap-3 text-left rounded-lg border border-border/50 bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-accent/40 transition-colors disabled:opacity-60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {app.artworkUrl100 ? <img src={app.artworkUrl100} alt="" className="w-9 h-9 rounded-lg shrink-0" /> : <div className="w-9 h-9 rounded-lg bg-muted shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{app.trackName}</p>
                <p className="text-xs text-muted-foreground truncate">{app.artistName}</p>
              </div>
              {analyzing === app.trackId
                ? <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                : <span className="text-xs text-primary inline-flex items-center gap-1 shrink-0"><Sparkles className="h-3.5 w-3.5" /> Analyser</span>}
            </button>
          ))}
        </div>
      )}

      {teardown && (
        <div className="space-y-5">
          <div className="bg-card border border-border/50 card-pop rounded-xl p-5 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {teardown.app.icon ? <img src={teardown.app.icon} alt="" className="w-12 h-12 rounded-xl shrink-0" /> : null}
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold truncate">{teardown.app.name}</h2>
              <p className="text-xs text-muted-foreground">{teardown.app.genre}{teardown.app.rating != null ? ` · ${teardown.app.rating.toFixed(1)}★ (${(teardown.app.ratingCount ?? 0).toLocaleString('fr-FR')})` : ''}</p>
            </div>
            <button onClick={() => setTeardown(null)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">← Autre concurrent</button>
          </div>

          <Section icon={Target} title="Positionnement">
            <p className="text-sm text-muted-foreground leading-relaxed">{teardown.data.positioning}</p>
          </Section>
          <Section icon={Star} title="Ses forces">
            <ul className="space-y-1.5">{teardown.data.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />{s}</li>
            ))}</ul>
          </Section>
          <Section icon={Swords} title="Son angle ASO">
            <p className="text-sm text-muted-foreground leading-relaxed">{teardown.data.keyword_angle}</p>
          </Section>
          <Section icon={Lightbulb} title="Comment te différencier">
            <ul className="space-y-1.5">{teardown.data.differentiation.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm"><Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /><span className="text-foreground">{s}</span></li>
            ))}</ul>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border/40 rounded-xl p-5">
      <h3 className="text-sm font-medium mb-3 inline-flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /> {title}</h3>
      {children}
    </div>
  );
}
