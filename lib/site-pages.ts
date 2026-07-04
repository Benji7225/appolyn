// Pages « annexes » du site public (FAQ, contact, légales…). Préfaites + éditables
// par le dev, persistées dans published_sites.pages. Vide = on propose un modèle
// honnête que le dev relit et adapte. Aucune donnée inventée sur l'app.

export type SitePage = { active: boolean; title: string; body: string };
export type SitePages = Record<string, SitePage>;

// Sections de contenu LIBRES ajoutées par le dev sur l'accueil de son site (titre +
// texte + image optionnelle), pour le SEO et raconter l'app au-delà de la fiche App
// Store. Stockées dans published_sites.overrides.sections.
export type SiteSection = { id: string; title: string; body: string; image?: string };

export type PageCtx = { name: string; seller?: string; description?: string; email?: string };

// Catégorie App Store en français (le libellé iTunes est en anglais). Mapping FACTUEL
// des catégories Apple officielles, pas une invention : inconnu → on garde tel quel.
const FR_CATEGORIES: Record<string, string> = {
  'books': 'Livres', 'business': 'Économie et entreprise', 'developer tools': 'Outils de développement',
  'education': 'Éducation', 'entertainment': 'Divertissement', 'finance': 'Finance',
  'food & drink': 'Cuisine et boissons', 'games': 'Jeux', 'graphics & design': 'Graphisme et design',
  'health & fitness': 'Forme et santé', 'lifestyle': 'Style de vie', 'kids': 'Enfants',
  'magazines & newspapers': 'Magazines et journaux', 'medical': 'Médecine', 'music': 'Musique',
  'navigation': 'Navigation', 'news': 'Actualités', 'photo & video': 'Photo et vidéo',
  'productivity': 'Productivité', 'reference': 'Références', 'shopping': 'Shopping',
  'social networking': 'Réseaux sociaux', 'sports': 'Sports', 'travel': 'Voyages',
  'utilities': 'Utilitaires', 'weather': 'Météo', 'stickers': 'Autocollants',
};
export const frCategory = (genre?: string): string => {
  const g = (genre ?? '').trim();
  return FR_CATEGORIES[g.toLowerCase()] ?? g;
};

// Libellé français d'un code langue ISO2 (pour la section « Disponible en X langues »).
const LANG_LABELS: Record<string, string> = {
  EN: 'Anglais', FR: 'Français', DE: 'Allemand', ES: 'Espagnol', IT: 'Italien',
  PT: 'Portugais', NL: 'Néerlandais', JA: 'Japonais', KO: 'Coréen', ZH: 'Chinois',
  RU: 'Russe', AR: 'Arabe', TR: 'Turc', PL: 'Polonais', SV: 'Suédois', DA: 'Danois',
  FI: 'Finnois', NB: 'Norvégien', NO: 'Norvégien', CS: 'Tchèque', EL: 'Grec',
  HE: 'Hébreu', HI: 'Hindi', ID: 'Indonésien', MS: 'Malais', RO: 'Roumain',
  SK: 'Slovaque', TH: 'Thaï', UK: 'Ukrainien', VI: 'Vietnamien', HU: 'Hongrois',
  CA: 'Catalan', HR: 'Croate',
};
export const langLabel = (code: string): string => LANG_LABELS[code.toUpperCase().split('-')[0]] ?? code.toUpperCase();

