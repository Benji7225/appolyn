// Code couleur OFFICIEL des étapes du tunnel de conversion Appolyn.
// Réutilisable PARTOUT (analytics, carte, segments, badges…) pour qu'une même
// étape ait toujours la même couleur dans tout le produit.
// Convention clé : le VERT = les utilisateurs PAYANTS (acheteurs).
// Ordre = la chaîne de conversion mobile, du plus large (en haut de l'entonnoir)
// au plus précieux (en bas).

export type FunnelStageKey = 'impressions' | 'pageViews' | 'downloads' | 'trials' | 'payers';

export type FunnelStage = {
  key: FunnelStageKey;
  label: string;
  short: string;
  color: string; // couleur pleine (texte, points, accents)
  tint: string;  // fond translucide (remplissage du cône)
};

export const FUNNEL_STAGES: FunnelStage[] = [
  { key: 'impressions', label: 'Impressions',     short: 'Impr.',   color: '#2563eb', tint: 'rgba(37,99,235,0.14)' },   // bleu
  { key: 'pageViews',   label: 'Vues fiche',       short: 'Vues',    color: '#c026d3', tint: 'rgba(192,38,211,0.14)' },  // magenta
  { key: 'downloads',   label: 'Téléchargements',  short: 'Téléch.', color: '#ec4899', tint: 'rgba(236,72,153,0.14)' },  // rose
  { key: 'trials',      label: 'Essais',           short: 'Essais',  color: '#f97316', tint: 'rgba(249,115,22,0.14)' },   // orange
  { key: 'payers',      label: 'Payants',          short: 'Payants', color: '#16a34a', tint: 'rgba(22,163,74,0.14)' },    // vert = acheteurs
];

// Accès direct à la couleur d'une étape (ex: FUNNEL_COLOR.payers pour colorer les
// acheteurs sur une carte ou un graphe).
export const FUNNEL_COLOR: Record<FunnelStageKey, string> = FUNNEL_STAGES.reduce(
  (acc, s) => { acc[s.key] = s.color; return acc; },
  {} as Record<FunnelStageKey, string>,
);
