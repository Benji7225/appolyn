'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ASC_LOCALES } from '@/lib/aso';
import { LAUNCH_KEYS } from '@/lib/launch-checklist';
import { Globe, Star, Rocket, Swords, type LucideIcon } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const healthColor = (s: number) => (s >= 80 ? 'text-emerald-500' : s >= 50 ? 'text-amber-500' : 'text-rose-500');
export const healthBar = (s: number) => (s >= 80 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-rose-500');
export const healthVerdict = (s: number) => (s >= 80 ? 'Excellent' : s >= 60 ? 'Bon' : s >= 40 ? 'À améliorer' : 'Faible');

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

export type Pillar = {
  key: string;
  label: string;
  icon: LucideIcon;
  weight: number;
  score: number | null; // null = donnée pas encore disponible (honnête, exclu du calcul)
  pending?: boolean;     // true = en cours de chargement (≠ « à connecter »)
  detail: string;
  href: string;
  cta: string;
};

// Score de santé global de l'app : un seul nombre + les leviers à actionner, sur des
// signaux 100% réels. Chaque pilier est indépendant ; donnée manquante = honnêtement
// « à connecter » et exclu du calcul (jamais inventé). Score STABLE (persisté + 'keep').
// Hook réutilisable (Accueil + ailleurs) pour ne pas dupliquer la logique.
export function useAppHealth(appId: string, ascAppId: string) {
  const [pillars, setPillars] = useState<Pillar[] | null>(null);

  const makePillars = useCallback((s: Scores, pending: Set<string>): Pillar[] => [
    { key: 'launch', label: 'Préparation au lancement', icon: Rocket, weight: 25, score: s.launch, pending: pending.has('launch'), detail: 'Avance ta checklist guidée de lancement.', href: '/app/launch', cta: 'Ouvrir la checklist' },
    { key: 'coverage', label: 'Couverture des langues', icon: Globe, weight: 25, score: s.coverage, pending: pending.has('coverage'), detail: ascAppId ? 'Ajoute des langues pour toucher plus de marchés.' : 'Connecte App Store Connect pour mesurer.', href: '/app/localization', cta: 'Voir la couverture' },
    { key: 'reputation', label: 'Réputation (note)', icon: Star, weight: 30, score: s.rating, pending: pending.has('reputation'), detail: ascAppId ? 'Réponds aux avis pour soigner ta note.' : 'Connecte App Store Connect pour mesurer.', href: '/app/reviews', cta: 'Gérer les avis' },
    { key: 'tracking', label: 'Suivi & veille', icon: Swords, weight: 20, score: s.tracking, pending: pending.has('tracking'), detail: 'Suis des mots-clés et des concurrents pour piloter ton ASO.', href: '/app/competitors', cta: 'Ajouter des concurrents' },
  ], [ascAppId]);

  const compute = useCallback(async () => {
    if (!appId) { setPillars(null); return; }

    const persisted = loadScores(appId);
    const scores: Scores = persisted ?? { launch: null, coverage: null, rating: null, tracking: null };
    const inScope = !!ascAppId;
    const pending = new Set<string>();
    if (scores.launch == null) pending.add('launch');
    if (inScope && scores.coverage == null) pending.add('coverage');
    if (inScope && scores.rating == null) pending.add('reputation');
    if (scores.tracking == null) pending.add('tracking');
    setPillars(makePillars(scores, pending));

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // 'keep' = échec transitoire → on conserve la dernière valeur connue (pas d'exclusion
    // surprise qui ferait varier le score). null = vraiment pas de donnée (déterministe).
    const resolve = (key: string, field: keyof Scores, value: number | null | 'keep') => {
      if (value !== 'keep') scores[field] = value;
      pending.delete(key);
      setPillars(makePillars(scores, pending));
    };

    const launchP: PromiseLike<number | null | 'keep'> = supabase
      .from('launch_checklist').select('id', { count: 'exact', head: true }).eq('app_id', appId).eq('done', true)
      .then((r: { count: number | null }) => Math.round(((r.count ?? 0) / LAUNCH_KEYS.length) * 100));

    const coverageP: Promise<number | null | 'keep'> = (async () => {
      if (!inScope) return null;
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

    const ratingP: Promise<number | null | 'keep'> = (async () => {
      if (!inScope) return null;
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

    await Promise.all([launchP, coverageP, ratingP, trackingP]);
    saveScores(appId, scores);
  }, [appId, ascAppId, makePillars]);

  useEffect(() => { compute(); }, [compute]);

  const available = (pillars ?? []).filter((p) => p.score != null) as (Pillar & { score: number })[];
  const totalWeight = available.reduce((s, p) => s + p.weight, 0);
  const overall = totalWeight ? Math.round(available.reduce((s, p) => s + p.score * p.weight, 0) / totalWeight) : null;
  const weakest = [...available].sort((a, b) => a.score - b.score)[0] ?? null;
  const settling = (pillars ?? []).some((p) => p.pending);

  return { pillars, overall, weakest, settling };
}
