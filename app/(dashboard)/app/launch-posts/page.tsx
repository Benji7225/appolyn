'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { Sparkles, RefreshCw, Copy, Check, Smartphone, Megaphone } from 'lucide-react';

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* refusé */ } }}
      className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 px-2.5 py-1 hover:bg-accent transition-colors shrink-0">
      {done ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copié</> : <><Copy className="h-3.5 w-3.5" /> Copier</>}
    </button>
  );
}

type Posts = {
  product_hunt_tagline: string;
  product_hunt_comment: string;
  x_post: string;
  reddit_title: string;
  reddit_body: string;
};

// Génère des annonces de lancement prêtes à poster (Product Hunt, X, Reddit) à
// partir des infos de l'app + un pitch. Pour le jour J, sans page blanche.
export default function LaunchPostsPage() {
  const { selectedApp } = useDashboard();
  const ascAppId = selectedApp?.asc_app_id ?? '';
  const appUrl = ascAppId ? `https://apps.apple.com/app/id${ascAppId}` : '';

  const [angle, setAngle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [posts, setPosts] = useState<Posts | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setGenerating(true); setError(null); setPosts(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/generate-launch-posts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ascAppId, appName: selectedApp?.name ?? '', angle, url: appUrl }),
      });
      const j = await r.json() as { posts?: Posts; error?: string };
      if (j.error || !j.posts) { setError(j.error ?? 'Génération impossible.'); setGenerating(false); return; }
      setPosts(j.posts);
    } catch { setError('Génération impossible (réseau).'); }
    setGenerating(false);
  };

  if (!selectedApp) {
    return (
      <div className="p-8">
        <PageHeader title="Annonces de lancement" description="Des posts prêts à publier pour ton jour J, générés par l'IA." />
        <EmptyState
          icon={Smartphone}
          title="Ajoute d'abord une app"
          description="Sélectionne une app pour générer ses annonces de lancement (Product Hunt, X, Reddit)."
          action={<a href="/app/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>}
        />
      </div>
    );
  }

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Annonces de lancement"
        description="L'IA part de ta vraie fiche App Store et rédige tes posts de lancement prêts à publier (Product Hunt, X, Reddit), dans ta langue. Tu n'as rien à décrire."
      />

      <div className="bg-card border border-border/50 card-pop rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-medium">{selectedApp?.name ? `Annonces pour ${selectedApp.name}` : 'Génère tes annonces'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{ascAppId ? `Basé sur ta fiche App Store réelle.${appUrl ? ' Le lien App Store sera inclus.' : ''}` : 'Renseigne l’App ID de ton app pour des annonces sur-mesure, ou ajoute un angle ci-dessous.'}</p>
          </div>
          <button type="button" onClick={generate} disabled={generating}
            className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0">
            {generating ? <><RefreshCw className="h-4 w-4 animate-spin" /> Génération…</> : <><Sparkles className="h-4 w-4" /> Générer mes annonces</>}
          </button>
        </div>
        <input
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          placeholder="Affiner (optionnel) : un angle, une cible, une promo de lancement…"
          className="w-full mt-3 text-sm bg-background border border-input rounded-lg px-3 h-10 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      </div>

      {posts && (
        <div className="space-y-4">
          <PostCard label="Product Hunt — Tagline" hint="≤ 60 caractères" value={posts.product_hunt_tagline} />
          <PostCard label="Product Hunt — 1er commentaire du maker" value={posts.product_hunt_comment} />
          <PostCard label="X (Twitter)" hint="≤ 280 caractères" value={posts.x_post} />
          <PostCard label="Reddit — Titre" value={posts.reddit_title} />
          <PostCard label="Reddit — Post" value={posts.reddit_body} />
        </div>
      )}
    </div>
  );
}

function PostCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-card border border-border/40 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2 gap-3">
        <h3 className="text-sm font-medium inline-flex items-center gap-2"><Megaphone className="h-3.5 w-3.5 text-muted-foreground" /> {label}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {hint && <span className="text-[11px] text-muted-foreground tabular-nums">{value.length} · {hint}</span>}
          <CopyButton text={value} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{value}</p>
    </div>
  );
}
