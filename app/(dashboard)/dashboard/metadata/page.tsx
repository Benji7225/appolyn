'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Upload, RefreshCw, Sparkles, CircleAlert, CircleCheck as CheckCircle2, Info, Lock } from 'lucide-react';
import { useDashboard } from '@/lib/app-context';
import { auditMetadata, ASC_LOCALES, LIMITS } from '@/lib/aso';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Loc = {
  locale: string;
  title: string;
  subtitle: string;
  keywords: string;
  description: string;
  promotionalText: string;
  localizationId: string | null;     // appStoreVersionLocalization id
  infoLocalizationId: string | null; // appInfoLocalization id
  isNew?: boolean;                    // added locally, not yet on ASC
};

type AscPayload = { versionId: string; versionState: string; editable: boolean; locales: Loc[] };

// Module-level cache so coming back to the page is instant (we still revalidate
// in the background). Keyed by the ASC app id.
const cache: Record<string, AscPayload> = {};

const LABELS: Record<string, { label: string; country: string }> =
  Object.fromEntries(ASC_LOCALES.map((l) => [l.code, { label: l.label, country: l.country }]));

// Flag fallback for any locale code Apple returns that isn't in our list.
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
  /^[A-Za-z]{2}$/.test(country)
    ? country.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : '🏳️';

const auditLoc = (l: Loc) =>
  auditMetadata({ title: l.title, subtitle: l.subtitle, keywords: l.keywords, description: l.description, promotional_text: l.promotionalText });

