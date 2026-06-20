'use client';

import { useState } from 'react';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { Share2, Lock, Copy, Check, ExternalLink } from 'lucide-react';

function CopyButton({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* refusé */ } }}
      className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 px-2.5 py-1 hover:bg-accent transition-colors shrink-0">
      {done ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copié</> : <><Copy className="h-3.5 w-3.5" /> {label}</>}
    </button>
  );
}

// Kit de partage : tout ce qu'un dev colle sur son site / ses réseaux pour
// envoyer du trafic vers l'App Store. Construit depuis le lien App Store réel.
export default function SharePage() {
  const { selectedApp } = useDashboard();
  const ascAppId = selectedApp?.asc_app_id ?? '';
  const name = selectedApp?.name ?? 'Mon app';

  if (!selectedApp || !ascAppId) {
    return (
      <div className="p-8">
        <PageHeader title="Kit de partage" description="Lien, badge App Store et bannière prêts à coller partout." />
        <EmptyState
          icon={Lock}
          title="Renseigne ton App ID"
          description="Sélectionne une app avec son identifiant App Store Connect pour générer son kit de partage."
          action={<a href="/app/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>}
        />
      </div>
    );
  }

  const url = `https://apps.apple.com/app/id${ascAppId}`;
  const shareText = `Découvre ${name} sur l'App Store : ${url}`;
  const badgeFr = `https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/fr-fr?size=250x83`;
  const badgeEn = `https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83`;
  const badgeHtml = `<a href="${url}"><img src="${badgeFr}" alt="Télécharger ${name} sur l'App Store" height="56" /></a>`;
  const smartBanner = `<meta name="apple-itunes-app" content="app-id=${ascAppId}">`;

  return (
    <div className="p-8 scrollbar-macos space-y-6">
      <PageHeader title="Kit de partage" description={`Tout ce dont tu as besoin pour envoyer du trafic vers ${name} sur l'App Store.`} />

      {/* Lien + texte de partage */}
      <div className="bg-card border border-border/40 rounded-xl p-5">
        <h3 className="text-sm font-medium mb-3">Lien & texte de partage</h3>
        <div className="flex items-center gap-2 mb-3">
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 text-sm text-primary hover:underline truncate inline-flex items-center gap-1">
            {url} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
          <CopyButton text={url} label="Copier le lien" />
        </div>
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">{shareText}</p>
          <CopyButton text={shareText} label="Copier le texte" />
        </div>
      </div>

      {/* Badge App Store */}
      <div className="bg-card border border-border/40 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3 gap-3">
          <h3 className="text-sm font-medium">Badge officiel App Store</h3>
          <CopyButton text={badgeHtml} label="Copier le HTML" />
        </div>
        <div className="flex items-center gap-4 flex-wrap mb-3">
          <a href={url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeFr} alt="Télécharger sur l'App Store (FR)" height={56} style={{ height: 56 }} />
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeEn} alt="Download on the App Store (EN)" height={56} style={{ height: 56 }} />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">Colle ce HTML sur ton site ou ta landing pour un bouton officiel cliquable.</p>
        <pre className="mt-2 text-[11px] bg-muted/40 rounded-lg p-3 overflow-x-auto scrollbar-macos text-muted-foreground"><code>{badgeHtml}</code></pre>
      </div>

      {/* Smart App Banner */}
      <div className="bg-card border border-border/40 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2 gap-3">
          <h3 className="text-sm font-medium">Smart App Banner</h3>
          <CopyButton text={smartBanner} label="Copier la balise" />
        </div>
        <p className="text-xs text-muted-foreground mb-2">Ajoute cette balise dans le {'<head>'} de ton site : Safari iOS affichera automatiquement une bannière « Ouvrir dans l&apos;app / Télécharger » en haut de la page.</p>
        <pre className="text-[11px] bg-muted/40 rounded-lg p-3 overflow-x-auto scrollbar-macos text-muted-foreground"><code>{smartBanner}</code></pre>
      </div>
    </div>
  );
}
