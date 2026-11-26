// Calculs de la page Paywalls : conversion, comparaison avec la période
// précédente, verdict statistique (test z à deux proportions) et revenu par vue.
// Pur et sans dépendance : testable à la main.

export type PwEvent = {
  client_id: string;
  event: string;
  properties: Record<string, unknown> | null;
  value?: number | null;
  currency?: string | null;
  created_at: string;
};

export type PwStat = {
  id: string;
  viewers: number;
  buyers: number;
  conv: number;
  revenue: number | null; // null si devises mélangées ou aucun montant remonté
  currency: string | null;
  revPerViewer: number | null;
};

export const MIN_VIEWERS = 100; // en dessous, une conversion bouge trop au hasard

export function aggregate(rows: PwEvent[]): PwStat[] {
  const views: Record<string, Set<string>> = {};
  const buys: Record<string, Set<string>> = {};
  const rev: Record<string, { sum: number; cur: Set<string>; n: number }> = {};
  for (const e of rows) {
    const id = String(e.properties?.id ?? '').trim() || 'Paywall';
    if (e.event === 'paywall_view') (views[id] ??= new Set()).add(e.client_id);
    else if (e.event === 'paywall_purchase') {
      (buys[id] ??= new Set()).add(e.client_id);
      if (typeof e.value === 'number' && e.value > 0) {
        const r = (rev[id] ??= { sum: 0, cur: new Set(), n: 0 });
        r.sum += e.value; r.n++; r.cur.add((e.currency || '').toUpperCase());
      }
    }
  }
  const keys = Array.from(new Set([...Object.keys(views), ...Object.keys(buys)]));
  return keys.map((id) => {
    const viewers = views[id]?.size ?? 0;
    const buyers = buys[id]?.size ?? 0;
    const r = rev[id];
    const single = r && r.cur.size === 1 && !r.cur.has('');
    return {
      id, viewers, buyers, conv: viewers ? buyers / viewers : 0,
      revenue: single ? r.sum : null,
      currency: single ? Array.from(r.cur)[0] : null,
      revPerViewer: single && viewers ? r.sum / viewers : null,
    };
  }).sort((a, b) => b.viewers - a.viewers);
}

// Probabilité (approx. normale) que A et B aient une vraie différence : 1 - p-value bilatérale.
function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function confidence(a: PwStat, b: PwStat): number {
  if (a.viewers === 0 || b.viewers === 0) return 0;
  const pool = (a.buyers + b.buyers) / (a.viewers + b.viewers);
  const se = Math.sqrt(pool * (1 - pool) * (1 / a.viewers + 1 / b.viewers));
  if (se === 0) return 0;
  const z = Math.abs(a.conv - b.conv) / se;
  return 2 * normCdf(z) - 1;
}

export type Verdict = { tone: 'ok' | 'warn' | 'info'; text: string };

export function verdict(stats: PwStat[]): Verdict | null {
  if (stats.length === 0) return null;
  const pct = (x: number) => `${(x * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
  if (stats.length === 1) {
    const s = stats[0];
    if (s.viewers < MIN_VIEWERS)
      return { tone: 'info', text: `Seulement ${s.viewers} personne(s) ont vu « ${s.id} » : trop peu pour conclure. Reviens quand tu approches ${MIN_VIEWERS} vues.` };
    return { tone: 'info', text: `« ${s.id} » convertit ${pct(s.conv)} de ${s.viewers.toLocaleString('fr-FR')} vues. Pour savoir si c'est bon ou non, compare-le à une deuxième version (autre prix, autre texte) avec un identifiant différent.` };
  }
  const solid = stats.filter((s) => s.viewers >= MIN_VIEWERS);
  if (solid.length < 2)
    return { tone: 'info', text: `Pas encore assez de vues pour comparer : il en faut au moins ${MIN_VIEWERS} par paywall (là, ${stats.map((s) => `${s.id} : ${s.viewers}`).join(', ')}).` };
  const ranked = [...solid].sort((a, b) => b.conv - a.conv);
  const [best, second] = ranked;
  const c = confidence(best, second);
  const gap = best.conv - second.conv;
  if (c >= 0.95)
    return { tone: 'ok', text: `« ${best.id} » gagne : ${pct(best.conv)} contre ${pct(second.conv)} pour « ${second.id} » (${Math.round(c * 100)} % de certitude que l'écart est réel). Tu peux le garder pour tout le monde.` };
  if (c >= 0.8)
    return { tone: 'warn', text: `« ${best.id} » est devant (${pct(best.conv)} contre ${pct(second.conv)}) mais l'écart n'est sûr qu'à ${Math.round(c * 100)} %. Laisse tourner encore avant de trancher.` };
  return { tone: 'warn', text: `Pas de gagnant net : « ${best.id} » ${pct(best.conv)} et « ${second.id} » ${pct(second.conv)}, l'écart de ${pct(gap)} peut venir du hasard. Il faut plus de vues.` };
}

export function rangeStart(days: number | null, offset = 0): string | null {
  if (days === null) return null;
  return new Date(Date.now() - (days * (1 + offset)) * 86400000).toISOString();
}

export function toCsv(stats: PwStat[]): string {
  const head = 'paywall;vues;achats;conversion_pct;revenu;devise;revenu_par_vue';
  const f = (n: number | null, d = 2) => (n === null ? '' : n.toFixed(d).replace('.', ','));
  const lines = stats.map((s) => [s.id.replace(/;/g, ','), s.viewers, s.buyers, f(s.conv * 100, 1), f(s.revenue), s.currency ?? '', f(s.revPerViewer, 3)].join(';'));
  return [head, ...lines].join('\n');
}
