'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { ASC_LOCALES } from '@/lib/aso';
import { Sparkles, RefreshCw, Copy, Check, Smartphone, FileText } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Target = { code: string; label: string };

const labelFor = (code: string) => ASC_LOCALES.find((l) => l.code === code)?.label ?? code;
const flagFor = (code: string) => {
  const c = ASC_LOCALES.find((l) => l.code === code)?.country;
  return c && /^[A-Za-z]{2}$/.test(c) ? c.toUpperCase().replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0))) : '🏳️';
};

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* refusé */ } }}
      className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 px-2.5 py-1 hover:bg-accent transition-colors shrink-0">
      {done ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copié</> : <><Copy className="h-3.5 w-3.5" /> Copier</>}
    </button>
  );
}

// Génère le "Quoi de neuf" d'une version dans toutes les langues de l'app, à
// partir d'un court résumé des changements. Automatique, FR partout.
export default function ReleaseNotesPage() {
  const { selectedApp } = useDashboard();
  const ascAppId = selectedApp?.asc_app_id ?? '';

  const [targets, setTargets] = useState<Target[]>([]);
  const [summary, setSummary] = useState('');
  const [generating, setGenerating] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);

  // Langues = celles que l'app couvre déjà sur l'App Store (sinon FR + EN par défaut).
  const loadLocales = useCallback(async () => {
    if (!ascAppId) { setTargets([{ code: 'fr-FR', label: 'Français' }, { code: 'en-US', label: 'Anglais (US)' }]); return; }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-localizations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: ascAppId }),
      });
      const j = await r.json() as { localizations?: { locale: string }[] };
      const locales = (j.localizations ?? []).map((l) => l.locale);
      if (locales.length) setTargets(locales.map((c) => ({ code: c, label: labelFor(c) })));
      else setTargets([{ code: 'fr-FR', label: 'Français' }, { code: 'en-US', label: 'Anglais (US)' }]);
    } catch {
      setTargets([{ code: 'fr-FR', label: 'Français' }, { code: 'en-US', label: 'Anglais (US)' }]);
    }
  }, [ascAppId]);

  useEffect(() => { loadLocales(); }, [loadLocales]);

  const generate = async () => {
    if (summary.trim().length < 3) { setTopError("Décris d'abord ce qui a changé."); return; }
    setGenerating(true); setTopError(null); setNotes({}); setErrors({});
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/generate-release-notes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, appName: selectedApp?.name ?? '', targetLocales: targets }),
      });
      const j = await r.json() as { notes?: Record<string, string>; errors?: Record<string, string>; error?: string };
      if (j.error) { setTopError(j.error); setGenerating(false); return; }
      setNotes(j.notes ?? {});
      setErrors(j.errors ?? {});
    } catch {
      setTopError('Génération impossible (réseau).');
    }
    setGenerating(false);
  };

  if (!selectedApp) {
    return (
      <div className="p-8">
        <PageHeader title="Notes de version" description="Génère ton « Quoi de neuf » dans toutes tes langues, automatiquement." />
        <EmptyState
          icon={Smartphone}
          title="Ajoute d'abord une app"
          description="Sélectionne une app pour générer ses notes de version localisées."
          action={<a href="/dashboard/settings/apps" className="text-sm text-primary hover:underline">Ouvrir Mes apps →</a>}
        />
      </div>
    );
  }

  const noteEntries = Object.entries(notes);
  const allMarkdown = noteEntries.map(([code, n]) => `## ${labelFor(code)} (${code})\n${n}`).join('\n\n');

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Notes de version"
        description="Décris ce qui a changé, l'IA rédige un « Quoi de neuf » clair et localisé pour chaque langue de ton app."
        actions={noteEntries.length > 0 ? (
          <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(allMarkdown); } catch { /* refusé */ } }}
            className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border/60 px-2.5 py-1 hover:bg-accent transition-colors">
            <Copy className="h-3.5 w-3.5" /> Copier tout
          </button>
        ) : undefined}
      />

      <div className="bg-card border border-border/50 card-pop rounded-xl p-5 mb-6">
        <label className="text-sm font-medium">Qu&apos;est-ce qui a changé dans cette version ?</label>
        <p className="text-xs text-muted-foreground mt-0.5 mb-2">En vrac, dans n&apos;importe quelle langue. Ex : « correction du bug de connexion, nouveau mode sombre, widget plus rapide ».</p>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          placeholder="• ..."
          className="w-full resize-none text-sm bg-background border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">{targets.length} langue{targets.length > 1 ? 's' : ''} : {targets.slice(0, 6).map((t) => t.label).join(', ')}{targets.length > 6 ? '…' : ''}</p>
          <button type="button" onClick={generate} disabled={generating}
            className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-10 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {generating ? <><RefreshCw className="h-4 w-4 animate-spin" /> Génération…</> : <><Sparkles className="h-4 w-4" /> Générer dans mes langues</>}
          </button>
        </div>
        {topError && <p className="text-sm text-destructive mt-3">{topError}</p>}
      </div>

      {noteEntries.length > 0 && (
        <div className="space-y-4">
          {noteEntries.map(([code, n]) => (
            <div key={code} className="bg-card border border-border/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2 gap-3">
                <h3 className="text-sm font-medium inline-flex items-center gap-2"><span aria-hidden>{flagFor(code)}</span> {labelFor(code)} <span className="text-xs text-muted-foreground font-normal">{code}</span></h3>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] tabular-nums ${n.length > 4000 ? 'text-destructive' : 'text-muted-foreground'}`}>{n.length}/4000</span>
                  <CopyButton text={n} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{n}</p>
            </div>
          ))}
          {Object.entries(errors).map(([code, e]) => (
            <div key={code} className="text-xs text-destructive">{labelFor(code)} : {e}</div>
          ))}
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Copie-colle chaque note dans le champ « Nouveautés » de ta version dans App Store Connect.
          </p>
        </div>
      )}
    </div>
  );
}
