'use client';

import { PageHeader } from '@/components/dashboard/shell';
import { Instagram, Music2, Youtube, Twitter, Search, Facebook, Megaphone } from 'lucide-react';

const organic = [
  { icon: Instagram, name: 'Instagram', desc: 'Programmation et cross-post de Reels.' },
  { icon: Music2, name: 'TikTok', desc: 'Publication et statistiques de vues.' },
  { icon: Youtube, name: 'YouTube', desc: 'Shorts et vidéos, performance.' },
  { icon: Twitter, name: 'X', desc: 'Posts et threads, portée.' },
];

const paid = [
  { icon: Search, name: 'Apple Search Ads', desc: 'Campagnes et reporting App Store.' },
  { icon: Facebook, name: 'Meta Ads', desc: 'Instagram & Facebook, ROAS.' },
  { icon: Music2, name: 'TikTok Ads', desc: 'Campagnes et coût par installation.' },
  { icon: Megaphone, name: 'Google Ads', desc: 'UAC et reporting.' },
];

function ConnectCard({ icon: Icon, name, desc }: { icon: typeof Search; name: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <span className="text-[11px] text-muted-foreground border border-border/60 rounded-md px-2 py-1 shrink-0">
        Bientôt
      </span>
    </div>
  );
}

export default function MarketingPage() {
  return (
    <div className="p-8 max-w-5xl scrollbar-macos">
      <PageHeader
        title="Marketing"
        description="Tes canaux organiques et payants, au même endroit. Reporting unifié à venir."
      />

      <div className="rounded-lg bg-muted/40 border border-border/40 p-3 mb-6">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ces canaux demandent de connecter tes comptes externes (OAuth). Les connexions arrivent progressivement.
          Tant qu'un compte n'est pas relié, rien n'est affiché ici : aucune statistique n'est inventée.
        </p>
      </div>

      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-3">Organique</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {organic.map((c) => <ConnectCard key={c.name} {...c} />)}
      </div>

      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-3">Payant</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {paid.map((c) => <ConnectCard key={c.name} {...c} />)}
      </div>
    </div>
  );
}
