'use client';

import { ScreenshotsManager } from '@/components/dashboard/screenshots-manager';

// Page Screenshots dédiée (sortie de la Localisation pour respirer). On lit les
// captures réelles de l'App Store, on traduit la grosse accroche dans chaque
// langue et on publie en 1 clic. Pilier ASO. Le titre + le sous-titre + les actions
// (sélecteur de langue, traduire) sont rendus par ScreenshotsManager, sur une seule
// ligne (plus de doublon de header).
export default function ScreenshotsPage() {
  return (
    <div className="p-8 scrollbar-macos">
      <ScreenshotsManager />
    </div>
  );
}
