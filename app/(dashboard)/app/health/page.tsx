'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { ASC_LOCALES } from '@/lib/aso';
import { LAUNCH_KEYS } from '@/lib/launch-checklist';
import { HeartPulse, Smartphone, Globe, Star, Rocket, Swords, ArrowRight, RefreshCw } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Scores résolus par pilier, persistés par app pour un score STABLE au rechargement
// (mêmes données → même score). 'keep' = échec transitoire, on garde la valeur connue.
type Scores = { launch: number | null; coverage: number | null; rating: number | null; tracking: number | null };
const SKEY = (id: string) => `health:scores:${id}`;
function loadScores(id: string): Scores | null {
  try { const r = localStorage.getItem(SKEY(id)); return r ? (JSON.parse(r) as Scores) : null; } catch { return null; }
}
function saveScores(id: string, s: Scores) {
  try { localStorage.setItem(SKEY(id), JSON.stringify(s)); } catch { /* ignore */ }
}
// Petit retry : un échec réseau transitoire ne doit pas faire chuter le score.
async function fetchRetry(url: string, opts: RequestInit, tries = 2): Promise<Response | null> {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, opts); if (r.ok) return r; } catch { /* retry */ }
    if (i < tries - 1) await new Promise((res) => setTimeout(res, 350));
  }
  return null;
}

