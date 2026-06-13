'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { getCache, setCache } from '@/lib/cache';
import { Plus, Copy, Check, Link2, Trash2, Smartphone, Users, X, Download } from 'lucide-react';

// Channels the dev can label by creating a link. Organic + Apple Search Ads are
// detected automatically, so they're not here.
const CHANNELS = ['TikTok', 'TikTok Ads', 'Instagram', 'Facebook', 'Meta Ads', 'YouTube', 'Google Ads', 'X', 'Reddit', 'Newsletter'];

// New tables aren't in the generated DB types yet; access them untyped.
const db = supabase as unknown as { from: (t: string) => any };

type SignalLink = { id: string; slug: string; label: string; source: string; destination_url: string; created_at: string };
type Click = {
  id: string; ts: string; country: string | null; city: string | null;
  device: string | null; platform: string | null;
  link: { id: string; label: string; source: string } | null;
};
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

const randSlug = () => Math.random().toString(36).slice(2, 9);
// Readable per-channel slug (e.g. "tiktok-ads-9k2x") so the link reads cleanly
// instead of random gibberish, while staying unique via a short suffix.
const channelSlug = (ch: string) =>
  `${ch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${randSlug().slice(0, 4)}`;

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

export default function AcquisitionPage() {
  const { selectedApp } = useDashboard();
  const [links, setLinks] = useState<SignalLink[]>([]);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [origin, setOrigin] = useState('');

  const [sdkClients, setSdkClients] = useState<SdkClient[]>([]);
  const [sdkKey, setSdkKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<SdkClient | null>(null);
  const [detailEvents, setDetailEvents] = useState<SdkEvent[]>([]);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  // Real clients captured by the Appolyn SDK, scoped to the selected app + the
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

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [{ data: l }, { data: c }] = await Promise.all([
      db.from('signal_links').select('id, slug, label, source, destination_url, created_at').order('created_at', { ascending: false }),
      db.from('signal_clicks').select('id, ts, country, city, device, platform, link:signal_links!inner(id, label, source)').order('ts', { ascending: false }).limit(200),
    ]);
    const linksData = (l ?? []) as SignalLink[];
    const clicksData = (c ?? []) as unknown as Click[];
    setLinks(linksData);
    setClicks(clicksData);
    setCache('acquisition:state', { links: linksData, clicks: clicksData });
    setLoading(false);
  }, []);

  useEffect(() => {
    const cached = getCache<{ links: SignalLink[]; clicks: Click[] }>('acquisition:state');
    if (cached) { setLinks(cached.links); setClicks(cached.clicks); setLoading(false); }
    load(!!cached);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One click per channel: creates (or copies) a ready link for that source, so the
  // dev pastes it in their ad / bio and installs get labelled with that channel.
  const createPreset = async (channel: string) => {
    const existing = links.find((l) => l.source === channel);
    if (existing) {
      // Repair an older link whose destination is empty/broken (would land on Appolyn).
      if (defaultDest && !/^https?:\/\//i.test(existing.destination_url || '')) {
        await db.from('signal_links').update({ destination_url: defaultDest }).eq('id', existing.id);
        await load(true);
      }
      copy(`${origin}/s/${existing.slug}`, existing.id);
      return;
    }
    if (!defaultDest) return; // no destination known yet (app has no Apple id)
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }
    const { data: created } = await db.from('signal_links').insert({
      user_id: user.id, slug: channelSlug(channel), label: channel, source: channel,
      destination_url: defaultDest,
    }).select('id, slug').single();
    await load(true);
    if (created?.slug) copy(`${origin}/s/${created.slug}`, created.id as string);
    setCreating(false);
  };

  const removeLink = async (id: string) => {
    await db.from('signal_links').delete().eq('id', id);
    await load(true);
  };

  const copy = (url: string, id: string) => {
    navigator.clipboard?.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  };

  const clicksByLink = clicks.reduce<Record<string, number>>((acc, c) => {
    if (c.link?.id) acc[c.link.id] = (acc[c.link.id] ?? 0) + 1;
    return acc;
  }, {});

  // The App Store page a tracked link redirects to. Falls back to building the
  // store URL from the app's Apple id when store_url isn't set (otherwise the
  // /s redirect has nowhere to go and lands back on Appolyn).
  const defaultDest = selectedApp?.store_url
    || (selectedApp?.asc_app_id ? `https://apps.apple.com/app/id${selectedApp.asc_app_id}` : '');

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">Tes vrais utilisateurs : qui installe, depuis où, sur quel appareil, et combien ils paient.</p>
        </div>
        <button onClick={() => setShowSetup(true)}
          className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity shrink-0">
          <Download className="h-4 w-4" /> Connecter les clients
        </button>
      </div>

      {/* Clients table — the whole page, basically */}
      <div className="bg-card border border-border/40 card-pop rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Clients{selectedApp?.name ? ` · ${selectedApp.name}` : ''}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{sdkClients.length}</span>
        </div>
        {sdkClients.length > 0 && (
          <div className="grid items-center gap-4 px-5 py-2.5 border-b border-border/40 text-xs font-medium text-muted-foreground uppercase tracking-wide overflow-x-auto"
            style={{ gridTemplateColumns: '1.1fr 1.2fr 0.7fr 1fr 0.8fr 0.8fr 0.9fr' }}>
            <span>Client</span><span>Appareil</span><span>Pays</span><span>Source</span><span>Confiance</span><span>Revenu</span><span>Installé</span>
          </div>
        )}
        {sdkClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-12 h-12 rounded-2xl border border-border/40 flex items-center justify-center mb-3"><Users className="h-5 w-5 text-muted-foreground" /></div>
            <h3 className="text-sm font-medium mb-1">Aucun client pour l&apos;instant</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">Connecte ton app et chaque installation, achat et source apparaît ici, tout seul.</p>
            <button onClick={() => setShowSetup(true)}
              className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
              <Download className="h-4 w-4" /> Connecter les clients
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

      {/* Acquisition sources — visible, one click per channel */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Sources d&apos;acquisition</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-2 max-w-2xl">
          <span className="text-foreground font-medium">Organic</span> et <span className="text-foreground font-medium">Apple Search Ads</span> s&apos;affichent tout seuls. Apple ne révèle pas le reste : pour qu&apos;un client apparaisse en « TikTok », « Meta Ads », « Facebook »…, clique le canal pour générer son lien, et utilise-le comme destination de ta pub ou dans ta bio / ton post. Les installs qui passent par là sont étiquetés automatiquement.
        </p>
        <p className="text-[11px] text-muted-foreground/70 mb-3 max-w-2xl">
          Ce lien renvoie <strong>instantanément vers ta page App Store</strong> (le passage est invisible) — c&apos;est le seul moyen de connaître la source par client, Apple ne la transmet pas. Tu pourras brancher <strong>ton propre domaine</strong> pour une URL 100% à toi.
        </p>

        <div className="bg-card border border-border/40 card-pop rounded-xl p-5">
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((ch) => {
              const exists = links.some((l) => l.source === ch);
              return (
                <button key={ch} onClick={() => createPreset(ch)} disabled={creating}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full border px-3 h-8 transition-colors disabled:opacity-50 ${exists ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border/50 hover:bg-accent'}`}>
                  {exists ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
                  {ch}
                </button>
              );
            })}
          </div>

          {links.length > 0 ? (
            <div className="mt-4 space-y-2">
              {links.map((l) => {
                const url = `${origin}/s/${l.slug}`;
                return (
                  <div key={l.id} className="flex items-center gap-3 py-2 border-t border-border/30 first:border-t-0 first:pt-0">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-foreground shrink-0">{l.source}</span>
                    <p className="text-xs text-muted-foreground truncate font-mono flex-1 min-w-0">{url}</p>
                    <span className="text-xs tabular-nums text-muted-foreground shrink-0">{clicksByLink[l.id] ?? 0} clics</span>
                    <button onClick={() => copy(url, l.id)} title="Copier le lien"
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/40 hover:bg-accent shrink-0">
                      {copied === l.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                    <button onClick={() => removeLink(l.id)} title="Supprimer"
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/40 hover:bg-destructive/10 shrink-0">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/70 mt-3">Clique un canal : tu obtiens une URL à coller dans ta pub ou ta bio. Le lien est copié automatiquement.</p>
          )}
        </div>
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
              <h3 className="text-base font-semibold">Connecter tes clients</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Un fichier, et c&apos;est tout. Installs, achats et source remontent automatiquement.</p>
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
                {detail.has_purchased && <span className="text-[10px] rounded bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5">client payant</span>}
              </div>
              <button onClick={() => setDetail(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-5">
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
