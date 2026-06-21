'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { EmptyState } from '@/components/dashboard/shell';
import { getCache, setCache } from '@/lib/cache';
import { Globe, Copy, Check, ExternalLink, Smartphone, RefreshCw, Power, Settings2, FileText } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// La table published_sites n'est pas dans les types générés : accès non typé.
const db = supabase as unknown as { from: (t: string) => any };
const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'app';

// Données réelles de l'app du dev : App Store public (iTunes) si l'app est sortie,
// sinon App Store Connect (fiche en préparation), pour capturer le contenu à publier.
type Detail = {
  title: string; sellerName: string; genre: string;
  averageRating: number | null; ratingCount: number | null;
  description: string; screenshots: string[]; ipadScreenshots: string[];
  artworkUrl: string; iconUrl: string; url: string;
};
type SiteRow = { slug: string; active: boolean };

// Repli : construit la capture depuis App Store Connect quand l'app n'est pas encore
// publique sur l'App Store. Préfère la localisation FR.
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
  const [copied, setCopied] = useState(false);
  const [row, setRow] = useState<SiteRow | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const copyUrl = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const revalidate = async (slug: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/revalidate-site', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
    } catch { /* le cache court (60s) prendra le relais */ }
  };

  // Capture PERSISTÉE (localStorage) : on ne régénère pas à chaque visite.
  const load = useCallback(async () => {
    if (!ascAppId) { setData(null); return; }
    const key = `site:${ascAppId}`;
    const pkey = `appolyn:site-detail:${ascAppId}`;
    const mem = getCache<Detail>(key);
    let persisted: Detail | null = mem ?? null;
    if (!persisted) { try { const r = localStorage.getItem(pkey); if (r) persisted = JSON.parse(r) as Detail; } catch { /* ignore */ } }
    if (persisted) { setData(persisted); setCache(key, persisted); return; }

    setLoading(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const r = await fetch(`/api/itunes?action=detail&id=${encodeURIComponent(ascAppId)}&country=fr`, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json() as { result?: Detail };
      const save = (d: Detail) => { setData(d); setCache(key, d); try { localStorage.setItem(pkey, JSON.stringify(d)); } catch { /* ignore */ } };
      if (j.result && (j.result.description || j.result.title)) save(j.result);
      else { const asc = await loadFromAsc(ascAppId, token); if (asc) save(asc); else setError('Impossible de charger ta fiche (ni App Store public, ni App Store Connect). Vérifie ton App ID et ta clé ASC.'); }
    } catch { setError('Connexion impossible.'); }
    setLoading(false);
  }, [ascAppId]);
  useEffect(() => { load(); }, [load]);

  const loadRow = useCallback(async () => {
    if (!selectedApp?.id) { setRow(null); return; }
    const { data: r } = await db.from('published_sites').select('slug, active').eq('app_id', selectedApp.id).maybeSingle();
    setRow(r ? (r as SiteRow) : null);
  }, [selectedApp?.id]);
  useEffect(() => { loadRow(); }, [loadRow]);

  const publish = async () => {
    if (!selectedApp?.id || !ascAppId) return;
    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let slug = row?.slug ?? null;
      if (!slug) {
        const base = slugify(selectedApp.name ?? data?.title ?? 'app');
        const { data: clash } = await db.from('published_sites').select('id').eq('slug', base).maybeSingle();
        slug = clash ? `${base}-${selectedApp.id.slice(0, 4)}` : base;
      }
      const { error: e } = await db.from('published_sites').upsert(
        { app_id: selectedApp.id, user_id: user?.id, asc_app_id: ascAppId, country: 'fr', slug, status: 'published', content: data ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'app_id' },
      );
      if (!e) { await loadRow(); await revalidate(slug); }
    } catch { /* ignore */ }
    setPublishing(false);
  };

  const toggleActive = async () => {
    if (!selectedApp?.id || !row) return;
    setToggling(true);
    const next = !row.active;
    const { error: e } = await db.from('published_sites').update({ active: next, updated_at: new Date().toISOString() }).eq('app_id', selectedApp.id);
    if (!e) { setRow({ ...row, active: next }); await revalidate(row.slug); }
    setToggling(false);
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

  const siteUrl = row ? `https://appolyn.io/site/${row.slug}` : '';
  const live = !!row && row.active !== false;

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
          {/* Statut + publication + on/off. Pour le reste : on clique et on voit. */}
          <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h3 className="text-sm font-medium inline-flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  {row ? (live ? 'Ton site est en ligne' : 'Ton site est hors ligne') : 'Mettre ton site en ligne'}
                  {row && (
                    <span className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${live ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                      {live ? 'Public' : 'Masqué'}
                    </span>
                  )}
                </h3>
                {row ? (
                  <a href={siteUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">appolyn.io/site/{row.slug}</a>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1 max-w-md">Un vrai site pour ton app en 1 clic, avec une URL partageable (bon pour Google). Construit depuis ta vraie fiche App Store.</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {row && (
                  <button onClick={() => copyUrl(siteUrl)} className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 px-2.5 py-1.5 hover:bg-accent transition-colors">
                    {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copié</> : <><Copy className="h-3.5 w-3.5" /> Copier l&apos;URL</>}
                  </button>
                )}
                {row && (
                  <a href={siteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 px-2.5 py-1.5 hover:bg-accent transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" /> Voir le site
                  </a>
                )}
                <button onClick={publish} disabled={publishing}
                  className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-9 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                  {publishing ? 'Publication…' : row ? 'Mettre à jour' : 'Publier mon site'}
                </button>
              </div>
            </div>
            {row && (
              <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
                  <Power className="h-3.5 w-3.5" />
                  {live ? 'Visible par tout le monde. Tu peux le masquer à tout moment.' : 'Masqué au public (404). Réactive-le quand tu veux.'}
                </div>
                <button onClick={toggleActive} disabled={toggling} role="switch" aria-checked={live}
                  className={`relative h-6 w-11 rounded-full transition-colors shrink-0 disabled:opacity-50 ${live ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${live ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            )}
          </div>

          {/* Accès rapide aux 2 vraies surfaces d'édition (pas un résumé en double). */}
          {row && (
            <div className="grid sm:grid-cols-2 gap-3">
              <a href="/app/site/settings" className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 transition-colors">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-muted-foreground"><Settings2 className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">Personnaliser</div>
                  <div className="text-xs text-muted-foreground">Textes, couleur, image d&apos;accueil, domaine</div>
                </div>
              </a>
              <a href="/app/site/pages" className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 transition-colors">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-muted-foreground"><FileText className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">Pages annexes</div>
                  <div className="text-xs text-muted-foreground">FAQ, contact, confidentialité… pré-remplies</div>
                </div>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