type Pillar = {
  key: string;
  label: string;
  icon: typeof Globe;
  weight: number;
  score: number | null; // null = donnée pas encore disponible (honnête, exclu du calcul)
  pending?: boolean;    // true = en cours de chargement (≠ « à connecter »)
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

  // Construit les 4 piliers à partir des scores connus + l'ensemble des piliers
  // encore en cours de chargement (pour afficher un spinner par carte).
  const makePillars = useCallback((s: { launch: number | null; coverage: number | null; rating: number | null; tracking: number | null }, pending: Set<string>): Pillar[] => [
    { key: 'launch', label: 'Préparation au lancement', icon: Rocket, weight: 25, score: s.launch, pending: pending.has('launch'), detail: 'Avance ta checklist guidée de lancement.', href: '/app/launch', cta: 'Ouvrir la checklist' },
    { key: 'coverage', label: 'Couverture des langues', icon: Globe, weight: 25, score: s.coverage, pending: pending.has('coverage'), detail: ascAppId ? 'Ajoute des langues pour toucher plus de marchés.' : 'Connecte App Store Connect pour mesurer.', href: '/app/localization', cta: 'Voir la couverture' },
    { key: 'reputation', label: 'Réputation (note)', icon: Star, weight: 30, score: s.rating, pending: pending.has('reputation'), detail: ascAppId ? 'Réponds aux avis pour soigner ta note.' : 'Connecte App Store Connect pour mesurer.', href: '/app/reviews', cta: 'Gérer les avis' },
    { key: 'tracking', label: 'Suivi & veille', icon: Swords, weight: 20, score: s.tracking, pending: pending.has('tracking'), detail: 'Suis des mots-clés et des concurrents pour piloter ton ASO.', href: '/app/competitors', cta: 'Ajouter des concurrents' },
  ], [ascAppId]);

  const compute = useCallback(async () => {
    if (!appId) { setPillars(null); return; }

    // Point de départ = derniers scores connus (localStorage) → score STABLE et
    // instantané au rechargement. On ne montre un spinner QUE pour un pilier en
    // scope dont on n'a encore aucune valeur. Pas de flicker.
    const persisted = loadScores(appId);
    const scores: Scores = persisted ?? { launch: null, coverage: null, rating: null, tracking: null };
    const coverageInScope = !!ascAppId;
    const ratingInScope = !!ascAppId;
    const pending = new Set<string>();
    if (scores.launch == null) pending.add('launch');
    if (coverageInScope && scores.coverage == null) pending.add('coverage');
    if (ratingInScope && scores.rating == null) pending.add('reputation');
    if (scores.tracking == null) pending.add('tracking');
    setPillars(makePillars(scores, pending));
    setLoading(false);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // 'keep' = échec transitoire → on conserve la dernière valeur connue (pas d'exclusion
    // surprise qui ferait varier le score). null = vraiment pas de donnée (déterministe).
    const resolve = (key: string, field: keyof Scores, value: number | null | 'keep') => {
      if (value !== 'keep') scores[field] = value;
      pending.delete(key);
      setPillars(makePillars(scores, pending));
    };

    // 1) Préparation au lancement (checklist) — déterministe, résout toujours.
    const launchP: PromiseLike<number | null | 'keep'> = supabase
      .from('launch_checklist').select('id', { count: 'exact', head: true }).eq('app_id', appId).eq('done', true)
      .then((r: { count: number | null }) => Math.round(((r.count ?? 0) / LAUNCH_KEYS.length) * 100));

    // 2) Couverture langues (réel via ASC) — retry, 'keep' sur échec transitoire.
    const coverageP: Promise<number | null | 'keep'> = (async () => {
      if (!coverageInScope) return null;
      const r = await fetchRetry(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-localizations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: ascAppId }),
      });
      if (!r) return 'keep';
      try {
        const j = await r.json() as { localizations?: { locale: string }[]; error?: string };
        if (j.error || !j.localizations) return 'keep';
        const covered = new Set(j.localizations.map((l) => l.locale));
        const n = ASC_LOCALES.filter((l) => covered.has(l.code)).length;
        return Math.round((n / ASC_LOCALES.length) * 100);
      } catch { return 'keep'; }
    })();

    // 3) Réputation (réel via iTunes) — distingue « app sans note » (déterministe, null)
    // de « appel échoué » (transitoire, keep).
    const ratingP: Promise<number | null | 'keep'> = (async () => {
      if (!ratingInScope) return null;
      const r = await fetchRetry(`/api/itunes?action=lookup&id=${encodeURIComponent(ascAppId)}&country=us`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r) return 'keep';
      try {
        const j = await r.json() as { result?: { averageRating: number | null } | null; error?: string };
        if (!('result' in j)) return 'keep';
        if (!j.result) return null; // app pas (encore) publique / introuvable = déterministe
        const rating = j.result.averageRating;
        if (rating == null) return null; // publique mais pas encore de note
        return Math.round((rating / 5) * 100);
      } catch { return 'keep'; }
    })();

    // 4) Suivi & veille (concurrents suivis + mots-clés suivis) — déterministe.
    const trackingP: Promise<number | null | 'keep'> = (async () => {
      const [comp, kw] = await Promise.all([
        supabase.from('competitors').select('id', { count: 'exact', head: true }),
        supabase.from('keyword_searches').select('id', { count: 'exact', head: true }),
      ]);
      const c = comp.count ?? 0;
      const k = kw.count ?? 0;
      return Math.min(100, (c > 0 ? 50 : 0) + Math.min(50, k * 10));
    })();

    launchP.then((v) => resolve('launch', 'launch', v));
    coverageP.then((v) => resolve('coverage', 'coverage', v));
    ratingP.then((v) => resolve('reputation', 'rating', v));
    trackingP.then((v) => resolve('tracking', 'tracking', v));

    // Une fois tout résolu, on persiste les scores (stable au prochain rechargement).
    await Promise.all([launchP, coverageP, ratingP, trackingP]);
    saveScores(appId, scores);
  }, [appId, ascAppId, makePillars]);

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
  const settling = (pillars ?? []).some((p) => p.pending); // tant que tout n'est pas chargé, on n'affiche pas un score intermédiaire (fini le flicker)

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Santé de l'app"
        description="Un seul score, calculé sur tes vraies données, et les leviers à actionner. Tu ne navigues plus à l'aveugle."
      />

      {/* Score global */}
          <div className="bg-card border border-border/50 card-pop rounded-xl p-6 mb-6 flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center">
                <HeartPulse className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score de santé</p>
                <p className={`text-4xl font-semibold tabular-nums leading-none mt-1 ${!settling && overall != null ? scoreColor(overall) : 'text-muted-foreground'}`}>
                  {settling ? '…' : overall != null ? overall : '—'}<span className="text-lg text-muted-foreground">/100</span>
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
                    {p.pending ? <RefreshCw className="h-3.5 w-3.5 animate-spin inline" /> : p.score != null ? `${p.score}/100` : 'à connecter'}
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
    </div>
  );
}
