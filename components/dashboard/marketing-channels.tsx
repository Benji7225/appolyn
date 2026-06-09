'use client';

import { useState } from 'react';
import { PageHeader, SubNav, EmptyState, StatCard } from '@/components/dashboard/shell';
import { PostComposer } from '@/components/dashboard/post-composer';
import { CalendarGrid, type NewPostData } from '@/components/dashboard/calendar-grid';
import {
  Instagram, Music2, Youtube, Twitter, Search, Facebook, Megaphone,
  TrendingUp, BarChart2, CheckCircle2, Circle, AlertCircle,
  type LucideIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChannelStatus = 'connected' | 'disconnected' | 'error';

type OrganicChannel = {
  icon: LucideIcon;
  name: string;
  color: string;
  status: ChannelStatus;
  stats?: { followers: number; reach: number; engagement: number };
};

type PaidChannel = {
  icon: LucideIcon;
  name: string;
  color: string;
  status: ChannelStatus;
  budget?: { spent: number; total: number };
  stats?: { impressions: number; clicks: number; installs: number; cpi: number };
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const ORGANIC_CHANNELS: OrganicChannel[] = [
  { icon: Instagram, name: 'Instagram', color: '#E1306C', status: 'disconnected' },
  { icon: Music2, name: 'TikTok', color: '#010101', status: 'disconnected' },
  { icon: Youtube, name: 'YouTube', color: '#FF0000', status: 'disconnected' },
  { icon: Twitter, name: 'X (Twitter)', color: '#1DA1F2', status: 'disconnected' },
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
        Les statistiques s&apos;afficheront depuis vos comptes connectés. Aucune donnée n&apos;est inventée — connectez un canal pour voir ses métriques réelles.
      </p>
    </div>
  );
}

// ─── Organic ──────────────────────────────────────────────────────────────────

function OrganicChannelCard({ channel: ch }: { channel: OrganicChannel }) {
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
          <div className="mt-1"><StatusBadge status={ch.status} /></div>
        </div>
      </div>
      {ch.status === 'connected' && ch.stats ? (
        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2">
          <div><p className="text-[11px] text-muted-foreground">Abonnés</p><p className="text-sm font-medium tabular-nums">{fmtNum(ch.stats.followers)}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Portée</p><p className="text-sm font-medium tabular-nums">{fmtNum(ch.stats.reach)}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Engagement</p><p className="text-sm font-medium tabular-nums">{ch.stats.engagement.toFixed(1)}%</p></div>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground/50">
          <BarChart2 className="h-3.5 w-3.5 shrink-0" /> Statistiques disponibles après connexion
        </div>
      )}
    </div>
  );
}

function OrganicOverview({ onNewPost, newPostData }: { onNewPost: (date?: string) => void; newPostData?: NewPostData }) {
  const anyConnected = ORGANIC_CHANNELS.some((c) => c.status === 'connected');
  return (
    <div>
      <SectionHint />
      <div className={`grid sm:grid-cols-3 gap-3 mb-6 ${!anyConnected ? 'opacity-40 pointer-events-none select-none' : ''}`}>
        <StatCard label="Portée totale" value="—" hint="Cumul tous canaux" />
        <StatCard label="Engagement moyen" value="—" hint="Likes + commentaires / impressions" />
        <StatCard label="Abonnés" value="—" hint="Total tous canaux" />
      </div>
      <h2 className="text-sm font-medium mb-3">Canaux</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {ORGANIC_CHANNELS.map((ch) => <OrganicChannelCard key={ch.name} channel={ch} />)}
      </div>
      <h2 className="text-sm font-medium mb-3">Calendrier éditorial</h2>
      <CalendarGrid onNewPost={onNewPost} newPostData={newPostData} />
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

function OrganicContent({ onNewPost, newPostData }: { onNewPost: (date?: string) => void; newPostData?: NewPostData }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">Gérez et planifiez vos contenus sur tous vos canaux depuis un seul endroit.</p>
      <CalendarGrid onNewPost={onNewPost} newPostData={newPostData} />
    </div>
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
          <div className="mt-1"><StatusBadge status={ch.status} /></div>
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
          <BarChart2 className="h-3.5 w-3.5 shrink-0" /> Performances disponibles après connexion
        </div>
      )}
    </div>
  );
}

function PaidOverview() {
  const anyConnected = PAID_CHANNELS.some((c) => c.status === 'connected');
  return (
    <div>
      <SectionHint />
      <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 ${!anyConnected ? 'opacity-40 pointer-events-none select-none' : ''}`}>
        <StatCard label="Dépenses totales" value="—" sub="Connectez un canal" />
        <StatCard label="Installations" value="—" sub="Connectez un canal" />
        <StatCard label="CPI moyen" value="—" sub="Coût par install" />
        <StatCard label="ROAS" value="—" sub="Retour sur investissement" />
      </div>
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Budget mensuel</h2>
          <span className="text-xs text-muted-foreground">Juin 2026</span>
        </div>
        <div className="space-y-3">
          {PAID_CHANNELS.map((ch) => <BudgetRow key={ch.name} channel={ch} />)}
        </div>
        <p className="text-xs text-muted-foreground/60 mt-4 text-center">Connectez vos comptes pour voir le suivi de budget en temps réel</p>
      </div>
      <h2 className="text-sm font-medium mb-3">Plateformes publicitaires</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {PAID_CHANNELS.map((ch) => <PaidChannelCard key={ch.name} channel={ch} />)}
      </div>
    </div>
  );
}

function PaidCampaigns() {
  return (
    <EmptyState icon={Megaphone} title="Aucune campagne disponible"
      description="Connectez Apple Search Ads, Meta Ads, TikTok Ads ou Google UAC pour centraliser toutes vos campagnes et leur performance ici." />
  );
}

function PaidAnalytics() {
  return (
    <EmptyState icon={BarChart2} title="Reporting unifié en attente"
      description="Une fois vos plateformes publicitaires connectées, vous verrez ici un reporting consolidé : dépenses, CPI, ROAS et funnel d'acquisition." />
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
    ? "Réseaux sociaux, calendrier éditorial et croissance d'audience."
    : "Campagnes payantes, budget et reporting d'acquisition.";

  const [composerOpen, setComposerOpen] = useState(false);
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [lastPost, setLastPost] = useState<NewPostData | undefined>();

  const openComposer = (date?: string) => {
    setPrefillDate(date);
    setComposerOpen(true);
  };

  return (
    <div className="p-8 max-w-5xl scrollbar-macos">
      <PageHeader title={title} description={desc} />
      <SubNav items={isOrganic ? ORGANIC_TABS : PAID_TABS} />
      {isOrganic ? (
        sub === 'analytics' ? <OrganicAnalytics /> :
        sub === 'content'   ? <OrganicContent onNewPost={openComposer} newPostData={lastPost} /> :
        <OrganicOverview onNewPost={openComposer} newPostData={lastPost} />
      ) : (
        sub === 'campaigns' ? <PaidCampaigns />  :
        sub === 'analytics' ? <PaidAnalytics />  :
        <PaidOverview />
      )}
      {composerOpen && (
        <PostComposer
          prefillDate={prefillDate}
          onClose={() => setComposerOpen(false)}
          onSave={(post) => {
            setLastPost({ ...post, date: prefillDate && prefillDate !== '' ? prefillDate : post.date });
            setComposerOpen(false);
          }}
        />
      )}
    </div>
  );
}
