'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { ASC_LOCALES } from '@/lib/aso';
import { LAUNCH_KEYS } from '@/lib/launch-checklist';
import { getCache, setCache } from '@/lib/cache';
import { HeartPulse, Smartphone, Globe, Star, Rocket, Swords, ArrowRight, RefreshCw } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Pillar = {
  key: string;
  label: string;
  icon: typeof Globe;
  weight: number;
  score: number | null; // null = donnée pas encore disponible (honnête, exclu du calcul)
  detail: string;
  href: string;
  cta: string;
};

const scoreColor = (s: number) => (s >= 80 ? 'text-emerald-500' : s >= 50 ? 'text-amber-500' : 'text-rose-500');
const barColor = (s: number) => (s >= 80 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-rose-500');
const verdictOf = (s: number) => (s >= 80 ? 'Excellent' : s >= 60 ? 'Bon' : s >= 40 ? 'À améliorer' : 'Faible');

// Score de santé global de l'app : un seul nombre + les leviers à actionner, sur
// des signaux 100% réels. Chaque pilier est indépendant ; s'il manque une donnée,
// il est honnêtement marqué « à connecter » et exclu du calcul (jamais inventé).
export default function HealthPage() {
  const { selectedApp } = useDashboard();
  const appId = selectedApp?.id ?? '';
  const ascAppId = selectedApp?.asc_app_id ?? '';

  const [pillars, setPillars] = useState<Pillar[] | null>(null);
  const [loading, setLoading] = useState(false);

  const compute = useCallback(async () => {
    if (!appId) { setPillars(null); return; }
    const cacheKey = `health:${appId}`;
    const cached = getCache<Pillar[]>(cacheKey);
    if (cached) setPillars(cached);
    setLoading(!cached);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // 1) Préparation au lancement (checklist)
    const launchP: PromiseLike<number | null> = supabase
      .from('launch_checklist').select('id', { count: 'exact', head: true }).eq('app_id', appId).eq('done', true)
      .then((r: { count: number | null }) => Math.round(((r.count ?? 0) / LAUNCH_KEYS.length) * 100));

    // 2) Couverture langues (réel via ASC), 3) Réputation (réel via iTunes)
    const coverageP: Promise<number | null> = (async () => {
      if (!ascAppId) return null;
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-localizations`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId: ascAppId }),
        });
        const j = await r.json() as { localizations?: { locale: string }[]; error?: string };
        if (j.error || !j.localizations) return null;
        const covered = new Set(j.localizations.map((l) => l.locale));
        const n = ASC_LOCALES.filter((l) => covered.has(l.code)).length;
        return Math.round((n / ASC_LOCALES.length) * 100);
      } catch { return null; }
    })();

    const ratingP: Promise<number | null> = (async () => {
      if (!ascAppId) return null;
      try {
        const r = await fetch(`/api/itunes?action=lookup&id=${encodeURIComponent(ascAppId)}&country=us`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json() as { result?: { averageRating: number | null; ratingCount: number | null }; error?: string };
        const rating = j.result?.averageRating;
        if (rating == null) return null;
        return Math.round((rating / 5) * 100);
      } catch { return null; }
    })();

    // 4) Suivi & veille (concurrents suivis + mots-clés suivis)
    const trackingP: Promise<number | null> = (async () => {
      const [comp, kw] = await Promise.all([
        supabase.from('competitors').select('id', { count: 'exact', head: true }),
        supabase.from('keyword_searches').select('id', { count: 'exact', head: true }),
      ]);
      const c = comp.count ?? 0;
      const k = kw.count ?? 0;
      return Math.min(100, (c > 0 ? 50 : 0) + Math.min(50, k * 10));
    })();

    const [launch, coverage, rating, tracking] = await Promise.all([launchP, coverageP, ratingP, trackingP]);

    const next: Pillar[] = [
      { key: 'launch', label: 'Préparation au lancement', icon: Rocket, weight: 25, score: launch, detail: 'Avance ta checklist guidée de lancement.', href: '/app/launch', cta: 'Ouvrir la checklist' },
      { key: 'coverage', label: 'Couverture des langues', icon: Globe, weight: 25, score: coverage, detail: ascAppId ? 'Ajoute des langues pour toucher plus de marchés.' : 'Connecte App Store Connect pour mesurer.', href: '/app/localization', cta: 'Voir la couverture' },
      { key: 'reputation', label: 'Réputation (note)', icon: Star, weight: 30, score: rating, detail: ascAppId ? 'Réponds aux avis pour soigner ta note.' : 'Connecte App Store Connect pour mesurer.', href: '/app/reviews', cta: 'Gérer les avis' },
      { key: 'tracking', label: 'Suivi & veille', icon: Swords, weight: 20, score: tracking, detail: 'Suis des mots-clés et des concurrents pour piloter ton ASO.', href: '/app/competitors', cta: 'Ajouter des concurrents' },
    ];
    setPillars(next);
    setCache(cacheKey, next);
    setLoading(false);
  }, [appId, ascAppId]);

  useEffect(() => { compute(); }, [compute]);

  if (!appId) {
    return (
      <div className="p-8">
        <PageHeader title="Santé de l'app" description="Un score global et les leviers à actionner, en un coup d'œil." />
        <EmptyState
          icon={Smartphone}
          title="Ajoute d'abord une app"
          description="Sélectionne une app pour voir son score de santé et tes prochaines actions prioritaires."
          action={<a href="/app/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>}
        />
      </div>
    );
  }

  const available = (pillars ?? []).filter((p) => p.score != null) as (Pillar & { score: number })[];
  const totalWeight = available.reduce((s, p) => s + p.weight, 0);
  const overall = totalWeight ? Math.round(available.reduce((s, p) => s + p.score * p.weight, 0) / totalWeight) : null;
  // La prochaine action = le pilier disponible le plus faible.
  const weakest = [...available].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Santé de l'app"
        description="Un seul score, calculé sur tes vraies données, et les leviers à actionner. Tu ne navigues plus à l'aveugle."
      />

      {loading && !pillars ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin inline mr-2" /> Calcul de ton score…
        </div>
      ) : (
        <>
          {/* Score global */}
          <div className="bg-card border border-border/50 card-pop rounded-xl p-6 mb-6 flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center">
                <HeartPulse className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score de santé</p>
                <p className={`text-4xl font-semibold tabular-nums leading-none mt-1 ${overall != null ? scoreColor(overall) : 'text-muted-foreground'}`}>
                  {overall != null ? overall : '—'}<span className="text-lg text-muted-foreground">/100</span>
                </p>
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              {overall != null ? (
                <>
                  <p className="text-sm font-medium">{verdictOf(overall)}</p>
                  {weakest && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Plus gros levier : <Link href={weakest.href} className="text-primary hover:underline">{weakest.label.toLowerCase()}</Link> ({weakest.score}/100).
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Connecte App Store Connect pour un score complet.</p>
              )}
            </div>
          </div>

          {/* Piliers */}
          <div className="grid sm:grid-cols-2 gap-4">
            {(pillars ?? []).map((p) => (
              <div key={p.key} className="bg-card border border-border/40 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p.icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">{p.label}</h3>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${p.score != null ? scoreColor(p.score) : 'text-muted-foreground'}`}>
                    {p.score != null ? `${p.score}/100` : 'à connecter'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-accent overflow-hidden mb-3">
                  <div className={`h-full rounded-full transition-all ${p.score != null ? barColor(p.score) : 'bg-muted-foreground/30'}`} style={{ width: `${p.score != null ? Math.max(p.score, 2) : 0}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mb-3">{p.detail}</p>
                <Link href={p.href} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
