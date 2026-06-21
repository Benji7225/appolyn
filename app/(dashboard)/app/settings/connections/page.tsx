'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { SdkModal } from '@/components/dashboard/sdk-modal';
import { SdkStatusBanner } from '@/components/dashboard/sdk-status';
import {
  Instagram, Music2, Youtube, Facebook, Search, Megaphone,
  CheckCircle2, Circle, Copy, Check, Code2, ChevronDown, type LucideIcon,
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

type Account = { account_name?: string; external_id?: string; meta?: Record<string, unknown> };

// Nom du compte connecté à montrer, par plateforme (Meta = 1 connexion FB + IG :
// on affiche la page côté Facebook, le @handle côté Instagram).
function accountLabel(platformId: Platform, acct?: Account): string {
  if (!acct) return '';
  const m = (acct.meta ?? {}) as Record<string, unknown>;
  if (platformId === 'instagram') return typeof m.ig_username === 'string' && m.ig_username ? `@${m.ig_username}` : (acct.account_name ?? '');
  if (platformId === 'facebook') return typeof m.page_name === 'string' && m.page_name ? (m.page_name as string) : (acct.account_name ?? '');
  return acct.account_name ?? '';
}

export default function ConnectionsSettings() {
  const { selectedApp } = useDashboard();
  const [accounts, setAccounts] = useState<Record<string, Account>>({});
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [sdkOpen, setSdkOpen] = useState(false);

  const sdkKey = (selectedApp as { sdk_key?: string } | null)?.sdk_key ?? '';

  const load = useCallback(async () => {
    const { data } = await supabase.from('social_accounts').select('platform, account_name, external_id, meta').eq('status', 'connected');
    const map: Record<string, Account> = {};
    for (const a of (data as (Account & { platform: string })[] | null) ?? []) {
      map[a.platform] = { account_name: a.account_name, external_id: a.external_id, meta: a.meta };
    }
    setAccounts(map);
  }, []);
  useEffect(() => { load(); }, [load]);

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  };

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
      {/* SDK & attribution : surface SIMPLE (bouton + clé), détail technique replié. */}
      <section>
        <h2 className="text-sm font-medium mb-1 flex items-center gap-1.5"><Code2 className="h-4 w-4" /> SDK &amp; attribution</h2>
        <p className="text-xs text-muted-foreground mb-3">Une seule ligne dans ton app et tu vois chaque installation, sa source et son revenu. Les achats sont captés automatiquement, sans donnée personnelle ni prompt de suivi.</p>

        {!selectedApp ? (
          <p className="text-xs text-muted-foreground">Sélectionne une app (en haut) pour obtenir sa clé SDK.</p>
        ) : (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-medium">{selectedApp.name}</p>
                <code className="block text-[11px] font-mono text-muted-foreground truncate mt-0.5 max-w-xs">{sdkKey || '—'}</code>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => copy(sdkKey, 'key')} disabled={!sdkKey}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground border border-border hover:bg-accent rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50">
                  {copied === 'key' ? <><Check className="h-3 w-3 text-emerald-500" /> Copiée</> : <><Copy className="h-3 w-3" /> Copier la clé</>}
                </button>
                <button onClick={() => setSdkOpen(true)}
                  className="inline-flex items-center gap-1.5 text-sm rounded-lg px-3.5 h-9 bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
                  Brancher le SDK
                </button>
              </div>
            </div>

            <div className="mt-3"><SdkStatusBanner appId={selectedApp?.id} /></div>

            {/* Détail technique : discret, replié par défaut. */}
            <details className="group mt-3 pt-3 border-t border-border/40">
              <summary className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors list-none [&::-webkit-details-marker]:hidden">
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                Options avancées : sources, écrans d&apos;onboarding, confidentialité
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs font-medium mb-1">Données de tes utilisateurs <span className="text-muted-foreground font-normal">(optionnel)</span></p>
                  <p className="text-[11px] text-muted-foreground">Remonte leurs choix pour les voir dans leur fiche et dans la « Répartition » de la page Utilisateurs : <code className="font-mono">Appolyn.setUserProperty(&quot;niveau&quot;, &quot;Engagé&quot;)</code>. Et leur source, sans aucun lien à coller : <code className="font-mono">Appolyn.setSource(&quot;TikTok&quot;)</code> (la réponse à ta question d&apos;onboarding « Comment as-tu connu l&apos;app ? »).</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Entonnoir d&apos;onboarding <span className="text-muted-foreground font-normal">(optionnel)</span></p>
                  <p className="text-[11px] text-muted-foreground">Pour voir où tes utilisateurs décrochent, marque tes écrans. SwiftUI : <code className="font-mono">.appolynScreen(&quot;welcome&quot;)</code>. UIKit : <code className="font-mono">Appolyn.screen(&quot;Welcome&quot;)</code> dans <code className="font-mono">viewDidAppear</code>. Appolyn ordonne les écrans et calcule le décrochage tout seul.</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Données collectées <span className="text-muted-foreground font-normal">(pour ta nutrition label App Privacy)</span></p>
                  <p className="text-[11px] text-muted-foreground">Le SDK ne collecte que des signaux techniques anonymes, jamais l&apos;IDFA ni de données personnelles, et n&apos;affiche aucun prompt ATT. À déclarer dans App Store Connect &rsaquo; Confidentialité de l&apos;app : <strong>Identifiants</strong> (IDFV), <strong>Achats</strong>, <strong>Données d&apos;utilisation</strong> (lancements, écrans vus), <strong>Diagnostics</strong> (appareil, OS, version). Tout est lié à l&apos;IDFV pseudonyme, sans suivi cross-app.</p>
                </div>
              </div>
            </details>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium mb-1">Réseaux sociaux</h2>
        <p className="text-xs text-muted-foreground mb-3">Connecte tes comptes pour publier ton contenu et voir tes statistiques réelles. Facebook et Instagram partagent une seule connexion Meta.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {SOCIAL.map((ch) => {
            const acct = accounts[accountPlatform(ch.id)];
            const isOn = !!acct;
            const label = accountLabel(ch.id, acct);
            return (
              <div key={ch.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ch.color}18` }}>
                  <ch.icon className="h-5 w-5" style={{ color: ch.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ch.name}</p>
                  {isOn ? (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500 min-w-0">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">Connecté{label ? ` · ${label}` : ''}</span>
                    </span>
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

      <SdkModal open={sdkOpen} onClose={() => setSdkOpen(false)} />
    </div>
  );
}
