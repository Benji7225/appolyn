'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ContentCockpit } from '@/components/dashboard/content-cockpit';
import { PageHeader, SubNav, EmptyState, StatCard } from '@/components/dashboard/shell';
import {
  Instagram, Music2, Youtube, Search, Facebook, Megaphone,
  TrendingUp, BarChart2, Calendar, CheckCircle2, Circle, AlertCircle, ArrowRight,
  type LucideIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChannelStatus = 'connected' | 'disconnected' | 'error';
type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook';

type OrganicChannel = { id: Platform; icon: LucideIcon; name: string; color: string };

type PaidChannel = {
  icon: LucideIcon;
  name: string;
  color: string;
  status: ChannelStatus;
  budget?: { spent: number; total: number };
  stats?: { impressions: number; clicks: number; installs: number; cpi: number };
};

// ─── Data ─────────────────────────────────────────────────────────────────────

// The four platforms the content cockpit supports, in posting order.
const ORGANIC_CHANNELS: OrganicChannel[] = [
  { id: 'tiktok', icon: Music2, name: 'TikTok', color: '#010101' },
  { id: 'instagram', icon: Instagram, name: 'Instagram', color: '#E1306C' },
  { id: 'youtube', icon: Youtube, name: 'YouTube', color: '#FF0000' },
  { id: 'facebook', icon: Facebook, name: 'Facebook', color: '#1877F2' },
];

const PAID_CHANNELS: PaidChannel[] = [
  { icon: Search, name: 'Apple Search Ads', color: '#0071E3', status: 'disconnected' },
  { icon: Facebook, name: 'Meta Ads', color: '#1877F2', status: 'disconnected' },
  { icon: Music2, name: 'TikTok Ads', color: '#010101', status: 'disconnected' },
  { icon: Megaphone, name: 'Google UAC', color: '#4285F4', status: 'disconnected' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(spent: number, total: number) {
  return Math.min(100, Math.round((spent / total) * 100));
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtEur(n: number) {
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ChannelStatus }) {
  if (status === 'connected') return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
      <CheckCircle2 className="h-3 w-3" /> Connecté
    </span>
  );
  if (status === 'error') return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-destructive">
      <AlertCircle className="h-3 w-3" /> Erreur
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60">
      <Circle className="h-3 w-3" /> Non connecté
    </span>
  );
}

function ConnectButton({ status }: { status: ChannelStatus }) {
  if (status === 'connected') return (
    <button className="text-[12px] font-medium text-muted-foreground border border-border hover:bg-accent rounded-md px-2.5 py-1 shrink-0 transition-colors">
      Gérer
    </button>
  );
  return (
    <button className="text-[12px] font-medium text-primary border border-primary/30 hover:bg-primary/5 rounded-md px-2.5 py-1 shrink-0 transition-colors">
      Connecter
    </button>
  );
}

function SectionHint() {
  return (
    <div className="rounded-lg bg-muted/60 border border-border p-3 mb-6">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Les statistiques s&apos;afficheront depuis vos comptes connectés. Aucune donnée n&apos;est inventée, connectez un canal pour voir ses métriques réelles.
      </p>
    </div>
  );
}

// Top-right channel filter for an overview: "Tout" + a logo toggle per channel.
// Logos are coloured when the account is connected, greyed otherwise. Selecting
// channels filters what the overview below shows. Multi-select.
function ChannelFilter<T extends { name: string; icon: LucideIcon; color: string }>({
  items, selected, onChange, isConnected,
}: { items: T[]; selected: Set<string>; onChange: (s: Set<string>) => void; isConnected?: (item: T) => boolean }) {
  const allOn = selected.size === items.length;
  const toggleAll = () => onChange(allOn ? new Set() : new Set(items.map((i) => i.name)));
  const toggle = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name); else next.add(name);
    onChange(next);
  };
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={toggleAll}
        className={`text-[12px] font-medium rounded-lg px-3 h-8 border transition-colors ${allOn ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}
      >
        Tout
      </button>
      <div className="flex items-center gap-1">
        {items.map((it) => {
          const on = selected.has(it.name);
          const connected = isConnected ? isConnected(it) : false;
          return (
            <button
              key={it.name}
              onClick={() => toggle(it.name)}
              title={connected ? it.name : `${it.name} · non connecté`}
              className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-all ${on ? 'border-primary/40 bg-card' : 'border-transparent opacity-45 hover:opacity-80'}`}
            >
              <it.icon className={`h-4 w-4 ${connected ? '' : 'text-muted-foreground'}`} style={connected ? { color: it.color } : undefined} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Organic ──────────────────────────────────────────────────────────────────

