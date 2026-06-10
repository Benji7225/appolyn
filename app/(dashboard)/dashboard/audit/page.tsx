'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Gauge, TriangleAlert, Lightbulb, CircleCheck as CheckCircle2, RefreshCw } from 'lucide-react';
import { auditMetadata, localeLabelForCountry, ASC_LOCALES, type AuditResult } from '@/lib/aso';
import { useDashboard } from '@/lib/app-context';

type LocaleRow = {
  country_code: string;
  title: string;
  subtitle: string;
  keywords: string;
  description: string;
  promotional_text: string;
};

type Audited = LocaleRow & AuditResult;

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function scoreRing(score: number) {
  if (score >= 80) return 'border-emerald-400/40';
  if (score >= 50) return 'border-amber-400/40';
  return 'border-red-400/40';
}

export default function AuditPage() {
  const { apps, selectedApp } = useDashboard();
  const [rows, setRows] = useState<Audited[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAudit = useCallback(async (appId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('app_localizations')
      .select('country_code,title,subtitle,keywords,description,promotional_text')
      .eq('app_id', appId)
      .eq('is_current', true);
    const localeRows = (data ?? []) as LocaleRow[];
    const audited = localeRows
      .map((r) => ({ ...r, ...auditMetadata(r) }))
      .sort((a, b) => a.score - b.score); // worst first, most actionable
    setRows(audited);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedApp) loadAudit(selectedApp.id);
    else setRows([]);
  }, [selectedApp?.id, loadAudit]); // eslint-disable-line react-hooks/exhaustive-deps

  const overall = rows.length > 0 ? Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length) : null;
  const totalFindings = rows.reduce((a, r) => a + r.findings.length, 0);
  const totalWarnings = rows.reduce((a, r) => a + r.findings.filter((f) => f.severity === 'warning').length, 0);

  if (apps.length === 0) {
    return (
      <div className="p-8">
        <Header />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl border border-border/40 flex items-center justify-center mb-4">
            <Gauge className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium mb-2">No apps yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs">Add an app from the Overview page to audit its metadata.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <Header />
        <button
          onClick={() => selectedApp && loadAudit(selectedApp.id)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border/40 rounded-lg px-3 h-9 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Re-audit
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl border border-border/40 flex items-center justify-center mb-4">
            <Gauge className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium mb-2">No metadata to audit yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Add or generate metadata in the{' '}
            <a href="/dashboard/metadata" className="underline hover:text-foreground">Metadata editor</a>, then come back here for an ASO score and concrete fixes.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className={`bg-card border rounded-xl p-5 ${overall != null ? scoreRing(overall) : 'border-border/40'}`}>
              <span className="text-sm text-muted-foreground">Average score</span>
              <div className={`text-3xl font-semibold tracking-tight mt-1 ${overall != null ? scoreColor(overall) : ''}`}>
                {overall}<span className="text-base text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="bg-card border border-border/40 rounded-xl p-5">
              <span className="text-sm text-muted-foreground">Languages audited</span>
              <div className="text-3xl font-semibold tracking-tight mt-1">
                {rows.length}<span className="text-base text-muted-foreground">/{ASC_LOCALES.length}</span>
              </div>
            </div>
            <div className="bg-card border border-border/40 rounded-xl p-5">
              <span className="text-sm text-muted-foreground">Issues found</span>
              <div className="text-3xl font-semibold tracking-tight mt-1">
                {totalFindings}
                {totalWarnings > 0 && <span className="text-base text-amber-400"> · {totalWarnings} key</span>}
              </div>
            </div>
          </div>

          {/* Per-locale audit */}
          <div className="space-y-4">
            {rows.map((r) => (
              <div key={r.country_code} className="bg-card border border-border/40 rounded-xl p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium">{localeLabelForCountry(r.country_code)}</h3>
                    <p className="text-xs text-muted-foreground truncate">{r.title || '(no title)'}</p>
                  </div>
                  <div className={`shrink-0 text-2xl font-semibold tabular-nums ${scoreColor(r.score)}`}>
                    {r.score}<span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>

                {r.findings.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    No issues found, this listing is well optimized.
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {r.findings.map((finding, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        {finding.severity === 'warning'
                          ? <TriangleAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          : <Lightbulb className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />}
                        <span className="text-sm text-muted-foreground leading-relaxed">{finding.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">ASO Audit</h1>
      <p className="text-sm text-muted-foreground mt-1">Real, actionable checks on your App Store metadata, per language.</p>
    </div>
  );
}
