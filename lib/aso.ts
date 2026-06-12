// Shared ASO helpers: App Store locales, character limits, and a real
// (non-AI) metadata audit. The audit only uses computable facts about the
// metadata, no mock data.

export const LIMITS = {
  title: 30,
  subtitle: 30,
  keywords: 100,
  description: 4000,
  promotional_text: 170,
} as const;

// The full set of App Store Connect localizations (Apple's official locale
// codes). Country is only used to pick a flag emoji; for languages without a
// single obvious country we use the most representative store.
export const ASC_LOCALES: { code: string; label: string; country: string }[] = [
  { code: 'ar-SA', label: 'Arabe', country: 'sa' },
  { code: 'ca', label: 'Catalan', country: 'es' },
  { code: 'zh-Hans', label: 'Chinois (simplifié)', country: 'cn' },
  { code: 'zh-Hant', label: 'Chinois (traditionnel)', country: 'tw' },
  { code: 'hr', label: 'Croate', country: 'hr' },
  { code: 'cs', label: 'Tchèque', country: 'cz' },
  { code: 'da', label: 'Danois', country: 'dk' },
  { code: 'nl-NL', label: 'Néerlandais', country: 'nl' },
  { code: 'en-AU', label: 'Anglais (Australie)', country: 'au' },
  { code: 'en-CA', label: 'Anglais (Canada)', country: 'ca' },
  { code: 'en-GB', label: 'Anglais (R-U)', country: 'gb' },
  { code: 'en-US', label: 'Anglais (US)', country: 'us' },
  { code: 'fi', label: 'Finnois', country: 'fi' },
  { code: 'fr-FR', label: 'Français', country: 'fr' },
  { code: 'fr-CA', label: 'Français (Canada)', country: 'ca' },
  { code: 'de-DE', label: 'Allemand', country: 'de' },
  { code: 'el', label: 'Grec', country: 'gr' },
  { code: 'he', label: 'Hébreu', country: 'il' },
  { code: 'hi', label: 'Hindi', country: 'in' },
  { code: 'hu', label: 'Hongrois', country: 'hu' },
  { code: 'id', label: 'Indonésien', country: 'id' },
  { code: 'it', label: 'Italien', country: 'it' },
  { code: 'ja', label: 'Japonais', country: 'jp' },
  { code: 'ko', label: 'Coréen', country: 'kr' },
  { code: 'ms', label: 'Malais', country: 'my' },
  { code: 'nb', label: 'Norvégien', country: 'no' },
  { code: 'pl', label: 'Polonais', country: 'pl' },
  { code: 'pt-BR', label: 'Portugais (Brésil)', country: 'br' },
  { code: 'pt-PT', label: 'Portugais (Portugal)', country: 'pt' },
  { code: 'ro', label: 'Roumain', country: 'ro' },
  { code: 'ru', label: 'Russe', country: 'ru' },
  { code: 'sk', label: 'Slovaque', country: 'sk' },
  { code: 'es-MX', label: 'Espagnol (Mexique)', country: 'mx' },
  { code: 'es-ES', label: 'Espagnol (Espagne)', country: 'es' },
  { code: 'sv', label: 'Suédois', country: 'se' },
  { code: 'th', label: 'Thaï', country: 'th' },
  { code: 'tr', label: 'Turc', country: 'tr' },
  { code: 'uk', label: 'Ukrainien', country: 'ua' },
  { code: 'vi', label: 'Vietnamien', country: 'vn' },
];

export function localeLabelForCountry(country: string): string {
  return ASC_LOCALES.find((l) => l.country === country)?.label ?? country.toUpperCase();
}

export type AuditSeverity = 'warning' | 'tip';
export type AuditFinding = { severity: AuditSeverity; message: string };
export type AuditResult = { score: number; findings: AuditFinding[] };

export type AuditableFields = {
  title: string;
  subtitle: string;
  keywords: string;
  description: string;
  promotional_text: string;
};

// Generic, low-signal words that usually waste keyword space.
const WASTEFUL = new Set([
  'app', 'apps', 'the', 'and', 'for', 'with', 'your', 'free', 'best', 'top',
  'a', 'an', 'of', 'to', 'in', 'on', 'is', 'it',
]);

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
}

const stemOf = (w: string) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);

