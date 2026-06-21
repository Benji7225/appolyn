'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

// Visionneuse d'image simple et réutilisable : on clique une image n'importe où
// dans l'app pour la voir en grand. Fond sombre, fermeture par clic ou Échap.
// Sobre, zéro dépendance.
export function Lightbox({ src, alt = '', onClose }: { src: string; alt?: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // Empêche le scroll de l'arrière-plan tant que la visionneuse est ouverte.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 cursor-zoom-out" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]" />
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-5 right-5 z-10 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl object-contain cursor-default"
      />
    </div>
  );
}

// Petit bouton loupe à superposer en coin d'une vignette cliquable, quand le
// clic de la vignette sert déjà à autre chose. Appelle onZoom sans propager.
export function ZoomButton({ onZoom }: { onZoom: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onZoom(); }}
      aria-label="Agrandir"
      className="absolute top-1.5 right-1.5 z-10 h-7 w-7 rounded-md bg-black/55 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
        <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6M8 11h6" />
      </svg>
    </button>
  );
}
