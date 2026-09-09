'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Plug, ArrowRight } from 'lucide-react';
import { SdkModal } from './sdk-modal';

// Etat vide ACTIONNABLE pour tout ce qui depend du SDK.
//
// Pourquoi ce composant existe : la moitie des ecrans d'Appolyn (entonnoir,
// paywalls, utilisateurs, essais, retention) ne peut rien afficher tant que le
// SDK n'emet pas. Un ecran vide qui se contente de dire « pas de donnees »
// laisse croire que l'outil est casse. Un ecran vide qui dit CE QUI MANQUE et
// donne le bouton pour le brancher transforme un defaut en prochaine action.
//
// Le bouton ouvre le meme modal que l'accueil, donc un seul chemin a maintenir.
export function SdkEmptyState({
  icon: Icon = Plug,
  title,
  what,
  compact = false,
}: {
  icon?: LucideIcon;
  /** Ce que cet ecran montrerait, en une phrase. */
  title: string;
  /** Le detail : quelles donnees arriveraient ici une fois le SDK branche. */
  what: string;
  /** Version resserree, pour un bloc dans une grille plutot qu'une page entiere. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className={`flex flex-col items-center justify-center text-center ${
          compact ? 'py-8 px-4' : 'py-14 px-6'
        }`}
      >
        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <p className={`font-medium ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
        <p className="text-[13px] text-muted-foreground leading-relaxed mt-1.5 max-w-sm">{what}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-110 transition"
        >
          Brancher le SDK
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <p className="text-[11px] text-muted-foreground/60 mt-2">
          Deux lignes de code, une seule fois.
        </p>
      </div>
      <SdkModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
