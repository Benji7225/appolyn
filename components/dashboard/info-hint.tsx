'use client';

import { Info } from 'lucide-react';

// Petite infobulle d'explication, sobre, à coller à côté d'un titre. Au survol
// (ou au focus clavier), on voit en une phrase simple ce que la métrique veut
// dire. Zéro jargon. Le `title` natif sert de repli si la bulle est masquée par
// un conteneur qui coupe le débordement.
export function InfoHint({ text, side = 'top' }: { text: string; side?: 'top' | 'bottom' }) {
  const pos = side === 'top'
    ? 'bottom-full mb-1.5'
    : 'top-full mt-1.5';
  return (
    <span className="group relative inline-flex items-center align-middle" tabIndex={0} title={text}>
      <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" aria-hidden />
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${pos} z-50 w-60 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-[11px] font-normal normal-case leading-snug text-popover-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100`}
      >
        {text}
      </span>
    </span>
  );
}
