'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Instagram, Music2, Youtube, Facebook, Search, Megaphone,
  CheckCircle2, Circle, type LucideIcon,
} from 'lucide-react';

type Platform = 'tiktok' | 'instagram' | 'youtube' | 'facebook';

const SOCIAL: { id: Platform; name: string; icon: LucideIcon; color: string }[] = [
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: '#010101' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
];

const ADS: { name: string; icon: LucideIcon; color: string }[] = [
  { name: 'Apple Search Ads', icon: Search, color: '#0071E3' },
  { name: 'Meta Ads', icon: Facebook, color: '#1877F2' },
  { name: 'TikTok Ads', icon: Music2, color: '#010101' },
  { name: 'Google UAC', icon: Megaphone, color: '#4285F4' },
];

// Facebook + Instagram are covered by one Meta connection.
const accountPlatform = (p: Platform): string => (p === 'facebook' || p === 'instagram' ? 'meta' : p);

export default function ConnectionsSettings() {
  const [connected, setConnected] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<Platform | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('social_accounts').select('platform').eq('status', 'connected');
    setConnected(((data as { platform: string }[] | null) ?? []).map((a) => a.platform));
  }, []);
  useEffect(() => { load(); }, [load]);

  const connect = async (p: Platform) => {
    setConnecting(p);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`/api/oauth/${accountPlatform(p)}/start`, {
        method: 'POST', headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const j = await r.json() as { url?: string; error?: string };
      if (j.url) { window.location.href = j.url; return; }
      setConnecting(null);
      alert(j.error ?? 'Connexion impossible.');
    } catch { setConnecting(null); alert('Connexion impossible (réseau).'); }
  };

  const disconnect = async (p: Platform) => {
    if (!confirm(`Déconnecter ${p} ?`)) return;
    await supabase.from('social_accounts').delete().eq('platform', accountPlatform(p));
    load();
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-medium mb-1">Réseaux sociaux</h2>
        <p className="text-xs text-muted-foreground mb-3">Connecte tes comptes pour publier ton contenu et voir tes statistiques réelles. Facebook et Instagram partagent une seule connexion Meta.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {SOCIAL.map((ch) => {
            const isOn = connected.includes(accountPlatform(ch.id));
            return (
              <div key={ch.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ch.color}18` }}>
                  <ch.icon className="h-5 w-5" style={{ color: ch.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ch.name}</p>
                  {isOn ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500"><CheckCircle2 className="h-3 w-3" /> Connecté</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60"><Circle className="h-3 w-3" /> Non connecté</span>
                  )}
                </div>
                {isOn ? (
                  <button onClick={() => disconnect(ch.id)} className="text-[12px] font-medium text-muted-foreground border border-border hover:bg-accent rounded-md px-2.5 py-1 shrink-0 transition-colors">Déconnecter</button>
                ) : (
                  <button onClick={() => connect(ch.id)} disabled={connecting === ch.id} className="text-[12px] font-medium text-primary border border-primary/30 hover:bg-primary/5 rounded-md px-2.5 py-1 shrink-0 transition-colors disabled:opacity-50">
                    {connecting === ch.id ? 'Ouverture...' : 'Connecter'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-1">Plateformes publicitaires</h2>
        <p className="text-xs text-muted-foreground mb-3">Connecte tes régies pour centraliser budgets et performances. Bientôt disponible.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {ADS.map((ch) => (
            <div key={ch.name} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ch.color}18` }}>
                <ch.icon className="h-5 w-5" style={{ color: ch.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{ch.name}</p>
                <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60"><Circle className="h-3 w-3" /> Non connecté</span>
              </div>
              <span className="text-[11px] text-muted-foreground/60 shrink-0">Bientôt</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