type UpcomingPost = { id: string; title: string; scheduled_at: string | null; platforms: Platform[] };

function OrganicChannelCard({ channel: ch, connected, wired, connecting, onConnect, onDisconnect }: {
  channel: OrganicChannel; connected: boolean; wired: boolean; connecting: boolean;
  onConnect: () => void; onDisconnect: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ch.color}18` }}>
          <ch.icon className="h-5 w-5" style={{ color: ch.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{ch.name}</p>
            {connected ? (
              <button onClick={onDisconnect}
                className="text-[12px] font-medium text-muted-foreground border border-border hover:bg-accent rounded-md px-2.5 py-1 shrink-0 transition-colors">
                Déconnecter
              </button>
            ) : wired ? (
              <button onClick={onConnect} disabled={connecting}
                className="text-[12px] font-medium text-primary border border-primary/30 hover:bg-primary/5 rounded-md px-2.5 py-1 shrink-0 transition-colors disabled:opacity-50">
                {connecting ? 'Ouverture...' : 'Connecter'}
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground/60 shrink-0">Bientôt</span>
            )}
          </div>
          <div className="mt-1">
            <StatusBadge status={connected ? 'connected' : 'disconnected'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function UpcomingPosts({ posts }: { posts: UpcomingPost[] }) {
  const channelIcon = (p: Platform) => ORGANIC_CHANNELS.find((c) => c.id === p)?.icon ?? Calendar;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-muted-foreground" /> Posts à venir
        </h2>
        <Link href="/dashboard/marketing/organic/content" className="text-xs text-primary hover:underline flex items-center gap-1">
          Gérer le contenu <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {posts.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">Aucun post programmé.</p>
            <Link href="/dashboard/marketing/organic/content" className="text-xs text-primary hover:underline mt-1 inline-block">
              Créer un post
            </Link>
          </div>
        ) : posts.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0">
            <p className="text-sm flex-1 truncate">{item.title || 'Sans titre'}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.platforms.map((p) => {
                const Icon = channelIcon(p);
                return <Icon key={p} className="h-3.5 w-3.5 text-muted-foreground" />;
              })}
            </div>
            {item.scheduled_at && (
              <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                {new Date(item.scheduled_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// All four platforms are wired now (FB + Insta share one Meta connection).
const WIRED: Platform[] = ['youtube', 'tiktok', 'facebook', 'instagram'];

// Facebook + Instagram are both covered by a single Meta connection (platform 'meta').
const accountPlatform = (p: Platform): string => (p === 'facebook' || p === 'instagram' ? 'meta' : p);

function OrganicOverview() {
  const [connected, setConnected] = useState<string[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingPost[]>([]);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [active, setActive] = useState<Set<string>>(new Set(ORGANIC_CHANNELS.map((c) => c.name)));

  const load = useCallback(async () => {
    const [{ data: acc }, { data: posts }] = await Promise.all([
      supabase.from('social_accounts').select('platform').eq('status', 'connected'),
      supabase
        .from('content_posts')
        .select('id,title,scheduled_at,content_post_targets(platform)')
        .order('scheduled_at', { ascending: true, nullsFirst: false })
        .limit(5),
    ]);
    setConnected(((acc as { platform: string }[] | null) ?? []).map((a) => a.platform));
    setUpcoming(
      ((posts as { id: string; title: string; scheduled_at: string | null; content_post_targets: { platform: Platform }[] }[] | null) ?? [])
        .map((p) => ({ id: p.id, title: p.title, scheduled_at: p.scheduled_at, platforms: (p.content_post_targets ?? []).map((t) => t.platform) })),
    );
  }, []);

  useEffect(() => { load(); }, [load]);

  const connect = async (platform: Platform) => {
    setConnecting(platform);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`/api/oauth/${accountPlatform(platform)}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const j = await r.json() as { url?: string; error?: string };
      if (j.url) { window.location.href = j.url; return; }
      setConnecting(null);
      alert(j.error ?? 'Connexion impossible.');
    } catch {
      setConnecting(null);
      alert('Connexion impossible (réseau).');
    }
  };

  const disconnect = async (platform: Platform) => {
    if (!confirm(`Déconnecter ${platform} ?`)) return;
    await supabase.from('social_accounts').delete().eq('platform', accountPlatform(platform));
    load();
  };

  const anyConnected = connected.length > 0;
  const shown = ORGANIC_CHANNELS.filter((ch) => active.has(ch.name));
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-xs text-muted-foreground">Filtre par canal</p>
        <ChannelFilter
          items={ORGANIC_CHANNELS}
          selected={active}
          onChange={setActive}
          isConnected={(ch) => connected.includes(accountPlatform(ch.id))}
        />
      </div>
      <SectionHint />
      <div className={`grid sm:grid-cols-3 gap-3 mb-6 ${!anyConnected ? 'opacity-40 pointer-events-none select-none' : ''}`}>
        <StatCard label="Portée totale" value="—" hint="Cumul des canaux sélectionnés" />
        <StatCard label="Engagement moyen" value="—" hint="Likes + commentaires / impressions" />
        <StatCard label="Abonnés" value="—" hint="Total des canaux sélectionnés" />
      </div>
      <h2 className="text-sm font-medium mb-3">Canaux</h2>
      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center mb-8">
          <p className="text-sm text-muted-foreground">Aucun canal sélectionné. Choisis « Tout » ou un canal ci-dessus.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {shown.map((ch) => (
            <OrganicChannelCard
              key={ch.id}
              channel={ch}
              connected={connected.includes(accountPlatform(ch.id))}
              wired={WIRED.includes(ch.id)}
              connecting={connecting === ch.id}
              onConnect={() => connect(ch.id)}
              onDisconnect={() => disconnect(ch.id)}
            />
          ))}
        </div>
      )}
      <UpcomingPosts posts={upcoming} />
    </div>
  );
}

