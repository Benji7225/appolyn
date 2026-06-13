'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { ASC_LOCALES } from '@/lib/aso';
import { Languages, ImageIcon, X, Loader2, Sparkles, Upload } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const LABELS: Record<string, { label: string; country: string }> =
  Object.fromEntries(ASC_LOCALES.map((l) => [l.code, { label: l.label, country: l.country }]));
const SPECIAL_FLAG: Record<string, string> = {
  ja: 'jp', ko: 'kr', el: 'gr', he: 'il', uk: 'ua', vi: 'vn', cs: 'cz', da: 'dk',
  nb: 'no', sv: 'se', ms: 'my', hi: 'in', ca: 'es', sk: 'sk', hr: 'hr', th: 'th',
  hu: 'hu', id: 'id', ro: 'ro', tr: 'tr', pl: 'pl', ru: 'ru', fi: 'fi', it: 'it', en: 'us', fr: 'fr',
};
const localeMeta = (code: string): { label: string; country: string } => {
  if (LABELS[code]) return LABELS[code];
  const region = code.split('-')[1];
  return { label: code, country: (region || SPECIAL_FLAG[code.split('-')[0]] || '').toLowerCase() };
};
const flagEmoji = (country: string) =>
  /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : '🏳️';

type Shot = { id: string; url: string | null; width: number; height: number; state: string | null };
type ShotSet = { id: string; displayType: string; screenshots: Shot[] };
type ScreensPayload = { localizationId: string | null; locale: string | null; sets: ShotSet[] };
type Translation = { locale: string; text: string };
type BBox = { x: number; y: number; w: number; h: number };
type Result = {
  found: boolean; legend: string; translations: Translation[];
  bbox?: BBox; color?: string; background?: string; align?: 'left' | 'center' | 'right';
};

// Friendlier device labels for Apple's screenshot display types.
const deviceLabel = (t: string): string =>
  t.replace(/^APP_/, '').replace(/_/g, ' ').replace('IPHONE', 'iPhone').replace('IPAD', 'iPad').replace('DISPLAY', '').trim() || t;

