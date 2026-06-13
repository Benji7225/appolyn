'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { getCache, setCache } from '@/lib/cache';
import { Radar, Plus, Copy, Check, Link2, Trash2, MapPin, Smartphone } from 'lucide-react';

const SOURCES = ['Organic', 'TikTok Ads', 'Meta Ads', 'Google Ads', 'Apple Search Ads', 'Créateur', 'Landing page'];

// New tables aren't in the generated DB types yet; access them untyped.
const db = supabase as unknown as { from: (t: string) => any };

type SignalLink = { id: string; slug: string; label: string; source: string; destination_url: string; created_at: string };
type Click = {
  id: string; ts: string; country: string | null; city: string | null;
  device: string | null; platform: string | null;
  link: { id: string; label: string; source: string } | null;
};

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

  useEffect(() => { setOrigin(window.location.origin); }, []);

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
        <h1 className="text-2xl font-semibold tracking-tight">Acquisition</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Mesure chaque source de trafic vers ton app. Crée un lien tracké par campagne, créateur ou test, et vois d&apos;où viennent tes visiteurs : device, pays, source. Données réelles, anonymes, sans cookie.
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

      {/* Clicks table */}
      <div className="bg-card border border-border/40 card-pop rounded-xl overflow-hidden">
        <div className="grid items-center gap-4 px-5 py-3 border-b border-border/40 text-xs font-medium text-muted-foreground uppercase tracking-wide"
          style={{ gridTemplateColumns: '1.4fr 1fr 0.9fr 1fr 1fr' }}>
          <span>Visiteur</span><span>Plateforme</span><span>Quand</span><span>Source</span><span>Localisation</span>
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
        Les clics sont anonymes (aucune donnée personnelle, aucun cookie). Pour relier une visite à une installation et au revenu, il faudra une couche supplémentaire (SDK ou SKAdNetwork) — prévue plus tard.
      </p>
    </div>
  );
}