// Returns a 0-100 score and a list of concrete, actionable findings. The score
// is split into weighted buckets that reflect real App Store ranking leverage
// (title 30, subtitle 18, keywords 27, description 18, promo 7). Each deduction
// maps to an explainable finding — never a vague "quality" opinion. It judges
// how well the metadata is BUILT for search and conversion, not the prose taste.
export function auditMetadata(f: AuditableFields): AuditResult {
  const findings: AuditFinding[] = [];

  const title = (f.title ?? '').trim();
  const subtitle = (f.subtitle ?? '').trim();
  const keywordsRaw = f.keywords ?? '';
  const description = (f.description ?? '').trim();
  const promo = (f.promotional_text ?? '').trim();

  const titleWords = tokenize(title);
  const subWords = tokenize(subtitle);
  const kWords = tokenize(keywordsRaw);
  const clampBucket = (n: number, max: number) => Math.max(0, Math.min(max, n));

  // ── Title — 30 pts (strongest ranking field) ──────────────────────────────
  let titleS = 30;
  if (title.length === 0) {
    titleS = 0;
    findings.push({ severity: 'warning', message: 'Le titre est vide. C’est le champ qui pèse le plus dans le classement App Store.' });
  } else {
    if (title.length < 15) { titleS -= 10; findings.push({ severity: 'tip', message: `Le titre n’utilise que ${title.length}/${LIMITS.title} caractères. Ajoute un mot-clé fort.` }); }
    else if (title.length < 23) { titleS -= 4; findings.push({ severity: 'tip', message: `Le titre utilise ${title.length}/${LIMITS.title} caractères, tu peux encore caser un mot-clé.` }); }
    if (titleWords.filter((w) => !WASTEFUL.has(w)).length <= 1) {
      titleS -= 12;
      findings.push({ severity: 'warning', message: 'Le titre se limite quasiment au nom de l’app. Ajoute un mot-clé descriptif (ex. « Marque – Versets & Prière »).' });
    }
  }
  titleS = clampBucket(titleS, 30);

  // ── Subtitle — 18 pts (indexed, high value) ───────────────────────────────
  let subS = 18;
  if (subtitle.length === 0) {
    subS = 0;
    findings.push({ severity: 'warning', message: 'Le sous-titre est vide. Il est indexé : remplis-le avec des mots-clés différents du titre.' });
  } else {
    if (subtitle.length < 15) { subS -= 6; findings.push({ severity: 'tip', message: `Le sous-titre n’utilise que ${subtitle.length}/${LIMITS.subtitle} caractères.` }); }
    else if (subtitle.length < 23) { subS -= 3; }
    const titleSet = new Set(titleWords);
    const newWords = subWords.filter((w) => !titleSet.has(w) && !WASTEFUL.has(w));
    if (subWords.length > 0 && newWords.length === 0) {
      subS -= 8;
      findings.push({ severity: 'warning', message: 'Le sous-titre répète les mots du titre. Sers-t’en pour couvrir de NOUVEAUX mots-clés.' });
    }
  }
  subS = clampBucket(subS, 18);

  // ── Keywords field — 27 pts ───────────────────────────────────────────────
  let kwS = 27;
  if (keywordsRaw.trim().length === 0) {
    kwS = 0;
    findings.push({ severity: 'warning', message: 'Le champ mots-clés est vide : 100 caractères indexables inutilisés.' });
  } else {
    if (keywordsRaw.length < 70) { kwS -= 8; findings.push({ severity: 'tip', message: `Le champ mots-clés utilise ${keywordsRaw.length}/${LIMITS.keywords} caractères. Chaque caractère est une chance de ranking.` }); }
    else if (keywordsRaw.length < 90) { kwS -= 3; }

    const spaceMatches = keywordsRaw.match(/,\s/g);
    if (spaceMatches && spaceMatches.length > 0) { kwS -= 3; findings.push({ severity: 'tip', message: `Enlève les espaces après les virgules des mots-clés (~${spaceMatches.length} caractères gaspillés).` }); }

    const kTerms = keywordsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const dupTerms = Array.from(new Set(kTerms.filter((t, i) => kTerms.indexOf(t) !== i)));
    if (dupTerms.length > 0) { kwS -= 3; findings.push({ severity: 'tip', message: `Mots-clés en double : ${dupTerms.join(', ')}.` }); }

    // Words already indexed via title/subtitle (Apple indexes each word once)
    const titleSubWords = new Set([...titleWords, ...subWords]);
    const overlap = Array.from(new Set(kWords)).filter((w) => titleSubWords.has(w));
    if (overlap.length > 0) {
      const recoverable = overlap.reduce((a, w) => a + w.length + 1, 0);
      kwS -= Math.min(10, overlap.length * 3);
      findings.push({ severity: 'warning', message: `Ces mots sont déjà dans ton titre/sous-titre, les répéter ici gaspille de la place : ${overlap.join(', ')} (~${recoverable} caractères récupérables).` });
    }

    // Singular/plural redundancy (Apple stems, so "verse" + "verses" is wasteful)
    const stems: Record<string, string[]> = {};
    for (const w of Array.from(new Set(kWords))) { const s = stemOf(w); (stems[s] ??= []).push(w); }
    const redundant = Object.values(stems).filter((g) => g.length > 1).map((g) => g.join('/'));
    if (redundant.length > 0) { kwS -= Math.min(4, redundant.length * 2); findings.push({ severity: 'tip', message: `Singulier + pluriel redondants (Apple gère les deux) : ${redundant.join(', ')}.` }); }

    const waste = Array.from(new Set(kWords)).filter((w) => WASTEFUL.has(w));
    if (waste.length > 0) { kwS -= 2; findings.push({ severity: 'tip', message: `Mots-clés génériques à retirer : ${waste.join(', ')}.` }); }
  }
  kwS = clampBucket(kwS, 27);

  // Breadth: distinct, meaningful terms across all three indexed fields. Few
  // unique terms = you can only rank for a handful of searches.
  const indexable = new Set([...titleWords, ...subWords, ...kWords].filter((w) => !WASTEFUL.has(w)));
  if (title.length > 0 || subtitle.length > 0 || keywordsRaw.trim().length > 0) {
    if (indexable.size < 8) { kwS = clampBucket(kwS - 4, 27); findings.push({ severity: 'tip', message: `Peu de mots-clés distincts (${indexable.size}). Couvre plus de termes de recherche pour être trouvé plus souvent.` }); }
  }

  // ── Description — 18 pts (conversion; not indexed for keywords on iOS) ─────
  let descS = 18;
  if (description.length === 0) {
    descS = 0;
    findings.push({ severity: 'warning', message: 'La description est vide. Elle ne sert pas au ranking iOS mais c’est elle qui convertit le visiteur en installation.' });
  } else {
    if (description.length < 200) { descS -= 8; findings.push({ severity: 'tip', message: 'Description très courte. Développe les bénéfices, c’est ce qui transforme la visite en installation.' }); }
    else if (description.length < 600) { descS -= 3; }
    const firstLine = description.split('\n')[0].trim();
    if (firstLine.length < 30) { descS -= 4; findings.push({ severity: 'tip', message: 'La 1re ligne est ce qu’on voit avant « plus ». Mets-y une vraie accroche.' }); }
    if (description.length > 700 && !description.includes('\n')) { descS -= 3; findings.push({ severity: 'tip', message: 'Bloc de texte compact. Aère avec des sauts de ligne et des paragraphes pour la lisibilité.' }); }
  }
  descS = clampBucket(descS, 18);

  // ── Promotional text — 7 pts ──────────────────────────────────────────────
  let promoS = 7;
  if (promo.length === 0) {
    promoS = 0;
    findings.push({ severity: 'tip', message: 'Pas de texte promotionnel. Modifiable sans nouvelle version, parfait pour annoncer une promo ou une nouveauté.' });
  }

  const score = Math.max(0, Math.min(100, Math.round(titleS + subS + kwS + descS + promoS)));
  // Surface the most important issues first.
  findings.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'warning' ? -1 : 1));
  return { score, findings };
}

