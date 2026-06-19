'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { getCache, setCache } from '@/lib/cache';
import { Megaphone, Lock, RefreshCw, Copy, Check, Download, ExternalLink, Star } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Detail = {
  title: string;
  sellerName: string;
  genre: string;
  genres: string[];
  averageRating: number | null;
  ratingCount: number | null;
  version: string;
  url: string;
  description: string;
  releaseDate: string | null;
  currentVersionReleaseDate: string | null;
  fileSizeBytes: number | null;
  minimumOsVersion: string;
  contentRating: string;
  formattedPrice: string;
  languages: string[];
  screenshots: string[];
  ipadScreenshots: string[];
  artworkUrl: string;
  iconUrl: string;
};

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
const fmtSize = (b: number | null) => (b ? `${(b / 1_048_576).toFixed(0)} Mo` : '—');

function CopyButton({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* clipboard refusé */ } }}
      className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 px-2.5 py-1 hover:bg-accent transition-colors shrink-0"
    >
      {done ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copié</> : <><Copy className="h-3.5 w-3.5" /> {label}</>}
    </button>
  );
}

// Press-kit / media-kit : assemble automatiquement un dossier de presse à partir
// des VRAIES données publiques App Store de l'app (icône, captures, description,
// faits). Zéro saisie. Pour Product Hunt, la presse, Reddit, etc.
export default function PressKitPage() {
  const { selectedApp } = useDashboard();
  const ascAppId = selectedApp?.asc_app_id ?? '';

  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ascAppId) { setData(null); return; }
    const key = `presskit:${ascAppId}`;
    const cached = getCache<Detail>(key);
    if (cached) setData(cached);
    setLoading(!cached);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`/api/itunes?action=detail&id=${encodeURIComponent(ascAppId)}&country=us`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const j = await r.json() as { result?: Detail; error?: string };
      if (j.error || !j.result) setError(j.error ?? 'App introuvable.');
      else { setData(j.result); setCache(key, j.result); }
    } catch {
      setError('Récupération des données App Store impossible.');
    }
    setLoading(false);
  }, [ascAppId]);

  useEffect(() => { load(); }, [load]);

  if (!ascAppId) {
    return (
      <div className="p-8">
        <PageHeader title="Press-kit" description="Ton dossier de presse, généré automatiquement depuis ta fiche App Store." />
        <EmptyState
          icon={Lock}
          title="Connecte App Store Connect"
          description="Sélectionne une app avec son App ID pour générer son press-kit (icône, captures, description, faits) prêt à partager."
          action={<a href="/dashboard/settings/app-store-connect" className="text-sm text-primary hover:underline">Aller aux réglages →</a>}
        />
      </div>
    );
  }

  const shots = data ? [...data.screenshots, ...data.ipadScreenshots] : [];
  const icon = data?.artworkUrl || data?.iconUrl || '';

  const markdown = data ? [
    `# ${data.title}`,
    data.sellerName ? `**Éditeur :** ${data.sellerName}` : '',
    data.genre ? `**Catégorie :** ${data.genre}` : '',
    data.formattedPrice ? `**Prix :** ${data.formattedPrice}` : '',
    data.averageRating != null && data.ratingCount ? `**Note :** ${data.averageRating.toFixed(1)}/5 (${data.ratingCount.toLocaleString('fr-FR')} avis)` : '',
    data.url ? `**App Store :** ${data.url}` : '',
    '',
    '## Description',
    data.description,
  ].filter(Boolean).join('\n') : '';

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Press-kit"
        description="Généré automatiquement depuis ta fiche App Store. Copie les blocs, télécharge les visuels, partage-le (Product Hunt, presse, Reddit)."
        actions={data ? <CopyButton text={markdown} label="Copier le press-kit (Markdown)" /> : undefined}
      />

      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive mb-6">{error}</div>}

      {loading && !data ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin inline mr-2" /> Génération de ton press-kit…
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* En-tête identité */}
          <div className="bg-card border border-border/50 card-pop rounded-xl p-6 flex items-start gap-5 flex-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {icon && <img src={icon} alt={data.title} width={88} height={88} className="rounded-2xl shrink-0" style={{ width: 88, height: 88 }} />}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold tracking-tight">{data.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{data.sellerName}{data.genre ? ` · ${data.genre}` : ''}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap text-sm">
                {data.averageRating != null && data.ratingCount ? (
                  <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{data.averageRating.toFixed(1)} <span className="text-muted-foreground">({data.ratingCount.toLocaleString('fr-FR')})</span></span>
                ) : null}
                {data.formattedPrice && <span className="text-muted-foreground">{data.formattedPrice}</span>}
                {data.url && (
                  <a href={data.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    Voir sur l&apos;App Store <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
            {icon && (
              <a href={icon} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 px-2.5 py-1 hover:bg-accent transition-colors shrink-0">
                <Download className="h-3.5 w-3.5" /> Icône
              </a>
            )}
          </div>

          {/* Faits clés */}
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <h3 className="text-sm font-medium mb-3">Faits clés</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Fact label="Version" value={data.version || '—'} />
              <Fact label="Prix" value={data.formattedPrice || 'Gratuit'} />
              <Fact label="Taille" value={fmtSize(data.fileSizeBytes)} />
              <Fact label="iOS min." value={data.minimumOsVersion || '—'} />
              <Fact label="Âge" value={data.contentRating || '—'} />
              <Fact label="Langues" value={data.languages.length ? String(data.languages.length) : '—'} />
              <Fact label="Sortie" value={fmtDate(data.releaseDate)} />
              <Fact label="MàJ" value={fmtDate(data.currentVersionReleaseDate)} />
            </div>
          </div>

          {/* Description */}
          <div className="bg-card border border-border/40 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h3 className="text-sm font-medium">Description</h3>
              <CopyButton text={data.description} />
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{data.description || '—'}</p>
          </div>

          {/* Visuels */}
          {shots.length > 0 && (
            <div className="bg-card border border-border/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h3 className="text-sm font-medium">Captures ({shots.length})</h3>
                <span className="text-xs text-muted-foreground">Clique pour télécharger en pleine résolution</span>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-macos pb-1">
                {shots.map((s, i) => (
                  <a key={i} href={s} target="_blank" rel="noopener noreferrer" title="Ouvrir / télécharger" className="shrink-0 group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s} alt={`Capture ${i + 1}`} className="h-52 rounded-lg border border-border/40 object-cover" loading="lazy" />
                    <span className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Download className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5 truncate">{value}</p>
    </div>
  );
}
