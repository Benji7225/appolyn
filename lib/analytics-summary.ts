// Résumé « en bref » de la page Analytics et export CSV.
// Fonctions pures : tout est dérivé des chiffres réels déjà chargés, rien n'est
// inventé. Si une donnée manque, la phrase correspondante n'apparaît pas.

export type SummaryTone = 'good' | 'warn' | 'info';
export type SummaryLine = { tone: SummaryTone; text: string };

export type SummaryInput = {
  rangeLabel: string; // ex. « 30 j »
  granularity: 'day' | 'week' | 'month';
  revenue: number;
  downloads: number;
  previous: { revenue: number; downloads: number } | null; // null = pas de comparaison
  rows: { date: string; downloads: number; revenue: number }[];
  byCountry: { code: string; revenue: number }[];
  countryName: (code: string) => string;
  fmtMoney: (n: number) => string;
  fmtDay: (d: string) => string;
  subs: { activeSubscribers: number; churnRate: number | null } | null;
  trials: { trials: number; converted: number };
};

const frPct = (n: number) => `${Math.abs(Math.round(n))} %`;
const change = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

export function buildSummary(i: SummaryInput): SummaryLine[] {
  const out: SummaryLine[] = [];
  if (i.rows.length === 0) return out;

  const revCh = i.previous ? change(i.revenue, i.previous.revenue) : null;
  const dlCh = i.previous ? change(i.downloads, i.previous.downloads) : null;

  // 1. Revenu
  if (i.revenue > 0) {
    if (revCh == null) {
      out.push({ tone: 'info', text: `Tu as touché ${i.fmtMoney(i.revenue)} sur ${i.rangeLabel}.` });
    } else if (Math.abs(revCh) < 1) {
      out.push({ tone: 'info', text: `Revenu stable : ${i.fmtMoney(i.revenue)} sur ${i.rangeLabel}, comme la période de comparaison.` });
    } else {
      const up = revCh > 0;
      out.push({
        tone: up ? 'good' : 'warn',
        text: `Revenu ${up ? 'en hausse' : 'en baisse'} de ${frPct(revCh)} : ${i.fmtMoney(i.revenue)} sur ${i.rangeLabel} contre ${i.fmtMoney(i.previous!.revenue)} avant.`,
      });
    }
  } else {
    out.push({ tone: 'info', text: `Aucun revenu sur ${i.rangeLabel}. ${i.downloads > 0 ? 'Des gens installent ton app mais aucun achat : regarde ton paywall.' : ''}`.trim() });
  }

  // 2. Téléchargements, avec le croisement utile revenu / téléchargements
  if (dlCh != null && Math.abs(dlCh) >= 1) {
    const up = dlCh > 0;
    let text = `Téléchargements ${up ? 'en hausse' : 'en baisse'} de ${frPct(dlCh)} (${i.downloads.toLocaleString('fr-FR')}).`;
    if (up && revCh != null && revCh < -1) text += ' Mais le revenu baisse : ces nouveaux utilisateurs paient moins.';
    if (!up && revCh != null && revCh > 1) text += ' Le revenu monte quand même : tu monétises mieux.';
    out.push({ tone: up ? 'good' : 'warn', text });
  }

  // 3. Meilleur jour (seulement en vue journalière, avec au moins 2 jours)
  if (i.granularity === 'day' && i.rows.length >= 2) {
    const best = i.rows.reduce((b, r) => (r.revenue > b.revenue ? r : b), i.rows[0]);
    if (best.revenue > 0) out.push({ tone: 'info', text: `Meilleur jour : ${i.fmtDay(best.date)} (${i.fmtMoney(best.revenue)}).` });
  }

  // 4. Concentration par pays
  const total = i.byCountry.reduce((s, c) => s + Math.max(c.revenue, 0), 0);
  if (total > 0 && i.byCountry.length > 0) {
    const top = i.byCountry[0];
    const share = Math.round((Math.max(top.revenue, 0) / total) * 100);
    if (i.byCountry.length === 1) {
      out.push({ tone: 'info', text: `Tout ton revenu vient d'un seul pays : ${i.countryName(top.code)}.` });
    } else if (share >= 60) {
      out.push({ tone: 'warn', text: `${i.countryName(top.code)} pèse ${share} % de ton revenu. Traduire ta fiche dans d'autres langues élargit cette base.` });
    } else {
      out.push({ tone: 'info', text: `Premier pays : ${i.countryName(top.code)} (${share} % du revenu), sur ${i.byCountry.length} pays avec des ventes.` });
    }
  }

  // 5. Abonnements : churn au-dessus du repère affiché dans l'app (5 %)
  if (i.subs && i.subs.activeSubscribers > 0 && i.subs.churnRate != null && i.subs.churnRate > 5) {
    out.push({ tone: 'warn', text: `Résiliation à ${String(i.subs.churnRate).replace('.', ',')} % : au-dessus du repère de 5 %. Vérifie ce qui fait partir tes abonnés.` });
  }

  // 6. Conversion d'essai : seulement avec assez d'essais pour ne pas conclure sur 2 cas
  if (i.trials.trials >= 10) {
    const conv = Math.round((i.trials.converted / i.trials.trials) * 100);
    if (conv < 5) out.push({ tone: 'warn', text: `Seulement ${conv} % de tes essais deviennent payants (${i.trials.converted}/${i.trials.trials}). Paywall ou promesse à revoir.` });
  }

  return out;
}

// ---- Export CSV --------------------------------------------------------

// Échappe une cellule et neutralise l'injection de formule (=, +, -, @) à l'ouverture dans Excel.
function cell(v: string | number): string {
  let s = typeof v === 'number' ? String(v) : v;
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Séparateur « ; » et virgule décimale : s'ouvre directement dans Excel en français.
const num = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

export function buildCsv(i: {
  granularity: 'day' | 'week' | 'month';
  rows: { date: string; downloads: number; revenue: number }[];
  byCountry: { code: string; downloads: number; revenue: number }[];
}): string {
  const gran = i.granularity === 'month' ? 'mois' : i.granularity === 'week' ? 'semaine' : 'jour';
  const lines: string[] = [];
  lines.push(['Période (' + gran + ')', 'Téléchargements', 'Revenu'].map(cell).join(';'));
  for (const r of i.rows) lines.push([cell(r.date), cell(r.downloads), cell(num(r.revenue))].join(';'));
  if (i.byCountry.length) {
    lines.push('');
    lines.push(['Pays', 'Téléchargements', 'Revenu'].map(cell).join(';'));
    for (const c of i.byCountry) lines.push([cell(c.code), cell(c.downloads), cell(num(c.revenue))].join(';'));
  }
  // BOM pour qu'Excel lise l'UTF-8 (accents).
  return '﻿' + lines.join('\r\n');
}
