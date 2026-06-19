'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { getCache, setCache } from '@/lib/cache';
import { Trophy, Lock, RefreshCw } from 'lucide-react';

const COUNTRIES = [
  { code: 'us', name: 'États-Unis' }, { code: 'fr', name: 'France' }, { code: 'gb', name: 'Royaume-Uni' },
  { code: 'de', name: 'Allemagne' }, { code: 'es', name: 'Espagne' }, { code: 'it', name: 'Italie' },
  { code: 'ca', name: 'Canada' }, { code: 'jp', name: 'Japon' }, { code: 'br', name: 'Brésil' }, { code: 'au', name: 'Australie' },
];

type Charts = { type: 'free' | 'paid'; genreName: string; category: number | null; overall: number | null; of: number };

export default function ChartsPage() {
  const { selectedApp } = useDashboard();
  const ascAppId = selectedApp?.asc_app_id ?? '';

  const [country, setCountry] = useState('us');
  const [data, setData] = useState<Charts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ascAppId) { setData(null); return; }
    const key = `charts:${ascAppId}:${country}`;
    const cached = getCache<Charts>(key);
    if (cached) setData(cached);
    setLoading(!cached);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`/api/charts?id=${encodeURIComponent(ascAppId)}&country=${country}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const j = await r.json() as Charts & { error?: string };
      if (j.error) setError(j.error);
      else { setData(j); setCache(key, j); }
    } catch { setError('Récupération des classements impossible.'); }
    setLoading(false);
  }, [ascAppId, country]);

  useEffect(() => { load(); }, [load]);

  if (!ascAppId) {
    return (
      <div className="p-8">
        <PageHeader title="Classements" description="La position de ton app dans les charts App Store." />
        <EmptyState
          icon={Lock}
          title="Renseigne ton App ID"
          description="Sélectionne une app avec son identifiant App Store Connect pour voir sa position dans les classements."
          action={<a href="/dashboard/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>}
        />
      </div>
    );
  }

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Classements"
        description="La position de ton app dans le top App Store (catégorie et général), en données réelles."
        actions={
          <select value={country} onChange={(e) => setCountry(e.target.value)}
            className="text-sm bg-card border border-border/40 rounded-lg px-3 h-9 text-foreground focus:outline-none">
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        }
      />

      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive mb-6">{error}</div>}

      {loading && !data ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin inline mr-2" /> Lecture des classements…
        </div>
      ) : data ? (
        <>
          <p className="text-xs text-muted-foreground mb-4">
            Classement {data.type === 'free' ? 'gratuit' : 'payant'} · top {data.of}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <RankCard label={`Catégorie · ${data.genreName || 'App'}`} rank={data.category} of={data.of} />
            <RankCard label="Général (toutes catégories)" rank={data.overall} of={data.of} />
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            « Non classé » signifie que ton app n&apos;est pas dans le top {data.of} de ce classement pour ce pays. Vise un pic de téléchargements (lancement, contenu) pour y entrer.
          </p>
        </>
      ) : null}
    </div>
  );
}

function RankCard({ label, rank, of }: { label: string; rank: number | null; of: number }) {
  return (
    <div className="bg-card border border-border/50 card-pop rounded-xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className={`h-4 w-4 ${rank != null ? 'text-amber-500' : 'text-muted-foreground'}`} />
        <p className="text-sm font-medium">{label}</p>
      </div>
      {rank != null ? (
        <p className="text-3xl font-semibold tabular-nums">#{rank}<span className="text-base text-muted-foreground"> / {of}</span></p>
      ) : (
        <p className="text-2xl font-semibold text-muted-foreground">Non classé</p>
      )}
    </div>
  );
}
