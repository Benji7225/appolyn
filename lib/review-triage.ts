// Tri des avis App Store : fonctions pures (sans réseau), testables à la main.

export type TriageReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  territory: string;
  createdDate: string;
  reviewerNickname: string;
  responseBody: string | null;
};

export type ReviewStatus = 'all' | 'unanswered' | 'answered';
export type ReviewSort = 'recent' | 'oldest' | 'lowest' | 'highest';

export type ReviewStats = {
  total: number;
  answered: number;
  unanswered: number;
  /** Avis de 1 à 3 étoiles sans réponse : ceux qui coûtent le plus cher. */
  unansweredCritical: number;
  /** Part des avis ayant une réponse, 0 à 100 (null si aucun avis). */
  responseRate: number | null;
  /** Plus ancien avis critique sans réponse, en jours (null s'il n'y en a pas). */
  oldestCriticalDays: number | null;
};

const DAY = 86_400_000;

export function reviewStats(reviews: TriageReview[], now: number = Date.now()): ReviewStats {
  const answered = reviews.filter((r) => !!r.responseBody?.trim()).length;
  const critical = reviews.filter((r) => r.rating <= 3 && !r.responseBody?.trim());
  const ages = critical
    .map((r) => Math.floor((now - new Date(r.createdDate).getTime()) / DAY))
    .filter((d) => Number.isFinite(d));
  return {
    total: reviews.length,
    answered,
    unanswered: reviews.length - answered,
    unansweredCritical: critical.length,
    responseRate: reviews.length ? Math.round((answered / reviews.length) * 100) : null,
    oldestCriticalDays: ages.length ? Math.max(0, ...ages) : null,
  };
}

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function filterReviews(
  reviews: TriageReview[],
  opts: { rating: number; status: ReviewStatus; query: string; sort: ReviewSort },
): TriageReview[] {
  const q = norm(opts.query.trim());
  const out = reviews.filter((r) => {
    if (opts.rating !== 0 && r.rating !== opts.rating) return false;
    const has = !!r.responseBody?.trim();
    if (opts.status === 'unanswered' && has) return false;
    if (opts.status === 'answered' && !has) return false;
    if (q && !norm(`${r.title} ${r.body} ${r.reviewerNickname} ${r.territory}`).includes(q)) return false;
    return true;
  });
  const t = (r: TriageReview) => new Date(r.createdDate).getTime() || 0;
  const cmp: Record<ReviewSort, (a: TriageReview, b: TriageReview) => number> = {
    recent: (a, b) => t(b) - t(a),
    oldest: (a, b) => t(a) - t(b),
    lowest: (a, b) => a.rating - b.rating || t(b) - t(a),
    highest: (a, b) => b.rating - a.rating || t(b) - t(a),
  };
  return [...out].sort(cmp[opts.sort]);
}

function csvCell(v: string | number | null): string {
  let s = v == null ? '' : String(v).replace(/\r?\n/g, ' ');
  // Neutralise l'injection de formule dans Excel / Sheets.
  if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
  return /[";,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function reviewsToCsv(reviews: TriageReview[]): string {
  const head = ['date', 'note', 'pays', 'auteur', 'titre', 'avis', 'reponse'];
  const rows = reviews.map((r) =>
    [r.createdDate.slice(0, 10), r.rating, r.territory, r.reviewerNickname, r.title, r.body, r.responseBody]
      .map(csvCell).join(','),
  );
  return '﻿' + [head.join(','), ...rows].join('\n');
}

/** Phrase « En bref » : ce qu'il faut faire d'abord. */
export function triageSummary(s: ReviewStats): string {
  if (s.total === 0) return 'Aucun avis chargé pour l’instant.';
  if (s.unansweredCritical > 0) {
    const age = s.oldestCriticalDays != null && s.oldestCriticalDays >= 2 ? `, le plus ancien date de ${s.oldestCriticalDays} jours` : '';
    return `${s.unansweredCritical} avis de 1 à 3 ★ attendent ta réponse${age}. Commence par eux : après ta réponse, l’auteur peut modifier son avis.`;
  }
  if (s.unanswered > 0) return `Aucun avis négatif sans réponse. Il reste ${s.unanswered} avis positif${s.unanswered > 1 ? 's' : ''} à remercier.`;
  return 'Tous les avis chargés ont une réponse. Rien à faire ici.';
}