function OrganicAnalytics() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="Analytics en attente"
      description="Connectez au moins un réseau social pour voir la portée, l'engagement et la croissance de votre audience dans le temps."
    />
  );
}

// ─── Paid ─────────────────────────────────────────────────────────────────────

function BudgetRow({ channel: ch }: { channel: PaidChannel }) {
  const spent = ch.budget?.spent ?? 0;
  const total = ch.budget?.total ?? 0;
  const p = total > 0 ? pct(spent, total) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${ch.color}18` }}>
        <ch.icon className="h-3 w-3" style={{ color: ch.color }} />
      </div>
      <span className="text-xs font-medium w-32 shrink-0 truncate">{ch.name}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary/40 transition-all" style={{ width: `${p}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-20 text-right shrink-0">
        {total > 0 ? `${fmtEur(spent)} / ${fmtEur(total)}` : '—'}
      </span>
    </div>
  );
}

function PaidChannelCard({ channel: ch }: { channel: PaidChannel }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ch.color}18` }}>
          <ch.icon className="h-5 w-5" style={{ color: ch.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{ch.name}</p>
            <ConnectButton status={ch.status} />
          </div>
          <div className="mt-1">
            <StatusBadge status={ch.status} />
          </div>
        </div>
      </div>
      {ch.status === 'connected' && ch.stats ? (
        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
          <div><p className="text-[11px] text-muted-foreground">Impressions</p><p className="text-sm font-medium tabular-nums">{fmtNum(ch.stats.impressions)}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Clics</p><p className="text-sm font-medium tabular-nums">{fmtNum(ch.stats.clicks)}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Installations</p><p className="text-sm font-medium tabular-nums">{fmtNum(ch.stats.installs)}</p></div>
          <div><p className="text-[11px] text-muted-foreground">CPI</p><p className="text-sm font-medium tabular-nums">{fmtEur(ch.stats.cpi)}</p></div>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground/50">
          <BarChart2 className="h-3.5 w-3.5 shrink-0" />
          Performances disponibles après connexion
        </div>
      )}
    </div>
  );
}

function PaidOverview() {
  const anyConnected = PAID_CHANNELS.some((c) => c.status === 'connected');
  const [active, setActive] = useState<Set<string>>(new Set(PAID_CHANNELS.map((c) => c.name)));
  const shown = PAID_CHANNELS.filter((ch) => active.has(ch.name));
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-xs text-muted-foreground">Filtre par plateforme</p>
        <ChannelFilter
          items={PAID_CHANNELS}
          selected={active}
          onChange={setActive}
          isConnected={(ch) => ch.status === 'connected'}
        />
      </div>
      <SectionHint />
      <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 ${!anyConnected ? 'opacity-40 pointer-events-none select-none' : ''}`}>
        <StatCard label="Dépenses totales" value="—" sub="Canaux sélectionnés" />
        <StatCard label="Installations" value="—" sub="Canaux sélectionnés" />
        <StatCard label="CPI moyen" value="—" sub="Coût par install" />
        <StatCard label="ROAS" value="—" sub="Retour sur investissement" />
      </div>
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Budget mensuel</h2>
          <span className="text-xs text-muted-foreground">Juin 2026</span>
        </div>
        <div className="space-y-3">
          {shown.map((ch) => <BudgetRow key={ch.name} channel={ch} />)}
        </div>
        <p className="text-xs text-muted-foreground/60 mt-4 text-center">
          Connectez vos comptes pour voir le suivi de budget en temps réel
        </p>
      </div>
      <h2 className="text-sm font-medium mb-3">Plateformes publicitaires</h2>
      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">Aucune plateforme sélectionnée. Choisis « Tout » ou une plateforme ci-dessus.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {shown.map((ch) => <PaidChannelCard key={ch.name} channel={ch} />)}
        </div>
      )}
    </div>
  );
}

