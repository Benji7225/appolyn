'use client';

import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { Swords } from 'lucide-react';

export default function CompetitorsPage() {
  return (
    <div className="p-8 max-w-5xl scrollbar-macos">
      <PageHeader
        title="Competitors"
        description="Surveille jusqu'à 5 apps concurrentes et sois alerté quand elles bougent."
      />
      <EmptyState
        icon={Swords}
        title="Bientôt : surveillance des concurrents"
        description="Ajoute jusqu'à 5 apps concurrentes par leur fiche App Store. Appolyn prendra un instantané réel de leur titre, sous-titre, prix, note et captures, et te préviendra à chaque changement. Aucune donnée inventée : tout vient de l'App Store public."
      />
    </div>
  );
}
