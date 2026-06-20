'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { ASC_LOCALES } from '@/lib/aso';
import { getCache, setCache } from '@/lib/cache';
import { Globe, Lock, Check, Plus, RefreshCw, ArrowRight } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const flagEmoji = (country: string) =>
  /^[A-Za-z]{2}$/.test(country)
    ? country.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    : '🏳️';

type Payload = { versionState: string; editable: boolean; localizations: { locale: string }[] };

// Vue d'ensemble de la couverture des langues App Store (distincte de l'éditeur
// App Store Page) : combien de marchés sont couverts, lesquels manquent, et où
// agir. 100% sur la vraie donnée ASC (action edge get-localizations).
export default function LocalizationPage() {
  const { selectedApp } = useDashboard();
  const ascAppId = selectedApp?.asc_app_id ?? '';

  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ascAppId) { setData(null); return; }
    const key = `loc-coverage:${ascAppId}`;
    const cached = getCache<Payload>(key);
    if (cached) setData(cached);
    setLoading(!cached);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-localizations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: ascAppId }),
      });
      const j = await r.json() as Payload & { error?: string };
      if (j.error) setError(j.error);
      else { setData(j); setCache(key, j); }
    } catch {
      setError('Connexion à App Store Connect impossible. Vérifie tes identifiants ASC.');
    }
    setLoading(false);
  }, [ascAppId]);

  useEffect(() => { load(); }, [load]);

  if (!ascAppId) {
    return (
      <div className="p-8">
        <PageHeader title="Localisation" description="Ta couverture de langues App Store, en un coup d'œil." />
        <EmptyState
          icon={Lock}
          title="Connecte App Store Connect"
          description="Connecte ta clé API et sélectionne une app avec son App ID pour voir tes langues couvertes et celles qui te manquent."
          action={<a href="/app/settings/app-store-connect" className="text-sm text-primary hover:underline">Aller aux réglages →</a>}
        />
      </div>
    );
  }

  const covered = new Set((data?.localizations ?? []).map((l) => l.locale));
  const coveredList = ASC_LOCALES.filter((l) => covered.has(l.code));
  const missingList = ASC_LOCALES.filter((l) => !covered.has(l.code));
  const total = ASC_LOCALES.length;
  const coveredCount = coveredList.length;
  const pct = total ? Math.round((coveredCount / total) * 100) : 0;
  const published = data?.versionState === 'READY_FOR_SALE';

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Localisation"
        description="Ta couverture de langues App Store, en un coup d'œil. Édite et publie chaque langue depuis la page App Store."
        actions={
          <Link href="/app/metadata" className="inline-flex items-center gap-1.5 text-sm rounded-lg px-3 h-9 bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
            Éditer les langues <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive mb-6">{error}</div>
      )}

      {loading && !data ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin inline mr-2" /> Chargement de tes langues…
        </div>
      ) : (
        <>
          {/* Résumé couverture */}
          <div className="bg-card border border-border/50 card-pop rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
              <div>
                <p className="text-sm font-medium">Couverture des langues</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {coveredCount} / {total} langues App Store · {missingList.length} à ajouter
                  {data ? <> · <span className={published ? 'text-emerald-600' : 'text-amber-600'}>{published ? 'Version publiée' : 'Version en préparation'}</span></> : null}
                </p>
              </div>
              <span className="text-2xl font-semibold tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-accent overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(pct, 2)}%` }} />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Couvertes */}
            <div className="bg-card border border-border/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Check className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-medium">Langues couvertes ({coveredCount})</h3>
              </div>
              {coveredCount === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune langue encore. Commence par ta langue principale dans la page App Store.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {coveredList.map((l) => (
                    <span key={l.code} className="inline-flex items-center gap-1.5 text-xs rounded-full border border-border/50 bg-background px-2.5 py-1">
                      <span aria-hidden>{flagEmoji(l.country)}</span> {l.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Manquantes */}
            <div className="bg-card border border-border/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">Marchés à conquérir ({missingList.length})</h3>
                </div>
                {missingList.length > 0 && (
                  <Link href="/app/metadata" className="text-xs text-primary hover:underline whitespace-nowrap">Générer avec l&apos;IA →</Link>
                )}
              </div>
              {missingList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bravo, tu couvres toutes les langues App Store.</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-3">Chaque langue ajoutée te rend visible sur un nouveau marché. La page App Store génère et publie ta fiche traduite en 1 clic.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingList.map((l) => (
                      <span key={l.code} className="inline-flex items-center gap-1.5 text-xs rounded-full border border-dashed border-border/60 text-muted-foreground px-2.5 py-1">
                        <span aria-hidden>{flagEmoji(l.country)}</span> {l.label}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
