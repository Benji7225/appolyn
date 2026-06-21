// Badges officiels « Download on the App Store » et « Get it on Google Play »,
// dessinés en SVG (aucune image externe). Présentationnel pur : utilisable côté
// serveur (site public) ET client (aperçu dashboard). Le badge Google Play ne
// s'affiche que si une URL Play est fournie (zéro mock).

export function AppStoreBadge({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label="Télécharger sur l'App Store"
      className="inline-flex items-center gap-2.5 rounded-xl bg-black text-white h-12 px-4 hover:opacity-90 transition-opacity">
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden>
        <path d="M16.36 12.78c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.46-1.6-2.99-1.62-1.27-.13-2.49.75-3.13.75-.65 0-1.65-.73-2.71-.71-1.39.02-2.68.81-3.4 2.06-1.45 2.52-.37 6.25 1.04 8.3.69 1 1.5 2.12 2.57 2.08 1.03-.04 1.42-.67 2.67-.67 1.24 0 1.6.67 2.69.65 1.11-.02 1.81-1.02 2.49-2.03.78-1.16 1.11-2.29 1.12-2.35-.02-.01-2.15-.82-2.18-3.26zM14.3 6.74c.57-.69.95-1.65.85-2.61-.82.03-1.81.55-2.4 1.23-.53.61-.99 1.58-.86 2.51.91.07 1.84-.46 2.41-1.13z" />
      </svg>
      <span className="flex flex-col leading-none text-left">
        <span className="text-[9px] font-normal opacity-90">Download on the</span>
        <span className="text-[17px] font-semibold tracking-tight -mt-0.5">App Store</span>
      </span>
    </a>
  );
}

export function GooglePlayBadge({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label="Disponible sur Google Play"
      className="inline-flex items-center gap-2.5 rounded-xl bg-black text-white h-12 px-4 hover:opacity-90 transition-opacity">
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden>
        <path d="M3.6 2.3c-.2.2-.3.5-.3.9v17.6c0 .4.1.7.3.9l.1.1L13.5 12v-.1L3.7 2.2l-.1.1z" fill="#00D0FF" />
        <path d="M17.1 15.3 13.5 12v-.1l3.6-3.3 4.3 2.5c1.2.7 1.2 1.8 0 2.5l-4.3 2.7z" fill="#FFCE00" />
        <path d="m17.1 15.3-3.6-3.4L3.6 21.7c.4.4 1 .5 1.7.1l11.8-6.5z" fill="#FF3D44" />
        <path d="M3.6 2.3 13.5 11.9l3.6-3.3L5.3 2.1C4.6 1.7 4 1.9 3.6 2.3z" fill="#00F076" />
      </svg>
      <span className="flex flex-col leading-none text-left">
        <span className="text-[9px] font-normal opacity-90">GET IT ON</span>
        <span className="text-[17px] font-semibold tracking-tight -mt-0.5">Google Play</span>
      </span>
    </a>
  );
}

export function StoreBadges({ appStoreUrl, playUrl, className = '' }: { appStoreUrl?: string; playUrl?: string; className?: string }) {
  if (!appStoreUrl && !playUrl) return null;
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {appStoreUrl && <AppStoreBadge href={appStoreUrl} />}
      {playUrl && <GooglePlayBadge href={playUrl} />}
    </div>
  );
}
