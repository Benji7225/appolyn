'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDashboard } from '@/lib/app-context';
import { SdkStatusBanner } from '@/components/dashboard/sdk-status';
import { X, Copy, Check } from 'lucide-react';

// Pop-up « Brancher le SDK » : la VRAIE clé SDK de l'app + le moyen le plus simple
// de l'installer (un prompt prêt à coller à un assistant de code), avec un repli
// manuel Xcode. Le dev branche le SDK et il a tout, sans rien décrire.
export function SdkModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { selectedApp } = useDashboard();
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  const sdkKey = (selectedApp as { sdk_key?: string } | null)?.sdk_key ?? '';
  const appName = selectedApp?.name ?? 'ton app';

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  };

  const iosSnippet = `import Appolyn

// Au lancement de l'app, une seule ligne :
Appolyn.start(key: "${sdkKey}")`;

  // Le chemin sans douleur pour un vibecoder : coller ce message à son IA de code.
  // La clé est déjà injectée, il n'a rien à écrire ni à comprendre.
  const aiPrompt = `Ajoute le SDK Appolyn à mon app iOS.
1. Dans Xcode, ajoute le package Swift : https://github.com/Benji7225/appolyn-ios (Règle de dépendance : "Branch" → main).
2. Importe Appolyn et appelle UNE seule fois, au tout premier lancement de l'app :
   Appolyn.start(key: "${sdkKey}")
   - App SwiftUI : dans init() de la struct App.
   - App UIKit : dans application(_:didFinishLaunchingWithOptions:).
3. N'ajoute aucune autre configuration : installs, achats StoreKit et écrans sont captés automatiquement.
Dis-moi ensuite dans quel fichier tu as ajouté la ligne.`;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[88vh] overflow-auto rounded-2xl bg-background border border-border shadow-2xl scrollbar-macos">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 sticky top-0 bg-background z-10">
          <div>
            <h3 className="text-sm font-semibold">Brancher le SDK</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Une ligne dans {appName} et tu vois tout : installs, utilisateurs, revenus.</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-muted-foreground hover:text-foreground shrink-0"><X className="h-4 w-4" /></button>
        </div>

        {!selectedApp ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Ajoute d&apos;abord une app pour obtenir ta clé SDK.
            <div className="mt-3"><Link href="/app/settings/apps" onClick={onClose} className="text-primary hover:underline">Ouvrir Mes apps →</Link></div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Clé SDK */}
            <div>
              <p className="text-xs font-medium mb-1.5">Ta clé SDK</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] font-mono bg-muted/50 rounded-md px-2.5 py-2 text-muted-foreground truncate">{sdkKey || '—'}</code>
                <button onClick={() => copy(sdkKey, 'key')} disabled={!sdkKey}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground border border-border hover:bg-accent rounded-md px-2.5 py-2 transition-colors disabled:opacity-50 shrink-0">
                  {copied === 'key' ? <><Check className="h-3 w-3 text-emerald-500" /> Copiée</> : <><Copy className="h-3 w-3" /> Copier</>}
                </button>
              </div>
            </div>

            {/* Statut : le SDK envoie-t-il déjà ? (passe au vert en direct au 1er signal) */}
            <SdkStatusBanner appId={selectedApp?.id} />

            {/* Le plus simple : coller un prompt à ton IA (Cursor, Claude, ChatGPT) */}
            <div className="space-y-2">
              <p className="text-xs font-medium">Le plus simple : laisse ton IA le faire</p>
              <p className="text-[11px] text-muted-foreground">Copie ce message et colle-le à ton assistant de code (Cursor, Claude, ChatGPT). Ta clé est déjà dedans, tu n&apos;as rien à écrire.</p>
              <CodeBlock code={aiPrompt} copied={copied === 'ai'} onCopy={() => copy(aiPrompt, 'ai')} />
            </div>

            {/* Ou à la main dans Xcode */}
            <details>
              <summary className="text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">Ou le faire à la main dans Xcode →</summary>
              <div className="mt-3 space-y-3">
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
                  <li>Xcode : <strong>File &rsaquo; Add Package Dependencies…</strong></li>
                  <li>Colle <code className="font-mono text-foreground">github.com/Benji7225/appolyn-ios</code>, choisis <strong>Dependency Rule → Branch → main</strong>, puis ajoute le produit <code className="font-mono text-foreground">Appolyn</code>.</li>
                  <li>Ajoute la ligne ci-dessous au lancement de l&apos;app. C&apos;est tout.</li>
                </ol>
                <CodeBlock code={iosSnippet} copied={copied === 'ios'} onCopy={() => copy(iosSnippet, 'ios')} />
              </div>
            </details>

            <p className="text-[11px] text-muted-foreground/70">
              Les achats remontent tout seuls (StoreKit 2). Aucune donnée personnelle, aucun prompt de suivi. Android : bientôt.
            </p>
            <div className="pt-1 border-t border-border/40">
              <Link href="/app/settings/connections" onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                Options avancées (sources, écrans, confidentialité) →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CodeBlock({ code, copied, onCopy }: { code: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="relative">
      <pre className="text-[11px] font-mono bg-foreground/[0.04] border border-border/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{code}</pre>
      <button onClick={onCopy} title="Copier" className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-background border border-border rounded-md px-2 py-0.5 hover:bg-accent transition-colors">
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}
