'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, DollarSign, Star, Layers, RefreshCw, CircleAlert, ExternalLink } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { App } from '@/lib/database.types';
import { AddAppDialog } from '@/components/dashboard/add-app-dialog';
import { Button } from '@/components/ui/button';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const DEMO_CHART_DATA = [
  { date: 'Jan', downloads: 420, revenue: 840 },
  { date: 'Feb', downloads: 580, revenue: 1020 },
  { date: 'Mar', downloads: 510, revenue: 940 },
  { date: 'Apr', downloads: 720, revenue: 1380 },
  { date: 'May', downloads: 680, revenue: 1240 },
  { date: 'Jun', downloads: 890, revenue: 1680 },
  { date: 'Jul', downloads: 950, revenue: 1820 },
  { date: 'Aug', downloads: 1080, revenue: 2100 },
  { date: 'Sep', downloads: 1020, revenue: 1980 },
  { date: 'Oct', downloads: 1240, revenue: 2340 },
  { date: 'Nov', downloads: 1180, revenue: 2240 },
  { date: 'Dec', downloads: 1380, revenue: 2640 },
];

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
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [hasCreds, setHasCreds] = useState(false);
  const [realData, setRealData] = useState<RealData>({
    averageRating: null, ratingCount: null, reviews: [],
    salesRows: [], totalDownloads: 0, totalRevenue: 0,
    loading: false, error: null,
  });

  useEffect(() => { loadApps(); checkCreds(); }, []);

  useEffect(() => {
    if (selectedApp?.asc_app_id && hasCreds) {
      loadRealData(selectedApp);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApp?.id, hasCreds]);

  const checkCreds = async () => {
    const { data } = await supabase.from('asc_credentials').select('id').maybeSingle();
    setHasCreds(!!data);
  };

  const loadApps = async () => {
    const { data } = await supabase.from('apps').select('*').order('created_at', { ascending: false });
    if (data) {
      const rows = (data ?? []) as App[];
      setApps(rows);
      if (rows.length > 0 && !selectedApp) setSelectedApp(rows[0]);
    }
  };

  const loadRealData = useCallback(async (app: App) => {
    if (!app.asc_app_id) return;
    setRealData((p) => ({ ...p, loading: true, error: null }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const tok = session?.access_token ?? '';
      const ratings = await ascPost('get-ratings', { appId: app.asc_app_id }, tok) as {
        averageRating?: number;
        ratingCount?: number;
        reviews?: Review[];
        error?: string;
      };
      if (ratings.error) {
        setRealData((p) => ({ ...p, loading: false, error: ratings.error ?? null }));
        return;
      }
      setRealData((p) => ({
        ...p,
        loading: false,
        error: null,
        averageRating: ratings.averageRating ?? null,
        ratingCount: ratings.ratingCount ?? null,
        reviews: ratings.reviews ?? [],
      }));
    } catch {
      setRealData((p) => ({ ...p, loading: false, error: 'Failed to load data from App Store Connect.' }));
    }
  }, []);

  const isLive = hasCreds && !!selectedApp?.asc_app_id;

  const stats = [
    {
      label: 'Downloads',
      value: isLive && realData.totalDownloads > 0 ? realData.totalDownloads.toLocaleString() : '—',
      sub: isLive ? 'This month' : 'Connect ASC for real data',
      icon: Download,
      live: isLive,
    },
    {
      label: 'Revenue',
      value: isLive && realData.totalRevenue > 0 ? `$${realData.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—',
      sub: isLive ? 'This month (proceeds)' : 'Connect ASC for real data',
      icon: DollarSign,
      live: isLive,
    },
    {
      label: 'Rating',
      value: isLive && realData.averageRating != null ? realData.averageRating.toFixed(1) : '—',
      sub: isLive && realData.ratingCount != null ? `${realData.ratingCount.toLocaleString()} ratings` : 'Connect ASC for real data',
      icon: Star,
      live: isLive && realData.averageRating != null,
    },
    {
      label: 'Active Apps',
      value: String(apps.length),
      sub: apps.length === 1 ? '1 app tracked' : `${apps.length} apps tracked`,
      icon: Layers,
      live: true,
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Your app performance at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          {apps.length > 0 && (
            <select
              className="text-sm bg-card border border-border/40 rounded-lg px-3 h-9 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={selectedApp?.id ?? ''}
              onChange={(e) => {
                const app = apps.find((a) => a.id === e.target.value) ?? null;
                setSelectedApp(app);
              }}
            >
              {apps.map((app) => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          )}
          {isLive && (
            <Button variant="outline" size="sm" className="h-9" disabled={realData.loading}
              onClick={() => selectedApp && loadRealData(selectedApp)}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${realData.loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          <AddAppDialog onCreated={loadApps} />
        </div>
      </div>

      {apps.length === 0 ? (
        <EmptyState onCreated={loadApps} />
      ) : (
        <>
          {!hasCreds && (
            <div className="flex items-center gap-3 p-4 bg-card border border-border/40 rounded-xl mb-6 text-sm">
              <CircleAlert className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                Connect your App Store Connect API key in{' '}
                <a href="/dashboard/settings" className="underline hover:text-foreground transition-colors">Settings</a>{' '}
                to see real downloads, revenue, and ratings.
              </span>
            </div>
          )}
          {hasCreds && !selectedApp?.asc_app_id && (
            <div className="flex items-center gap-3 p-4 bg-card border border-border/40 rounded-xl mb-6 text-sm">
              <CircleAlert className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                Set the App Store Connect App ID for this app in{' '}
                <a href="/dashboard/apps" className="underline hover:text-foreground transition-colors">My Apps</a>{' '}
                to load real data.
              </span>
            </div>
          )}
          {realData.error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl mb-6 text-sm text-destructive">
              <CircleAlert className="h-4 w-4 shrink-0" />
              {realData.error}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} loading={realData.loading} />
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <ChartCard
              title="Downloads"
              sub={isLive && realData.salesRows.length > 0 ? 'From Sales Reports' : 'Demo data — connect ASC for real'}
              data={isLive && realData.salesRows.length > 0 ? realData.salesRows : DEMO_CHART_DATA}
              dataKey="downloads"
              gradId="downloadGrad"
              isDemo={!(isLive && realData.salesRows.length > 0)}
            />
            <ChartCard
              title="Revenue"
              sub={isLive && realData.salesRows.length > 0 ? 'From Sales Reports (proceeds)' : 'Demo data — connect ASC for real'}
              data={isLive && realData.salesRows.length > 0 ? realData.salesRows : DEMO_CHART_DATA}
              dataKey="revenue"
              gradId="revenueGrad"
              prefix="$"
              isDemo={!(isLive && realData.salesRows.length > 0)}
            />
          </div>

          {isLive && realData.reviews.length > 0 && (
            <div className="bg-card border border-border/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium">Recent Reviews</h3>
                  <p className="text-xs text-muted-foreground">From App Store Connect</p>
                </div>
                {selectedApp?.asc_app_id && (
                  <a
                    href={`https://appstoreconnect.apple.com/apps/${selectedApp.asc_app_id}/appstore/ios/version/deliverable`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all <ExternalLink className="h-3 w-3" />
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
    <div className="bg-card border border-border/40 rounded-xl p-5">
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

function ChartCard({
  title, sub, data, dataKey, gradId, prefix = '', isDemo,
}: {
  title: string;
  sub: string;
  data: { date: string; downloads?: number; revenue?: number }[];
  dataKey: string;
  gradId: string;
  prefix?: string;
  isDemo: boolean;
}) {
  return (
    <div className={`bg-card border rounded-xl p-5 ${isDemo ? 'border-border/40' : 'border-border/60'}`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
        {isDemo && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 border border-border/40 rounded px-1.5 py-0.5">
            Demo
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={isDemo ? 0.06 : 0.15} />
              <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(v: number) => [`${prefix}${v.toLocaleString()}`, title]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="hsl(var(--foreground))"
            strokeWidth={isDemo ? 1 : 1.5}
            strokeOpacity={isDemo ? 0.3 : 1}
            fill={`url(#${gradId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{review.reviewerNickname || 'Anonymous'}</span>
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
      <p className="text-xs text-muted-foreground/50 mt-1.5">{new Date(review.createdDate).toLocaleDateString()}</p>
    </div>
  );
}

function EmptyState({ onCreated }: { onCreated: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl border border-border/40 flex items-center justify-center mb-4">
        <Download className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium mb-2">No apps yet</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Add your first app to start tracking downloads, keywords, and metadata.
      </p>
      <AddAppDialog onCreated={onCreated} />
    </div>
  );
}
