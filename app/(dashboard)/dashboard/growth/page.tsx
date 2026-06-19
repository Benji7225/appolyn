'use client';

import Link from 'next/link';
import { Rocket, Clapperboard, Megaphone, FileText, Link2, Swords, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/shell';

// Hub Croissance : un point d'entrée unique vers tous les outils pour faire
// grandir son app (lancement, contenu, presse, partage, veille concurrentielle).
const tools = [
  { href: '/dashboard/launch', icon: Rocket, title: 'Checklist de lancement', desc: 'Le plan guidé, étape par étape, pour réussir ton jour J : avant, pendant, après.' },
  { href: '/dashboard/content-ideas', icon: Clapperboard, title: 'Idées de contenu', desc: 'Des idées de vidéos court-format (TikTok, Reels, Shorts) qui accrochent, générées par l\'IA.' },
  { href: '/dashboard/launch-posts', icon: Megaphone, title: 'Annonces de lancement', desc: 'Tes posts Product Hunt, X et Reddit prêts à publier, dans ta langue.' },
  { href: '/dashboard/press-kit', icon: FileText, title: 'Press-kit', desc: 'Ton dossier de presse généré automatiquement depuis ta fiche App Store.' },
  { href: '/dashboard/share', icon: Link2, title: 'Kit de partage', desc: 'Badge officiel App Store, Smart App Banner et lien prêts à coller partout.' },
  { href: '/dashboard/competitor-analysis', icon: Swords, title: 'Analyse concurrentielle IA', desc: 'Décortique un concurrent et découvre comment te différencier.' },
];

export default function GrowthPage() {
  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Croissance"
        description="Tout pour faire connaître et grandir ton app, au même endroit."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((t) => (
          <Link key={t.href} href={t.href}
            className="group rounded-xl border border-border/50 bg-card p-5 hover:border-primary/40 transition-colors">
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
