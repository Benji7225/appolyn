'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader, StatCard, EmptyState } from '@/components/dashboard/shell';
import { RefreshCw, Lock } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type SalesRow = { date: string; downloads: number; revenue: number };

function fmtMoney(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

// Lightweight daily bars (no chart lib) — pure real data.
function DailyBars({ rows, field }: { rows: SalesRow[]; field: 'revenue' | 'downloads' }) {
  const max = Math.max(1, ...rows.map((r) => r[field]));
  return (
    <div className="flex items-end gap-[3px] h-28">
      {rows.map((r) => (
        <div
          key={r.date}
          title={`${r.date} · ${field === 'revenue' ? fmtMoney(r.revenue) : r.downloads}`}
          className="flex-1 bg-primary/80 hover:bg-primary rounded-sm transition-colors"
          style={{ height: `${Math.max(2, (r[field] / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [hasCreds, setHasCreds] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SalesRow[]>([]);
  const [totals, setTotals] = useState<{ downloads: number; revenue: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data: creds } = await supabase.from('asc_credentials').select('id').maybeSingle();
    setHasCreds(!!creds);
    if (creds) loadSales();
  };

  const loadSales = async () => {
    setLoading(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-sales`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const json = await r.json() as { rows?: SalesRow[]; totalDownloads?: number; totalRevenue?: number; error?: string };
      if (json.error) { setError(json.error); }
      else {
        setRows(json.rows ?? []);
        setTotals({ downloads: json.totalDownloads ?? 0, revenue: json.totalRevenue ?? 0 });
      }
    } catch {
      setError('Connexion à App Store Connect impossible.');
    }
    setLoading(false);
  };

  if (hasCreds === false) {
    return (
      <div className="p-8 max-w-5xl">
        <PageHeader title="Analytics" description="Tes revenus, abonnements et acquisition, en données réelles." />
        <EmptyState
          icon={Lock}
          title="Connecte App Store Connect"
          description="Ajoute ta clé API App Store Connect et ton numéro de vendeur dans les réglages pour charger tes vraies ventes, revenus et abonnements. Aucune donnée n'est inventée."
          action={<a href="/dashboard/settings" className="text-sm text-primary hover:underline">Aller aux réglages</a>}
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl scrollbar-macos">
      <PageHeader
        title="Analytics"
        description="Revenus et acquisition sur 30 jours, depuis tes rapports App Store réels."
        actions={
          <button
            onClick={loadSales}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
        }
      />

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">{error}</div>
      )}

      {/* Revenue / Acquisition */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Revenu (30 j)" value={totals ? fmtMoney(totals.revenue) : '—'} hint="Proceeds développeur" />
        <StatCard label="Téléchargements (30 j)" value={totals ? totals.downloads.toLocaleString('fr-FR') : '—'} />
        <StatCard label="MRR" value="—" hint="Abonnements : arrive avec tes premiers abonnés" />
        <StatCard label="Churn" value="—" hint="Abonnements : arrive avec tes premiers abonnés" />
      </div>

      {/* Daily revenue */}
      <div className="rounded-xl border border-border/50 bg-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Revenu journalier</h2>
          <span className="text-xs text-muted-foreground">{rows.length} jours avec données</span>
        </div>
        {rows.length > 0 ? (
          <DailyBars rows={rows} field="revenue" />
        ) : (
          <p className="text-sm text-muted-foreground py-10 text-center">
            {loading ? 'Chargement...' : 'Aucune vente sur les 30 derniers jours pour le moment. Les barres se rempliront dès tes premières ventes.'}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground/70">
        Bientôt ici : MRR / ARR, revenu par pays et par plateforme, rétention (renouvellements, annulations) et carte mondiale des ventes, tout en données réelles.
      </p>
    </div>
  );
}
