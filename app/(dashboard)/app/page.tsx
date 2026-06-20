'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  DollarSign, Star, CircleAlert, ExternalLink,
  CircleCheck as CheckCircle2, Circle, Globe, Swords, Gauge, MessageSquare,
  ChevronRight, Sparkles, TrendingUp, TrendingDown, Rocket,
} from 'lucide-react';
import type { App } from '@/lib/database.types';
import { auditMetadata, ASC_LOCALES } from '@/lib/aso';
import { useDashboard } from '@/lib/app-context';
import { getCache, setCache } from '@/lib/cache';

const db = supabase as unknown as { from: (t: string) => any };

type RecoAction = { icon: React.ElementType; label: string; href: string; priority: number };
type Insight = { icon: React.ElementType; text: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const eur = (n: number, max = 2) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: max }).format(n);

type Review = {
  rating: number;
  title: string;
  body: string;
  territory: string;
  createdDate: string;
  reviewerNickname: string;
  responseBody?: string | null;
};

type RealData = {
  averageRating: number | null;
  ratingCount: number | null;
  reviews: Review[];
  salesRows: { date: string; downloads: number; revenue: number }[];
  totalDownloads: number;
  totalRevenue: number;
  salesError: string | null;
  loading: boolean;
  error: string | null;
};

async function ascPost(action: string, body: Record<string, unknown>, token: string) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=${action}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return r.json();
}

