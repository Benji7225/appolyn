'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { EmptyState } from '@/components/dashboard/shell';
import { getCache, setCache } from '@/lib/cache';
import { Globe, Copy, Check, ExternalLink, Smartphone, RefreshCw } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// La table published_sites n'est pas dans les types générés : accès non typé.
const db = supabase as unknown as { from: (t: string) => any };
const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'app';

// Données réelles de l'app du dev : App Store public (iTunes) si l'app est sortie,
// sinon App Store Connect (fiche en préparation), pour que l'aperçu marche AUSSI
// avant le lancement. Aucune route publique servie pour l'instant : additif, zéro risque.
type Detail = {
  title: string; sellerName: string; genre: string;
  averageRating: number | null; ratingCount: number | null;
  description: string; screenshots: string[]; ipadScreenshots: string[];
  artworkUrl: string; iconUrl: string; url: string;
};

function CopyBtn({ text, id, copied, onCopy, label }: { text: string; id: string; copied: string | null; onCopy: (t: string, id: string) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onCopy(text, id)}
      className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 px-2.5 py-1 hover:bg-accent transition-colors shrink-0">
      {copied === id ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copié</> : <><Copy className="h-3.5 w-3.5" /> {label ?? 'Copier'}</>}
    </button>
  );
}

// Repli : construit l'aperçu depuis App Store Connect (texte + screenshots) quand
// l'app n'est pas encore publique sur l'App Store. Préfère la localisation FR.
async function loadFromAsc(ascAppId: string, token?: string): Promise<Detail | null> {
  try {
    const headers = { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
    const body = JSON.stringify({ appId: ascAppId });
    const [locRes, shotRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-localizations`, { method: 'POST', headers, body }),
      fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-screenshots`, { method: 'POST', headers, body }),
    ]);
    const locJson = await locRes.json() as { localizations?: { locale: string; title?: string; subtitle?: string; description?: string }[] };
    const shotJson = await shotRes.json() as { sets?: { screenshots: { url: string | null }[] }[] };
    const locs = locJson.localizations ?? [];
    const pick = locs.find((l) => l.locale?.startsWith('fr') && (l.description || l.title))
      ?? locs.find((l) => l.description || l.title) ?? locs[0];
    if (!pick) return null;
    const shots = (shotJson.sets ?? []).flatMap((s) => s.screenshots.filter((x) => x.url).map((x) => x.url as string));
    return {
      title: pick.title ?? '', sellerName: '', genre: '',
      averageRating: null, ratingCount: null,
      description: pick.description ?? '', screenshots: shots, ipadScreenshots: [],
      artworkUrl: '', iconUrl: '', url: `https://apps.apple.com/app/id${ascAppId}`,
    };
  } catch { return null; }
}

