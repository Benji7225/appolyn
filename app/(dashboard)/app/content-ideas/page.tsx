'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader } from '@/components/dashboard/shell';
import { Sparkles, RefreshCw, Copy, Check, Clapperboard, Rocket } from 'lucide-react';

// New tables aren't in the generated DB types yet; access them untyped.
const db = supabase as unknown as { from: (t: string) => any };

type Idea = { format: string; hook: string; script: string };
type Kind = 'content' | 'launch';

// Sélecteurs simples (pas de champ libre) pour cadrer la génération.
const ANGLES = ['auto', 'problème → solution', 'POV', 'avant/après', "j'ai testé", 'démo', 'storytime', '3 erreurs'];
const CIBLES = ['auto', 'grand public', 'débutants', 'créateurs / makers', 'pros'];
const PROMOS = ['aucune', 'le lancement', 'un essai gratuit', 'une offre de lancement'];

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* refusé */ } }}
      title="Copier"
      className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 px-2 py-1 hover:bg-accent transition-colors shrink-0">
      {done ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-background border border-input rounded-lg px-2.5 h-9 focus:outline-none focus:ring-1 focus:ring-ring capitalize">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

// Idées de contenu (vidéos courtes) OU annonces de lancement, depuis la vraie fiche
// App Store. Les résultats sont PERSISTÉS par app (plus besoin de régénérer à chaque
// visite). Pilier Growth.
export default function ContentIdeasPage() {
  const { selectedApp } = useDashboard();
  const ascAppId = selectedApp?.asc_app_id ?? '';
  const [kind, setKind] = useState<Kind>('content');
  const [angle, setAngle] = useState('auto');
  const [cible, setCible] = useState('auto');
  const [promo, setPromo] = useState('aucune');
  const [generating, setGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recharge les dernières idées générées pour cette app (persistées).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIdeas([]); setLoaded(false);
      if (!selectedApp?.id) { setLoaded(true); return; }
      const { data } = await db.from('content_ideas').select('ideas, kind').eq('app_id', selectedApp.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (cancelled) return;
      if (data?.ideas?.length) { setIdeas(data.ideas as Idea[]); if (data.kind === 'launch' || data.kind === 'content') setKind(data.kind); }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [selectedApp?.id]);

  const generate = async () => {
    setGenerating(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/generate-content-ideas', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ascAppId, appName: selectedApp?.name ?? '', kind, angle, cible, promo }),
      });
      const j = await r.json() as { ideas?: Idea[]; error?: string };
      if (j.error || !j.ideas) { setError(j.error ?? 'Génération impossible.'); setGenerating(false); return; }
      setIdeas(j.ideas);
      // Persiste pour cette app (pour ne plus régénérer à chaque visite).
      if (selectedApp?.id) {
        const { data: { user } } = await supabase.auth.getUser();
        await db.from('content_ideas').insert({ user_id: user?.id, app_id: selectedApp.id, kind, params: { angle, cible, promo }, ideas: j.ideas });
      }
    } catch { setError('Génération impossible (réseau).'); }
    setGenerating(false);
  };

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Idées de contenu"
        description="L'IA part de ta vraie fiche App Store et te sort du contenu prêt à tourner ou à poster. Tes idées restent ici, pas besoin de régénérer."
      />

      <div className="bg-card border border-border/50 card-pop rounded-xl p-5 mb-6">
        {/* Type de contenu */}
        <div className="inline-flex rounded-lg border border-border/60 p-0.5 mb-4">
          <button type="button" onClick={() => setKind('content')}
            className={`inline-flex items-center gap-1.5 text-sm rounded-md px-3 h-8 transition-colors ${kind === 'content' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
            <Clapperboard className="h-3.5 w-3.5" /> Vidéos courtes
          </button>
          <button type="button" onClick={() => setKind('launch')}
            className={`inline-flex items-center gap-1.5 text-sm rounded-md px-3 h-8 transition-colors ${kind === 'launch' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
            <Rocket className="h-3.5 w-3.5" /> Annonce de lancement
          </button>
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          {kind === 'content' && <Select label="Angle" value={angle} onChange={setAngle} options={ANGLES} />}
          <Select label="Cible" value={cible} onChange={setCible} options={CIBLES} />
          <Select label="Mettre en avant" value={promo} onChange={setPromo} options={PROMOS} />
          <button type="button" onClick={generate} disabled={generating || !ascAppId}
            className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-9 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0">
            {generating ? <><RefreshCw className="h-4 w-4 animate-spin" /> Génération…</> : <><Sparkles className="h-4 w-4" /> {ideas.length ? 'Régénérer' : 'Générer'}</>}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {ascAppId ? 'Basé sur ta fiche App Store réelle.' : 'Connecte ton app à App Store Connect pour des idées sur-mesure.'}
        </p>
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      </div>

      {ideas.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {ideas.map((idea, i) => (
            <div key={i} className="bg-card border border-border/40 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {kind === 'launch' ? <Rocket className="h-3 w-3" /> : <Clapperboard className="h-3 w-3" />} {idea.format}
                </span>
                <CopyButton text={`${idea.hook}\n\n${idea.script}`} />
              </div>
              <p className="text-sm font-medium leading-snug">{idea.hook}</p>
              {idea.script && <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">{idea.script}</p>}
            </div>
          ))}
        </div>
      ) : loaded && !generating && (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground">
          Choisis un type et clique « Générer ». Tes idées resteront ici pour cette app.
        </div>
      )}
    </div>
  );
}
