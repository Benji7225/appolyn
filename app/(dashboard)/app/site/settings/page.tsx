'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { Globe, RefreshCw, Check, ExternalLink, Power } from 'lucide-react';

// La table published_sites n'est pas dans les types générés : accès non typé.
const db = supabase as unknown as { from: (t: string) => any };

type Overrides = { title?: string; tagline?: string; description?: string; accent?: string };
type Row = { slug: string; active: boolean; overrides: Overrides | null };

// Couleurs d'accent proposées (sobres), + un sélecteur libre.
const ACCENTS = ['#2563eb', '#16a34a', '#7c3aed', '#db2777', '#ea580c', '#0891b2', '#111827'];

// Réglages du site : on/off + personnalisation (textes + couleur d'accent), au-dessus
// du contenu auto généré depuis la fiche App Store. Le dev garde la main, sans repartir
// de zéro : vide = on reprend automatiquement la vraie fiche.
export default function SiteSettingsPage() {
  const { selectedApp } = useDashboard();
  const [row, setRow] = useState<Row | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(true);
  const [ov, setOv] = useState<Overrides>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoaded(false); setRow(null);
    if (!selectedApp?.id) { setLoaded(true); return; }
    const { data } = await db.from('published_sites').select('slug, active, overrides').eq('app_id', selectedApp.id).maybeSingle();
    if (data) {
      setRow(data as Row);
      setActive(data.active !== false);
      setOv((data.overrides ?? {}) as Overrides);
    }
    setLoaded(true);
  }, [selectedApp?.id]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!selectedApp?.id || !row) return;
    setSaving(true); setSaved(false);
    // On ne garde que les overrides réellement remplis (vide = reprend la vraie fiche).
    const clean: Overrides = {};
    if (ov.title?.trim()) clean.title = ov.title.trim();
    if (ov.tagline?.trim()) clean.tagline = ov.tagline.trim();
    if (ov.description?.trim()) clean.description = ov.description.trim();
    if (ov.accent) clean.accent = ov.accent;
    const { error } = await db.from('published_sites')
      .update({ active, overrides: Object.keys(clean).length ? clean : null, updated_at: new Date().toISOString() })
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

  if (!selectedApp?.id) {
    return (
      <div className="p-8">
        <PageHeader title="Réglages du site" description="Active, désactive et personnalise le site public de ton app." />
        <EmptyState icon={Globe} title="Sélectionne une app" description="Choisis une app pour régler son site." />
      </div>
    );
  }

  return (
    <div className="p-8 scrollbar-macos max-w-2xl">
      <PageHeader title="Réglages du site" description="Active, désactive et personnalise le site public de ton app. Laisse un champ vide pour reprendre automatiquement ta vraie fiche App Store." />

      {!loaded ? (
        <div className="rounded-xl border border-border/40 bg-card p-10 text-center text-sm text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin inline mr-2" /> Chargement…</div>
      ) : !row ? (
        <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">Tu n&apos;as pas encore publié de site pour cette app.</p>
          <Link href="/app/site" className="text-sm text-primary hover:underline">Aller à la Vue d&apos;ensemble pour publier →</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* On/off */}
          <div className="rounded-xl border border-border/50 bg-card p-5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-medium inline-flex items-center gap-2"><Power className="h-4 w-4 text-muted-foreground" /> Site en ligne</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {active
                  ? <>En ligne sur <a href={`https://appolyn.io/site/${row.slug}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">appolyn.io/site/{row.slug}</a></>
                  : 'Désactivé : le site n\'est plus accessible publiquement.'}
              </p>
            </div>
            <button onClick={() => setActive((a) => !a)} role="switch" aria-checked={active}
              className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${active ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${active ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Personnalisation des textes */}
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <h3 className="text-sm font-medium">Personnalise les textes</h3>
            <Field label="Titre" placeholder="Repris de ta fiche App Store" value={ov.title ?? ''} onChange={(v) => setOv((o) => ({ ...o, title: v }))} />
            <Field label="Accroche (sous le titre)" placeholder="Repris de ta description App Store" value={ov.tagline ?? ''} onChange={(v) => setOv((o) => ({ ...o, tagline: v }))} />
            <Field label="Description" placeholder="Reprise de ta fiche App Store" value={ov.description ?? ''} onChange={(v) => setOv((o) => ({ ...o, description: v }))} textarea />
          </div>

          {/* Couleur d'accent */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-medium mb-3">Couleur d&apos;accent</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {ACCENTS.map((c) => (
                <button key={c} onClick={() => setOv((o) => ({ ...o, accent: c }))} aria-label={c}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${ov.accent === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <label className="h-8 w-8 rounded-full border border-border overflow-hidden cursor-pointer relative" title="Couleur libre">
                <input type="color" value={ov.accent ?? '#2563eb'} onChange={(e) => setOv((o) => ({ ...o, accent: e.target.value }))} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">+</span>
              </label>
              {ov.accent && (
                <button onClick={() => setOv((o) => ({ ...o, accent: undefined }))} className="text-xs text-muted-foreground hover:text-foreground ml-1">Par défaut</button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
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

function Field({ label, value, onChange, placeholder, textarea }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4}
          className="mt-1 w-full text-sm bg-background border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring resize-y" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="mt-1 w-full text-sm bg-background border border-input rounded-lg px-3 h-9 focus:outline-none focus:ring-1 focus:ring-ring" />
      )}
    </label>
  );
}
