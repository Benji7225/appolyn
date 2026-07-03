'use client';

import { useEffect } from 'react';

// Apparition douce des sections au scroll, SÛRE :
// - Sans JS (ou avant hydratation) : rien n'est caché (la classe `reveal-on` n'est pas
//   posée), donc contenu visible et indexable.
// - prefers-reduced-motion : le CSS neutralise l'effet (voir globals.css).
// - Pas de flash : les éléments DÉJÀ visibles au chargement passent visibles dans le
//   même tick (aucune transition), seuls ceux hors écran s'animent à l'entrée.
export function RevealController() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('reveal-on');
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('is-visible'));
      return () => root.classList.remove('reveal-on');
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

    for (const e of els) {
      const r = e.getBoundingClientRect();
      // Déjà à l'écran → visible tout de suite (même tick = aucune animation, aucun flash).
      if (r.top < window.innerHeight && r.bottom > 0) e.classList.add('is-visible');
      else io.observe(e);
    }

    return () => { io.disconnect(); root.classList.remove('reveal-on'); };
  }, []);

  return null;
}
