'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { getCache, setCache } from '@/lib/cache';
import { Globe, Download, Copy, Check, Star, ExternalLink, Shield, LifeBuoy, Smartphone, RefreshCw } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  };

  const load = useCallback(async () => {
    if (!ascAppId) { setData(null); return; }
    const key = `site:${ascAppId}`;
    const cached = getCache<Detail>(key);
    if (cached) setData(cached);
    setLoading(!cached); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      // 1) App Store public (app déjà sortie)
      const r = await fetch(`/api/itunes?action=detail&id=${encodeURIComponent(ascAppId)}&country=fr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json() as { result?: Detail; error?: string };
      if (j.result && (j.result.description || j.result.title)) {
        setData(j.result); setCache(key, j.result);
      } else {
        // 2) Repli App Store Connect (fiche en préparation / pré-lancement)
        const asc = await loadFromAsc(ascAppId, token);
        if (asc) { setData(asc); setCache(key, asc); }
        else setError('Impossible de charger ta fiche (ni App Store public, ni App Store Connect). Vérifie ton App ID et ta clé ASC.');
      }
    } catch { setError('Connexion impossible.'); }
    setLoading(false);
  }, [ascAppId]);
  useEffect(() => { load(); }, [load]);

  const storeUrl = data?.url || (ascAppId ? `https://apps.apple.com/app/id${ascAppId}` : '');
  const shots = data ? [...data.screenshots, ...data.ipadScreenshots] : [];
  const smartBanner = `<meta name="apple-itunes-app" content="app-id=${ascAppId}">`;
  const privacyText = data ? buildPrivacy(data, selectedApp?.name ?? data.title) : '';
  const supportText = data ? buildSupport(data, selectedApp?.name ?? data.title) : '';

  if (!ascAppId) {
    return (
      <div className="p-8">
        <PageHeader title="Site" description="Un site marketing auto pour ton app, généré depuis ta fiche App Store." />
        <EmptyState
          icon={Smartphone}
          title="Connecte ton app"
          description="Renseigne l'App ID App Store Connect de ton app pour générer la prévisualisation de son site (héro, screenshots, bouton de téléchargement) et les pages confidentialité + support exigées par Apple."
          action={<a href="/app/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>}
        />
      </div>
    );
  }

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Site"
        description="Aperçu du site marketing auto de ton app, à partir de tes vraies données App Store. Idéal pour le référencement Google et pour les URLs confidentialité/support exigées par Apple. (Mise en ligne sur ton domaine : à venir.)"
      />

      {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive mb-6">{error}</div>}
      {loading && !data && (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin inline mr-2" /> Génération de l&apos;aperçu…
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Aperçu de la landing */}
          <div className="rounded-2xl border border-border/50 bg-card card-pop overflow-hidden">
            <div className="p-8 bg-gradient-to-b from-accent/40 to-transparent">
              <div className="flex items-center gap-4 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {data.artworkUrl || data.iconUrl ? <img src={data.artworkUrl || data.iconUrl} alt="" className="w-20 h-20 rounded-2xl shrink-0" /> : null}
                <div className="min-w-0">
                  <h2 className="text-2xl font-semibold tracking-tight truncate">{data.title}</h2>
                  <p className="text-sm text-muted-foreground truncate">{data.sellerName}{data.genre ? ` · ${data.genre}` : ''}</p>
                  {data.averageRating != null && (
                    <p className="text-sm mt-1 inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {data.averageRating.toFixed(1)} {data.ratingCount != null ? <span className="text-muted-foreground">({data.ratingCount.toLocaleString('fr-FR')})</span> : null}</p>
                  )}
                </div>
              </div>
              <a href={storeUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm rounded-xl px-5 h-12 bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
                <Download className="h-4 w-4" /> Télécharger sur l&apos;App Store
              </a>
            </div>

            {shots.length > 0 && (
              <div className="px-8 pb-6">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-macos">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {shots.slice(0, 10).map((s, i) => <img key={i} src={s} alt="" className="h-[360px] w-auto rounded-xl border border-border/40 shrink-0 object-contain bg-muted/30" loading="lazy" />)}
                </div>
              </div>
            )}

            {data.description && (
              <div className="px-8 pb-8">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-[12]">{data.description}</p>
              </div>
            )}
          </div>

          {/* Smart App Banner */}
          <div className="rounded-xl border border-border/40 bg-card p-5">
            <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
              <h3 className="text-sm font-medium inline-flex items-center gap-2"><Smartphone className="h-4 w-4 text-muted-foreground" /> Smart App Banner</h3>
              <CopyBtn text={smartBanner} id="banner" copied={copied} onCopy={copy} />
            </div>
            <p className="text-xs text-muted-foreground mb-2">Colle cette balise dans le &lt;head&gt; de ton site : Safari iOS affichera une bannière « Ouvrir dans l&apos;App Store » en haut de la page.</p>
            <code className="block text-[11px] font-mono px-3 py-2 rounded-lg bg-background border border-border/40 overflow-x-auto">{smartBanner}</code>
          </div>

          {/* Pages obligatoires Apple */}
          <div className="grid lg:grid-cols-2 gap-6">
            <LegalCard icon={Shield} title="Politique de confidentialité" hint="URL exigée par Apple à la soumission." text={privacyText} id="privacy" copied={copied} onCopy={copy} />
            <LegalCard icon={LifeBuoy} title="Page de support" hint="URL de support exigée par Apple." text={supportText} id="support" copied={copied} onCopy={copy} />
          </div>

          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" /> Bientôt : mise en ligne automatique sur <strong>tonapp.appolyn.io</strong> puis sur ton domaine perso, avec un moteur de contenu SEO.
          </p>
        </div>
      )}
    </div>
  );
}

function LegalCard({ icon: Icon, title, hint, text, id, copied, onCopy }: {
  icon: typeof Shield; title: string; hint: string; text: string; id: string; copied: string | null; onCopy: (t: string, id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-5">
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h3 className="text-sm font-medium inline-flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /> {title}</h3>
        <CopyBtn text={text} id={id} copied={copied} onCopy={onCopy} label="Copier le texte" />
      </div>
      <p className="text-xs text-muted-foreground mb-2">{hint} Modèle à relire et adapter, puis héberge-le et colle l&apos;URL dans App Store Connect.</p>
      <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto scrollbar-macos bg-background border border-border/40 rounded-lg p-3">{text}</pre>
    </div>
  );
}

function buildPrivacy(d: Detail, name: string): string {
  const today = new Date().toLocaleDateString('fr-FR');
  return `Politique de confidentialité — ${name}
Dernière mise à jour : ${today}

${name} (« l'application »), éditée par ${d.sellerName || 'l\'éditeur'}, respecte ta vie privée. Cette politique explique quelles données sont collectées et comment elles sont utilisées.

Données collectées
- Données d'usage anonymes (ouvertures, actions dans l'app) pour améliorer l'expérience.
- Aucune donnée n'est vendue à des tiers.
[À COMPLÉTER : liste précisément ce que TON app collecte, en cohérence avec ta déclaration « Confidentialité de l'app » sur l'App Store.]

Utilisation
Les données servent uniquement à faire fonctionner et améliorer l'application.

Tes droits
Tu peux demander l'accès, la rectification ou la suppression de tes données à : [TON EMAIL DE CONTACT].

Contact
${d.sellerName || ''} — [TON EMAIL DE CONTACT]`;
}

function buildSupport(d: Detail, name: string): string {
  return `Support — ${name}

Besoin d'aide avec ${name} ? On est là.

Contact
Écris-nous à [TON EMAIL DE CONTACT], on répond généralement sous 48 h.

Questions fréquentes
- Comment gérer mon abonnement ? Depuis Réglages iOS > ton compte > Abonnements.
- Un bug, une idée ? Réponds par mail avec ton modèle d'iPhone et ta version iOS, ça nous aide à corriger vite.

Éditeur
${d.sellerName || ''}`;
}
