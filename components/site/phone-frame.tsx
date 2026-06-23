// Cadre iPhone en CSS pur (aucune image externe). Habille soit une capture d'écran de
// la fiche App Store, soit un contenu libre (`children`, ex. écran de marque). Rendu
// premium, présentationnel, server-safe. La largeur se pilote par la classe du parent.
import type { ReactNode } from 'react';

export function PhoneFrame({ src, alt = '', className = '', priority = false, children }: { src?: string; alt?: string; className?: string; priority?: boolean; children?: ReactNode }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      {/* Cadre sobre : fine bordure sombre + coins arrondis, SANS pastille (une
          encoche par-dessus une capture marketing fait verrue). */}
      <div className="rounded-[2rem] bg-neutral-900 p-[5px] shadow-[0_24px_60px_-20px_rgba(15,23,42,0.4)] ring-1 ring-black/10">
        <div className="overflow-hidden rounded-[1.65rem] bg-white">
          {children ?? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              className="block h-auto w-full object-contain"
              loading={priority ? 'eager' : 'lazy'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
