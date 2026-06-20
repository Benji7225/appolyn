'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader } from '@/components/dashboard/shell';
import { Sparkles, RefreshCw, Copy, Check, Clapperboard } from 'lucide-react';

type Idea = { hook: string; format: string };

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* refusé */ } }}
      className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 px-2 py-1 hover:bg-accent transition-colors shrink-0">
      {done ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// Générateur d'idées de contenu court-format (hooks TikTok/Reels/Shorts) pour
// promouvoir l'app organiquement. Pilier Growth.
export default function ContentIdeasPage() {
  const { selectedApp } = useDashboard();
  const ascAppId = selectedApp?.asc_app_id ?? '';
  const [angle, setAngle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setGenerating(true); setError(null); setIdeas([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/generate-content-ideas', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ascAppId, appName: selectedApp?.name ?? '', angle }),
      });
      const j = await r.json() as { ideas?: Idea[]; error?: string };
      if (j.error || !j.ideas) { setError(j.error ?? 'Génération impossible.'); setGenerating(false); return; }
      setIdeas(j.ideas);
    } catch { setError('Génération impossible (réseau).'); }
    setGenerating(false);
  };

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Idées de contenu"
        description="L'IA part de ta vraie fiche App Store et te sort des idées de vidéos court-format (TikTok, Reels, Shorts) prêtes à tourner. Tu n'as rien à décrire."
      />

      <div className="bg-card border border-border/50 card-pop rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-medium">{selectedApp?.name ? `Idées pour ${selectedApp.name}` : 'Génère des idées'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{ascAppId ? 'Basé sur ta fiche App Store réelle.' : 'Connecte ton app à App Store Connect pour des idées sur-mesure, ou ajoute un angle ci-dessous.'}</p>
          </div>
          <button type="button" onClick={generate} disabled={generating}
            className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0">
            {generating ? <><RefreshCw className="h-4 w-4 animate-spin" /> Génération…</> : <><Sparkles className="h-4 w-4" /> Générer des idées</>}
          </button>
        </div>
        <input
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          placeholder="Affiner (optionnel) : un angle, une cible, une promo…"
          className="w-full mt-3 text-sm bg-background border border-input rounded-lg px-3 h-10 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      </div>

      {ideas.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {ideas.map((idea, i) => (
            <div key={i} className="bg-card border border-border/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  <Clapperboard className="h-3 w-3" /> {idea.format}
                </span>
                <CopyButton text={idea.hook} />
              </div>
              <p className="text-sm leading-relaxed">{idea.hook}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
