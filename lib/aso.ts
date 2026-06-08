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

export const ASC_LOCALES: { code: string; label: string; country: string }[] = [
  { code: 'en-US', label: 'English (US)', country: 'us' },
  { code: 'en-GB', label: 'English (UK)', country: 'gb' },
  { code: 'fr-FR', label: 'French', country: 'fr' },
  { code: 'de-DE', label: 'German', country: 'de' },
  { code: 'es-ES', label: 'Spanish (Spain)', country: 'es' },
  { code: 'es-MX', label: 'Spanish (Mexico)', country: 'mx' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)', country: 'br' },
  { code: 'it-IT', label: 'Italian', country: 'it' },
  { code: 'ja', label: 'Japanese', country: 'jp' },
  { code: 'ko', label: 'Korean', country: 'kr' },
  { code: 'zh-Hans', label: 'Chinese (Simplified)', country: 'cn' },
  { code: 'zh-Hant', label: 'Chinese (Traditional)', country: 'tw' },
  { code: 'nl-NL', label: 'Dutch', country: 'nl' },
  { code: 'sv', label: 'Swedish', country: 'se' },
  { code: 'da', label: 'Danish', country: 'dk' },
  { code: 'fi', label: 'Finnish', country: 'fi' },
  { code: 'nb', label: 'Norwegian', country: 'no' },
  { code: 'pl', label: 'Polish', country: 'pl' },
  { code: 'ru', label: 'Russian', country: 'ru' },
  { code: 'tr', label: 'Turkish', country: 'tr' },
  { code: 'ar-SA', label: 'Arabic', country: 'sa' },
  { code: 'hi', label: 'Hindi', country: 'in' },
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

// Returns a 0-100 score and a list of concrete, actionable findings.
export function auditMetadata(f: AuditableFields): AuditResult {
  const findings: AuditFinding[] = [];
  let score = 100;

  const title = (f.title ?? '').trim();
  const subtitle = (f.subtitle ?? '').trim();
  const keywordsRaw = f.keywords ?? '';
  const description = (f.description ?? '').trim();
  const promo = (f.promotional_text ?? '').trim();

  // Title (strongest ranking field)
  if (title.length === 0) {
    findings.push({ severity: 'warning', message: 'Title is empty. It is the single strongest ranking field.' });
    score -= 25;
  } else if (title.length < 20) {
    findings.push({ severity: 'tip', message: `Title uses only ${title.length}/${LIMITS.title} characters. Fill more of it with a relevant keyword.` });
    score -= 8;
  }

  // Subtitle (high-value indexed field)
  if (subtitle.length === 0) {
    findings.push({ severity: 'warning', message: 'Subtitle is empty. It is indexed and high-value, add keyword-rich copy.' });
    score -= 15;
  } else if (subtitle.length < 20) {
    findings.push({ severity: 'tip', message: `Subtitle uses only ${subtitle.length}/${LIMITS.subtitle} characters.` });
    score -= 5;
  }

  // Keywords field usage
  if (keywordsRaw.length === 0) {
    findings.push({ severity: 'warning', message: 'Keywords field is empty, you are leaving 100 indexable characters unused.' });
    score -= 20;
  } else if (keywordsRaw.length < 80) {
    findings.push({ severity: 'tip', message: `Keywords field uses ${keywordsRaw.length}/${LIMITS.keywords} characters. Every character is a ranking opportunity.` });
    score -= 6;
  }

  // Spaces after commas waste characters
  const spaceMatches = keywordsRaw.match(/,\s/g);
  if (spaceMatches && spaceMatches.length > 0) {
    findings.push({ severity: 'tip', message: `Remove the spaces after commas in keywords (~${spaceMatches.length} characters wasted).` });
    score -= 3;
  }

  // Duplicate keyword terms
  const kTerms = keywordsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  const dupTerms = Array.from(new Set(kTerms.filter((t, i) => kTerms.indexOf(t) !== i)));
  if (dupTerms.length > 0) {
    findings.push({ severity: 'tip', message: `Duplicate keyword(s): ${dupTerms.join(', ')}.` });
    score -= 3;
  }

  // Words already in title/subtitle repeated in keywords (Apple indexes each word once)
  const titleSubWords = new Set([...tokenize(title), ...tokenize(subtitle)]);
  const keywordWords = new Set(tokenize(keywordsRaw));
  const overlap = Array.from(keywordWords).filter((w) => titleSubWords.has(w));
  if (overlap.length > 0) {
    const recoverable = overlap.reduce((a, w) => a + w.length + 1, 0);
    findings.push({
      severity: 'warning',
      message: `These words are already in your title/subtitle, repeating them in keywords wastes space: ${overlap.join(', ')} (~${recoverable} characters recoverable).`,
    });
    score -= Math.min(15, overlap.length * 4);
  }

  // Generic / low-value keywords
  const waste = Array.from(keywordWords).filter((w) => WASTEFUL.has(w));
  if (waste.length > 0) {
    findings.push({ severity: 'tip', message: `Generic keyword(s) you can probably drop: ${waste.join(', ')}.` });
    score -= 2;
  }

  // Title and subtitle repeating each other
  const titleWords = new Set(tokenize(title));
  const subOverlap = Array.from(new Set(tokenize(subtitle).filter((w) => titleWords.has(w))));
  if (subOverlap.length > 0) {
    findings.push({ severity: 'tip', message: `Title and subtitle repeat: ${subOverlap.join(', ')}. Use different words to cover more search terms.` });
    score -= 3;
  }

  // Description (conversion, not indexed for keywords on iOS)
  if (description.length < 100) {
    findings.push({ severity: 'tip', message: 'Description is very short. It drives conversion even though it is not indexed for keywords on iOS.' });
    score -= 4;
  }

  // Promotional text
  if (promo.length === 0) {
    findings.push({ severity: 'tip', message: 'No promotional text. It can be updated anytime without a new app version, useful for campaigns.' });
    score -= 2;
  }

  return { score: Math.max(0, Math.round(score)), findings };
}
