'use client';

import Link from 'next/link';
import { FileText, Search, Image as ImageIcon, Globe, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/shell';

const tools = [
  {
    href: '/dashboard/metadata',
    icon: FileText,
    title: 'App Store Page',
    desc: 'Titre, sous-titre, mots-clés, description par langue, avec note ASO. Génération IA et publication en 1 clic vers App Store Connect.',
    ready: true,
  },
  {
    href: '/dashboard/keywords',
    icon: Search,
    title: 'Keywords',
    desc: 'Recherche de mots-clés, concurrents qui rankent et suivi de position dans le temps.',
    ready: true,
  },
  {
    href: '/dashboard/screenshots',
    icon: ImageIcon,
    title: 'Screenshots',
    desc: 'Tes captures App Store par appareil, avec traduction automatique de l\'accroche dans chaque langue et publication en 1 clic.',
    ready: true,
  },
  {
    href: '/dashboard/localization',
    icon: Globe,
    title: 'Localisation',
    desc: 'Ta couverture de langues App Store en un coup d\'œil : marchés couverts, langues manquantes à conquérir, statut de publication.',
    ready: true,
  },
];

const soon: { icon: typeof Globe; title: string; desc: string }[] = [];

export default function StorePage() {
  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Store Optimization"
        description="Tout ce qui touche à ta fiche App Store, au même endroit."
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

      {soon.length > 0 && (
      <div className="mt-8">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-3">
          Bientôt dans cette section
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {soon.map((s) => (
            <div key={s.title} className="rounded-xl border border-dashed border-border/60 bg-card/40 p-5">
              <div className="h-9 w-9 rounded-lg bg-accent/60 flex items-center justify-center">
                <s.icon className="h-[18px] w-[18px] text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium mt-3 text-muted-foreground">{s.title}</h3>
              <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