// Beaucoup d'apps mettent en tête de description leurs CONDITIONS D'ABONNEMENT / liens
// légaux. Ce n'est jamais une bonne accroche : on l'écarte de l'accroche, des
// paragraphes et des puces du site (le site a des pages légales dédiées). N'invente rien.
export const isBoilerplate = (t: string): boolean => {
  const s = (t ?? '').toLowerCase().trim();
  if (!s) return false;
  if (/^https?:\/\/\S+$/.test(s)) return true;
  return (
    /renouvellement automatique|se renouvelle automatiquement|auto[- ]?renew|politique de confidentialit|privacy policy|conditions (g[ée]n[ée]rales )?(d[’']?(utilisation|usage))|terms of (use|service)|\beula\b|sera d[ée]bit|will be charged|paiement sera pr[ée]lev|contrat de licence/.test(s)
    || /(abonnement|subscription)[^.]{0,60}(mensuel|annuel|hebdomadaire|\/\s?mois|\/\s?an|par mois|par an|monthly|yearly|weekly|\d+[.,]\d{2}\s*[€$£])/.test(s)
    || /^[-•*·]?\s*(pro\s+)?(mensuel|annuel|hebdomadaire|monthly|yearly|weekly)\b/.test(s)
  );
};

// 1re phrase « propre » de la description App Store, pour pré-remplir les pages
// avec du vrai contenu (pas un placeholder vide). On saute le boilerplate d'abonnement/
// légal en tête (ex. « … est un abonnement à renouvellement automatique. ») pour ne pas
// décrire l'app par ses conditions d'abonnement dans la FAQ / « Comment ça marche ».
function firstSentence(desc?: string): string {
  if (!desc) return '';
  const lines = desc.split('\n').map((l) => l.trim()).filter((l) => l.length > 30);
  const flat = lines.find((l) => !isBoilerplate(l)) ?? lines[0] ?? desc.trim();
  const m = flat.match(/^(.{30,220}?[.!?])(\s|$)/);
  return (m ? m[1] : flat.slice(0, 200)).trim();
}

export const PAGE_DEFS: {
  key: string; label: string; defaultTitle: string; build: (ctx: PageCtx) => string;
}[] = [
  {
    key: 'faq', label: 'FAQ', defaultTitle: 'Questions fréquentes',
    build: ({ name, description }) => [
      `Qu'est-ce que ${name} ?`,
      firstSentence(description) || `${name} est une application iOS. Décris ici en une phrase ce qu'elle fait et pour qui.`,
      '',
      'Est-ce gratuit ?',
      'Explique ton modèle : gratuit, essai, ou abonnement. Sois clair sur ce qui est inclus.',
      '',
      'Comment gérer mon abonnement ?',
      'Depuis Réglages iOS > ton compte > Abonnements. Tu peux annuler à tout moment.',
      '',
      "J'ai un souci, comment vous joindre ?",
      'Écris-nous, on répond généralement sous 48 h (voir la page Contact).',
    ].join('\n'),
  },
  {
    key: 'how', label: 'Comment ça marche', defaultTitle: 'Comment ça marche',
    build: ({ name, description }) => [
      firstSentence(description) || `${name} t'aide au quotidien.`,
      '',
      `Bien démarrer avec ${name}, en 3 étapes :`,
      '',
      '1. Télécharge l\'app sur l\'App Store.',
      '2. Ouvre-la et suis l\'introduction.',
      '3. Profite. Ajoute ici les détails propres à ton app.',
    ].join('\n'),
  },
  {
    key: 'contact', label: 'Contact', defaultTitle: 'Nous contacter',
    build: ({ name, seller, email }) => [
      `Une question sur ${name} ? On est là.`,
      '',
      `Email : ${email || '[TON EMAIL DE CONTACT]'}`,
      'On répond généralement sous 48 h.',
      '',
      seller ? `Éditeur : ${seller}` : 'Éditeur : [TON NOM / TA SOCIÉTÉ]',
    ].join('\n'),
  },
  {
    key: 'privacy', label: 'Confidentialité', defaultTitle: 'Politique de confidentialité',
    build: ({ name, seller, email }) => [
      `${name}${seller ? `, édité par ${seller},` : ''} respecte ta vie privée.`,
      '',
      'Données collectées',
      "- Données d'usage anonymes pour améliorer l'expérience.",
      '- Aucune donnée n\'est vendue à des tiers.',
      'Cette page doit rester cohérente avec ta déclaration « Confidentialité de l\'app » sur l\'App Store.',
      '',
      'Tes droits',
      `Tu peux demander l'accès, la rectification ou la suppression de tes données à : ${email || '[TON EMAIL]'}.`,
    ].join('\n'),
  },
  {
    key: 'terms', label: 'Conditions', defaultTitle: 'Conditions d\'utilisation',
    build: ({ name }) => [
      `En utilisant ${name}, tu acceptes les présentes conditions.`,
      '',
      'Utilisation',
      `${name} est fournie « telle quelle ». Tu t'engages à en faire un usage conforme à la loi.`,
      '',
      'Abonnements',
      "Les abonnements éventuels sont gérés par l'App Store et se renouvellent automatiquement sauf annulation.",
      '',
      '[À COMPLÉTER selon ton app.]',
    ].join('\n'),
  },
];

export const PAGE_KEYS = PAGE_DEFS.map((p) => p.key);
export const pageDef = (key: string) => PAGE_DEFS.find((p) => p.key === key);

// Contenu effectif d'une page : ce que le dev a saisi, sinon le modèle par défaut.
export function effectivePage(key: string, pages: SitePages | null | undefined, ctx: PageCtx): { title: string; body: string; active: boolean } | null {
  const def = pageDef(key);
  if (!def) return null;
  const saved = pages?.[key];
  return {
    // Actives PAR DÉFAUT : les pages standard sont déjà là, même sans édition.
    active: saved?.active ?? true,
    title: (saved?.title?.trim()) || def.defaultTitle,
    body: (saved?.body?.trim()) || def.build(ctx),
  };
}

// Nettoie un corps de page pour le RENDU PUBLIC : on ne publie JAMAIS un placeholder
// du modèle. On substitue d'abord les tokens remplissables (email de contact, nom de
// l'éditeur), puis on retire proprement le reste (parenthèses d'instruction, tokens
// entre crochets, phrases-instructions du modèle). Idempotent : un body déjà rédigé
// par le dev (sans placeholder) ressort inchangé.
const INSTR_SENTENCE = /(décris ici|explique ton modèle|sois clair sur ce qui est inclus|ajoute ici|remplace par tes vraies)/i;

export function cleanPublicBody(body: string, ctx: { email?: string; seller?: string }): string {
  let filled = body;
  if (ctx.email) filled = filled.replace(/\[TON EMAIL( DE CONTACT)?\]/gi, ctx.email);
  if (ctx.seller) filled = filled.replace(/\[TON NOM ?\/ ?TA SOCIÉTÉ\]/gi, ctx.seller);

  const lines = filled.split('\n').map((line) => {
    // 1) parenthèses d'instruction entières : "(remplace par tes vraies étapes)"
    let l = line.replace(/\s*\([^)]*(remplace par tes vraies|décris ici|ajoute ici|explique ton)[^)]*\)/gi, '');
    // 2) tokens crochets non remplis : "[À COMPLÉTER …]", "[TON EMAIL]"…
    l = l.replace(/\s*\[[^\]]*\]/g, '');
    // 2b) connecteur orphelin laissé par un token retiré (ex. « … tes données à :. »
    //     quand aucun email n'est renseigné) → phrase propre « … tes données. ».
    //     (les étiquettes seules type « Email : » sont retirées plus bas.)
    l = l.replace(/\s+(?:à|au|via|par)\s*:\s*(?=[.!?]|$)/gi, '');
    // 3) phrases-instructions résiduelles (au sein d'une ligne multi-phrases)
    l = l.split(/(?<=[.!?])\s+/).filter((s) => !INSTR_SENTENCE.test(s)).join(' ');
    return l.replace(/\s{2,}/g, ' ').trimEnd();
  })
    // Retire les étiquettes orphelines laissées par un token non rempli (ex. « Email : »,
    // « Éditeur : ») — une étiquette courte suivie de « : » et plus rien.
    .filter((l) => !/^[^\s:]{1,15}\s*:\s*$/.test(l));

  // Retire un paragraphe de boilerplate d'abonnement/légal EN TÊTE du body (ex. une page
  // « Comment ça marche » stockée à la publication qui commençait par « … est un
  // abonnement à renouvellement automatique. »). Uniquement en tête → ne casse pas une
  // FAQ (dont la 1re ligne est une question, pas du boilerplate).
  while (lines.length && (lines[0].trim() === '' || isBoilerplate(lines[0]))) lines.shift();

  return lines.join('\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
