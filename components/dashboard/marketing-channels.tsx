'use client';

import { PageHeader } from '@/components/dashboard/shell';
import { Instagram, Music2, Youtube, Twitter, Search, Facebook, Megaphone, type LucideIcon } from 'lucide-react';

type Channel = { icon: LucideIcon; name: string; desc: string };

const ORGANIC: Channel[] = [
  { icon: Instagram, name: 'Instagram', desc: 'Programmation et cross-post de Reels.' },
  { icon: Music2, name: 'TikTok', desc: 'Publication et statistiques de vues.' },
  { icon: Youtube, name: 'YouTube', desc: 'Shorts et vidéos, performance.' },
  { icon: Twitter, name: 'X', desc: 'Posts et threads, portée.' },
];

const PAID: Channel[] = [
  { icon: Search, name: 'Apple Search Ads', desc: 'Campagnes et reporting App Store.' },
  { icon: Facebook, name: 'Meta Ads', desc: 'Instagram & Facebook, ROAS.' },
  { icon: Music2, name: 'TikTok Ads', desc: 'Campagnes et coût par installation.' },
  { icon: Megaphone, name: 'Google Ads', desc: 'UAC et reporting.' },
];

function ConnectCard({ icon: Icon, name, desc }: Channel) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <button className="text-[12px] font-medium text-primary border border-primary/30 hover:bg-primary/5 rounded-md px-2.5 py-1 shrink-0">
        Connecter
      </button>
    </div>
  );
}

export function MarketingSection({ kind }: { kind: 'organic' | 'paid' }) {
  const items = kind === 'organic' ? ORGANIC : PAID;
  const title = kind === 'organic' ? 'Marketing — Organique' : 'Marketing — Publicité';
  const desc = kind === 'organic'
    ? 'Réseaux sociaux : cross-post, calendrier et statistiques. Reporting unifié à venir.'
    : 'Campagnes payantes et reporting unifié. Connexions à venir.';

  return (
    <div className="p-8 max-w-5xl scrollbar-macos">
      <PageHeader title={title} description={desc} />
      <div className="rounded-lg bg-muted/60 border border-border p-3 mb-6">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ces canaux demandent de connecter tes comptes externes. Tant qu'un compte n'est pas relié, rien n'est
          affiché ici : aucune statistique n'est inventée.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((c) => <ConnectCard key={c.name} {...c} />)}
      </div>
    </div>
  );
}
