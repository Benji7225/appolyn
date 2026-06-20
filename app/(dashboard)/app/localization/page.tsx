'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Upload, RefreshCw, Sparkles, CircleAlert, CircleCheck as CheckCircle2, Info, Lock } from 'lucide-react';
import { useDashboard } from '@/lib/app-context';
import { MetricRing } from '@/components/dashboard/metric-ring';
import { ScreenshotsManager } from '@/components/dashboard/screenshots-manager';
import { EmptyState } from '@/components/dashboard/shell';
import { ASC_LOCALES, LIMITS } from '@/lib/aso';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Loc = {
  locale: string;
  title: string;
  subtitle: string;
  keywords: string;
  description: string;
  promotionalText: string;
  localizationId: string | null;
  infoLocalizationId: string | null;
  isNew?: boolean;
};

type AscPayload = { versionId: string; versionState: string; editable: boolean; locales: Loc[] };

type KwBreak = { term: string; difficulty: number; popularity: number; ranks: boolean; rank: number | null; verdict: string };
type AsoData = { score: number; verdict: string; issues: string[]; keywords: KwBreak[]; weak: string[] };

const cache: Record<string, AscPayload> = {};
// Score results kept across navigations (keyed by locale + content) so the ASO
// analysis shows instantly when you come back, instead of re-analysing.
const scoreMemo: Record<string, AsoData> = {};
// Content fingerprint of a locale: same content -> same memo key -> instant score.
const clientHash = (l: Loc) => `${l.title}|${l.subtitle}|${l.keywords}|${l.description.length}|${l.promotionalText}`;

const LABELS: Record<string, { label: string; country: string }> =
  Object.fromEntries(ASC_LOCALES.map((l) => [l.code, { label: l.label, country: l.country }]));

const SPECIAL_FLAG: Record<string, string> = {
  ja: 'jp', ko: 'kr', el: 'gr', he: 'il', uk: 'ua', vi: 'vn', cs: 'cz', da: 'dk',
  nb: 'no', sv: 'se', ms: 'my', hi: 'in', ca: 'es', sk: 'sk', hr: 'hr', th: 'th',
  hu: 'hu', id: 'id', ro: 'ro', tr: 'tr', pl: 'pl', ru: 'ru', fi: 'fi', it: 'it',
};
const localeMeta = (code: string): { label: string; country: string } => {
  if (LABELS[code]) return LABELS[code];
  const region = code.split('-')[1];
  return { label: code, country: (region || SPECIAL_FLAG[code] || '').toLowerCase() };
};
const flagEmoji = (country: string) =>
  /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : '🏳️';

const scoreColor = (s: number) => (s >= 80 ? 'text-emerald-500' : s >= 50 ? 'text-amber-500' : 'text-rose-500');
const dotColor = (s: number) => (s >= 80 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-rose-500');

// Score ASO global "justifié". Au lieu d'une moyenne brute (où 100 + 0 = 50), on
// calcule la QUALITÉ moyenne des langues (publiées = poids plein, brouillons =
// demi-poids), puis on l'ajuste par la COUVERTURE (langues couvertes / total). Les
// langues non créées et les brouillons font donc baisser le score, mais légèrement
// (via la couverture), pas à parts égales avec une langue publiée.
function computeGlobalAso(
  entries: { score: number; draft: boolean }[],
  totalLocales: number,
): { score: number; ready: boolean; quality: number; coverage: number } {
  if (entries.length === 0) return { score: 0, ready: false, quality: 0, coverage: 0 };
  let wSum = 0, wScore = 0;
  for (const e of entries) {
    const w = e.draft ? 0.5 : 1; // un brouillon compte moitié moins qu'une langue publiée
    wSum += w;
    wScore += w * e.score;
  }
  const quality = wSum ? wScore / wSum : 0;
  const coverage = Math.min(1, wSum / Math.max(1, totalLocales));
  // 65% du score vient de la qualité, 35% se débloque avec la couverture.
  const score = Math.round(quality * (0.65 + 0.35 * coverage));
  return { score, ready: true, quality: Math.round(quality), coverage };
}

// Rank colour: only the ranking number is coloured (green/amber), pop/diff rings
// stay grey with black numbers.
const rankColor = (rank: number | null) =>
  rank == null ? 'text-muted-foreground' : rank <= 10 ? 'text-emerald-600' : rank <= 30 ? 'text-amber-600' : 'text-muted-foreground';

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return <span className={`text-xs tabular-nums ${over ? 'text-destructive' : 'text-muted-foreground'}`}>{value.length}/{max}</span>;
}

