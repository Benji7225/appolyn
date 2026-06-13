'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { Plus, Copy, Check, Trash2, Link2 } from 'lucide-react';

// New tables aren't in the generated DB types yet; access them untyped.
const db = supabase as unknown as { from: (t: string) => any };

type SignalLink = { id: string; slug: string; label: string; source: string; destination_url: string; destination_url_android: string | null };

export const ORGANIC_LINK_CHANNELS = ['TikTok', 'Instagram', 'Facebook', 'YouTube', 'X', 'Reddit', 'Newsletter'];
export const PAID_LINK_CHANNELS = ['TikTok Ads', 'Meta Ads', 'Google Ads'];

const randSuffix = () => Math.random().toString(36).slice(2, 6);
const channelSlug = (ch: string) =>
  `${ch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${randSuffix()}`;

// Per-channel tracked links for one app, used in Marketing (Organique / Publicité).
// Click a channel to generate (or copy) its link; the install that comes through it
// is labelled with that source in the Clients table. The destination is the app's
// App Store page (built from its Apple id when store_url isn't set).
export function AcquisitionLinks({ channels, kind }: { channels: string[]; kind: 'organic' | 'paid' }) {
  const { selectedApp } = useDashboard();
  const [links, setLinks] = useState<SignalLink[]>([]);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [androidUrl, setAndroidUrl] = useState('');
  const [androidSaved, setAndroidSaved] = useState(false);
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const dest = selectedApp?.store_url
    || (selectedApp?.asc_app_id ? `https://apps.apple.com/app/id${selectedApp.asc_app_id}` : '');

  const load = useCallback(async () => {
    const { data } = await db.from('signal_links').select('id, slug, label, source, destination_url, destination_url_android').order('created_at', { ascending: false });
    const rows = (data ?? []) as SignalLink[];
    setLinks(rows.filter((l) => channels.includes(l.source)));
    const existingAndroid = rows.find((l) => l.destination_url_android)?.destination_url_android;
    if (existingAndroid) setAndroidUrl((cur) => cur || existingAndroid);
  }, [channels]);
  useEffect(() => { load(); }, [load]);

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  };

  const createPreset = async (channel: string) => {
    const existing = links.find((l) => l.source === channel);
    if (existing) {
      if (dest && !/^https?:\/\//i.test(existing.destination_url || '')) {
        await db.from('signal_links').update({ destination_url: dest }).eq('id', existing.id);
        await load();
      }
      copy(`${origin}/s/${existing.slug}`, existing.id);
      return;
    }
    if (!dest) return;
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }
    const { data: created } = await db.from('signal_links').insert({
      user_id: user.id, slug: channelSlug(channel), label: channel, source: channel,
      destination_url: dest, destination_url_android: androidUrl.trim() || null,
    }).select('id, slug').single();
    await load();
    if (created?.slug) copy(`${origin}/s/${created.slug}`, created.id as string);
    setCreating(false);
  };

  const removeLink = async (id: string) => { await db.from('signal_links').delete().eq('id', id); await load(); };

  // Apply the Google Play link to all of this section's links so the same URL
  // sends Android users to Play and iOS users to the App Store.
  const saveAndroid = async () => {
    const val = androidUrl.trim() || null;
    await Promise.all(links.map((l) => db.from('signal_links').update({ destination_url_android: val }).eq('id', l.id)));
    setAndroidSaved(true);
    setTimeout(() => setAndroidSaved(false), 1500);
    await load();
  };

  const intro = kind === 'organic'
    ? "Mets le lien d'un canal dans ta bio ou ton post. Chaque client qui passe par là apparaît avec ce canal dans Clients."
    : "Mets le lien comme destination de ta pub. Chaque install qui passe par là est attribué à ce canal dans Clients. (Apple Search Ads est détecté automatiquement, sans lien.)";

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-1">
        <Link2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Liens d&apos;acquisition</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3 max-w-2xl">{intro}</p>

      {!selectedApp ? (
        <div className="rounded-xl border border-border/40 bg-card p-5 text-sm text-muted-foreground">Sélectionne une app pour générer ses liens.</div>
      ) : (
        <div className="bg-card border border-border/40 card-pop rounded-xl p-5">
          <div className="flex flex-wrap gap-2">
            {channels.map((ch) => {
              const exists = links.some((l) => l.source === ch);
              return (
                <button key={ch} onClick={() => createPreset(ch)} disabled={creating || !dest}
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

          <div className="mt-4 pt-3 border-t border-border/30">
            <label className="text-xs text-muted-foreground">Lien Google Play (Android, optionnel)</label>
            <div className="flex items-center gap-2 mt-1">
              <input value={androidUrl} onChange={(e) => setAndroidUrl(e.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=..."
                className="text-sm bg-background border border-border/40 rounded-lg px-3 h-9 flex-1 min-w-0 focus:outline-none" />
              <button onClick={saveAndroid} disabled={links.length === 0}
                className="text-sm rounded-lg px-3 h-9 border border-border/50 hover:bg-accent transition-colors disabled:opacity-50 shrink-0">
                {androidSaved ? 'Enregistré ✓' : 'Enregistrer'}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-1">Si rempli, le même lien envoie les Android vers Google Play et les iPhone vers l&apos;App Store.</p>
          </div>
        </div>
      )}
    </div>
  );
}
