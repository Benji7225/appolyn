'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Download, DollarSign, Star, Layers, CircleAlert, ExternalLink,
  CircleCheck as CheckCircle2, Circle, Globe, Swords, Gauge, MessageSquare,
  ChevronRight, Sparkles, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { App } from '@/lib/database.types';
import { AddAppDialog } from '@/components/dashboard/add-app-dialog';
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
  const { apps, selectedApp, reloadApps } = useDashboard();
  const [hasCreds, setHasCreds] = useState(false);
  const [realData, setRealData] = useState<RealData>({
    averageRating: null, ratingCount: null, reviews: [],
    salesRows: [], totalDownloads: 0, totalRevenue: 0,
    salesError: null, loading: false, error: null,
  });
  const [langCount, setLangCount] = useState<number | null>(null);
  const [compCount, setCompCount] = useState(0);
  const [worstAudit, setWorstAudit] = useState<{ score: number; warnings: number } | null>(null);

  useEffect(() => { checkCreds(); loadSignals(); }, []);

  // Real signals used to build the "recommended actions": how many languages are
  // already filled, how many competitors are tracked, and the weakest ASO score.
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
    }
    const { count } = await db.from('competitors').select('id', { count: 'exact', head: true });
    setCompCount(count ?? 0);
  };

  useEffect(() => {
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
  const setupComplete = hasCreds && hasApp && hasAscId;

  const stats = [
    {
      label: 'Téléchargements',
      value: isLive && realData.totalDownloads > 0 ? realData.totalDownloads.toLocaleString('fr-FR') : '—',
      sub: !isLive ? 'Connecte App Store Connect' : realData.salesError ? 'Ajoute ton numéro de vendeur' : '30 derniers jours',
      icon: Download,
      live: isLive && !realData.salesError,
    },
    {
      label: 'Revenu',
      value: isLive && realData.totalRevenue > 0 ? eur(realData.totalRevenue, 0) : '—',
      sub: !isLive ? 'Connecte App Store Connect' : realData.salesError ? 'Ajoute ton numéro de vendeur' : '30 derniers jours (proceeds)',
      icon: DollarSign,
      live: isLive && !realData.salesError,
    },
    {
      label: 'Note',
      value: isLive && realData.averageRating != null ? realData.averageRating.toFixed(1) : '—',
      sub: isLive && realData.ratingCount != null ? `${realData.ratingCount.toLocaleString('fr-FR')} notes` : 'Connecte App Store Connect',
      icon: Star,
      live: isLive && realData.averageRating != null,
    },
    {
      label: 'Apps suivies',
      value: String(apps.length),
      sub: apps.length === 1 ? '1 app suivie' : `${apps.length} apps suivies`,
      icon: Layers,
      live: true,
    },
  ];

  // Recommended actions, derived only from real signals (never fabricated),
  // ordered by business impact: revenue/conversion first, then ASO, then setup.
  const recoList: RecoAction[] = [];
  if (!hasCreds) recoList.push({ icon: Gauge, label: 'Connecte App Store Connect pour des données réelles', href: '/dashboard/settings', priority: 100 });
  if (hasCreds && realData.salesError) recoList.push({ icon: DollarSign, label: 'Ajoute ton numéro de vendeur pour voir tes ventes', href: '/dashboard/settings', priority: 92 });
  // Conversion signal: real downloads but zero revenue = the paywall/offers aren't converting.
  if (isLive && !realData.salesError && realData.totalDownloads >= 25 && realData.totalRevenue === 0)
    recoList.push({ icon: DollarSign, label: `${realData.totalDownloads.toLocaleString('fr-FR')} téléchargements mais 0 € : tes offres ne convertissent pas, vérifie ton paywall`, href: '/dashboard/analytics', priority: 88 });
  // A low rating quietly kills conversion.
  if (isLive && realData.averageRating != null && realData.ratingCount != null && realData.ratingCount >= 5 && realData.averageRating < 4)
    recoList.push({ icon: Star, label: `Ta note est de ${realData.averageRating.toFixed(1)}/5 : réponds à tes avis pour la remonter`, href: '/dashboard/reviews', priority: 80 });
  if (langCount === 0) recoList.push({ icon: Globe, label: 'Renseigne ta fiche App Store', href: '/dashboard/metadata', priority: 70 });
  if (worstAudit && worstAudit.warnings > 0) recoList.push({ icon: Gauge, label: `Corrige ${worstAudit.warnings} point(s) ASO (score le plus faible ${worstAudit.score}/100)`, href: '/dashboard/metadata', priority: 64 });
  if (langCount != null && langCount > 0 && langCount < ASC_LOCALES.length) recoList.push({ icon: Globe, label: `Traduis ta fiche dans ${ASC_LOCALES.length - langCount} langues de plus`, href: '/dashboard/metadata', priority: 56 });
  if (compCount === 0) recoList.push({ icon: Swords, label: 'Ajoute des concurrents à surveiller', href: '/dashboard/competitors', priority: 40 });
  if (isLive && realData.reviews.length > 0) recoList.push({ icon: MessageSquare, label: `Réponds à tes avis récents (${realData.reviews.length})`, href: '/dashboard/reviews', priority: 32 });
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accueil</h1>
          <p className="text-sm text-muted-foreground mt-1">Ta performance en un coup d&apos;œil.</p>
        </div>
        <div className="flex items-center gap-3">
          <AddAppDialog onCreated={reloadApps} />
        </div>
      </div>

      {!setupComplete && (
        <SetupChecklist hasCreds={hasCreds} hasApp={hasApp} hasAscId={hasAscId} />
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

          {realData.salesRows.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-4 mb-6">
              <ChartCard
                title="Téléchargements"
                sub="30 derniers jours — rapports de ventes"
                data={realData.salesRows}
                dataKey="downloads"
                gradId="downloadGrad"
              />
              <ChartCard
                title="Revenu"
                sub="30 derniers jours — proceeds développeur"
                data={realData.salesRows}
                dataKey="revenue"
                gradId="revenueGrad"
                prefix="€"
              />
            </div>
          ) : (
            <SalesEmpty isLive={isLive} salesError={realData.salesError} loading={realData.loading} />
          )}

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
  label, value, sub, icon: Icon, live, loading,
}: {
  label: string; value: string; sub: string; icon: React.ElementType; live: boolean; loading: boolean;
}) {
  return (
    <div className="bg-card border border-border/40 card-pop rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <div className={`text-2xl font-semibold tracking-tight ${loading ? 'animate-pulse text-muted-foreground' : ''}`}>
        {loading ? '...' : value}
      </div>
      <p className={`text-xs mt-1 truncate ${live ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>{sub}</p>
    </div>
  );
}

function fmtDay(date: string) {
  // "2026-06-08" -> "08/06"
  const parts = date.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
}

function ChartCard({
  title, sub, data, dataKey, gradId, prefix = '',
}: {
  title: string;
  sub: string;
  data: { date: string; downloads?: number; revenue?: number }[];
  dataKey: string;
  gradId: string;
  prefix?: string;
}) {
  return (
    <div className="bg-card border border-border/60 card-pop rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={24} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelFormatter={(l: string) => fmtDay(l)}
            formatter={(v: number) => [`${prefix}${v.toLocaleString('fr-FR')}`, title]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="hsl(var(--foreground))"
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function SalesEmpty({ isLive, salesError, loading }: { isLive: boolean; salesError: string | null; loading: boolean }) {
  const message = loading
    ? 'Chargement des ventes…'
    : !isLive
      ? 'Connecte ta clé API App Store Connect et renseigne l\'identifiant de ton app pour voir tes vrais téléchargements et revenus.'
      : salesError
        ? salesError
        : 'Aucune vente sur les 30 derniers jours pour l\'instant. Tes téléchargements et revenus s\'afficheront ici dès que ton app commence à vendre.';
  return (
    <div className="bg-card border border-border/40 card-pop rounded-xl p-8 mb-6 flex flex-col items-center justify-center text-center min-h-[200px]">
      <div className="w-12 h-12 rounded-2xl border border-border/40 flex items-center justify-center mb-3">
        <Download className="h-5 w-5 text-muted-foreground/60" />
      </div>
      <h3 className="text-sm font-medium mb-1">Ventes &amp; revenus</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
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

function SetupChecklist({ hasCreds, hasApp, hasAscId }: { hasCreds: boolean; hasApp: boolean; hasAscId: boolean }) {
  const steps = [
    {
      done: hasCreds,
      title: 'Connecte App Store Connect',
      desc: 'Ajoute ta clé API (.p8), ton Key ID et ton Issuer ID dans les réglages.',
      cta: { href: '/dashboard/settings', label: 'Ouvrir les réglages' },
    },
    {
      done: hasApp,
      title: 'Ajoute ton app',
      desc: 'Utilise le bouton « Ajouter une app » en haut à droite pour créer ton app.',
      cta: null as { href: string; label: string } | null,
    },
    {
      done: hasAscId,
      title: 'Renseigne l\'identifiant App Store Connect',
      desc: 'Permet à Appolyn de charger tes vrais téléchargements, revenus et notes.',
      cta: { href: '/dashboard/apps', label: 'Ouvrir Mes apps' },
    },
  ];
  const done = steps.filter((s) => s.done).length;
  return (
    <div className="bg-card border border-border/60 card-pop rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium">Bien démarrer avec Appolyn</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Trois étapes rapides pour connecter tes données App Store.</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{done}/3</span>
      </div>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            {s.done
              ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              : <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${s.done ? 'text-muted-foreground line-through' : ''}`}>{s.title}</p>
              {!s.done && <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>}
            </div>
            {!s.done && s.cta && (
              <a href={s.cta.href} className="text-xs text-emerald-400 hover:underline shrink-0 mt-0.5 whitespace-nowrap">{s.cta.label} →</a>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
