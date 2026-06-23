'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader } from '@/components/dashboard/shell';
import { Sparkles, RefreshCw, Copy, Check, Clapperboard, Rocket, Type, Lightbulb } from 'lucide-react';

// New tables aren't in the generated DB types yet; access them untyped.
const db = supabase as unknown as { from: (t: string) => any };

// Idée RICHE : package prêt à tourner/poster. Les anciens champs ({format,hook,script})
// restent compatibles (script affiché tel quel si pas de plan plan-par-plan).
type Idea = {
  format: string; hook: string; script?: string;
  duration?: string; beats?: string[]; onScreenText?: string;
  caption?: string; hashtags?: string[]; whyItWorks?: string;
};
type Kind = 'content' | 'launch';

// Texte complet d'une idée, pour le bouton Copier (assemble tout le package).
function ideaToText(idea: Idea): string {
  const parts: string[] = [];
  if (idea.hook) parts.push(idea.hook);
  if (idea.onScreenText) parts.push(`À l'écran : ${idea.onScreenText}`);
  if (idea.beats?.length) parts.push(idea.beats.map((b, k) => `${k + 1}. ${b}`).join('\n'));
  if (idea.script) parts.push(idea.script);
  if (idea.caption) parts.push(`Légende : ${idea.caption}`);
  if (idea.hashtags?.length) parts.push(idea.hashtags.join(' '));
  return parts.join('\n\n');
}

// Sélecteurs simples (pas de champ libre) pour cadrer la génération.
const ANGLES = ['auto', 'problème → solution', 'POV', 'avant/après', "j'ai testé", 'démo', 'storytime', '3 erreurs'];
const CIBLES = ['auto', 'grand public', 'débutants', 'créateurs / makers', 'pros'];
const PROMOS = ['aucune', 'le lancement', 'un essai gratuit', 'une offre de lancement'];
const LANGUES = ['Français', 'English', 'Español', 'Deutsch', 'Italiano', 'Português', 'Nederlands', '日本語'];

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
  const [langue, setLangue] = useState('Français');
  const [generating, setGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recharge les dernières idées pour cette app ET ce type (vidéos vs lancement
  // ont chacun leur propre historique : on ne mélange jamais les deux).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIdeas([]); setLoaded(false);
      if (!selectedApp?.id) { setLoaded(true); return; }
      const { data } = await db.from('content_ideas').select('ideas, params').eq('app_id', selectedApp.id).eq('kind', kind).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (cancelled) return;
      if (data?.ideas?.length) { setIdeas(data.ideas as Idea[]); if (data.params?.langue) setLangue(data.params.langue as string); }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [selectedApp?.id, kind]);

  const generate = async () => {
    setGenerating(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/generate-content-ideas', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ascAppId, appName: selectedApp?.name ?? '', kind, angle, cible, promo, langue }),
      });
      const j = await r.json() as { ideas?: Idea[]; error?: string };
      if (j.error || !j.ideas) { setError(j.error ?? 'Génération impossible.'); setGenerating(false); return; }
      setIdeas(j.ideas);
      // Persiste pour cette app ET ce type (pour ne plus régénérer à chaque visite).
      if (selectedApp?.id) {
        const { data: { user } } = await supabase.auth.getUser();
        await db.from('content_ideas').insert({ user_id: user?.id, app_id: selectedApp.id, kind, params: { angle, cible, promo, langue }, ideas: j.ideas });
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
          <Select label="Langue" value={langue} onChange={setLangue} options={LANGUES} />
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
        <div className="grid sm:grid-cols-2 gap-4 items-start">
          {ideas.map((idea, i) => (
            <div key={i} className="bg-card border border-border/40 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {kind === 'launch' ? <Rocket className="h-3 w-3" /> : <Clapperboard className="h-3 w-3" />} {idea.format}
                  {idea.duration ? <span className="text-primary/60">· {idea.duration}</span> : null}
                </span>
                <CopyButton text={ideaToText(idea)} />
              </div>

              {/* Le hook : la force de Benji, mis en avant. */}
              <p className="text-sm font-semibold leading-snug">{idea.hook}</p>

              {/* Texte à afficher à l'écran (vidéos). */}
              {idea.onScreenText && (
                <p className="flex items-start gap-2 text-[13px] text-foreground/90">
                  <Type className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span><span className="text-muted-foreground">À l&apos;écran : </span>{idea.onScreenText}</span>
                </p>
              )}

              {/* Plan plan-par-plan : une vraie liste de prises à filmer. */}
              {idea.beats && idea.beats.length > 0 && (
                <ol className="space-y-1.5">
                  {idea.beats.map((b, k) => (
                    <li key={k} className="flex gap-2 text-[13px] text-muted-foreground leading-relaxed">
                      <span className="shrink-0 h-4 w-4 rounded-full bg-accent text-[10px] font-medium text-foreground/70 flex items-center justify-center mt-0.5">{k + 1}</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ol>
              )}

              {/* Post complet (annonces de lancement) ou ancien format texte libre. */}
              {idea.script && <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">{idea.script}</p>}

              {/* Légende prête à coller. */}
              {idea.caption && (
                <div className="rounded-lg bg-muted/40 border border-border/40 p-2.5 text-[13px] text-foreground/90">{idea.caption}</div>
              )}

              {/* Hashtags. */}
              {idea.hashtags && idea.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {idea.hashtags.map((h) => <span key={h} className="text-[11px] text-primary/80 bg-primary/5 rounded px-1.5 py-0.5">{h}</span>)}
                </div>
              )}

              {/* Pourquoi ça marche : pédagogique, instaure la confiance. */}
              {idea.whyItWorks && (
                <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground/80 italic border-t border-border/30 pt-2 mt-0.5">
                  <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" /> {idea.whyItWorks}
                </p>
              )}
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
