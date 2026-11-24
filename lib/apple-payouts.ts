// Calendrier fiscal Apple et dates de versement estimées.
// Fonctions pures. Règles (sources : Appfigures « Apple's fiscal payout calendar »,
// RevenueCat « App Store fiscal calendar and payment dates ») :
//  - chaque trimestre fiscal = un mois de 35 jours et deux mois de 28 jours ;
//  - Apple verse 33 jours après la fin du mois fiscal ;
//  - Apple ne publie pas de calendrier machine-lisible : le calendrier officiel est dans
//    App Store Connect. Tout ce qui n'est pas « confirmé » ci-dessous est une ESTIMATION.
// Ancre confirmée (Appfigures, 2026-2027) : mois d'octobre 2026 = 27/09 → 31/10 (versé le 03/12/2026),
// mois de novembre 2026 = 01/11 → 28/11 (versé le 31/12/2026). Au-delà, on prolonge le motif
// 5-4-4 semaines : une année « à semaine en plus » peut décaler ces dates d'une semaine.

export type FiscalMonth = {
  key: string; // YYYY-MM du mois dans lequel tombe la fin
  label: string; // « octobre 2026 »
  start: string; // YYYY-MM-DD (inclus)
  end: string; // YYYY-MM-DD (inclus)
  payDate: string; // YYYY-MM-DD
  confirmed: boolean;
};

export type PayoutStatus = 'running' | 'pending' | 'paid';

const DAY = 86400000;
const PAY_DELAY_DAYS = 33;
const ANCHOR_START = Date.UTC(2026, 8, 27); // 27 septembre 2026 (dimanche)
const CONFIRMED_KEYS = new Set(['2026-10', '2026-11']);
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
// Semaines par mois fiscal dans un trimestre : 5-4-4 (octobre, novembre, décembre fiscaux…).
const WEEKS = [5, 4, 4];

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function monthAt(startMs: number, weeks: number): FiscalMonth {
  const endMs = startMs + weeks * 7 * DAY - DAY;
  const e = new Date(endMs);
  const key = `${e.getUTCFullYear()}-${String(e.getUTCMonth() + 1).padStart(2, '0')}`;
  return {
    key,
    label: `${MONTHS[e.getUTCMonth()]} ${e.getUTCFullYear()}`,
    start: iso(startMs),
    end: iso(endMs),
    payDate: iso(endMs + PAY_DELAY_DAYS * DAY),
    confirmed: CONFIRMED_KEYS.has(key),
  };
}

// Mois fiscaux de `before` mois avant l'ancre à `after` mois après. Avant l'ancre on ne remonte que d'un mois : plus loin, le motif n'est pas vérifié.
export function fiscalMonths(before = 1, after = 8): FiscalMonth[] {
  const out: FiscalMonth[] = [];
  // Ancre = premier mois d'un trimestre (position 0 du motif 5-4-4).
  for (let i = -before; i <= after; i++) {
    const q = Math.floor(i / 3);
    const pos = ((i % 3) + 3) % 3;
    // décalage en semaines depuis l'ancre : trimestres de 13 semaines
    const weeksFromAnchor = q * 13 + WEEKS.slice(0, pos).reduce((a, b) => a + b, 0);
    out.push(monthAt(ANCHOR_START + weeksFromAnchor * 7 * DAY, WEEKS[pos]));
  }
  return out;
}

export function payoutStatus(m: FiscalMonth, today: string): PayoutStatus {
  if (today <= m.end) return 'running';
  if (today < m.payDate) return 'pending';
  return 'paid';
}

export function daysUntil(date: string, today: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY);
}

// Mois dont le versement n'est pas encore tombé (en cours ou en attente), du plus proche au plus lointain.
export function upcomingPayouts(today: string, limit = 3): FiscalMonth[] {
  return fiscalMonths(1, 12).filter((m) => payoutStatus(m, today) !== 'paid').slice(0, limit);
}