function PaidCampaigns() {
  return (
    <EmptyState
      icon={Megaphone}
      title="Aucune campagne disponible"
      description="Connectez Apple Search Ads, Meta Ads, TikTok Ads ou Google UAC pour centraliser toutes vos campagnes et leur performance ici."
    />
  );
}

function PaidAnalytics() {
  return (
    <EmptyState
      icon={BarChart2}
      title="Reporting unifié en attente"
      description="Une fois vos plateformes publicitaires connectées, vous verrez ici un reporting consolidé : dépenses, CPI, ROAS et funnel d'acquisition."
    />
  );
}

// ─── Sub-nav configs ──────────────────────────────────────────────────────────

const ORGANIC_TABS = [
  { href: '/dashboard/marketing/organic', label: "Vue d'ensemble" },
  { href: '/dashboard/marketing/organic/analytics', label: 'Analytics' },
  { href: '/dashboard/marketing/organic/content', label: 'Contenu' },
];

const PAID_TABS = [
  { href: '/dashboard/marketing/paid', label: "Vue d'ensemble" },
  { href: '/dashboard/marketing/paid/campaigns', label: 'Campagnes' },
  { href: '/dashboard/marketing/paid/analytics', label: 'Analytics' },
];

// ─── Export ───────────────────────────────────────────────────────────────────

export function MarketingSection({ kind, sub }: { kind: 'organic' | 'paid'; sub?: string }) {
  const isOrganic = kind === 'organic';
  const title = isOrganic ? 'Marketing Organique' : 'Marketing Publicité';
  const desc = isOrganic
    ? "Réseaux sociaux, contenu et croissance d'audience."
    : "Campagnes payantes, budget et reporting d'acquisition.";

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader title={title} description={desc} />
      <SubNav items={isOrganic ? ORGANIC_TABS : PAID_TABS} />
      {isOrganic ? (
        sub === 'analytics' ? <OrganicAnalytics /> :
        sub === 'content'   ? <ContentCockpit />   :
        <OrganicOverview />
      ) : (
        sub === 'campaigns' ? <PaidCampaigns />  :
        sub === 'analytics' ? <PaidAnalytics />  :
        <PaidOverview />
      )}
    </div>
  );
}