export default function ScreenshotsPage() {
  const { selectedApp } = useDashboard();
  const ascAppId = selectedApp?.asc_app_id;

  const [data, setData] = useState<ScreensPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [results, setResults] = useState<Record<string, Result>>({});
  const [detail, setDetail] = useState<string | null>(null);
  const [rendered, setRendered] = useState<Record<string, string>>({});
  const [rendering, setRendering] = useState<string | null>(null);
  const [view, setView] = useState<{ shotId: string; locale: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<Record<string, { ok: boolean; text: string }>>({});

  const load = useCallback(async () => {
    if (!ascAppId) { setData(null); return; }
    setLoading(true); setError(null); setResults({});
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-screenshots`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: ascAppId }),
      });
      const j = await r.json() as ScreensPayload & { error?: string };
      if (j.error) setError(j.error);
      else setData(j);
    } catch {
      setError('Connexion à App Store Connect impossible. Vérifie tes identifiants ASC.');
    }
    setLoading(false);
  }, [ascAppId]);

  useEffect(() => { load(); }, [load]);

  const allShots = (data?.sets ?? []).flatMap((s) => s.screenshots).filter((s) => s.url);
  const sourceLocale = data?.locale ?? '';
  const targets = ASC_LOCALES.filter((l) => l.code !== sourceLocale).map((l) => ({ code: l.code, label: l.label }));

  const translateAll = async () => {
    if (allShots.length === 0) return;
    setTranslating(true);
    setProgress({ done: 0, total: allShots.length });
    setResults({});
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    let done = 0;
    const run = async (shot: Shot) => {
      try {
        const r = await fetch('/api/translate-screenshot-captions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: shot.url,
            appName: selectedApp?.name,
            sourceLabel: localeMeta(sourceLocale).label,
            targets,
          }),
        });
        const j = await r.json() as Result & { error?: string };
        if (!j.error) setResults((prev) => ({ ...prev, [shot.id]: { found: j.found, legend: j.legend, translations: j.translations ?? [], bbox: j.bbox, color: j.color, background: j.background, align: j.align } }));
      } catch { /* one screenshot failing must not stop the rest */ }
      done += 1; setProgress({ done, total: allShots.length });
    };

    // Bounded concurrency (2 at a time) to stay gentle on the API.
    const queue = [...allShots];
    await Promise.all(Array.from({ length: Math.min(2, queue.length) }, async () => {
      for (let s = queue.shift(); s; s = queue.shift()) await run(s);
    }));
    setTranslating(false);
  };

  // Render one translated legend onto its screenshot (server-side canvas).
  const renderLang = async (shotId: string, locale: string, text: string) => {
    const key = `${shotId}:${locale}`;
    setView({ shotId, locale });
    if (rendered[key]) return;
    const res = results[shotId];
    const shot = allShots.find((s) => s.id === shotId);
    if (!res?.bbox || !shot?.url) { setRendered((p) => ({ ...p, [key]: '' })); return; }
    setRendering(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/render-screenshot', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: shot.url, text, bbox: res.bbox, color: res.color, background: res.background, align: res.align }),
      });
      const j = await r.json() as { supported?: boolean; image?: string };
      setRendered((p) => ({ ...p, [key]: j.supported && j.image ? `data:image/png;base64,${j.image}` : (j.supported === false ? 'UNSUPPORTED' : '') }));
    } catch { setRendered((p) => ({ ...p, [key]: '' })); }
    setRendering(null);
  };

  // Publish one rendered (translated) screenshot to App Store Connect for its
  // language. Creates a new version first if the app is locked (like publish).
  const uploadOne = async (shotId: string, locale: string) => {
    const key = `${shotId}:${locale}`;
    const img = rendered[key];
    if (!img || img === 'UNSUPPORTED' || !ascAppId) return;
    const displayType = (data?.sets ?? []).find((s) => s.screenshots.some((x) => x.id === shotId))?.displayType ?? '';
    if (!window.confirm(`Publier ce screenshot en ${localeMeta(locale).label} sur l'App Store ? Une nouvelle version sera créée si nécessaire.`)) return;
    setUploading(key); setUploadMsg((p) => ({ ...p, [key]: { ok: true, text: 'Envoi…' } }));
    const base64 = img.replace(/^data:image\/png;base64,/, '');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
      const doUpload = () => fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=upload-screenshot`, {
        method: 'POST', headers, body: JSON.stringify({ appId: ascAppId, locale, displayType, imageBase64: base64 }),
      });
      let r = await doUpload();
      let j = await r.json() as { ok?: boolean; editable?: boolean; error?: string };
      if (r.status === 409 || j.editable === false) {
        setUploadMsg((p) => ({ ...p, [key]: { ok: true, text: 'Création d’une version…' } }));
        await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=create-version`, { method: 'POST', headers, body: JSON.stringify({ appId: ascAppId }) });
        r = await doUpload(); j = await r.json();
      }
      setUploadMsg((p) => ({ ...p, [key]: j.ok ? { ok: true, text: 'Publié sur l’App Store ✓' } : { ok: false, text: j.error ?? 'Échec de l’envoi.' } }));
    } catch { setUploadMsg((p) => ({ ...p, [key]: { ok: false, text: 'Erreur réseau.' } })); }
    setUploading(null);
  };

  const detailResult = detail ? results[detail] : null;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Screenshots</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            On traduit <strong>seulement la grosse légende</strong> de chaque screenshot, adaptée ASO (pas du mot à mot), dans toutes les langues. Le reste de l&apos;image n&apos;est pas touché.
          </p>
        </div>
        {allShots.length > 0 && (
          <button onClick={translateAll} disabled={translating}
            className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0">
            {translating ? <><Loader2 className="h-4 w-4 animate-spin" /> Traduction {progress.done}/{progress.total}</> : <><Languages className="h-4 w-4" /> Traduire les légendes</>}
          </button>
        )}
      </div>

      {sourceLocale && (
        <p className="text-xs text-muted-foreground mb-4">
          Langue source : <span aria-hidden>{flagEmoji(localeMeta(sourceLocale).country)}</span> {localeMeta(sourceLocale).label} · {targets.length} langues cibles
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive mb-4">{error}</div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground">Chargement de tes screenshots…</div>
      ) : allShots.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center">
          <div className="w-12 h-12 rounded-2xl border border-border/40 flex items-center justify-center mx-auto mb-3"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
          <h3 className="text-sm font-medium mb-1">Aucun screenshot trouvé</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">{error ? 'Vérifie la connexion App Store Connect.' : 'Ajoute des screenshots à ta fiche App Store, puis reviens ici pour traduire leurs légendes.'}</p>
        </div>
      ) : (
        <div className="space-y-7">
          {(data?.sets ?? []).filter((s) => s.screenshots.some((x) => x.url)).map((set) => (
            <div key={set.id}>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">{deviceLabel(set.displayType)}</h2>
              <div className="flex flex-wrap gap-4">
                {set.screenshots.filter((s) => s.url).map((shot) => {
                  const res = results[shot.id];
                  return (
                    <button key={shot.id} onClick={() => { if (res) { setDetail(shot.id); setView(null); } }}
                      className="group relative w-[150px] rounded-xl overflow-hidden border border-border/40 bg-card text-left card-pop disabled:cursor-default"
                      disabled={!res}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shot.url!} alt="" className="w-full aspect-[9/19.5] object-cover" loading="lazy" />
                      {res ? (
                        <div className="p-2">
                          <p className="text-[11px] font-medium line-clamp-2">{res.found ? res.legend : 'Aucune légende détectée'}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 inline-flex items-center gap-1"><Sparkles className="h-3 w-3" />{res.translations.length} langues · voir</p>
                        </div>
                      ) : translating ? (
                        <div className="p-2 text-[10px] text-muted-foreground inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> analyse…</div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {allShots.length > 0 && (
        <p className="text-[11px] text-muted-foreground/70 mt-6 max-w-2xl">
          Aperçu des légendes traduites ci-dessus. Prochaine étape (en construction) : le rendu de chaque image avec la légende traduite + la publication en 1 clic sur l&apos;App Store.
        </p>
      )}

      {detail && detailResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => { setDetail(null); setView(null); }} />
          <div className="relative w-full max-w-2xl max-h-[88vh] overflow-auto rounded-2xl bg-background border border-border shadow-2xl scrollbar-macos">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 sticky top-0 bg-background z-10">
              <div className="min-w-0 flex items-center gap-3">
                {view && <button onClick={() => setView(null)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">← langues</button>}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{view ? `Aperçu · ${localeMeta(view.locale).label}` : 'Légende traduite'}</h3>
                  <p className="text-xs text-muted-foreground truncate">Source : {detailResult.found ? `« ${detailResult.legend} »` : 'aucune détectée'}</p>
                </div>
              </div>
              <button onClick={() => { setDetail(null); setView(null); }} className="text-muted-foreground hover:text-foreground shrink-0"><X className="h-4 w-4" /></button>
            </div>

            {view && view.shotId === detail ? (
              <div className="p-5 flex flex-col items-center gap-3">
                {(() => {
                  const key = `${detail}:${view.locale}`;
                  const img = rendered[key];
                  if (rendering === key) return <div className="py-24 text-sm text-muted-foreground inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Rendu en cours…</div>;
                  if (img === 'UNSUPPORTED') return <div className="py-16 text-center text-sm text-muted-foreground max-w-sm">Le rendu image pour cette langue (script non latin : japonais, coréen, arabe…) arrive bientôt, il faut embarquer la police adaptée. La traduction du texte, elle, est prête.</div>;
                  if (!img) return <div className="py-16 text-center text-sm text-muted-foreground">Rendu indisponible.</div>;
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img src={img} alt="" className="max-h-[64vh] rounded-lg border border-border/40" />;
                })()}
                {(() => {
                  const key = `${detail}:${view.locale}`;
                  const img = rendered[key];
                  if (!img || img === 'UNSUPPORTED') return null;
                  const msg = uploadMsg[key];
                  return (
                    <div className="flex items-center gap-3">
                      <button onClick={() => uploadOne(detail, view.locale)} disabled={uploading === key}
                        className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-9 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                        {uploading === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Publier sur l&apos;App Store
                      </button>
                      {msg && <span className={`text-xs ${msg.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{msg.text}</span>}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="p-5 space-y-0.5">
                {detailResult.translations.map((t) => {
                  const m = localeMeta(t.locale);
                  return (
                    <button key={t.locale} onClick={() => renderLang(detail, t.locale, t.text)}
                      className="w-full text-left flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-lg hover:bg-accent/40 border-b border-border/20 last:border-0">
                      <span className="text-sm shrink-0 w-28 text-muted-foreground"><span aria-hidden>{flagEmoji(m.country)}</span> {m.label}</span>
                      <span className="text-sm flex-1">{t.text}</span>
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
