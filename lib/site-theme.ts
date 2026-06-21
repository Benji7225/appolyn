// Thème du SITE PUBLIC d'une app (route /site/[slug]). AUTONOME : il ne dépend PAS
// des tokens du dashboard Appolyn (qui peuvent basculer en sombre) — il pose ses
// propres variables CSS sur le conteneur racine du site. Toute la marque découle
// de la SEULE couleur d'accent choisie par le dev (overrides.accent), avec un repli
// sobre. Sert les deux routes publiques (accueil + pages annexes) pour un rendu
// cohérent. Zéro dépendance, calcul pur (utilisable côté serveur).

type Rgb = { r: number; g: number; b: number };

const DEFAULT_ACCENT = '#4f46e5'; // indigo sobre, premium, par défaut

function hexToRgb(hex: string): Rgb | null {
  const raw = hex.trim().replace('#', '');
  const s = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
}

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const toHex = ({ r, g, b }: Rgb) => '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
const mix = (a: Rgb, b: Rgb, amt: number): Rgb => ({ r: a.r + (b.r - a.r) * amt, g: a.g + (b.g - a.g) * amt, b: a.b + (b.b - a.b) * amt });

// Luminance relative (WCAG) pour choisir un texte lisible posé SUR l'accent.
function luminance({ r, g, b }: Rgb): number {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export type SiteTheme = {
  accent: string;        // hex solide (boutons pleins, bandeaux)
  accentInk: string;     // version assombrie pour du TEXTE sur fond clair (contraste)
  onAccent: string;      // texte lisible posé SUR l'accent
  vars: Record<string, string>; // variables CSS à poser sur le conteneur racine
};

// Construit le thème complet à partir de l'accent du dev (ou du repli).
export function siteTheme(accent?: string | null): SiteTheme {
  const hex = accent && hexToRgb(accent) ? accent : DEFAULT_ACCENT;
  const rgb = hexToRgb(hex)!;
  const lum = luminance(rgb);
  const black: Rgb = { r: 0, g: 0, b: 0 };

  // Texte sur l'accent : noir profond si l'accent est clair, blanc sinon.
  const onAccent = lum > 0.55 ? '#0b1220' : '#ffffff';
  // Texte d'accent sur fond BLANC : on assombrit les accents clairs pour le contraste.
  const inkAmt = lum > 0.5 ? 0.42 : lum > 0.28 ? 0.16 : 0;
  const accentInk = toHex(mix(rgb, black, inkAmt));
  const accentDeep = toHex(mix(rgb, black, 0.2)); // pour les dégradés / hover
  const rgba = (a: number) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;

  return {
    accent: hex,
    accentInk,
    onAccent,
    vars: {
      '--ac': hex,
      '--ac-deep': accentDeep,
      '--ac-ink': accentInk,
      '--ac-on': onAccent,
      '--ac-soft': rgba(0.1),
      '--ac-softer': rgba(0.05),
      '--ac-line': rgba(0.18),
      '--ac-glow': rgba(0.22),
      // Neutres FIXES du site (thème clair premium, indépendant du dashboard).
      '--ink': '#0e1525',
      '--sub': '#54607a',
      '--line': '#e7e9f0',
      '--surface': '#ffffff',
      '--panel': '#f6f7fb',
    },
  };
}
