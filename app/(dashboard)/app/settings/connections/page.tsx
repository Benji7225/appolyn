'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDashboard } from '@/lib/app-context';
import { SdkModal } from '@/components/dashboard/sdk-modal';
import { SdkStatusBanner } from '@/components/dashboard/sdk-status';
import { Copy, Check, Code2, ChevronDown, ArrowRight } from 'lucide-react';

// Réglages › Connexions = uniquement le SDK & attribution (technique, à sa place dans
// les réglages). Les connexions aux comptes sociaux vivent désormais dans
// Marketing › Organique, les régies pub dans Publicité › Campagnes : on connecte là
// où on s'en sert.
export default function ConnectionsSettings() {
  const { selectedApp } = useDashboard();
  const [copied, setCopied] = useState<string | null>(null);
  const [sdkOpen, setSdkOpen] = useState(false);

  const sdkKey = (selectedApp as { sdk_key?: string } | null)?.sdk_key ?? '';

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  };

  return (
    <div className="space-y-6">
      {/* SDK & attribution : surface SIMPLE (bouton + clé), détail technique replié. */}
      <section>
        <h2 className="text-sm font-medium mb-1 flex items-center gap-1.5"><Code2 className="h-4 w-4" /> SDK &amp; attribution</h2>
        <p className="text-xs text-muted-foreground mb-3">Une seule ligne dans ton app et tu vois chaque installation, sa source et son revenu. Les achats sont captés automatiquement, sans donnée personnelle ni prompt de suivi.</p>

        {!selectedApp ? (
          <p className="text-xs text-muted-foreground">Sélectionne une app (en haut) pour obtenir sa clé SDK.</p>
        ) : (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-medium">{selectedApp.name}</p>
                <code className="block text-[11px] font-mono text-muted-foreground truncate mt-0.5 max-w-xs">{sdkKey || '—'}</code>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => copy(sdkKey, 'key')} disabled={!sdkKey}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground border border-border hover:bg-accent rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50">
                  {copied === 'key' ? <><Check className="h-3 w-3 text-emerald-500" /> Copiée</> : <><Copy className="h-3 w-3" /> Copier la clé</>}
                </button>
                <button onClick={() => setSdkOpen(true)}
                  className="inline-flex items-center gap-1.5 text-sm rounded-lg px-3.5 h-9 bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
                  Brancher le SDK
                </button>
              </div>
            </div>

            <div className="mt-3"><SdkStatusBanner appId={selectedApp?.id} /></div>

            {/* Détail technique : discret, replié par défaut. */}
            <details className="group mt-3 pt-3 border-t border-border/40">
              <summary className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors list-none [&::-webkit-details-marker]:hidden">
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                Options avancées : sources, écrans d&apos;onboarding, confidentialité
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs font-medium mb-1">Données de tes utilisateurs <span className="text-muted-foreground font-normal">(optionnel)</span></p>
                  <p className="text-[11px] text-muted-foreground">Remonte leurs choix pour les voir dans leur fiche et dans la « Répartition » de la page Utilisateurs : <code className="font-mono">Appolyn.setUserProperty(&quot;niveau&quot;, &quot;Engagé&quot;)</code>. Et leur source, sans aucun lien à coller : <code className="font-mono">Appolyn.setSource(&quot;TikTok&quot;)</code> (la réponse à ta question d&apos;onboarding « Comment as-tu connu l&apos;app ? »).</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Entonnoir d&apos;onboarding <span className="text-muted-foreground font-normal">(optionnel)</span></p>
                  <p className="text-[11px] text-muted-foreground">Pour voir où tes utilisateurs décrochent, marque tes écrans. SwiftUI : <code className="font-mono">.appolynScreen(&quot;welcome&quot;)</code>. UIKit : <code className="font-mono">Appolyn.screen(&quot;Welcome&quot;)</code> dans <code className="font-mono">viewDidAppear</code>. Appolyn ordonne les écrans et calcule le décrochage tout seul.</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Données collectées <span className="text-muted-foreground font-normal">(pour ta nutrition label App Privacy)</span></p>
                  <p className="text-[11px] text-muted-foreground">Le SDK ne collecte que des signaux techniques anonymes, jamais l&apos;IDFA ni de données personnelles, et n&apos;affiche aucun prompt ATT. À déclarer dans App Store Connect &rsaquo; Confidentialité de l&apos;app : <strong>Identifiants</strong> (IDFV), <strong>Achats</strong>, <strong>Données d&apos;utilisation</strong> (lancements, écrans vus), <strong>Diagnostics</strong> (appareil, OS, version). Tout est lié à l&apos;IDFV pseudonyme, sans suivi cross-app.</p>
                </div>
              </div>
            </details>
          </div>
        )}
      </section>

      {/* Pointeur : les connexions de comptes ont déménagé là où on s'en sert. */}
      <section>
        <h2 className="text-sm font-medium mb-1">Comptes sociaux &amp; régies publicitaires</h2>
        <p className="text-xs text-muted-foreground mb-3">Tes connexions ont déménagé là où tu t&apos;en sers.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/app/marketing/organic" className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
            <div className="min-w-0">
              <p className="text-sm font-medium">Réseaux sociaux</p>
              <p className="text-xs text-muted-foreground">Marketing › Organique</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          </Link>
          <Link href="/app/marketing/paid/campaigns" className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
            <div className="min-w-0">
              <p className="text-sm font-medium">Plateformes publicitaires</p>
              <p className="text-xs text-muted-foreground">Publicité › Campagnes</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          </Link>
        </div>
      </section>

      <SdkModal open={sdkOpen} onClose={() => setSdkOpen(false)} />
    </div>
  );
}
