// Journal des changements des concurrents, calculé à partir des instantanés
// déjà enregistrés (aucune donnée inventée : on ne compare que deux relevés réels).

export type SnapLike = {
  captured_at: string; title: string | null; price: number | null; currency: string | null;
  average_rating: number | null; rating_count: number | null; version: string | null;
  icon_url: string | null; screenshot_count: number | null;
};

export type ChangeKind = 'title' | 'price' | 'version' | 'screenshots' | 'icon' | 'rating';

export type ChangeEvent = {
  competitorId: string; name: string; at: string; kind: ChangeKind; label: string; detail: string;
};

export const KIND_LABEL: Record<ChangeKind, string> = {
  title: 'Titre', price: 'Prix', version: 'Mise à jour', screenshots: 'Captures', icon: 'Icône', rating: 'Note',
};

function fmtPrice(p: number | null, cur: string | null) {
  if (p == null) return '—';
  if (p === 0) return 'Gratuit';
  return `${p} ${cur ?? ''}`.trim();
}

// L'hôte (is1…is5.mzstatic.com) et la taille changent sans que l'icône change : on compare le chemin.
export function iconKey(url: string | null): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    parts.pop();
    return parts.join('/');
  } catch { return url; }
}

// Changements notables entre deux relevés consécutifs (le plus récent d'abord en entrée).
export function diffSnapshots(cur: SnapLike, prev: SnapLike): Omit<ChangeEvent, 'competitorId' | 'name'>[] {
  const at = cur.captured_at;
  const out: Omit<ChangeEvent, 'competitorId' | 'name'>[] = [];
  if (cur.title && prev.title && cur.title !== prev.title)
    out.push({ at, kind: 'title', label: 'Titre modifié', detail: `« ${prev.title} » → « ${cur.title} »` });
  if (cur.price != null && prev.price != null && cur.price !== prev.price)
    out.push({ at, kind: 'price', label: 'Prix modifié', detail: `${fmtPrice(prev.price, prev.currency)} → ${fmtPrice(cur.price, cur.currency)}` });
  if (cur.version && prev.version && cur.version !== prev.version)
    out.push({ at, kind: 'version', label: 'Nouvelle version', detail: `${prev.version} → ${cur.version}` });
  if (cur.screenshot_count != null && prev.screenshot_count != null && cur.screenshot_count !== prev.screenshot_count)
    out.push({ at, kind: 'screenshots', label: 'Captures modifiées', detail: `${prev.screenshot_count} → ${cur.screenshot_count}` });
  const a = iconKey(cur.icon_url), b = iconKey(prev.icon_url);
  if (a && b && a !== b) out.push({ at, kind: 'icon', label: 'Icône changée', detail: 'Nouvelle icône sur la fiche' });
  if (cur.average_rating != null && prev.average_rating != null) {
    const d = Math.round((cur.average_rating - prev.average_rating) * 100) / 100;
    if (Math.abs(d) >= 0.1)
      out.push({ at, kind: 'rating', label: d < 0 ? 'Note en baisse' : 'Note en hausse',
        detail: `${prev.average_rating.toFixed(2)} → ${cur.average_rating.toFixed(2)}` });
  }
  return out;
}

// Tous les changements de tous les concurrents, du plus récent au plus ancien.
export function buildTimeline(
  competitors: { id: string; name: string | null; itunes_id: string }[],
  snaps: Record<string, SnapLike[]>, // chaque liste triée du plus récent au plus ancien
  sinceMs?: number,
): ChangeEvent[] {
  const events: ChangeEvent[] = [];
  for (const c of competitors) {
    const list = snaps[c.id] ?? [];
    const name = list[0]?.title ?? c.name ?? c.itunes_id;
    for (let i = 0; i < list.length - 1; i++) {
      for (const e of diffSnapshots(list[i], list[i + 1])) {
        if (sinceMs != null && new Date(e.at).getTime() < sinceMs) continue;
        events.push({ ...e, competitorId: c.id, name });
      }
    }
  }
  return events.sort((x, y) => (x.at < y.at ? 1 : x.at > y.at ? -1 : 0));
}

// Nouveaux avis par jour sur la fenêtre (proxy public de l'élan d'une app). null si on manque de recul.
export function reviewVelocity(list: SnapLike[], days = 30, now = Date.now()): { perDay: number; spanDays: number } | null {
  const withCount = list.filter((s) => s.rating_count != null);
  if (withCount.length < 2) return null;
  const latest = withCount[0];
  const limit = now - days * 86400000;
  let base = withCount[withCount.length - 1];
  for (const s of withCount) { if (new Date(s.captured_at).getTime() >= limit) base = s; else break; }
  const span = (new Date(latest.captured_at).getTime() - new Date(base.captured_at).getTime()) / 86400000;
  if (span < 1) return null;
  const delta = (latest.rating_count ?? 0) - (base.rating_count ?? 0);
  return { perDay: Math.max(0, delta) / span, spanDays: span };
}

// Texte brut pour copier le journal (veille d'équipe, notes de lancement).
export function timelineToText(events: ChangeEvent[]): string {
  return events.map((e) => `${new Date(e.at).toLocaleDateString('fr-FR')} · ${e.name} · ${e.label} : ${e.detail}`).join('\n');
}
