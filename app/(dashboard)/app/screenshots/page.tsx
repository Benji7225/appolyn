'use client';

import { PageHeader } from '@/components/dashboard/shell';
import { ScreenshotsManager } from '@/components/dashboard/screenshots-manager';

// Page Screenshots dédiée (sortie de la Localisation pour respirer). On lit les
// captures réelles de l'App Store, on traduit la grosse accroche dans chaque
// langue et on publie en 1 clic. Pilier ASO.
export default function ScreenshotsPage() {
  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Screenshots"
        description="Tes captures App Store, traduites dans chaque langue. On adapte seulement la grosse accroche (pas du mot à mot), on rend l'image et on publie sur l'App Store."
      />
      <ScreenshotsManager />
    </div>
  );
}
