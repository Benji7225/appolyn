'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { EmptyState } from '@/components/dashboard/shell';
import { PAGE_DEFS, effectivePage, type SitePages } from '@/lib/site-pages';
import { Globe, RefreshCw, Check, ExternalLink } from 'lucide-react';

const db = supabase as unknown as { from: (t: string) => any };

type Row = { slug: string; pages: SitePages | null; content: { title?: string; sellerName?: string; description?: string } | null; overrides: { contactEmail?: string } | null };
type Editable = Record<string, { active: boolean; title: string; body: string }>;

// Pages annexes du site (FAQ, contact, légales…) : préfaites + éditables, activables
// une par une, PERSISTÉES (pas de régénération auto). Servies sur le site public.
export default function SitePagesEditor() {
  const { selectedApp } = useDashboard();
  const [row, setRow] = useState<Row | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<Editable>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoaded(false); setRow(null);
    if (!selectedApp?.id) { setLoaded(true); return; }
    const { data } = await db.from('published_sites').select('slug, pages, content, overrides').eq('app_id', selectedApp.id).maybeSingle();
    if (data) {
      setRow(data as Row);
      const { data: { user } } = await supabase.auth.getUser();
      const email = (data.overrides?.contactEmail as string | undefined) || user?.email || undefined;
      const ctx = { name: (data.content?.title as string) || selectedApp.name || 'ton app', seller: data.content?.sellerName as string | undefined, description: data.content?.description as string | undefined, email };
      const init: Editable = {};
      for (const def of PAGE_DEFS) {
        const eff = effectivePage(def.key, data.pages as SitePages | null, ctx)!;
        init[def.key] = { active: eff.active, title: eff.title, body: eff.body };
      }
      setState(init);
    }
    setLoaded(true);
  }, [selectedApp?.id, selectedApp?.name]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!selectedApp?.id || !row) return;
    setSaving(true); setSaved(false);
    const { error } = await db.from('published_sites')
      .update({ pages: state, updated_at: new Date().toISOString() })
      .eq('app_id', selectedApp.id);
    if (!error) {
      setSaved(true); setTimeout(() => setSaved(false), 1800);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch('/api/revalidate-site', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: row.slug }),
        });
      } catch { /* le cache court prendra le relais */ }
    }
    setSaving(false);
  };

  const set = (key: string, patch: Partial<{ active: boolean; title: string; body: string }>) =>
    setState((s) => ({ ...s, [key]: { ...s[key], ...patch } }));

  if (!selectedApp?.id) {
    return <EmptyState icon={Globe} title="Sélectionne une app" description="Choisis une app pour éditer ses pages." />;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5">Des pages prêtes à l&apos;emploi (FAQ, contact, légales), pré-remplies depuis ta fiche. Elles sont actives par défaut : relis, adapte, et désactive celles que tu ne veux pas.</p>

      {!loaded ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin inline mr-2" /> Chargement…</div>
      ) : !row ? (
        <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">Tu n&apos;as pas encore publié de site pour cette app.</p>
          <Link href="/app/site" className="text-sm text-primary hover:underline">Aller à la Vue d&apos;ensemble pour publier →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {PAGE_DEFS.map((def) => {
            const v = state[def.key];
            if (!v) return null;
            return (
              <div key={def.key} className="rounded-xl border border-border/50 bg-card p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium">{def.label}</h3>
                    {v.active && row.slug && (
                      <a href={`https://appolyn.io/site/${row.slug}/${def.key}`} target="_blank" rel="noreferrer"
                        className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                        appolyn.io/site/{row.slug}/{def.key} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <button onClick={() => set(def.key, { active: !v.active })} role="switch" aria-checked={v.active}
                    className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${v.active ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${v.active ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
                {v.active && (
                  <div className="space-y-2.5">
                    <input value={v.title} onChange={(e) => set(def.key, { title: e.target.value })}
                      className="w-full text-sm font-medium bg-background border border-input rounded-lg px-3 h-9 focus:outline-none focus:ring-1 focus:ring-ring" />
                    <textarea value={v.body} onChange={(e) => set(def.key, { body: e.target.value })} rows={7}
                      className="w-full text-[13px] bg-background border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring resize-y leading-relaxed" />
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-3 sticky bottom-0 bg-background/80 backdrop-blur py-3">
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-2 text-sm rounded-lg px-4 h-9 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
              {saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Enregistrement…</> : saved ? <><Check className="h-4 w-4" /> Enregistré</> : 'Enregistrer'}
            </button>
            <a href={`https://appolyn.io/site/${row.slug}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="h-4 w-4" /> Voir le site
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