// ── Real keyword metrics, derived from live App Store data ───────────────────
// Apple does not expose true search volume without an Apple Search Ads account,
// so instead of inventing numbers we compute honest, transparent proxies from the
// apps that actually rank for a term (via the iTunes Search API):
//   - difficulty  = how entrenched the top competitors are (rating volume + how
//                   many of them target the keyword in their title)
//   - popularity  = a demand estimate from the aggregate traction of the apps
//                   ranking for the term
//   - appRanking  = the user's real position, matched by App Store id
//                   (apps.asc_app_id == iTunes trackId)
// No mock data, no random numbers. Every value is a function of real results.
export type RankedApp = {
  trackId?: number;
  trackName?: string;
  userRatingCount?: number;
};

export type KeywordMetrics = {
  popularity: number;          // 0-100, estimated search demand
  difficulty: number;          // 0-100, how hard the term is to rank for
  appRanking: number | null;   // user's real position, or null if not in the sample
  sampleSize: number;          // number of ranking apps analysed (transparency)
};

export function computeKeywordMetrics(
  apps: RankedApp[],
  keyword: string,
  userAscAppId?: string | null,
): KeywordMetrics {
  const sample = (apps ?? []).filter((a) => a && typeof a.trackId === 'number');
  const top = sample.slice(0, 10);
  const kw = keyword.trim().toLowerCase();
  const score = (n: number) => Math.max(1, Math.min(99, Math.round(n)));

  let difficulty = 0;
  let popularity = 0;
  if (top.length > 0) {
    // Difficulty: average competitor strength (log-scaled rating volume), with a
    // bonus when the top apps explicitly target the keyword in their title.
    const avgLog = top.reduce((s, a) => s + Math.log10((a.userRatingCount ?? 0) + 1), 0) / top.length;
    const strength = Math.min(85, (avgLog / 6.5) * 85); // ~3M avg ratings -> 85
    const titleMatch = kw
      ? top.filter((a) => (a.trackName ?? '').toLowerCase().includes(kw)).length / top.length
      : 0;
    difficulty = score(strength + titleMatch * 15);

    // Popularity: demand proxy from total traction of the ranking apps.
    const totalRatings = top.reduce((s, a) => s + (a.userRatingCount ?? 0), 0);
    popularity = score((Math.log10(totalRatings + 1) / 7.3) * 100); // ~20M total -> 100
  }

  let appRanking: number | null = null;
  if (userAscAppId) {
    const target = Number(userAscAppId);
    if (!Number.isNaN(target)) {
      const idx = sample.findIndex((a) => Number(a.trackId) === target);
      if (idx >= 0) appRanking = idx + 1;
    }
  }

  return { popularity, difficulty, appRanking, sampleSize: sample.length };
}
