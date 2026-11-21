// Vérificateur de métadonnées App Store (outil gratuit public, anglais).
// Pur et déterministe : aucune donnée inventée, tout se calcule dans le navigateur.

export const IOS_LIMITS = { title: 30, subtitle: 30, keywords: 100, promo: 170 } as const;

const GENERIC = new Set(['app', 'apps', 'the', 'and', 'for', 'with', 'your', 'free', 'best', 'top', 'a', 'an', 'of', 'to', 'in', 'on', 'is', 'it']);
const tokenize = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
const stem = (w: string) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);

export type Finding = { level: 'error' | 'warn' | 'tip'; text: string };
export type MetadataInput = { title: string; subtitle: string; keywords: string; promo: string };
export type MetadataCheck = {
  findings: Finding[];
  cleanedKeywords: string;
  removed: { term: string; reason: string }[];
  charsSaved: number;
  keywordsUsed: number;
};

export function checkMetadata(m: MetadataInput): MetadataCheck {
  const findings: Finding[] = [];
  const title = m.title.trim(), subtitle = m.subtitle.trim();
  const over = (name: string, len: number, max: number) => {
    if (len > max) findings.push({ level: 'error', text: `${name} is ${len - max} character${len - max > 1 ? 's' : ''} over the ${max}-character limit. App Store Connect will refuse it.` });
  };
  over('Title', title.length, IOS_LIMITS.title);
  over('Subtitle', subtitle.length, IOS_LIMITS.subtitle);
  over('Keyword field', m.keywords.length, IOS_LIMITS.keywords);
  over('Promotional text', m.promo.length, IOS_LIMITS.promo);

  if (title && title.length <= IOS_LIMITS.title && title.length < 20) findings.push({ level: 'tip', text: `Your title uses ${title.length}/30 characters. Title words weigh the most in search: add a descriptive keyword after the name.` });
  if (subtitle && subtitle.length <= IOS_LIMITS.subtitle && subtitle.length < 20) findings.push({ level: 'tip', text: `Your subtitle uses ${subtitle.length}/30 characters. It is indexed too: use the space for different keywords than the title.` });
  if (!subtitle) findings.push({ level: 'warn', text: 'The subtitle is empty. It is indexed for search, so leaving it blank wastes 30 characters.' });

  const titleWords = new Set(tokenize(title));
  const subWords = tokenize(subtitle).filter((w) => !GENERIC.has(w));
  if (subWords.length > 0 && subWords.every((w) => titleWords.has(w))) findings.push({ level: 'warn', text: 'The subtitle only repeats words from the title. Apple already indexes the title: use new words.' });

  const indexed = new Set<string>(Array.from(titleWords).concat(tokenize(subtitle)));
  const seenTerms = new Set<string>();
  const seenStems = new Map<string, string>();
  const kept: string[] = [];
  const removed: { term: string; reason: string }[] = [];
  for (const piece of m.keywords.split(',')) {
    const term = piece.trim().replace(/\s+/g, ' ');
    if (!term) continue;
    const key = term.toLowerCase();
    const words = tokenize(term);
    if (seenTerms.has(key)) { removed.push({ term, reason: 'duplicate' }); continue; }
    if (words.length && words.every((w) => GENERIC.has(w))) { removed.push({ term, reason: 'generic word' }); continue; }
    if (words.length && words.every((w) => indexed.has(w))) { removed.push({ term, reason: 'already in title or subtitle' }); continue; }
    if (words.length === 1) {
      const s = stem(words[0]);
      const prev = seenStems.get(s);
      if (prev) { removed.push({ term, reason: `singular/plural of “${prev}”` }); continue; }
      seenStems.set(s, term);
    }
    seenTerms.add(key);
    kept.push(term);
  }
  if (/,\s/.test(m.keywords)) findings.push({ level: 'warn', text: 'There are spaces after your commas. Each one costs a character. Separate keywords with commas only.' });
  if (removed.length) findings.push({ level: 'warn', text: `${removed.length} keyword${removed.length > 1 ? 's are' : ' is'} wasting space (duplicates, generic words, or words already indexed from the title/subtitle).` });
  const cleaned = kept.join(',');
  if (m.keywords.trim() && cleaned.length < 85 && !removed.length && m.keywords.length <= IOS_LIMITS.keywords) findings.push({ level: 'tip', text: `The keyword field uses ${cleaned.length}/100 characters. Fill the rest with relevant terms.` });
  if (!findings.length && (title || subtitle || m.keywords)) findings.push({ level: 'tip', text: 'No structural problem found. Next step: check that your keywords match what people actually search for.' });

  return { findings, cleanedKeywords: cleaned, removed, charsSaved: Math.max(0, m.keywords.trim().length - cleaned.length), keywordsUsed: m.keywords.length };
}