export default function DashboardPage() {
  const { apps, selectedApp } = useDashboard();
  const [hasCreds, setHasCreds] = useState(false);
  const [hasSdk, setHasSdk] = useState(false);
  const [realData, setRealData] = useState<RealData>({
    averageRating: null, ratingCount: null, reviews: [],
    salesRows: [], totalDownloads: 0, totalRevenue: 0,
    salesError: null, loading: false, error: null,
  });
  const [langCount, setLangCount] = useState<number | null>(null);
  const [compCount, setCompCount] = useState(0);
  const [worstAudit, setWorstAudit] = useState<{ score: number; warnings: number } | null>(null);
  const [avgScore, setAvgScore] = useState<number | null>(null);
  const [launchStarted, setLaunchStarted] = useState<boolean | null>(null);

  useEffect(() => { checkCreds(); loadSignals(); }, []);

  // La checklist de lancement de l'app sélectionnée est-elle démarrée ? (nudge accueil)
  useEffect(() => {
    const appId = selectedApp?.id;
    if (!appId) { setLaunchStarted(null); return; }
    db.from('launch_checklist').select('id', { count: 'exact', head: true }).eq('app_id', appId).eq('done', true)
      .then((res: { count: number | null }) => setLaunchStarted((res.count ?? 0) > 0));
  }, [selectedApp?.id]);

  // "SDK branché" = au moins un client réel remonté par le SDK sur une de tes apps
  // (la clé SDK existe toujours par app ; ce qui compte, c'est qu'elle reçoive des
  // données). Sert à la 4e étape du SetupChecklist.
  const appIds = apps.map((a) => a.id).join(',');
  useEffect(() => {
    if (!appIds) { setHasSdk(false); return; }
    db.from('sdk_clients').select('id', { count: 'exact', head: true })
      .in('app_id', appIds.split(','))
      .then((res: { count: number | null }) => setHasSdk((res.count ?? 0) > 0));
  }, [appIds]);

  // The headline "Score ASO" MUST match the App Store Page: the real score is
  // structure + live iTunes keyword competition (route /api/aso-score), averaged
  // across locales. The structural-only audit below can read 100 while the real
  // score is much lower, so we never use it for the headline number.
  const loadRealAsoScore = useCallback(async (rows: Record<string, string>[]) => {
    const cacheKey = 'home:asoScore';
    const cached = getCache<number>(cacheKey);
    if (cached != null) setAvgScore(cached);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const tok = session?.access_token ?? '';
      const countryOf = (code: string) =>
        ASC_LOCALES.find((l) => l.code === code)?.country ?? (code.split('-')[1]?.toLowerCase() ?? '');
      const scores: number[] = [];
      let i = 0;
      const worker = async () => {
        while (i < rows.length) {
          const r = rows[i++];
          if (!r.title && !r.subtitle && !r.keywords && !r.description) continue;
          try {
            const resp = await fetch('/api/aso-score', {
              method: 'POST',
              headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                locale: r.country_code, country: countryOf(r.country_code),
                ascAppId: selectedApp?.asc_app_id ?? '',
                title: r.title ?? '', subtitle: r.subtitle ?? '', keywords: r.keywords ?? '',
                description: r.description ?? '', promotional_text: r.promotional_text ?? '',
              }),
            });
            const j = await resp.json();
            if (typeof j?.score === 'number') scores.push(j.score);
          } catch { /* a single locale failing must not break the average */ }
        }
      };
      // Small concurrency so iTunes (cached server-side by content hash) isn't hammered.
      await Promise.all([worker(), worker(), worker(), worker()]);
      if (scores.length) {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        setAvgScore(avg);
        setCache(cacheKey, avg);
      }
    } catch { /* keep the cached value (or "—"); never invent a score */ }
  }, [selectedApp?.asc_app_id]);

  // Real signals used to build the "recommended actions": how many languages are
  // filled, how many competitors are tracked, and the weakest listing (structural
  // warnings only, which are honest regardless of the real keyword competition).
  const loadSignals = async () => {
    const { data: locs } = await supabase
      .from('app_localizations')
      .select('country_code,title,subtitle,keywords,description,promotional_text')
      .eq('is_current', true);
    const rows = (locs ?? []) as Record<string, string>[];
    const langs = new Set(rows.map((r) => r.country_code));
    setLangCount(langs.size);
    if (rows.length) {
      let worst = { score: 101, warnings: 0 };
      for (const r of rows) {
        const a = auditMetadata({
          title: r.title ?? '', subtitle: r.subtitle ?? '', keywords: r.keywords ?? '',
          description: r.description ?? '', promotional_text: r.promotional_text ?? '',
        });
        const warnings = a.findings.filter((f) => f.severity === 'warning').length;
        if (a.score < worst.score) worst = { score: a.score, warnings };
      }
      setWorstAudit(worst.score === 101 ? null : worst);
      loadRealAsoScore(rows);
    }
    const { count } = await db.from('competitors').select('id', { count: 'exact', head: true });
    setCompCount(count ?? 0);
  };

  useEffect(() => {
    // Score ASO = le MÊME chiffre que la page App Store (calcul authoritatif),
    // partagé via localStorage par app. Évite que l'accueil et la page App Store
    // affichent deux scores différents.
    if (selectedApp?.asc_app_id) {
      try {
        const v = localStorage.getItem(`aso:global:${selectedApp.asc_app_id}`);
        if (v != null && !Number.isNaN(Number(v))) setAvgScore(Number(v));
      } catch { /* ignore */ }
    }
    if (selectedApp?.asc_app_id && hasCreds) {
      // Show the last real snapshot instantly, then revalidate in the background.
      const cached = getCache<RealData>(`overview:${selectedApp.id}`);
      if (cached) setRealData({ ...cached, loading: false });
      loadRealData(selectedApp, !!cached);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp?.id, hasCreds]);

  const checkCreds = async () => {
    const { data } = await supabase.from('asc_credentials').select('id').maybeSingle();
    setHasCreds(!!data);
  };

  const loadRealData = useCallback(async (app: App, silent = false) => {
    if (!app.asc_app_id) return;
    if (!silent) setRealData((p) => ({ ...p, loading: true, error: null, salesError: null }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const tok = session?.access_token ?? '';

      const [ratings, sales] = await Promise.all([
        ascPost('get-ratings', { appId: app.asc_app_id }, tok) as Promise<{
          averageRating?: number; ratingCount?: number; reviews?: Review[]; error?: string;
        }>,
        ascPost('get-sales', {}, tok) as Promise<{
          rows?: { date: string; downloads: number; revenue: number }[];
          totalDownloads?: number; totalRevenue?: number; error?: string;
        }>,
      ]);

      if (ratings.error) {
        setRealData((p) => ({ ...p, loading: false, error: ratings.error ?? null }));
        return;
      }

      const next: RealData = {
        loading: false,
        error: null,
        averageRating: ratings.averageRating ?? null,
        ratingCount: ratings.ratingCount ?? null,
        reviews: ratings.reviews ?? [],
        // Sales are optional (need a vendor number); a sales error is surfaced
        // as a hint, it does not block ratings/reviews.
        salesError: sales.error ?? null,
        salesRows: sales.rows ?? [],
        totalDownloads: sales.totalDownloads ?? 0,
        totalRevenue: sales.totalRevenue ?? 0,
      };
      setRealData(next);
      setCache(`overview:${app.id}`, next);
    } catch {
      setRealData((p) => ({ ...p, loading: false, error: 'Chargement des données App Store Connect impossible.' }));
    }
  }, []);

  const isLive = hasCreds && !!selectedApp?.asc_app_id;
  const hasApp = apps.length > 0;
  const hasAscId = !!selectedApp?.asc_app_id;
  const setupComplete = hasCreds && hasApp && hasAscId && hasSdk;

  const stats = [
    {
      label: 'Téléchargements',
      value: isLive && realData.totalDownloads > 0 ? realData.totalDownloads.toLocaleString('fr-FR') : '—',
      sub: !isLive ? 'Connecte App Store Connect' : realData.salesError ? 'Ajoute ton numéro de vendeur' : '30 derniers jours',
      live: isLive && !realData.salesError,
    },
    {
      label: 'Revenu',
      value: isLive && realData.totalRevenue > 0 ? eur(realData.totalRevenue, 0) : '—',
      sub: !isLive ? 'Connecte App Store Connect' : realData.salesError ? 'Ajoute ton numéro de vendeur' : '30 derniers jours (proceeds)',
      live: isLive && !realData.salesError,
    },
    {
      label: 'Note',
      value: isLive && realData.averageRating != null ? realData.averageRating.toFixed(1) : '—',
      sub: isLive && realData.ratingCount != null ? `${realData.ratingCount.toLocaleString('fr-FR')} notes` : 'Connecte App Store Connect',
      live: isLive && realData.averageRating != null,
    },
    {
      label: 'Score ASO',
      value: avgScore != null ? `${avgScore}/100` : '—',
      sub: avgScore == null ? 'Renseigne ta fiche' : avgScore >= 80 ? 'Excellent' : avgScore >= 60 ? 'À améliorer' : 'Faible',
      live: avgScore != null,
    },
  ];

  // Recommended actions, derived only from real signals (never fabricated),
  // ordered by business impact: revenue/conversion first, then ASO, then setup.
  const recoList: RecoAction[] = [];
  if (!hasCreds) recoList.push({ icon: Gauge, label: 'Connecte App Store Connect pour des données réelles', href: '/app/settings', priority: 100 });
  if (hasCreds && realData.salesError) recoList.push({ icon: DollarSign, label: 'Ajoute ton numéro de vendeur pour voir tes ventes', href: '/app/settings', priority: 92 });
  // Conversion signal: real downloads but zero revenue = the paywall/offers aren't converting.
  if (isLive && !realData.salesError && realData.totalDownloads >= 25 && realData.totalRevenue === 0)
    recoList.push({ icon: DollarSign, label: `${realData.totalDownloads.toLocaleString('fr-FR')} téléchargements mais 0 € : tes offres ne convertissent pas, vérifie ton paywall`, href: '/app/analytics', priority: 88 });
  // A low rating quietly kills conversion.
  if (isLive && realData.averageRating != null && realData.ratingCount != null && realData.ratingCount >= 5 && realData.averageRating < 4)
    recoList.push({ icon: Star, label: `Ta note est de ${realData.averageRating.toFixed(1)}/5 : réponds à tes avis pour la remonter`, href: '/app/reviews', priority: 80 });
  if (langCount === 0) recoList.push({ icon: Globe, label: 'Renseigne ta fiche App Store', href: '/app/localization', priority: 70 });
  if (worstAudit && worstAudit.warnings > 0) recoList.push({ icon: Gauge, label: `Corrige ${worstAudit.warnings} point(s) ASO sur ta fiche`, href: '/app/localization', priority: 64 });
  if (langCount != null && langCount > 0 && langCount < ASC_LOCALES.length) recoList.push({ icon: Globe, label: `Traduis ta fiche dans ${ASC_LOCALES.length - langCount} langues de plus`, href: '/app/localization', priority: 56 });
  // Nudge vers la checklist de lancement guidée tant qu'elle n'est pas démarrée.
  if (selectedApp && launchStarted === false) recoList.push({ icon: Rocket, label: 'Prépare ton lancement avec la checklist guidée', href: '/app/launch', priority: 50 });
  // Negative reviews left unanswered: high-leverage, hurts conversion if ignored.
  const negNoReply = realData.reviews.filter((r) => r.rating <= 3 && !r.responseBody).length;
  if (isLive && negNoReply > 0)
    recoList.push({ icon: MessageSquare, label: `${negNoReply} avis négatif(s) sans réponse : traite-les en priorité`, href: '/app/reviews', priority: 84 });
  // Average ASO score below target across all localized listings.
  if (avgScore != null && avgScore < 75)
    recoList.push({ icon: Gauge, label: `Score ASO moyen ${avgScore}/100 : vise 80+ pour mieux te classer`, href: '/app/localization', priority: 62 });
  if (compCount === 0) recoList.push({ icon: Swords, label: 'Ajoute des concurrents à surveiller', href: '/app/competitors', priority: 40 });
  // Any reviews still without a reply (answering lifts your rating and trust).
  const noReply = realData.reviews.filter((r) => !r.responseBody).length;
  if (isLive && noReply > 0)
    recoList.push({ icon: MessageSquare, label: `Réponds à tes avis récents (${noReply} sans réponse)`, href: '/app/reviews', priority: 32 });
  // Excellent rating: turn social proof into growth.
  if (isLive && realData.averageRating != null && realData.ratingCount != null && realData.averageRating >= 4.5 && realData.ratingCount >= 10)
    recoList.push({ icon: Star, label: `Note excellente (${realData.averageRating.toFixed(1)}/5) : sollicite plus d'avis pour amplifier ta preuve sociale`, href: '/app/reviews', priority: 28 });
  const reco = recoList.sort((a, b) => b.priority - a.priority);

  // Automatic analyses: short narrative insights, each derived from real data only.
  const insights: Insight[] = [];
  if (isLive) {
    const rowsS = realData.salesRows;
    if (rowsS.length >= 8) {
      const half = Math.floor(rowsS.length / 2);
      const firstAvg = rowsS.slice(0, half).reduce((s, r) => s + r.downloads, 0) / half;
      const lastAvg = rowsS.slice(half).reduce((s, r) => s + r.downloads, 0) / (rowsS.length - half);
      if (firstAvg > 0) {
        const change = Math.round(((lastAvg - firstAvg) / firstAvg) * 100);
        if (Math.abs(change) >= 10)
          insights.push({
            icon: change > 0 ? TrendingUp : TrendingDown,
            text: change > 0
              ? `Tes téléchargements accélèrent : +${change} % sur la 2nde moitié de la période. C'est le moment de pousser ton contenu.`
              : `Tes téléchargements ralentissent : ${change} % sur la 2nde moitié. Regarde tes mots-clés et ta page produit.`,
          });
      }
    }
    if (realData.totalDownloads > 0 && realData.totalRevenue > 0)
      insights.push({ icon: DollarSign, text: `Chaque téléchargement te rapporte en moyenne ${eur(realData.totalRevenue / realData.totalDownloads)}.` });
    if (realData.averageRating != null && realData.ratingCount != null && realData.ratingCount > 0)
      insights.push({ icon: Star, text: `Note moyenne ${realData.averageRating.toFixed(1)}/5 sur ${realData.ratingCount.toLocaleString('fr-FR')} avis.` });
    if (realData.reviews.length >= 3) {
      const counts: Record<string, number> = {};
      for (const r of realData.reviews) counts[r.territory] = (counts[r.territory] ?? 0) + 1;
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top && top[1] >= 2) insights.push({ icon: Globe, text: `Tes avis récents viennent surtout de ${top[0]} : c'est là que ta communauté est la plus active.` });
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accueil</h1>
          <p className="text-sm text-muted-foreground mt-1">Ta performance en un coup d&apos;œil.</p>
        </div>
      </div>

      {!setupComplete && (
        <SetupChecklist hasCreds={hasCreds} hasApp={hasApp} hasAscId={hasAscId} hasSdk={hasSdk} />
      )}

      {apps.length > 0 && (
        <>
          {realData.error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl mb-6 text-sm text-destructive">
              <CircleAlert className="h-4 w-4 shrink-0" />
              {realData.error}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} loading={realData.loading} />
            ))}
          </div>

          {reco.length > 0 && (
            <div className="bg-card border border-border/50 card-pop rounded-xl p-5 mb-6">
              <h3 className="text-sm font-medium mb-3">Actions recommandées</h3>
              <div className="space-y-0.5">
                {reco.map((a, i) => (
                  <Link key={i} href={a.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group">
                    <a.icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm flex-1">{a.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Les courbes téléchargements/revenus vivent dans Analytics (et les
              chiffres clés sont déjà dans les cartes ci-dessus) : l'accueil reste
              focalisé sur les actions, pas sur des graphiques en double. */}

          {insights.length > 0 && (
            <div className="bg-card border border-border/40 card-pop rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">Analyses automatiques</h3>
              </div>
              <div className="space-y-2.5">
                {insights.map((it, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <it.icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{it.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLive && realData.reviews.length > 0 && (
            <div className="bg-card border border-border/40 card-pop rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium">Avis récents</h3>
                  <p className="text-xs text-muted-foreground">Depuis App Store Connect</p>
                </div>
                {selectedApp?.asc_app_id && (
                  <a
                    href={`https://appstoreconnect.apple.com/apps/${selectedApp.asc_app_id}/appstore/ios/version/deliverable`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Voir tout <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="space-y-3">
                {realData.reviews.slice(0, 5).map((review, i) => (
                  <ReviewCard key={i} review={review} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label, value, sub, live, loading,
}: {
  label: string; value: string; sub: string; live: boolean; loading: boolean;
}) {
  return (
    <div className="bg-card border border-border/40 card-pop rounded-xl px-4 py-3">
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      <div className={`text-xl font-semibold tracking-tight mt-1 ${loading ? 'animate-pulse text-muted-foreground' : ''}`}>
        {loading ? '...' : value}
      </div>
      <p className={`text-[11px] mt-0.5 truncate ${live ? 'text-muted-foreground/80' : 'text-muted-foreground/40'}`}>{sub}</p>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{review.reviewerNickname || 'Anonyme'}</span>
          <span className="text-xs text-muted-foreground">{review.territory}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
          ))}
        </div>
      </div>
      {review.title && <p className="text-sm font-medium mb-0.5">{review.title}</p>}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{review.body}</p>
      <p className="text-xs text-muted-foreground/50 mt-1.5">{new Date(review.createdDate).toLocaleDateString('fr-FR')}</p>
    </div>
  );
}

function SetupChecklist({ hasCreds, hasApp, hasAscId, hasSdk }: { hasCreds: boolean; hasApp: boolean; hasAscId: boolean; hasSdk: boolean }) {
  const steps = [
    {
      done: hasCreds,
      title: 'Connecte App Store Connect',
      desc: 'Ajoute ta clé API (.p8), ton Key ID et ton Issuer ID dans les réglages.',
      cta: { href: '/app/settings', label: 'Ouvrir les réglages' },
    },
    {
      done: hasApp,
      title: 'Ajoute ton app',
      desc: 'Ajoute ton app depuis Mes apps pour piloter son ASO, ses avis et ses utilisateurs.',
      cta: { href: '/app/settings/apps', label: 'Ouvrir Mes apps' } as { href: string; label: string } | null,
    },
    {
      done: hasAscId,
      title: 'Renseigne l\'identifiant App Store Connect',
      desc: 'Permet à Appolyn de charger tes vrais téléchargements, revenus et notes.',
      cta: { href: '/app/apps', label: 'Ouvrir Mes apps' },
    },
    {
      done: hasSdk,
      title: 'Branche le SDK dans ton app',
      desc: 'Une seule ligne au lancement de ton app (Appolyn.start). Tu obtiens automatiquement tes installs, tes utilisateurs et tes revenus, sans rien coder de plus.',
      cta: { href: '/app/settings/connections', label: 'Obtenir ma clé SDK' },
    },
  ];
  const done = steps.filter((s) => s.done).length;
  // Parcours guidé : la 1re étape non faite est mise en avant comme « Étape suivante »
  // (une seule action claire à la fois, pour un non-codeur). Les autres restent discrètes.
  const nextIndex = steps.findIndex((s) => !s.done);
  const pct = Math.round((done / steps.length) * 100);
  return (
    <div className="bg-card border border-border/60 card-pop rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium">Bien démarrer avec Appolyn</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Suis les étapes dans l&apos;ordre, on te guide. Rien à coder au-delà d&apos;une ligne pour le SDK.</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{done}/{steps.length}</span>
      </div>
      <div className="h-1.5 rounded-full bg-accent overflow-hidden mb-5">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>
      <ol className="space-y-2.5">
        {steps.map((s, i) => {
          const isNext = i === nextIndex;
          return (
            <li key={i} className={`flex items-start gap-3 rounded-lg ${isNext ? 'bg-primary/5 border border-primary/20 p-3' : 'px-0.5'}`}>
              {s.done
                ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                : <Circle className={`h-5 w-5 shrink-0 mt-0.5 ${isNext ? 'text-primary' : 'text-muted-foreground/40'}`} />}
              <div className="flex-1 min-w-0">
                {isNext && <span className="block text-[10px] font-semibold uppercase tracking-wide text-primary mb-0.5">Étape suivante</span>}
                <p className={`text-sm font-medium ${s.done ? 'text-muted-foreground line-through' : ''}`}>{s.title}</p>
                {!s.done && <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>}
                {isNext && s.cta && (
                  <a href={s.cta.href} className="inline-flex items-center mt-2 text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-md px-3 py-1.5 transition-opacity">{s.cta.label} →</a>
                )}
              </div>
              {!s.done && !isNext && s.cta && (
                <a href={s.cta.href} className="text-xs text-muted-foreground hover:text-foreground hover:underline shrink-0 mt-0.5 whitespace-nowrap">{s.cta.label} →</a>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
