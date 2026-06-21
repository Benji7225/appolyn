'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDashboard } from '@/lib/app-context';
import { X, Copy, Check, Apple, Smartphone } from 'lucide-react';

type Tab = 'ios' | 'android';

// Pop-up « Obtenir ma clé SDK » : la VRAIE clé SDK de l'app + le code prêt à coller
// pour iOS (Swift) ET Android (Kotlin), avec les étapes simples. Réutilisable
// (accueil, réglages…). Le dev branche le SDK et il a tout, sans rien décrire.
export function SdkModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { selectedApp } = useDashboard();
  const [tab, setTab] = useState<Tab>('ios');
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

  const iosSnippet = `import Appolyn\n\n// Au lancement de l'app, une seule ligne :\nAppolyn.start(key: "${sdkKey}")`;
  const androidSnippet = `import io.appolyn.Appolyn\n\n// Dans Application.onCreate(), une seule ligne :\nAppolyn.start(this, "${sdkKey}")`;

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

            {/* Onglets Apple / Android */}
            <div className="inline-flex rounded-lg border border-border/60 p-0.5">
              <button onClick={() => setTab('ios')}
                className={`inline-flex items-center gap-1.5 text-sm rounded-md px-3 h-8 transition-colors ${tab === 'ios' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
                <Apple className="h-3.5 w-3.5" /> iOS (Apple)
              </button>
              <button onClick={() => setTab('android')}
                className={`inline-flex items-center gap-1.5 text-sm rounded-md px-3 h-8 transition-colors ${tab === 'android' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
                <Smartphone className="h-3.5 w-3.5" /> Android
              </button>
            </div>

            {tab === 'ios' ? (
              <div className="space-y-3">
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
                  <li>Dans Xcode : <strong>File &rsaquo; Add Package Dependencies…</strong></li>
                  <li>Colle l&apos;adresse : <code className="font-mono text-foreground">github.com/Benji7225/appolyn-ios</code></li>
                  <li>Ajoute la ligne ci-dessous au lancement de l&apos;app. C&apos;est tout.</li>
                </ol>
                <CodeBlock code={iosSnippet} copied={copied === 'ios'} onCopy={() => copy(iosSnippet, 'ios')} />
              </div>
            ) : (
              <div className="space-y-3">
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
                  <li>Dans <code className="font-mono text-foreground">settings.gradle</code>, ajoute le dépôt JitPack : <code className="font-mono text-foreground">maven {'{'} url = uri(&quot;https://jitpack.io&quot;) {'}'}</code></li>
                  <li>Dans le <code className="font-mono text-foreground">build.gradle</code> du module app : <code className="font-mono text-foreground">implementation(&quot;com.github.Benji7225:appolyn-android:1.5.0&quot;)</code></li>
                  <li>Ajoute la ligne ci-dessous dans <code className="font-mono text-foreground">Application.onCreate()</code>. C&apos;est tout.</li>
                </ol>
                <CodeBlock code={androidSnippet} copied={copied === 'android'} onCopy={() => copy(androidSnippet, 'android')} />
              </div>
            )}

            <p className="text-[11px] text-muted-foreground/70">
              Les achats remontent tout seuls (StoreKit sur iOS, Play Billing sur Android). Aucune donnée personnelle, aucun prompt de suivi.
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
      <pre className="text-[11px] font-mono bg-foreground/[0.04] border border-border/40 rounded-lg p-3 overflow-x-auto whitespace-pre">{code}</pre>
      <button onClick={onCopy} title="Copier" className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-background border border-border rounded-md px-2 py-0.5 hover:bg-accent transition-colors">
        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}