export default function SitePage() {
  const { selectedApp } = useDashboard();
  const ascAppId = selectedApp?.asc_app_id ?? '';

  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  };

  // Aperçu PERSISTÉ (localStorage) : une fois généré, il reste tel quel. On ne
  // régénère QUE sur action explicite (bouton « Actualiser »). Évite de re-générer
  // à chaque visite (irritant + ça consomme inutilement).
  const load = useCallback(async (force = false) => {
    if (!ascAppId) { setData(null); return; }
    const key = `site:${ascAppId}`;
    const pkey = `appolyn:site-detail:${ascAppId}`;
    // Déjà en mémoire ou en localStorage → on l'affiche et on s'arrête (pas de refetch auto).
    const mem = getCache<Detail>(key);
    let persisted: Detail | null = mem ?? null;
    if (!persisted) { try { const r = localStorage.getItem(pkey); if (r) persisted = JSON.parse(r) as Detail; } catch { /* ignore */ } }
    if (persisted && !force) { setData(persisted); setCache(key, persisted); setLoading(false); return; }

    setLoading(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      // 1) App Store public (app déjà sortie)
      const r = await fetch(`/api/itunes?action=detail&id=${encodeURIComponent(ascAppId)}&country=fr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json() as { result?: Detail; error?: string };
      const save = (d: Detail) => { setData(d); setCache(key, d); try { localStorage.setItem(pkey, JSON.stringify(d)); } catch { /* ignore */ } };
      if (j.result && (j.result.description || j.result.title)) {
        save(j.result);
      } else {
        // 2) Repli App Store Connect (fiche en préparation / pré-lancement)
        const asc = await loadFromAsc(ascAppId, token);
        if (asc) save(asc);
        else setError('Impossible de charger ta fiche (ni App Store public, ni App Store Connect). Vérifie ton App ID et ta clé ASC.');
      }
    } catch { setError('Connexion impossible.'); }
    setLoading(false);
  }, [ascAppId]);
  useEffect(() => { load(); }, [load]);

  // Slug déjà publié pour cette app (pour afficher l'URL publique + « Mettre à jour »).
  useEffect(() => {
    if (!selectedApp?.id) { setPublishedSlug(null); return; }
    let cancelled = false;
    (async () => {
      const { data: row } = await db.from('published_sites').select('slug').eq('app_id', selectedApp.id).maybeSingle();
      if (!cancelled) setPublishedSlug(row?.slug ?? null);
    })();
    return () => { cancelled = true; };
  }, [selectedApp?.id]);

  // Publication en 1 clic : crée/met à jour le site public appolyn.io/site/<slug>.
  const publish = async () => {
    if (!selectedApp?.id || !ascAppId) return;
    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let slug = publishedSlug;
      if (!slug) {
        const base = slugify(selectedApp.name ?? data?.title ?? 'app');
        const { data: clash } = await db.from('published_sites').select('id').eq('slug', base).maybeSingle();
        slug = clash ? `${base}-${selectedApp.id.slice(0, 4)}` : base;
      }
      const { error: e } = await db.from('published_sites').upsert(
        // On capture le contenu de la fiche (iTunes OU App Store Connect) pour que le
        // site public s'affiche AVEC du vrai contenu, même avant le lancement.
        { app_id: selectedApp.id, user_id: user?.id, asc_app_id: ascAppId, country: 'fr', slug, status: 'published', content: data ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'app_id' },
      );
      if (!e) {
        setPublishedSlug(slug);
        // Rafraîchit le site public tout de suite (sinon attente du cache).
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await fetch('/api/revalidate-site', {
            method: 'POST',
            headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug }),
          });
        } catch { /* le cache court (60s) prendra le relais */ }
      }
    } catch { /* ignore */ }
    setPublishing(false);
  };


  if (!ascAppId) {
    return (
      <EmptyState
        icon={Smartphone}
        title="Connecte ton app"
        description="Renseigne l'App ID App Store Connect de ton app pour publier son site (page produit, pages annexes et URLs confidentialité/support exigées par Apple)."
        action={<a href="/app/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>}
      />
    );
  }

  return (
    <div>
      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive mb-6">{error}</div>}
      {loading && !data && (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin inline mr-2" /> Chargement de tes infos…
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Publication + statut */}
          <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h3 className="text-sm font-medium inline-flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> {publishedSlug ? 'Ton site est en ligne' : 'Mettre ton site en ligne'}</h3>
              {publishedSlug ? (
                <p className="text-xs text-muted-foreground mt-1"><a href={`https://appolyn.io/site/${publishedSlug}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">appolyn.io/site/{publishedSlug}</a></p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Un vrai site pour ton app en 1 clic, avec une URL partageable (bon pour Google). Construit depuis ta vraie fiche App Store.</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {publishedSlug && <CopyBtn text={`https://appolyn.io/site/${publishedSlug}`} id="siteurl" copied={copied} onCopy={copy} label="Copier l'URL" />}
              {publishedSlug && (
                <a href={`https://appolyn.io/site/${publishedSlug}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 px-2.5 py-1 hover:bg-accent transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" /> Voir le site
                </a>
              )}
              <button onClick={publish} disabled={publishing}
                className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-9 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                {publishing ? 'Publication…' : publishedSlug ? 'Mettre à jour' : 'Publier mon site'}
              </button>
            </div>
          </div>

          {/* Aller plus loin : les deux autres onglets */}
          <div className="grid sm:grid-cols-2 gap-4">
            <a href="/app/site/pages" className="group rounded-xl border border-border/50 bg-card p-5 hover:border-primary/40 transition-colors">
              <h3 className="text-sm font-medium">Pages</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">FAQ, contact, légales et « comment ça marche », déjà prêtes et modifiables.</p>
            </a>
            <a href="/app/site/settings" className="group rounded-xl border border-border/50 bg-card p-5 hover:border-primary/40 transition-colors">
              <h3 className="text-sm font-medium">Réglages du site</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Activer/désactiver, couleur d&apos;accent, textes et nom de domaine.</p>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

