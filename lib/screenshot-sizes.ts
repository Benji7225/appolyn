// Tailles de screenshots App Store Connect. Source : page officielle « Screenshot
// specifications » d'Apple (developer.apple.com/help/app-store-connect/reference/app-information/
// screenshot-specifications/), lue le 25/11/2026. Les tailles Duo/Mac/TV/Vision/Watch
// ne sont pas validées ici (outil limité à iPhone et iPad).

export type SizeSet = {
  id: string;
  device: 'iPhone' | 'iPad';
  label: string;
  /** Portrait [largeur, hauteur]. Le paysage est l'inverse. */
  sizes: [number, number][];
  need: 'required' | 'conditional' | 'optional';
  note: string;
};

export const SIZE_SETS: SizeSet[] = [
  { id: 'iphone-di-large', device: 'iPhone', label: 'Dynamic Island (large, 6.9")', sizes: [[1320, 2868], [1290, 2796], [1260, 2736]], need: 'optional', note: 'Optionnel. Si absent, Apple utilise le set Face ID (large).' },
  { id: 'iphone-faceid-large', device: 'iPhone', label: 'Face ID (large, 6.5")', sizes: [[1284, 2778], [1242, 2688]], need: 'conditional', note: 'Obligatoire si le set Dynamic Island (large) n’est pas fourni.' },
  { id: 'iphone-di-medium', device: 'iPhone', label: 'Dynamic Island (medium, 6.3")', sizes: [[1206, 2622], [1179, 2556]], need: 'required', note: 'Le minimum exigé pour toute app iPhone.' },
  { id: 'iphone-faceid-medium', device: 'iPhone', label: 'Face ID (medium)', sizes: [[1170, 2532], [1125, 2436], [1080, 2340]], need: 'optional', note: 'Optionnel. Repli : Dynamic Island (medium).' },
  { id: 'iphone-home-large', device: 'iPhone', label: 'Home Button (large, 5.5")', sizes: [[1242, 2208]], need: 'optional', note: 'Optionnel. Repli : Face ID (medium).' },
  { id: 'iphone-home-medium', device: 'iPhone', label: 'Home Button (medium, 4.7")', sizes: [[750, 1334]], need: 'optional', note: 'Optionnel. Repli : Home Button (large).' },
  { id: 'ipad-13', device: 'iPad', label: 'iPad 13"', sizes: [[2064, 2752], [2048, 2732]], need: 'conditional', note: 'Obligatoire si l’app tourne sur iPad.' },
  { id: 'ipad-11', device: 'iPad', label: 'iPad 11"', sizes: [[1488, 2266], [1512, 2316], [1668, 2420], [1668, 2388], [1640, 2360]], need: 'optional', note: 'Optionnel. Repli : iPad 13".' },
  { id: 'ipad-105', device: 'iPad', label: 'iPad 10.5"', sizes: [[1668, 2224]], need: 'optional', note: 'Optionnel. Repli : iPad 12.9".' },
];

export const MAX_PER_SET = 10;
export const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

export type Match = { set: SizeSet; orientation: 'portrait' | 'landscape' };

export function matchSize(w: number, h: number): Match | null {
  for (const set of SIZE_SETS) {
    for (const [sw, sh] of set.sizes) {
      if (w === sw && h === sh) return { set, orientation: 'portrait' };
      if (w === sh && h === sw) return { set, orientation: 'landscape' };
    }
  }
  return null;
}

/** Plus proche taille connue (même ratio le plus proche), pour dire quoi viser. */
export function closestSize(w: number, h: number): [number, number] {
  const ratio = Math.min(w, h) / Math.max(w, h);
  let best: [number, number] = SIZE_SETS[0].sizes[0];
  let bestDiff = Infinity;
  for (const set of SIZE_SETS) {
    for (const s of set.sizes) {
      const d = Math.abs(s[0] / s[1] - ratio);
      if (d < bestDiff) { bestDiff = d; best = s; }
    }
  }
  return best;
}

/** Vrai si un PNG contient de la transparence (type de couleur 4/6 ou bloc tRNS). */
export function pngHasAlpha(bytes: Uint8Array): boolean {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 33 || sig.some((b, i) => bytes[i] !== b)) return false;
  const colorType = bytes[25];
  if (colorType === 4 || colorType === 6) {
    // Un PNG RGBA entièrement opaque est quand même refusé par Apple : on le signale.
    return true;
  }
  let p = 8;
  while (p + 8 <= bytes.length) {
    const len = ((bytes[p] << 24) | (bytes[p + 1] << 16) | (bytes[p + 2] << 8) | bytes[p + 3]) >>> 0;
    const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
    if (type === 'tRNS') return true;
    if (type === 'IDAT' || type === 'IEND') return false;
    p += 12 + len;
  }
  return false;
}

export type FileVerdict = {
  name: string;
  w: number;
  h: number;
  ok: boolean;
  match: Match | null;
  problems: string[];
  suggestion: string | null;
};

export function judgeFile(name: string, type: string, w: number, h: number, alpha: boolean): FileVerdict {
  const problems: string[] = [];
  let suggestion: string | null = null;
  if (!ACCEPTED_TYPES.includes(type)) problems.push('Format non accepté : Apple prend uniquement PNG et JPEG.');
  if (alpha) problems.push('Le PNG contient un canal alpha (transparence) : App Store Connect le refuse. Exporte sans transparence, ou en JPEG.');
  const match = matchSize(w, h);
  if (!match) {
    const [cw, ch] = closestSize(w, h);
    problems.push(`${w} × ${h} n’est pas une taille acceptée.`);
    suggestion = `La plus proche en proportions : ${cw} × ${ch} (ou ${ch} × ${cw} en paysage).`;
  }
  return { name, w, h, ok: problems.length === 0, match, problems, suggestion };
}
