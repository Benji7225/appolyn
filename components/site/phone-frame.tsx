// Cadre iPhone en CSS pur (aucune image externe). Habille une capture d'écran de la
// fiche App Store pour un rendu premium. Présentationnel, server-safe. La largeur se
// pilote par la classe du parent (ex. w-[260px]).

export function PhoneFrame({ src, alt, className = '', priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className="rounded-[2.3rem] bg-neutral-950 p-[6px] shadow-[0_30px_70px_-25px_rgba(15,23,42,0.45)] ring-1 ring-black/10">
        <div className="relative overflow-hidden rounded-[1.9rem] bg-white">
          {/* Dynamic Island sobre, posée au-dessus de la capture. */}
          <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-[18px] w-[78px] -translate-x-1/2 rounded-full bg-neutral-950/90" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="block h-auto w-full object-contain"
            loading={priority ? 'eager' : 'lazy'}
          />
        </div>
      </div>
    </div>
  );
}
