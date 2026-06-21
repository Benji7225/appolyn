'use client';

import Link from 'next/link';
import { Megaphone, Target, Sparkles, Rocket, Link2, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/shell';

// Hub de la section Marketing (page parent façon Shopify) : tout pour faire
// connaître l'app, au même endroit.
const tools = [
  {
    href: '/app/marketing/organic',
    icon: Megaphone,
    title: 'Organique',
    desc: 'Publie tes contenus sur tes réseaux et suis ce qui marche, sans payer.',
  },
  {
    href: '/app/marketing/paid',
    icon: Target,
    title: 'Publicité',
    desc: 'Tes campagnes payantes (Apple Search Ads, Meta, TikTok) au même endroit.',
  },
  {
    href: '/app/content-ideas',
    icon: Sparkles,
    title: 'Idées de contenu',
    desc: 'Des idées de vidéos courtes (TikTok, Reels, Shorts) générées à partir de ta vraie fiche App Store.',
  },
  {
    href: '/app/launch-posts',
    icon: Rocket,
    title: 'Annonces de lancement',
    desc: "Tes posts Product Hunt, Reddit et X pour le jour J, écrits par l'IA depuis ta fiche.",
  },
  {
    href: '/app/share',
    icon: Link2,
    title: 'Kit de partage',
    desc: 'Badge App Store, Smart App Banner, lien et QR code prêts à coller partout.',
  },
];

export default function MarketingPage() {
  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Marketing"
        description="Tout pour faire connaître ton app : contenus, publicité, lancement et partage."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group rounded-xl border border-border/50 bg-card p-5 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                <t.icon className="h-[18px] w-[18px] text-foreground" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-sm font-medium mt-3">{t.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
