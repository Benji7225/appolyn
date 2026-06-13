'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { getCache, setCache } from '@/lib/cache';
import { Radar, Plus, Copy, Check, Link2, Trash2, MapPin, Smartphone, Users, X } from 'lucide-react';

const SOURCES = ['Organic', 'TikTok Ads', 'Meta Ads', 'Google Ads', 'Apple Search Ads', 'Créateur', 'Landing page'];

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

export default function AcquisitionPage() {
  const { selectedApp } = useDashboard();
  const [links, setLinks] = useState<SignalLink[]>([]);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [source, setSource] = useState('TikTok Ads');
  const [dest, setDest] = useState('');
  const [creating, setCreating] = useState(false);
  const [origin, setOrigin] = useState('');

  const [sdkClients, setSdkClients] = useState<SdkClient[]>([]);
  const [detail, setDetail] = useState<SdkClient | null>(null);
  const [detailEvents, setDetailEvents] = useState<SdkEvent[]>([]);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  // Real clients captured by the Appolyn SDK, scoped to the selected app.
  const loadClients = useCallback(async () => {
    if (!selectedApp?.id) { setSdkClients([]); return; }
    const { data } = await db.from('sdk_clients').select('*').eq('app_id', selectedApp.id).order('last_seen', { ascending: false }).limit(200);
    setSdkClients((data ?? []) as SdkClient[]);
  }, [selectedApp?.id]);
  useEffect(() => { loadClients(); }, [loadClients]);

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

  const createLink = async () => {
    if (!label.trim() || !dest.trim()) return;
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }
    await db.from('signal_links').insert({
      user_id: user.id, slug: randSlug(), label: label.trim(), source, destination_url: dest.trim(),
    });
    setLabel(''); setDest('');
    await load(true);
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

  const defaultDest = selectedApp?.store_url || '';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Chaque visiteur qui arrive via un de tes liens trackés : identifiant unique, appareil, source et localisation. Crée un lien par campagne, pub ou créateur pour savoir d&apos;où viennent tes clients. Données réelles, anonymes, sans cookie.
        </p>
      </div>

      {/* Create a tracked link */}
      <div className="bg-card border border-border/40 card-pop rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Créer un lien de campagne</h2>
        </div>
        <div className="grid sm:grid-cols-[1fr_160px_1fr_auto] gap-2">
          <input
            value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="Nom (ex. Pub TikTok juin)"
            className="text-sm bg-background border border-border/40 rounded-lg px-3 h-10 focus:outline-none"
          />
          <select value={source} onChange={(e) => setSource(e.target.value)}
            className="text-sm bg-background border border-border/40 rounded-lg px-3 h-10 focus:outline-none">
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            value={dest} onChange={(e) => setDest(e.target.value)}
            placeholder={defaultDest || 'URL de destination (App Store...)'}
            className="text-sm bg-background border border-border/40 rounded-lg px-3 h-10 focus:outline-none"
          />
          <button onClick={createLink} disabled={creating || !label.trim() || !dest.trim()}
            className="inline-flex items-center gap-1.5 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium disabled:opacity-40">
            <Plus className="h-4 w-4" /> Créer
          </button>
        </div>
        {defaultDest && !dest && (
          <button onClick={() => setDest(defaultDest)} className="text-xs text-primary hover:underline mt-2">
            Utiliser l&apos;App Store de {selectedApp?.name}
          </button>
        )}
      </div>

      {/* Links list */}
      {links.length > 0 && (
        <div className="bg-card border border-border/40 card-pop rounded-xl p-5 mb-6">
          <h2 className="text-sm font-medium mb-3">Tes liens trackés</h2>
          <div className="space-y-2">
            {links.map((l) => {
              const url = `${origin}/s/${l.slug}`;
              return (
                <div key={l.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-foreground shrink-0">{l.source}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{l.label}</p>
                    <p className="text-xs text-muted-foreground truncate font-mono">{url}</p>
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground shrink-0">{clicksByLink[l.id] ?? 0} clics</span>
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
        </div>
      )}

      {/* SDK clients — real installs captured by the Appolyn SDK */}
      <div className="bg-card border border-border/40 card-pop rounded-xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Clients{selectedApp?.name ? ` · ${selectedApp.name}` : ''}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{sdkClients.length} via le SDK</span>
        </div>
        <div className="grid items-center gap-4 px-5 py-2.5 border-b border-border/40 text-xs font-medium text-muted-foreground uppercase tracking-wide overflow-x-auto"
          style={{ gridTemplateColumns: '1.1fr 1.2fr 0.7fr 1fr 0.8fr 0.8fr 0.9fr' }}>
          <span>Client</span><span>Appareil</span><span>Pays</span><span>Source</span><span>Confiance</span><span>Revenu</span><span>Installé</span>
        </div>
        {sdkClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl border border-border/40 flex items-center justify-center mb-3"><Users className="h-5 w-5 text-muted-foreground" /></div>
            <h3 className="text-sm font-medium mb-1">Aucun client pour l&apos;instant</h3>
            <p className="text-sm text-muted-foreground max-w-md">Installe le SDK Appolyn dans ton app (une ligne de code). Chaque installation apparaît ici avec son appareil, son pays, sa source et son revenu. Ta clé et le snippet sont dans Réglages &rsaquo; Comptes connectés.</p>
          </div>
        ) : (
          sdkClients.map((c) => (
            <button key={c.id} onClick={() => openDetail(c)}
              className="w-full text-left grid items-center gap-4 px-5 py-3 border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors"
              style={{ gridTemplateColumns: '1.1fr 1.2fr 0.7fr 1fr 0.8fr 0.8fr 0.9fr' }}>
              <span className="text-sm font-mono truncate">{c.idfv.slice(0, 8).toUpperCase()}{c.has_purchased ? ' ★' : ''}</span>
              <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5 truncate"><Smartphone className="h-3.5 w-3.5 shrink-0" />{c.device_model ?? c.platform ?? '—'}</span>
              <span className="text-sm text-muted-foreground"><span aria-hidden>{flagEmoji(c.region)}</span> {c.region ?? '—'}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-foreground w-fit truncate">{c.attributed_source ?? 'Direct'}</span>
              <span className="text-sm text-muted-foreground">{c.confidence != null ? `${Math.round(Number(c.confidence) * 100)}%` : '—'}</span>
              <span className="text-sm tabular-nums">{Number(c.total_revenue) > 0 ? `${Number(c.total_revenue).toFixed(2)} ${c.currency ?? '€'}` : '—'}</span>
              <span className="text-sm text-muted-foreground">{timeAgo(c.install_date ?? c.first_seen)}</span>
            </button>
          ))
        )}
      </div>

      {/* Clicks table — tracked-link visits (click side of attribution) */}
      <div className="bg-card border border-border/40 card-pop rounded-xl overflow-hidden">
        <div className="grid items-center gap-4 px-5 py-3 border-b border-border/40 text-xs font-medium text-muted-foreground uppercase tracking-wide"
          style={{ gridTemplateColumns: '1.4fr 1fr 0.9fr 1fr 1fr' }}>
          <span>Clic (lien tracké)</span><span>Plateforme</span><span>Quand</span><span>Source</span><span>Localisation</span>
        </div>
        {loading && clicks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Chargement…</p>
        ) : clicks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl border border-border/40 flex items-center justify-center mb-3">
              <Radar className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium mb-1">Aucun clic pour l&apos;instant</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Crée un lien, mets-le dans ta bio ou ta pub, et chaque visite apparaîtra ici en temps réel.</p>
          </div>
        ) : (
          clicks.map((c) => (
            <div key={c.id} className="grid items-center gap-4 px-5 py-3 border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors"
              style={{ gridTemplateColumns: '1.4fr 1fr 0.9fr 1fr 1fr' }}>
              <span className="text-sm font-mono">{c.id.slice(0, 8).toUpperCase()}.</span>
              <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" /> {c.platform ?? '—'}{c.device && c.device !== c.platform ? ` · ${c.device}` : ''}
              </span>
              <span className="text-sm text-muted-foreground">{timeAgo(c.ts)}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-foreground w-fit">{c.link?.source ?? '—'}</span>
              <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                <span aria-hidden>{flagEmoji(c.country)}</span>
                <MapPin className="h-3 w-3 opacity-50" />
                {c.city ?? c.country ?? '—'}
              </span>
            </div>
          ))
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/70 mt-3">
        Les clics (liens trackés) sont anonymes, sans cookie. Le <strong>SDK Appolyn</strong> relie l&apos;installation réelle au revenu et à la source (table « Clients » ci-dessus), via l&apos;IDFV, sans prompt ATT.
      </p>

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
                  ['Pays', detail.region ?? '—'],
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