function Field({ label, value, max, onChange, hint, textarea, rows }: {
  label: string; value: string; max: number; onChange: (v: string) => void; hint?: string; textarea?: boolean; rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <CharCount value={value} max={max} />
      </div>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows ?? 4} className="resize-none text-sm" />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
      )}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function AppStorePage() {
  const { apps, selectedApp } = useDashboard();
  const ascAppId = selectedApp?.asc_app_id ?? '';

  const [hasCreds, setHasCreds] = useState<boolean | null>(null);
  const [locs, setLocs] = useState<Loc[]>([]);
  const [editable, setEditable] = useState(false);
  const [versionState, setVersionState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishMsg, setPublishMsg] = useState<{ locale: string; ok: boolean; text: string } | null>(null);
  const [genBusy, setGenBusy] = useState(false);
  const [genMsg, setGenMsg] = useState('');
  // Notice « app déjà en ligne » : fermable, mémorisée par app (localStorage).
  const [lockNoticeHidden, setLockNoticeHidden] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLockNoticeHidden(localStorage.getItem(`metaLockNotice:hidden:${ascAppId}`) === '1');
  }, [ascAppId]);

  // Automatic, free ASO score per locale (real iTunes competition + structure),
  // cached server-side by content hash so iTunes is only queried when a locale
  // changes. This is THE score shown on the cards. No AI, no per-view cost.
  const [scores, setScores] = useState<Record<string, { loading: boolean; data?: AsoData }>>({});
  const scoredRef = useRef<Record<string, string>>({});

  const scoreLocale = useCallback(async (l: Loc, force = false) => {
    if (!l.title.trim() && !l.subtitle.trim() && !l.keywords.trim() && !l.description.trim()) {
      setScores((p) => ({ ...p, [l.locale]: { loading: false, data: { score: 0, verdict: 'Langue vide', issues: [], keywords: [], weak: [] } } }));
      return;
    }
    const h = clientHash(l);
    const memoKey = `${l.locale}|${h}`;
    if (!force && scoreMemo[memoKey]) {
      scoredRef.current[l.locale] = h;
      setScores((p) => ({ ...p, [l.locale]: { loading: false, data: scoreMemo[memoKey] } }));
      return;
    }
    if (!force && scoredRef.current[l.locale] === h) return;
    scoredRef.current[l.locale] = h;
    setScores((p) => ({ ...p, [l.locale]: { loading: true, data: p[l.locale]?.data } }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/aso-score', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: l.locale, country: localeMeta(l.locale).country, ascAppId,
          title: l.title, subtitle: l.subtitle, keywords: l.keywords, description: l.description, promotional_text: l.promotionalText,
        }),
      });
      const j = await r.json() as AsoData & { error?: string };
      if (j.error) { setScores((p) => ({ ...p, [l.locale]: { loading: false, data: p[l.locale]?.data } })); return; }
      scoreMemo[memoKey] = j;
      setScores((p) => ({ ...p, [l.locale]: { loading: false, data: j } }));
    } catch {
      setScores((p) => ({ ...p, [l.locale]: { loading: false, data: p[l.locale]?.data } }));
    }
  }, [ascAppId]);

  const scoreAll = useCallback(async (list: Loc[]) => {
    const targets = list.filter((l) => l.title.trim() || l.subtitle.trim() || l.keywords.trim() || l.description.trim());
    let i = 0;
    const worker = async () => { while (i < targets.length) { await scoreLocale(targets[i++]); } };
    await Promise.all(Array.from({ length: Math.min(3, targets.length) }, worker));
  }, [scoreLocale]);

  // Score a locale WITHOUT touching state (used to compare an AI candidate to the
  // current version before keeping it).
  const requestScore = useCallback(async (l: Loc): Promise<AsoData | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/aso-score', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: l.locale, country: localeMeta(l.locale).country, ascAppId,
          title: l.title, subtitle: l.subtitle, keywords: l.keywords, description: l.description, promotional_text: l.promotionalText,
        }),
      });
      const j = await r.json() as AsoData & { error?: string };
      return j.error ? null : j;
    } catch { return null; }
  }, [ascAppId]);

  useEffect(() => {
    supabase.from('asc_credentials').select('id').maybeSingle().then(({ data }) => setHasCreds(!!data));
  }, []);

  const applyPayload = useCallback((p: AscPayload) => {
    setLocs(p.locales);
    setEditable(p.editable);
    setVersionState(p.versionState);
  }, []);

  const load = useCallback(async (appId: string, silent: boolean) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-localizations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      });
      const j = await r.json() as {
        versionId?: string; versionState?: string; editable?: boolean;
        localizations?: { locale: string; id: string | null; infoLocalizationId: string | null; title: string; subtitle: string; keywords: string; description: string; promotionalText: string }[];
        error?: string;
      };
      if (j.error) { setError(j.error); setLoading(false); return; }
      const locales: Loc[] = (j.localizations ?? []).map((l) => ({
        locale: l.locale,
        title: l.title ?? '', subtitle: l.subtitle ?? '', keywords: l.keywords ?? '',
        description: l.description ?? '', promotionalText: l.promotionalText ?? '',
        localizationId: l.id, infoLocalizationId: l.infoLocalizationId,
      })).sort((a, b) => localeMeta(a.locale).label.localeCompare(localeMeta(b.locale).label));
      const payload: AscPayload = { versionId: j.versionId ?? '', versionState: j.versionState ?? '', editable: !!j.editable, locales };
      cache[appId] = payload;
      applyPayload(payload);
      scoreAll(locales);
    } catch {
      setError('Connexion à App Store Connect impossible.');
    }
    setLoading(false);
  }, [applyPayload, scoreAll]);

  useEffect(() => {
    if (!ascAppId) return;
    if (cache[ascAppId]) {
      applyPayload(cache[ascAppId]);
      // Seed scores from the in-memory memo so cards show instantly on revisit,
      // no "Analyse ASO..." flash and no re-querying iTunes for unchanged locales.
      const seeded: Record<string, { loading: boolean; data?: AsoData }> = {};
      for (const l of cache[ascAppId].locales) {
        const d = scoreMemo[`${l.locale}|${clientHash(l)}`];
        if (d) seeded[l.locale] = { loading: false, data: d };
      }
      if (Object.keys(seeded).length) setScores((p) => ({ ...seeded, ...p }));
      load(ascAppId, true);
    } else load(ascAppId, false);
  }, [ascAppId, load, applyPayload]);

  const updateLoc = (locale: string, patch: Partial<Loc>) =>
    setLocs((prev) => prev.map((l) => (l.locale === locale ? { ...l, ...patch } : l)));

  const present = useMemo(() => new Set(locs.map((l) => l.locale)), [locs]);
  const missing = useMemo(() => ASC_LOCALES.filter((l) => !present.has(l.code)), [present]);

  const asoEntries = useMemo(
    () => locs
      .filter((l) => typeof scores[l.locale]?.data?.score === 'number')
      .map((l) => ({ score: scores[l.locale]!.data!.score as number, draft: !!l.isNew })),
    [locs, scores],
  );
  const aso = computeGlobalAso(asoEntries, ASC_LOCALES.length);
  const globalScore = aso.score;
  const globalReady = aso.ready;

  // Partage le score global authoritatif avec la page d'accueil (même chiffre des
  // deux côtés) via localStorage, par app.
  useEffect(() => {
    if (aso.ready && ascAppId) {
      try { localStorage.setItem(`aso:global:${ascAppId}`, String(aso.score)); } catch { /* ignore */ }
    }
  }, [aso.ready, aso.score, ascAppId]);

  const addLocale = (code: string) => {
    if (present.has(code)) { setEditing(code); return; }
    const fresh: Loc = { locale: code, title: '', subtitle: '', keywords: '', description: '', promotionalText: '', localizationId: null, infoLocalizationId: null, isNew: true };
    setLocs((prev) => [...prev, fresh].sort((a, b) => localeMeta(a.locale).label.localeCompare(localeMeta(b.locale).label)));
    setEditing(code);
  };

  const publishOne = async (locale: string) => {
    const l = locs.find((x) => x.locale === locale);
    if (!l || !ascAppId) return;
    setPublishing(locale); setPublishMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
      const payload = {
        appId: ascAppId,
        localizations: [{ locale: l.locale, title: l.title, subtitle: l.subtitle, keywords: l.keywords, description: l.description, promotionalText: l.promotionalText }],
      };
      const doPublish = () => fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=publish-localizations`, {
        method: 'POST', headers, body: JSON.stringify(payload),
      });

      let r = await doPublish();
      let j = await r.json() as { editable?: boolean; published?: number; results?: { locale: string; ok: boolean; error?: string }[]; error?: string };

      // 100% auto: if the app is locked (live / in review), create a new editable
      // version on App Store Connect, then publish into it. The dev does nothing.
      if (r.status === 409 || j.editable === false) {
        setPublishMsg({ locale, ok: true, text: 'Création d’une nouvelle version sur App Store Connect…' });
        const cv = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=create-version`, {
          method: 'POST', headers, body: JSON.stringify({ appId: ascAppId }),
        });
        const cj = await cv.json() as { created?: boolean; versionString?: string; error?: string };
        if (cj.error) { setPublishMsg({ locale, ok: false, text: `Impossible de créer la nouvelle version : ${cj.error}` }); setPublishing(null); return; }
        r = await doPublish();
        j = await r.json();
      }

      if (j.error) { setPublishMsg({ locale, ok: false, text: j.error }); }
      else {
        const res = j.results?.[0];
        if (res && !res.ok) setPublishMsg({ locale, ok: false, text: res.error ?? 'Échec de la publication.' });
        else { setPublishMsg({ locale, ok: true, text: 'Publié sur l’App Store.' }); load(ascAppId, true); }
      }
    } catch {
      setPublishMsg({ locale, ok: false, text: 'Erreur réseau. Réessaie.' });
    }
    setPublishing(null);
  };

  // "Améliorer avec l'IA": rewrites this locale to maximise ASO, steering away
  // from the saturated keywords the free iTunes score flagged. KEEP-BEST: we score
  // the AI candidate on real iTunes data and only apply it if it's at least as good
  // as the current version, so "Améliorer" can never lower the score.
  const improveLoc = useCallback(async (locale: string): Promise<{ changes: string[]; improved: boolean; from: number; to: number }> => {
    const l = locs.find((x) => x.locale === locale);
    const oldScore = scores[locale]?.data?.score ?? 0;
    if (!l) return { changes: [], improved: false, from: oldScore, to: oldScore };
    const aso = scores[locale]?.data;
    const { data: { session } } = await supabase.auth.getSession();
    const r = await fetch('/api/improve-metadata', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale: l.locale, label: localeMeta(l.locale).label, country: localeMeta(l.locale).country,
        fields: { title: l.title, subtitle: l.subtitle, keywords: l.keywords, description: l.description, promotional_text: l.promotionalText },
        weak: aso?.weak ?? [],
        keywords_analysis: (aso?.keywords ?? []).map((k) => ({ term: k.term, difficulty: k.difficulty, popularity: k.popularity, verdict: k.verdict })),
      }),
    });
    const j = await r.json() as { fields?: { title: string; subtitle: string; keywords: string; description: string; promotional_text: string }; changes?: string[]; error?: string };
    if (j.error || !j.fields) throw new Error(j.error ?? 'La génération a échoué.');
    const nf = j.fields;
    const candidate: Loc = { ...l, title: nf.title, subtitle: nf.subtitle, keywords: nf.keywords, description: nf.description, promotionalText: nf.promotional_text };
    const newData = await requestScore(candidate);
    const newScore = newData?.score ?? -1;
    if (newScore >= oldScore) {
      const patch: Partial<Loc> = { title: nf.title, subtitle: nf.subtitle, keywords: nf.keywords, description: nf.description, promotionalText: nf.promotional_text };
      updateLoc(locale, patch);
      if (newData) {
        scoreMemo[`${locale}|${clientHash(candidate)}`] = newData;
        scoredRef.current[locale] = clientHash(candidate);
        setScores((p) => ({ ...p, [locale]: { loading: false, data: newData } }));
      }
      return { changes: j.changes ?? [], improved: true, from: oldScore, to: newScore };
    }
    // The AI version scored lower: keep the user's current version untouched.
    return { changes: [], improved: false, from: oldScore, to: Math.max(0, newScore) };
  }, [locs, scores, requestScore]);

  const generateMissing = async () => {
    const base = locs.find((l) => l.title.trim()) ?? locs[0];
    if (!base) { setGenMsg('Renseigne d’abord une langue de base (titre).'); return; }
    if (missing.length === 0) { setGenMsg('Toutes les langues existent déjà.'); return; }
    setGenBusy(true); setGenMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/generate-metadata', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base: { locale: base.locale, title: base.title, subtitle: base.subtitle, keywords: base.keywords, description: base.description, promotional_text: base.promotionalText },
          targetLocales: missing.map((l) => ({ code: l.code, label: l.label })),
        }),
      });
      const j = await r.json() as { localizations?: Record<string, { title: string; subtitle: string; keywords: string; description: string; promotional_text: string }>; error?: string };
      if (j.error) { setGenMsg(j.error); setGenBusy(false); return; }
      const gen = j.localizations ?? {};
      const added: Loc[] = Object.entries(gen).map(([code, g]) => ({
        locale: code, title: g.title ?? '', subtitle: g.subtitle ?? '', keywords: g.keywords ?? '',
        description: g.description ?? '', promotionalText: g.promotional_text ?? '',
        localizationId: null, infoLocalizationId: null, isNew: true,
      }));
      const merged = [...locs, ...added].sort((a, b) => localeMeta(a.locale).label.localeCompare(localeMeta(b.locale).label));
      setLocs(merged);
      setGenMsg(`${added.length} langue(s) générée(s). Relis chaque carte puis publie.`);
      scoreAll(added);
    } catch {
      setGenMsg('La génération a échoué. Réessaie.');
    }
    setGenBusy(false);
  };

  if (apps.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Localisation</h1>
        <div className="mt-6">
          <EmptyState
            icon={Plus}
            title="Ajoute d'abord une app"
            description="Crée ton app depuis l'accueil pour gérer et publier ta fiche App Store dans toutes tes langues."
            action={<a href="/app" className="text-sm text-primary hover:underline">Aller à l&apos;accueil →</a>}
          />
        </div>
      </div>
    );
  }
  if (hasCreds === false || !ascAppId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Localisation</h1>
        <div className="mt-6">
          <EmptyState
            icon={Lock}
            title="Connecte App Store Connect"
            description={hasCreds === false
              ? 'Ajoute ta clé API App Store Connect dans les réglages pour charger tes fiches par langue.'
              : "Renseigne l'App ID App Store Connect de cette app dans la page Apps pour synchroniser tes fiches."}
            action={hasCreds === false
              ? <a href="/app/settings" className="text-sm text-primary hover:underline">Aller aux réglages →</a>
              : <a href="/app/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>}
          />
        </div>
      </div>
    );
  }

  const editingLoc = editing ? locs.find((l) => l.locale === editing) : null;

  return (
    <div className="p-8 scrollbar-macos">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Localisation</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Chaque langue est un marché. Clique une carte pour éditer titre, sous-titre, mots-clés, description, texte promo et screenshots, avec sa note ASO réelle, puis publie sur l&apos;App Store en 1 clic.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {locs.length > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl border border-border/40 bg-card px-4 h-12 cursor-help"
              title={globalReady
                ? `Qualité moyenne de tes langues : ${aso.quality}/100 (les brouillons comptent à moitié). Couverture : ${Math.round(aso.coverage * 100)} % des langues App Store. Les langues non créées et les brouillons font baisser le score, mais légèrement (par la couverture), pas à parts égales avec une langue publiée.`
                : 'Analyse ASO en cours…'}
            >
              <div className="flex flex-col items-end">
                <span className="text-[11px] text-muted-foreground leading-none flex items-center gap-1">Score ASO global <Info className="h-3 w-3 opacity-60" /></span>
                <span className={`text-lg font-bold leading-tight ${globalReady ? scoreColor(globalScore) : 'text-muted-foreground'}`}>{globalReady ? globalScore : '…'}<span className="text-xs text-muted-foreground font-normal">/100</span></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {locs.length > 0 && (
        <div className="bg-card border border-border/50 card-pop rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between gap-4 mb-2.5 flex-wrap">
            <div>
              <p className="text-sm font-medium">Couverture des langues</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {present.size} / {ASC_LOCALES.length} langues App Store · {missing.length} marché(s) à conquérir. Chaque langue ajoutée te rend visible sur un nouveau marché.
              </p>
            </div>
            <span className="text-2xl font-semibold tabular-nums shrink-0">{Math.round((present.size / ASC_LOCALES.length) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-accent overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(Math.round((present.size / ASC_LOCALES.length) * 100), 2)}%` }} />
          </div>
        </div>
      )}

      {!editable && versionState && !lockNoticeHidden && (
        <div className="flex items-start gap-2 p-3 bg-muted/40 border border-border/40 rounded-lg mb-5">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">
            Ton app est déjà en ligne, donc Apple verrouille le titre, le sous-titre et les mots-clés sur la version en cours. Tu n&apos;as rien à faire : quand tu publies, Appolyn <strong>crée automatiquement une nouvelle version</strong> sur App Store Connect et y applique tes changements. Le <strong>texte promotionnel</strong>, lui, part tout de suite.
          </p>
          <button
            onClick={() => { setLockNoticeHidden(true); if (typeof window !== 'undefined') localStorage.setItem(`metaLockNotice:hidden:${ascAppId}`, '1'); }}
            className="text-muted-foreground/60 hover:text-foreground shrink-0 -mt-0.5"
            title="Fermer" aria-label="Fermer cette notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-5">
          <CircleAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive leading-relaxed">{error}</p>
        </div>
      )}

      {locs.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Chargement de tes fiches App Store...' : 'Aucune localisation trouvée. Ajoute une langue pour commencer.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {locs.map((l) => {
            const m = localeMeta(l.locale);
            const s = scores[l.locale];
            const ready = !!s?.data;
            const sc = s?.data?.score ?? 0;
            const nIssues = s?.data?.issues.length ?? 0;
            const hover = (s?.data?.issues ?? []).slice(0, 6).map((it) => `• ${it}`).join('\n');
            return (
              <button
                key={l.locale}
                onClick={() => setEditing(l.locale)}
                className="group text-left rounded-xl border border-border/50 bg-card p-4 relative shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200"
              >
                <div className="absolute top-3 right-3" title={ready ? (nIssues ? hover : 'Bien optimisé') : 'Analyse ASO en cours'}>
                  {!ready ? (
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground/50 animate-spin" />
                  ) : nIssues > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <span className={`h-2 w-2 rounded-full ${dotColor(sc)}`} />{nIssues}
                    </span>
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2.5 pr-8">
                  <span className="text-base leading-none" aria-hidden>{flagEmoji(m.country)}</span>
                  <span className="text-xs text-muted-foreground truncate">{m.label}</span>
                  {l.isNew && <span className="text-[10px] rounded bg-primary/10 text-primary px-1.5 py-0.5">brouillon</span>}
                </div>
                <p className="text-sm font-medium truncate">{l.title || <span className="text-muted-foreground/60">Sans titre</span>}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{l.subtitle || 'Pas de sous-titre'}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  {ready ? (
                    <><span className={`text-xs font-semibold ${scoreColor(sc)}`}>{sc}</span><span className="text-[11px] text-muted-foreground">/100 ASO</span></>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Analyse ASO…</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {missing.length > 0 && (
        <div className="mt-8">
          <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
            <div>
              <h2 className="text-sm font-medium">Marchés à conquérir <span className="text-muted-foreground font-normal">({missing.length})</span></h2>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">Ces langues ne sont pas encore sur ta fiche. Chaque langue ajoutée te rend visible sur un nouveau marché. Clique une carte pour la créer, ou génère-les toutes d&apos;un coup avec l&apos;IA.</p>
            </div>
            <Button size="sm" onClick={generateMissing} disabled={genBusy} className="h-9 shrink-0">
              {genBusy ? <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />Génération...</> : <><Sparkles className="h-4 w-4 mr-1.5" />Générer les {missing.length} manquantes (IA)</>}
            </Button>
          </div>
          {genMsg && <p className="text-xs text-muted-foreground mb-3">{genMsg}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {missing.map((l) => (
              <button
                key={l.code}
                onClick={() => addLocale(l.code)}
                title={`Créer la fiche ${l.label}`}
                className="group text-left rounded-xl border border-dashed border-border/60 bg-card/40 p-4 relative opacity-70 hover:opacity-100 hover:border-primary/40 hover:bg-card transition-all duration-200"
              >
                <div className="absolute top-3 right-3 text-muted-foreground/50 group-hover:text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 mb-2.5 pr-8">
                  <span className="text-base leading-none grayscale group-hover:grayscale-0 transition-all" aria-hidden>{flagEmoji(l.country)}</span>
                  <span className="text-xs text-muted-foreground truncate">{l.label}</span>
                </div>
                <p className="text-sm font-medium text-muted-foreground/60">Non créée</p>
                <p className="text-xs text-muted-foreground/50 truncate mt-0.5">Clique pour créer cette fiche</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground/40">—</span>
                  <span className="text-[11px] text-muted-foreground/40">/100 ASO</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 pt-8 border-t border-border/40">
        <ScreenshotsManager />
      </div>

      {editingLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => { const lc = editingLoc.locale; setEditing(null); const cur = locs.find((x) => x.locale === lc); if (cur) scoreLocale(cur); }} />
          <div className="relative w-full max-w-5xl max-h-[88vh] overflow-hidden rounded-2xl bg-background border border-border shadow-2xl scrollbar-macos">
            <LocaleEditor
              loc={editingLoc}
              aso={scores[editingLoc.locale]?.data}
              scoring={!!scores[editingLoc.locale]?.loading}
              editable={editable}
              publishing={publishing === editingLoc.locale}
              publishMsg={publishMsg && publishMsg.locale === editingLoc.locale ? publishMsg : null}
              onChange={(patch) => updateLoc(editingLoc.locale, patch)}
              onClose={() => { const lc = editingLoc.locale; setEditing(null); const cur = locs.find((x) => x.locale === lc); if (cur) scoreLocale(cur); }}
              onPublish={() => publishOne(editingLoc.locale)}
              onImprove={() => improveLoc(editingLoc.locale)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function LocaleEditor({ loc, aso, scoring, editable, publishing, publishMsg, onChange, onClose, onPublish, onImprove }: {
  loc: Loc;
  aso?: AsoData;
  scoring: boolean;
  editable: boolean;
  publishing: boolean;
  publishMsg: { ok: boolean; text: string } | null;
  onChange: (patch: Partial<Loc>) => void;
  onClose: () => void;
  onPublish: () => void;
  onImprove: () => Promise<{ changes: string[]; improved: boolean; from: number; to: number }>;
}) {
  const m = localeMeta(loc.locale);
  const [improving, setImproving] = useState(false);
  const [improveMsg, setImproveMsg] = useState<{ tone: 'success' | 'info' | 'error'; text: string; changes: string[] } | null>(null);

  const runImprove = async () => {
    setImproving(true); setImproveMsg(null);
    try {
      const res = await onImprove();
      if (res.improved) {
        setImproveMsg({ tone: 'success', text: `Score amélioré : ${res.from} → ${res.to}/100. Relis avant de publier.`, changes: res.changes });
      } else {
        setImproveMsg({ tone: 'info', text: `L’IA n’a pas dépassé ton score actuel (${res.from}/100). J’ai gardé ta version telle quelle.`, changes: [] });
      }
    } catch (e) {
      setImproveMsg({ tone: 'error', text: e instanceof Error ? e.message : 'La génération a échoué.', changes: [] });
    }
    setImproving(false);
  };

  const kws = aso?.keywords ?? [];

  return (
    <div className="flex flex-col max-h-[88vh]">
      {/* Top bar: language · score · "Améliorer avec l'IA" · close */}
      <div className="flex items-center gap-3 p-4 pl-6 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl leading-none shrink-0" aria-hidden>{flagEmoji(m.country)}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{m.label}</p>
            <p className="text-[11px] text-muted-foreground truncate">{loc.locale}{loc.isNew ? ' · nouveau brouillon' : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 ml-auto shrink-0">
          {scoring && !aso ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><RefreshCw className="h-3.5 w-3.5 animate-spin" />Analyse...</span>
          ) : aso ? (
            <span className="inline-flex items-baseline gap-1" title={aso.verdict}>
              <span className={`text-xl font-bold leading-none ${scoreColor(aso.score)}`}>{aso.score}</span>
              <span className="text-[11px] text-muted-foreground">/100</span>
            </span>
          ) : null}
          <Button onClick={runImprove} disabled={improving} size="sm" className="h-8">
            {improving ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Optimisation...</> : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Améliorer avec l&apos;IA</>}
          </Button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 p-6 flex-1 min-h-0 overflow-y-auto scrollbar-macos">
        {/* Left: the fields */}
        <div className="space-y-5 min-w-0 order-2 lg:order-1">
          {improveMsg && (
            <div className={`rounded-xl border p-3 text-[11px] ${improveMsg.tone === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' : improveMsg.tone === 'info' ? 'border-amber-500/30 bg-amber-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
              <p className={`flex items-center gap-1.5 font-medium ${improveMsg.tone === 'success' ? 'text-emerald-600' : improveMsg.tone === 'info' ? 'text-amber-600' : 'text-destructive'}`}>
                {improveMsg.tone === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}{improveMsg.text}
              </p>
              {improveMsg.changes.length > 0 && (
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {improveMsg.changes.map((c, i) => <li key={i} className="flex gap-1.5"><span className="text-primary shrink-0">•</span><span>{c}</span></li>)}
                </ul>
              )}
            </div>
          )}
          <Field label="Titre" value={loc.title} max={LIMITS.title} onChange={(v) => onChange({ title: v })} />
          <Field label="Sous-titre" value={loc.subtitle} max={LIMITS.subtitle} onChange={(v) => onChange({ subtitle: v })} />
          <Field label="Mots-clés" value={loc.keywords} max={LIMITS.keywords} onChange={(v) => onChange({ keywords: v })} hint="Séparés par des virgules, sans espace. iOS uniquement." />
          <Field label="Description" value={loc.description} max={LIMITS.description} onChange={(v) => onChange({ description: v })} textarea rows={8} />
          <Field label="Texte promotionnel" value={loc.promotionalText} max={LIMITS.promotional_text} onChange={(v) => onChange({ promotionalText: v })} textarea rows={3} hint="Modifiable sans nouvelle version de l'app." />
        </div>

        {/* Right: your keywords with real Pop. / Diff. / Rank, then structural fixes */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-0 self-start space-y-3">
          <div className="rounded-xl border border-border/40 bg-card p-3.5">
            <p className="text-[11px] font-medium mb-2">Tes mots-clés</p>
            {scoring && kws.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Analyse en cours...</p>
            ) : kws.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Renseigne tes mots-clés pour voir leur popularité, difficulté et ton rang.</p>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-wide text-muted-foreground pb-1.5 mb-1 border-b border-border/40">
                  <span className="flex-1">Mot-clé</span>
                  <span className="w-12 text-center shrink-0">Popularité</span>
                  <span className="w-12 text-center shrink-0">Difficulté</span>
                  <span className="w-9 text-right shrink-0">Rang</span>
                </div>
                <div className="space-y-1.5">
                  {kws.map((k) => (
                    <div key={k.term} className="flex items-center gap-2 text-[12px]">
                      <span className="flex-1 truncate min-w-0" title={k.term}>{k.term}</span>
                      <span className="w-12 flex justify-center shrink-0"><MetricRing score={k.popularity} tone="popularity" diameter={28} /></span>
                      <span className="w-12 flex justify-center shrink-0"><MetricRing score={k.difficulty} tone="difficulty" diameter={28} /></span>
                      <span className={`w-9 text-right tabular-nums font-semibold shrink-0 ${rankColor(k.rank)}`}>{k.rank ? `#${k.rank}` : '—'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Structural fixes */}
          {aso && aso.issues.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-card p-3.5">
              <p className="text-[11px] font-medium mb-2">À corriger</p>
              <ul className="space-y-1.5">
                {aso.issues.slice(0, 6).map((it, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px]"><span className="text-amber-500 font-bold shrink-0">!</span><span className="text-muted-foreground">{it}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 bg-background border-t border-border flex items-center gap-3">
        <Button onClick={onPublish} disabled={publishing} className="h-9">
          {publishing ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Publication...</> : <><Upload className="h-3.5 w-3.5 mr-1.5" />Publier sur l&apos;App Store</>}
        </Button>
        {publishMsg && (
          <span className={`flex items-center gap-1.5 text-xs ${publishMsg.ok ? 'text-emerald-500' : 'text-destructive'}`}>
            {publishMsg.ok ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
            {publishMsg.text}
          </span>
        )}
        {!editable && <span className="text-[11px] text-muted-foreground">Version en lecture seule</span>}
      </div>
    </div>
  );
}

