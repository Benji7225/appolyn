'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, RefreshCw, TriangleAlert, ThumbsUp, Minus } from 'lucide-react';
import type { App } from '@/lib/database.types';

type Theme = { label: string; count: number; percentage: number; sentiment: 'positive' | 'negative' | 'neutral'; example: string };
type Analysis = { summary: string; themes: Theme[] };

function SentimentIcon({ s }: { s: Theme['sentiment'] }) {
  if (s === 'negative') return <TriangleAlert className="h-3.5 w-3.5 text-destructive" />;
  if (s === 'positive') return <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function ReviewAnalysis() {
  const [appId, setAppId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notEnough, setNotEnough] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase.from('apps').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      const rows = (data ?? []) as App[];
      setAppId(rows.find((a) => a.asc_app_id)?.asc_app_id ?? null);
    });
  }, []);

  const run = async () => {
    if (!appId) return;
    setLoading(true); setError(''); setNotEnough(null); setAnalysis(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/analyze-reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      });
      const j = await r.json() as { enough?: boolean; count?: number; analysis?: Analysis; error?: string };
      if (j.error) setError(j.error);
      else if (j.enough === false) setNotEnough(j.count ?? 0);
      else { setAnalysis(j.analysis ?? null); setCount(j.count ?? 0); }
    } catch {
      setError('Analyse impossible. Réessaie.');
    }
    setLoading(false);
  };

  if (!appId) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 mb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-medium">Analyse IA des avis</h3>
            <p className="text-xs text-muted-foreground">Thèmes récurrents et plaintes, calculés sur tes vrais avis.</p>
          </div>
        </div>
        <button onClick={run} disabled={loading}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
          {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {analysis ? 'Réanalyser' : 'Analyser'}
        </button>
      </div>

      {error && <p className="text-xs text-destructive mt-3">{error}</p>}
      {notEnough != null && (
        <p className="text-sm text-muted-foreground mt-3">
          Pas encore assez d&apos;avis pour une analyse fiable ({notEnough}). Reviens quand l&apos;app en aura quelques-uns.
        </p>
      )}

      {analysis && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{analysis.summary}</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-2">
            Thèmes sur {count} avis
          </p>
          <div className="space-y-2">
            {analysis.themes.map((t, i) => (
              <div key={i} className="rounded-lg border border-border/40 p-3">
                <div className="flex items-center gap-2">
                  <SentimentIcon s={t.sentiment} />
                  <span className="text-sm font-medium flex-1">{t.label}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{t.percentage}% · {t.count} avis</span>
                </div>
                <div className="h-1.5 rounded-full bg-accent mt-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, t.percentage)}%` }} />
                </div>
                {t.example && <p className="text-xs text-muted-foreground mt-2 italic">“{t.example}”</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
