'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDashboard } from '@/lib/app-context';
import { Copy, Check, Smartphone, Users, X, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// New tables aren't in the generated DB types yet; access them untyped.
const db = supabase as unknown as { from: (t: string) => any };

type SdkClient = {
  id: string; idfv: string; platform: string | null;
  device_model: string | null; device_class: string | null;
  os_name: string | null; os_version: string | null; app_version: string | null;
  region: string | null; language: string | null; timezone: string | null;
  ip_country: string | null; ip_city: string | null;
  screen_w: number | null; screen_h: number | null;
  attributed_source: string | null; confidence: number | null;
  purchases: number; total_revenue: number; currency: string | null; has_purchased: boolean;
  install_date: string | null; first_seen: string; last_seen: string;
};
type SdkEvent = { event: string; value: number | null; currency: string | null; created_at: string; properties: Record<string, unknown> };

const flagEmoji = (code?: string | null) =>
  code && /^[A-Za-z]{2}$/.test(code)
    ? code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : '🌐';

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `il y a ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

// snake_case / camelCase -> libellé lisible ("adult_block" -> "Adult block").
const humanizeKey = (k: string) =>
  k.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, (c) => c.toUpperCase());
const fmtVal = (v: unknown): string =>
  typeof v === 'boolean' ? (v ? 'Oui' : 'Non')
    : Array.isArray(v) ? v.map(String).join(', ')
    : v == null ? '—' : String(v);

function CopyRow({ text, id, copied, onCopy }: {
  text: string; id: string; copied: string | null; onCopy: (t: string, id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-background border border-border/40 rounded-lg pl-3 pr-1.5 h-10">
      <code className="text-xs font-mono flex-1 truncate">{text}</code>
      <button onClick={() => onCopy(text, id)} title="Copier"
        className="h-7 w-7 flex items-center justify-center rounded-md border border-border/40 hover:bg-accent shrink-0">
        {copied === id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default function UsersPage() {
  const { selectedApp } = useDashboard();
  const [copied, setCopied] = useState<string | null>(null);

  const [sdkClients, setSdkClients] = useState<SdkClient[]>([]);
  const [sdkKey, setSdkKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<SdkClient | null>(null);
  const [detailEvents, setDetailEvents] = useState<SdkEvent[]>([]);
  const [showSetup, setShowSetup] = useState(false);

  // Real users captured by the Appolyn SDK, scoped to the selected app + the
  // app's SDK key (for the one-line setup snippet shown until data arrives).
  const loadClients = useCallback(async () => {
    if (!selectedApp?.id) { setSdkClients([]); setSdkKey(null); return; }
    const [{ data: clientsData }, { data: appRow }] = await Promise.all([
      db.from('sdk_clients').select('*').eq('app_id', selectedApp.id).order('last_seen', { ascending: false }).limit(200),
      db.from('apps').select('sdk_key').eq('id', selectedApp.id).maybeSingle(),
    ]);
    setSdkClients((clientsData ?? []) as SdkClient[]);
    setSdkKey((appRow?.sdk_key as string) ?? null);
  }, [selectedApp?.id]);
  useEffect(() => { loadClients(); }, [loadClients]);

  const keyForSnippet = sdkKey ?? 'appolyn_live_xxxxxxxx';
  const snippet = `Appolyn.start(key: "${keyForSnippet}")`;

  // Download the SDK with THIS app's key already baked into its setup comment, so
  // the dev just hands the file to their AI (or drops it in Xcode) and is done.
  const downloadSdk = async () => {
    try {
      const res = await fetch('/sdk/Appolyn.swift');
      let text = await res.text();
      if (sdkKey) text = text.split('appolyn_live_xxxxxxxx').join(sdkKey);
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'Appolyn.swift';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.location.href = '/sdk/Appolyn.swift';
    }
  };

  const openDetail = async (c: SdkClient) => {
    setDetail(c);
    setDetailEvents([]);
    const { data } = await db.from('sdk_events').select('event, value, currency, created_at, properties').eq('client_id', c.id).order('created_at', { ascending: false }).limit(50);
    setDetailEvents((data ?? []) as SdkEvent[]);
  };

  const copy = (url: string, id: string) => {
    navigator.clipboard?.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  };

  // Profil personnalisé : tout ce que CE dev a collecté dans SON app remonte via
  // les `properties` des events SDK (genre, lunettes, objectif, niveau, série…).
  // 100% dynamique : on n'affiche que ce qui existe vraiment, jamais de champ inventé.
  // Events triés du + récent au + ancien -> la 1re valeur vue par clé = la + récente.
  const userProps = useMemo(() => {
    const out: Record<string, unknown> = {};
    for (const e of detailEvents) {
      if (e.properties && typeof e.properties === 'object') {
        for (const [k, v] of Object.entries(e.properties)) {
          if (!(k in out) && v != null && v !== '') out[k] = v;
        }
      }
    }
    return out;
  }, [detailEvents]);
  const propEntries = Object.entries(userProps);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground mt-1">Les vrais utilisateurs de ton app : qui installe, depuis où, ce qu&apos;ils paient, et leurs choix dans ton app.</p>
        </div>
        <button onClick={() => setShowSetup(true)}
          className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity shrink-0">
          <Download className="h-4 w-4" /> Connecter mes utilisateurs
        </button>
      </div>

      {/* Users table — the whole page, basically */}
      <div className="bg-card border border-border/40 card-pop rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Utilisateurs{selectedApp?.name ? ` · ${selectedApp.name}` : ''}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{sdkClients.length}</span>
        </div>
        {sdkClients.length > 0 && (
          <div className="grid items-center gap-4 px-5 py-2.5 border-b border-border/40 text-xs font-medium text-muted-foreground uppercase tracking-wide overflow-x-auto"
            style={{ gridTemplateColumns: '1.1fr 1.2fr 0.7fr 1fr 0.8fr 0.8fr 0.9fr' }}>
            <span>Utilisateur</span><span>Appareil</span><span>Pays</span><span>Source</span><span>Confiance</span><span>Revenu</span><span>Installé</span>
          </div>
        )}
        {sdkClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-12 h-12 rounded-2xl border border-border/40 flex items-center justify-center mb-3"><Users className="h-5 w-5 text-muted-foreground" /></div>
            <h3 className="text-sm font-medium mb-1">Aucun utilisateur pour l&apos;instant</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">Connecte ton app et chaque installation, achat, source et choix de tes utilisateurs apparaît ici, tout seul.</p>
            <button onClick={() => setShowSetup(true)}
              className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
              <Download className="h-4 w-4" /> Connecter mes utilisateurs
            </button>
          </div>
        ) : (
          sdkClients.map((c) => (
            <button key={c.id} onClick={() => openDetail(c)}
              className="w-full text-left grid items-center gap-4 px-5 py-3 border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors"
              style={{ gridTemplateColumns: '1.1fr 1.2fr 0.7fr 1fr 0.8fr 0.8fr 0.9fr' }}>
              <span className="text-sm font-mono truncate">{c.idfv.slice(0, 8).toUpperCase()}{c.has_purchased ? ' ★' : ''}</span>
              <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5 truncate"><Smartphone className="h-3.5 w-3.5 shrink-0" />{c.device_model ?? c.platform ?? '—'}</span>
              <span className="text-sm text-muted-foreground"><span aria-hidden>{flagEmoji(c.ip_country ?? c.region)}</span> {c.ip_country ?? c.region ?? '—'}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-foreground w-fit truncate">{c.attributed_source ?? 'Organic'}</span>
              <span className="text-sm text-muted-foreground">{c.confidence != null ? `${Math.round(Number(c.confidence) * 100)}%` : '—'}</span>
              <span className="text-sm tabular-nums">{Number(c.total_revenue) > 0 ? `${Number(c.total_revenue).toFixed(2)} ${c.currency ?? '€'}` : '—'}</span>
              <span className="text-sm text-muted-foreground">{timeAgo(c.install_date ?? c.first_seen)}</span>
            </button>
          ))
        )}
      </div>

      {/* Source la plus fiable, sans aucun lien : une question d'onboarding -> SDK */}
      <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 max-w-2xl">
        <p className="text-sm"><strong>D&apos;où viennent tes utilisateurs ?</strong> Pas besoin de lien à coller. Demande dans ton onboarding « Comment as-tu connu l&apos;app ? » et passe la réponse au SDK, la colonne Source se remplit toute seule, fiable à 100% :</p>
        <code className="block text-[11px] font-mono mt-2 px-2 py-1 rounded bg-background/60 border border-border/40 w-fit">Appolyn.setSource(&quot;TikTok&quot;)</code>
      </div>

      {/* Setup modal — one file, that's it */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowSetup(false)} />
          <div className="relative w-full max-w-md max-h-[85vh] overflow-auto rounded-2xl bg-background border border-border shadow-2xl scrollbar-macos">
            <button onClick={() => setShowSetup(false)} className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>

            <div className="px-6 pt-8 pb-6 text-center bg-gradient-to-b from-accent/40 to-transparent">
              <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center mx-auto mb-3">
                <Smartphone className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold">Connecter tes utilisateurs</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Un fichier, et c&apos;est tout. Installs, achats, source et choix remontent automatiquement.</p>
            </div>

            <div className="px-6 pb-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-foreground text-background text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">1</div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">Télécharge le SDK</p>
                  <button onClick={downloadSdk}
                    className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
                    <Download className="h-4 w-4" /> Télécharger Appolyn.swift
                  </button>
                  <p className="text-xs text-muted-foreground/70 mt-1.5">Ta clé est déjà à l&apos;intérieur.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-foreground text-background text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">2</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Donne le fichier à ton IA</p>
                  <p className="text-sm text-muted-foreground mt-1">Glisse-le dans ta conversation (Cursor, Claude, ChatGPT…) ou dans ton projet Xcode. Les instructions sont écrites en haut du fichier, ton IA fait le reste.</p>
                </div>
              </div>

              <details className="group border-t border-border/40 pt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">Voir la ligne exacte (sans IA)</summary>
                <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                  <p>Glisse <code className="font-mono">Appolyn.swift</code> dans Xcode, puis au démarrage de l&apos;app :</p>
                  <CopyRow text={snippet} id="sdk-snippet" copied={copied} onCopy={copy} />
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-auto rounded-2xl bg-background border border-border shadow-2xl scrollbar-macos">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 sticky top-0 bg-background z-10">
              <div className="flex items-center gap-2">
                <span className="text-base" aria-hidden>{flagEmoji(detail.region)}</span>
                <h3 className="text-sm font-semibold font-mono">{detail.idfv.slice(0, 8).toUpperCase()}</h3>
                {detail.has_purchased && <span className="text-[10px] rounded bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5">utilisateur payant</span>}
              </div>
              <button onClick={() => setDetail(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-5">
              {/* Profil : ce que TON app a collecté (dynamique, propre à chaque app) */}
              <div>
                <p className="text-xs font-medium mb-2">Profil <span className="text-muted-foreground font-normal">· ce que ton app a collecté</span></p>
                {propEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune donnée perso encore. Envoie les choix de tes utilisateurs via le SDK (<code className="font-mono">Appolyn.setUserProperty(&quot;objectif&quot;, &quot;préserver mes yeux&quot;)</code>) et ils apparaissent ici, propres à ton app.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/40 bg-accent/20 p-3">
                    {propEntries.map(([k, v]) => (
                      <div key={k} className="min-w-0">
                        <p className="text-[11px] text-muted-foreground">{humanizeKey(k)}</p>
                        <p className="text-sm font-medium truncate" title={fmtVal(v)}>{fmtVal(v)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {([
                  ['Source', detail.attributed_source ?? 'Direct'],
                  ['Confiance', detail.confidence != null ? `${Math.round(Number(detail.confidence) * 100)} %` : '—'],
                  ['Revenu', Number(detail.total_revenue) > 0 ? `${Number(detail.total_revenue).toFixed(2)} ${detail.currency ?? '€'}` : '0'],
                  ['Achats', String(detail.purchases ?? 0)],
                  ['Appareil', detail.device_model ?? '—'],
                  ['Type', detail.device_class ?? detail.platform ?? '—'],
                  ['OS', `${detail.os_name ?? 'iOS'} ${detail.os_version ?? ''}`.trim()],
                  ['Version app', detail.app_version ?? '—'],
                  ['Pays', detail.ip_country ?? detail.region ?? '—'],
                  ['Ville', detail.ip_city ?? '—'],
                  ['Langue', detail.language ?? '—'],
                  ['Fuseau', detail.timezone ?? '—'],
                  ['Écran', detail.screen_w && detail.screen_h ? `${detail.screen_w}×${detail.screen_h}` : '—'],
                  ['Installé', detail.install_date ? new Date(detail.install_date).toLocaleString('fr-FR') : '—'],
                  ['Vu en dernier', new Date(detail.last_seen).toLocaleString('fr-FR')],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">{k}</p>
                    <p className="text-sm font-medium truncate" title={v}>{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium mb-2">Historique ({detailEvents.length})</p>
                <div className="space-y-1.5">
                  {detailEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun event.</p>
                  ) : detailEvents.map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-xs border-b border-border/20 pb-1.5 last:border-0">
                      <span className="font-medium">{e.event}{e.value != null ? ` · ${e.value} ${e.currency ?? ''}` : ''}</span>
                      <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
