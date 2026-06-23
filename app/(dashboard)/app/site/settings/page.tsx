'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { EmptyState } from '@/components/dashboard/shell';
import type { SiteSection } from '@/lib/site-pages';
import { Globe, RefreshCw, Check, ExternalLink, Power, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

// La table published_sites n'est pas dans les types générés : accès non typé.
const db = supabase as unknown as { from: (t: string) => any };

type Overrides = { title?: string; tagline?: string; description?: string; accent?: string; domain?: string; heroImage?: string; contactEmail?: string; sections?: SiteSection[] };
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
  const [domBusy, setDomBusy] = useState(false);
  const [domStatus, setDomStatus] = useState<{ verified: boolean; records: { type: string; name: string; value: string }[]; domain: string } | null>(null);
  const [domError, setDomError] = useState('');

  const load = useCallback(async () => {
    setLoaded(false); setRow(null);
    if (!selectedApp?.id) { setLoaded(true); return; }
    const { data } = await db.from('published_sites').select('slug, active, overrides').eq('app_id', selectedApp.id).maybeSingle();
    if (data) {
      setRow(data as Row);
      setActive(data.active !== false);
      const o = (data.overrides ?? {}) as Overrides;
      // Pré-remplit l'email de contact avec celui du compte (pas de « [à compléter] »).
      if (!o.contactEmail) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) o.contactEmail = user.email;
      }
      setOv(o);
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
    if (ov.contactEmail?.trim()) clean.contactEmail = ov.contactEmail.trim();
    if (ov.heroImage?.trim()) clean.heroImage = ov.heroImage.trim().replace(/^http:\/\//, 'https://');
    if (ov.domain?.trim()) clean.domain = ov.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const cleanSections = (ov.sections ?? [])
      .map((s) => ({ id: s.id, title: (s.title ?? '').trim(), body: (s.body ?? '').trim(), image: (s.image ?? '').trim() || undefined }))
      .filter((s) => s.title || s.body);
    if (cleanSections.length) clean.sections = cleanSections;
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

  // Connexion d'un domaine perso : ajoute le domaine au projet (Vercel) + renvoie les
  // DNS à poser + le statut de vérif. Le middleware sert ensuite le site dessus.
  const callDomain = async (action: 'add' | 'status' | 'remove') => {
    if (!selectedApp?.id) return;
    setDomBusy(true); setDomError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/site/domain', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: selectedApp.id, domain: ov.domain ?? '', action }),
      });
      const j = await r.json();
      if (!r.ok) { setDomError(j.error ?? 'Erreur.'); setDomBusy(false); return; }
      if (action === 'remove') { setDomStatus(null); setOv((o) => ({ ...o, domain: '' })); }
      else { setDomStatus({ verified: !!j.verified, records: j.records ?? [], domain: j.domain }); setOv((o) => ({ ...o, domain: j.domain ?? o.domain })); }
    } catch { setDomError('Connexion impossible.'); }
    setDomBusy(false);
  };

  // Au chargement, si un domaine est déjà branché, on récupère son statut.
  useEffect(() => {
    if (loaded && ov.domain && !domStatus && !domBusy) callDomain('status');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Sections de contenu libres (titre + texte + image) sur l'accueil du site.
  const sections = ov.sections ?? [];
  const setSections = (next: SiteSection[]) => setOv((o) => ({ ...o, sections: next }));
  const addSection = () => setSections([...sections, { id: crypto.randomUUID?.() ?? String(Date.now()), title: '', body: '', image: '' }]);
  const updateSection = (id: string, patch: Partial<SiteSection>) => setSections(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSection = (id: string) => setSections(sections.filter((s) => s.id !== id));
  const moveSection = (id: string, dir: -1 | 1) => {
    const i = sections.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
  };

  if (!selectedApp?.id) {
    return <EmptyState icon={Globe} title="Sélectionne une app" description="Choisis une app pour régler son site." />;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5">Active, désactive et personnalise ton site. Laisse un champ vide pour reprendre automatiquement ta vraie fiche App Store.</p>

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

          {/* Email de contact (pré-rempli) : alimente les pages Contact + Confidentialité */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-medium mb-1">Email de contact</h3>
            <p className="text-xs text-muted-foreground mb-3">Utilisé sur tes pages Contact et Confidentialité (au lieu d&apos;un « à compléter »). Pré-rempli avec l&apos;email de ton compte, modifiable.</p>
            <input type="email" value={ov.contactEmail ?? ''} onChange={(e) => setOv((o) => ({ ...o, contactEmail: e.target.value }))} placeholder="contact@monapp.com"
              className="w-full max-w-md text-sm bg-background border border-input rounded-lg px-3 h-9 focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>

          {/* Image d'accueil */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-medium mb-1">Image d&apos;accueil</h3>
            <p className="text-xs text-muted-foreground mb-3">Par défaut, l&apos;accueil montre un visuel de marque (icône + nom de ton app sur ta couleur). Tu peux mettre ta propre image (bannière, mockup, visuel produit) en collant son adresse. Tes captures d&apos;écran, elles, s&apos;affichent dans la galerie « Aperçu » plus bas.</p>
            <input value={ov.heroImage ?? ''} onChange={(e) => setOv((o) => ({ ...o, heroImage: e.target.value }))} placeholder="https://…/mon-image.png"
              className="w-full max-w-md text-sm bg-background border border-input rounded-lg px-3 h-9 focus:outline-none focus:ring-1 focus:ring-ring" />
            {ov.heroImage?.trim() && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ov.heroImage} alt="Aperçu" className="mt-3 h-28 rounded-lg border border-border/40 object-cover" />
            )}
          </div>

          {/* Sections de contenu libres (SEO + storytelling) */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-medium mb-1">Sections de ta page d&apos;accueil</h3>
            <p className="text-xs text-muted-foreground mb-4">Ajoute tes propres sections (titre + texte + image) sur l&apos;accueil de ton site. Idéal pour le référencement Google et pour raconter ton app au-delà de la fiche App Store.</p>
            {sections.length > 0 && (
              <div className="space-y-4 mb-4">
                {sections.map((s, i) => (
                  <div key={s.id} className="rounded-lg border border-border/50 bg-background p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Section {i + 1}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveSection(s.id, -1)} disabled={i === 0} title="Monter" className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button onClick={() => moveSection(s.id, 1)} disabled={i === sections.length - 1} title="Descendre" className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                        <button onClick={() => removeSection(s.id)} title="Supprimer" className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <input value={s.title} onChange={(e) => updateSection(s.id, { title: e.target.value })} placeholder="Titre de la section"
                      className="w-full text-sm font-medium bg-card border border-input rounded-lg px-3 h-9 focus:outline-none focus:ring-1 focus:ring-ring" />
                    <textarea value={s.body} onChange={(e) => updateSection(s.id, { body: e.target.value })} placeholder="Ton texte. Sépare tes paragraphes par une ligne vide." rows={4}
                      className="w-full text-sm bg-card border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring resize-y" />
                    <input value={s.image ?? ''} onChange={(e) => updateSection(s.id, { image: e.target.value })} placeholder="Image (URL, optionnel)"
                      className="w-full text-sm bg-card border border-input rounded-lg px-3 h-9 focus:outline-none focus:ring-1 focus:ring-ring" />
                    {s.image?.trim() && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image} alt="" className="h-24 rounded-lg border border-border/40 object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
            <button onClick={addSection} className="inline-flex items-center gap-1.5 text-sm rounded-lg px-3 h-9 border border-border hover:bg-accent transition-colors">
              <Plus className="h-4 w-4" /> Ajouter une section
            </button>
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

          {/* Domaine personnalisé : connexion RÉELLE (ajout au projet + DNS + vérif). */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="text-sm font-medium mb-1">Domaine personnalisé</h3>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Aujourd&apos;hui ton site est sur <span className="font-medium text-foreground">appolyn.io/site/{row.slug}</span>. Branche ton propre domaine (ex. monapp.com) : entre-le, pose l&apos;enregistrement DNS indiqué chez ton hébergeur, c&apos;est tout. Le HTTPS est automatique.
            </p>
            <div className="flex items-center gap-2 max-w-md">
              <input value={ov.domain ?? ''} onChange={(e) => setOv((o) => ({ ...o, domain: e.target.value }))} placeholder="monapp.com"
                className="flex-1 text-sm bg-background border border-input rounded-lg px-3 h-9 focus:outline-none focus:ring-1 focus:ring-ring" />
              <button onClick={() => callDomain('add')} disabled={domBusy || !ov.domain?.trim()}
                className="inline-flex items-center gap-1.5 text-sm rounded-lg px-3.5 h-9 bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0">
                {domBusy ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Connecter'}
              </button>
            </div>
            {domError && <p className="text-[11px] text-destructive mt-2">{domError}</p>}
            {domStatus && (
              <div className="mt-4 rounded-lg border border-border/50 bg-background p-4 space-y-3 max-w-md">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{domStatus.domain}</span>
                  {domStatus.verified
                    ? <span className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-emerald-500/15 text-emerald-600 inline-flex items-center gap-1 shrink-0"><Check className="h-3 w-3" /> Vérifié, en ligne</span>
                    : <span className="text-[11px] font-medium rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-600 shrink-0">En attente du DNS</span>}
                </div>
                {!domStatus.verified && domStatus.records.length > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Ajoute ce(s) enregistrement(s) chez ton hébergeur de domaine :</p>
                    <div className="space-y-1">
                      {domStatus.records.map((rec, i) => (
                        <div key={i} className="grid grid-cols-[auto_1fr] gap-x-3 text-[11px] font-mono bg-muted/40 rounded px-2 py-1">
                          <span className="text-muted-foreground">{rec.type}</span>
                          <span className="truncate">{rec.name} → {rec.value}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground/70 mt-1.5">La propagation peut prendre quelques minutes à quelques heures.</p>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => callDomain('status')} disabled={domBusy} className="text-[12px] font-medium text-muted-foreground border border-border hover:bg-accent rounded-md px-2.5 py-1 transition-colors disabled:opacity-50">Vérifier</button>
                  <button onClick={() => callDomain('remove')} disabled={domBusy} className="text-[12px] font-medium text-destructive/80 hover:text-destructive border border-border hover:bg-accent rounded-md px-2.5 py-1 transition-colors disabled:opacity-50">Retirer</button>
                </div>
              </div>
            )}
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