const scoreColor = (s: number) => (s >= 80 ? 'text-emerald-500' : s >= 50 ? 'text-amber-500' : 'text-rose-500');
const dotColor = (s: number) => (s >= 80 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-rose-500');

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

  const [editing, setEditing] = useState<string | null>(null); // locale code open in drawer
  const [adding, setAdding] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishMsg, setPublishMsg] = useState<{ locale: string; ok: boolean; text: string } | null>(null);
  const [genBusy, setGenBusy] = useState(false);
  const [genMsg, setGenMsg] = useState('');

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
    } catch {
      setError('Connexion à App Store Connect impossible.');
    }
    setLoading(false);
  }, [applyPayload]);

  // Auto-load on arrival (instant from cache, then revalidate). No manual refresh.
  useEffect(() => {
    if (!ascAppId) return;
    if (cache[ascAppId]) { applyPayload(cache[ascAppId]); load(ascAppId, true); }
    else load(ascAppId, false);
  }, [ascAppId, load, applyPayload]);

  const updateLoc = (locale: string, patch: Partial<Loc>) =>
    setLocs((prev) => prev.map((l) => (l.locale === locale ? { ...l, ...patch } : l)));

  const present = useMemo(() => new Set(locs.map((l) => l.locale)), [locs]);
  const missing = useMemo(() => ASC_LOCALES.filter((l) => !present.has(l.code)), [present]);

  const scores = useMemo(() => locs.map((l) => auditLoc(l).score), [locs]);
  const globalScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const addLocale = (code: string) => {
    if (present.has(code)) { setEditing(code); setAdding(false); return; }
    const fresh: Loc = { locale: code, title: '', subtitle: '', keywords: '', description: '', promotionalText: '', localizationId: null, infoLocalizationId: null, isNew: true };
    setLocs((prev) => [...prev, fresh].sort((a, b) => localeMeta(a.locale).label.localeCompare(localeMeta(b.locale).label)));
    setAdding(false);
    setEditing(code);
  };

  // Publish a single locale straight to App Store Connect (create-or-update).
  const publishOne = async (locale: string) => {
    const l = locs.find((x) => x.locale === locale);
    if (!l || !ascAppId) return;
    setPublishing(locale); setPublishMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=publish-localizations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: ascAppId,
          localizations: [{ locale: l.locale, title: l.title, subtitle: l.subtitle, keywords: l.keywords, description: l.description, promotionalText: l.promotionalText }],
        }),
      });
      const j = await r.json() as { editable?: boolean; published?: number; results?: { locale: string; ok: boolean; error?: string }[]; error?: string };
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

  // AI-generate every missing locale from the strongest existing one.
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
      setLocs((prev) => [...prev, ...added].sort((a, b) => localeMeta(a.locale).label.localeCompare(localeMeta(b.locale).label)));
      setGenMsg(`${added.length} langue(s) générée(s). Relis chaque carte puis publie.`);
    } catch {
      setGenMsg('La génération a échoué. Réessaie.');
    }
    setGenBusy(false);
  };

  // ── guard states ──────────────────────────────────────────────────────────
  if (apps.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Page App Store</h1>
        <p className="text-sm text-muted-foreground mt-1">Ajoute d&apos;abord une app depuis la page Overview.</p>
      </div>
    );
  }
  if (hasCreds === false || !ascAppId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Page App Store</h1>
        <div className="mt-6 rounded-xl border border-border/40 bg-card p-6 flex items-start gap-3 max-w-xl">
          <Lock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Connecte App Store Connect</p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasCreds === false
                ? <>Ajoute ta clé API App Store Connect dans les <a href="/dashboard/settings" className="underline hover:text-foreground">réglages</a> pour charger tes fiches par langue.</>
                : <>Renseigne l&apos;App ID App Store Connect de cette app dans la page Apps pour synchroniser tes fiches.</>}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const editingLoc = editing ? locs.find((l) => l.locale === editing) : null;

  return (
    <div className="p-8 scrollbar-macos">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Page App Store</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Chaque langue de ta fiche avec sa note ASO. Clique une carte pour éditer titre, sous-titre, mots-clés et publier directement sur l&apos;App Store.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {locs.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card px-4 h-12">
              <div className="flex flex-col items-end">
                <span className="text-[11px] text-muted-foreground leading-none">Score ASO global</span>
                <span className={`text-lg font-bold leading-tight ${scoreColor(globalScore)}`}>{globalScore}<span className="text-xs text-muted-foreground font-normal">/100</span></span>
              </div>
            </div>
          )}
          <Button size="sm" onClick={() => setAdding((v) => !v)} className="h-9">
            <Plus className="h-4 w-4 mr-1.5" /> Ajouter une langue
          </Button>
        </div>
      </div>

      {/* Read-only banner when the version can't be edited */}
      {!editable && versionState && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-5">
          <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Ta version actuelle est déjà publiée (ou en cours de validation par Apple). Pour changer le titre, le sous-titre ou les mots-clés, il faut créer une nouvelle version de l&apos;app dans App Store Connect. Le texte promotionnel, lui, reste modifiable tout de suite.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-5">
          <CircleAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive leading-relaxed">{error}</p>
        </div>
      )}

      {/* Add-language panel */}
      {adding && (
        <div className="rounded-xl border border-border/40 bg-card p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Ajouter une langue</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={generateMissing} disabled={genBusy || missing.length === 0}>
                {genBusy ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Génération...</> : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Générer les {missing.length} manquantes (IA)</>}
              </Button>
              <button onClick={() => setAdding(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
          </div>
          {genMsg && <p className="text-xs text-muted-foreground mb-3">{genMsg}</p>}
          {missing.length === 0 ? (
            <p className="text-xs text-muted-foreground">Toutes les langues sont déjà présentes.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {missing.map((l) => (
                <button
                  key={l.code}
                  onClick={() => addLocale(l.code)}
                  className="flex items-center gap-1.5 text-xs rounded-full border border-border/50 bg-background px-2.5 py-1 hover:border-primary/50 transition-colors"
                >
                  <span aria-hidden>{flagEmoji(l.country)}</span> {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Locale cards grid */}
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
            const a = auditLoc(l);
            const issues = a.findings.length;
            const hover = a.findings.slice(0, 6).map((f) => `${f.severity === 'warning' ? '!' : '•'} ${f.message}`).join('\n');
            return (
              <button
                key={l.locale}
                onClick={() => setEditing(l.locale)}
                className="group text-left rounded-xl border border-border/50 bg-card p-4 relative shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200"
              >
                <div className="absolute top-3 right-3" title={issues > 0 ? hover : 'Bien optimisé'}>
                  {issues > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <span className={`h-2 w-2 rounded-full ${dotColor(a.score)}`} />
                      {issues}
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
                  <span className={`text-xs font-semibold ${scoreColor(a.score)}`}>{a.score}</span>
                  <span className="text-[11px] text-muted-foreground">/100 ASO</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Editor modal (centered popup) */}
      {editingLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl scrollbar-macos">
            <LocaleEditor
              loc={editingLoc}
              appName={selectedApp?.name ?? ''}
              editable={editable}
              publishing={publishing === editingLoc.locale}
              publishMsg={publishMsg && publishMsg.locale === editingLoc.locale ? publishMsg : null}
              onChange={(patch) => updateLoc(editingLoc.locale, patch)}
              onClose={() => setEditing(null)}
              onPublish={() => publishOne(editingLoc.locale)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

type AiReview = {
  score: number; verdict: string; strengths: string[]; issues: string[];
  keyword_suggestions: string[]; suggested_title: string; suggested_subtitle: string; suggested_keywords: string;
};

function LocaleEditor({ loc, appName, editable, publishing, publishMsg, onChange, onClose, onPublish }: {
  loc: Loc;
  appName: string;
  editable: boolean;
  publishing: boolean;
  publishMsg: { ok: boolean; text: string } | null;
  onChange: (patch: Partial<Loc>) => void;
  onClose: () => void;
  onPublish: () => void;
}) {
  const m = localeMeta(loc.locale);
  const a = auditLoc(loc);

  const [aiLoading, setAiLoading] = useState(false);
  const [ai, setAi] = useState<AiReview | null>(null);
  const [aiError, setAiError] = useState('');
  useEffect(() => { setAi(null); setAiError(''); }, [loc.locale]);

  const runAi = async () => {
    setAiLoading(true); setAiError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/aso-review', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: loc.locale, appName, title: loc.title, subtitle: loc.subtitle, keywords: loc.keywords, description: loc.description, promotional_text: loc.promotionalText }),
      });
      const j = await r.json();
      if (j.error) setAiError(j.error); else setAi(j as AiReview);
    } catch { setAiError('Analyse impossible. Réessaie.'); }
    setAiLoading(false);
  };

  const addKeyword = (term: string) => {
    const cur = loc.keywords.split(',').map((s) => s.trim()).filter(Boolean);
    if (cur.some((s) => s.toLowerCase() === term.toLowerCase())) return;
    const next = [...cur, term].join(',');
    if (next.length <= LIMITS.keywords) onChange({ keywords: next });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none" aria-hidden>{flagEmoji(m.country)}</span>
          <div>
            <p className="text-sm font-medium">{m.label}</p>
            <p className="text-[11px] text-muted-foreground">{loc.locale}{loc.isNew ? ' · nouveau brouillon' : ''}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
      </div>

      {/* Per-locale ASO score */}
      <div className="rounded-lg border border-border/40 bg-card p-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${scoreColor(a.score)}`}>{a.score}<span className="text-xs text-muted-foreground font-normal">/100</span></span>
          <span className="text-xs text-muted-foreground">Score ASO de cette langue</span>
        </div>
        {a.findings.length > 0 && (
          <ul className="mt-2.5 space-y-1 border-t border-border/40 pt-2.5">
            {a.findings.slice(0, 5).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px]">
                <span className={`mt-0.5 shrink-0 font-bold ${f.severity === 'warning' ? 'text-amber-500' : 'text-muted-foreground/60'}`}>{f.severity === 'warning' ? '!' : '•'}</span>
                <span className="text-muted-foreground">{f.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Deep AI review: semantic + market keyword competitiveness for this locale */}
      <div className="rounded-lg border border-border/40 bg-card p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-xs font-medium">Analyse IA approfondie</p>
          </div>
          <Button size="sm" variant="outline" onClick={runAi} disabled={aiLoading} className="h-7 text-xs shrink-0">
            {aiLoading ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Analyse...</> : (ai ? 'Relancer' : 'Analyser ce marché')}
          </Button>
        </div>
        {!ai && !aiError && !aiLoading && (
          <p className="text-[11px] text-muted-foreground mt-2">Note sémantique tenant compte de la pertinence et de la saturation des mots-clés dans la langue {m.label}, avec des suggestions concrètes.</p>
        )}
        {aiError && <p className="text-[11px] text-destructive mt-2">{aiError}</p>}
        {ai && (
          <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${scoreColor(ai.score)}`}>{ai.score}<span className="text-xs text-muted-foreground font-normal">/100</span></span>
              <span className="text-[11px] text-muted-foreground">{ai.verdict}</span>
            </div>
            {ai.issues.length > 0 && (
              <ul className="space-y-1">
                {ai.issues.slice(0, 5).map((it, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px]"><span className="text-amber-500 font-bold shrink-0">!</span><span className="text-muted-foreground">{it}</span></li>
                ))}
              </ul>
            )}
            {ai.keyword_suggestions.length > 0 && (
              <div>
                <p className="text-[11px] font-medium mb-1.5">Mots-clés suggérés (clique pour ajouter)</p>
                <div className="flex flex-wrap gap-1.5">
                  {ai.keyword_suggestions.slice(0, 12).map((k) => (
                    <button key={k} onClick={() => addKeyword(k)} className="text-[11px] rounded-full border border-border/50 bg-background px-2 py-0.5 hover:border-primary/50 hover:text-primary transition-colors">+ {k}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {ai.suggested_title && ai.suggested_title !== loc.title && (
                <button onClick={() => onChange({ title: ai.suggested_title.slice(0, LIMITS.title) })} className="text-[11px] rounded-md bg-accent px-2 py-1 hover:bg-accent/70">Appliquer le titre : « {ai.suggested_title} »</button>
              )}
              {ai.suggested_subtitle && ai.suggested_subtitle !== loc.subtitle && (
                <button onClick={() => onChange({ subtitle: ai.suggested_subtitle.slice(0, LIMITS.subtitle) })} className="text-[11px] rounded-md bg-accent px-2 py-1 hover:bg-accent/70">Appliquer le sous-titre : « {ai.suggested_subtitle} »</button>
              )}
              {ai.suggested_keywords && ai.suggested_keywords !== loc.keywords && (
                <button onClick={() => onChange({ keywords: ai.suggested_keywords.slice(0, LIMITS.keywords) })} className="text-[11px] rounded-md bg-accent px-2 py-1 hover:bg-accent/70">Remplacer les mots-clés</button>
              )}
            </div>
          </div>
        )}
      </div>

      <Field label="Titre" value={loc.title} max={LIMITS.title} onChange={(v) => onChange({ title: v })} />
      <Field label="Sous-titre" value={loc.subtitle} max={LIMITS.subtitle} onChange={(v) => onChange({ subtitle: v })} />
      <Field label="Mots-clés" value={loc.keywords} max={LIMITS.keywords} onChange={(v) => onChange({ keywords: v })} hint="Séparés par des virgules, sans espace. iOS uniquement." />
      <Field label="Description" value={loc.description} max={LIMITS.description} onChange={(v) => onChange({ description: v })} textarea rows={8} />
      <Field label="Texte promotionnel" value={loc.promotionalText} max={LIMITS.promotional_text} onChange={(v) => onChange({ promotionalText: v })} textarea rows={3} hint="Modifiable sans nouvelle version de l'app." />

      <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-background border-t border-border flex items-center gap-3">
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
