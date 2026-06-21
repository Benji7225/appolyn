'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Check, RefreshCw, Sparkles, CircleCheck as CheckCircle2 } from 'lucide-react';

type Sub = {
  status: string;
  plan: string | null;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  comp: boolean;
};

const ACTIVE = new Set(['active', 'trialing', 'ghost']);

export default function BillingPage() {
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await supabase.from('subscriptions').select('status,plan,cancel_at_period_end,current_period_end,comp').maybeSingle();
    setSub((data as Sub | null) ?? null);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const go = async (path: string, body?: object) => {
    setError(''); setBusy(path);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(path, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const j = await r.json() as { url?: string; error?: string };
      if (j.url) { window.location.href = j.url; return; }
      setError(j.error ?? 'Action impossible.');
    } catch { setError('Réseau indisponible.'); }
    setBusy(null);
  };

  // Retention flow: 0 closed, 1 discount, 2 pause, 3 confirm cancel.
  const [step, setStep] = useState(0);
  const [rMsg, setRMsg] = useState('');
  const retention = async (action: string) => {
    setError(''); setBusy('retention');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/billing/retention', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const j = await r.json() as { ok?: boolean; message?: string; error?: string };
      if (j.error) { setError(j.error); setBusy(null); return; }
      setRMsg(j.message ?? ''); setStep(0); setBusy(null);
      await load();
    } catch { setError('Réseau indisponible.'); setBusy(null); }
  };

  const active = sub && (sub.comp || ACTIVE.has(sub.status));

  if (loading) return <p className="text-sm text-muted-foreground">Chargement de l&apos;abonnement...</p>;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-sm font-medium">Abonnement</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Gère ton accès à Appolyn.</p>
      </div>

      {active ? (
        <div className="rounded-xl border border-border/40 bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-sm font-medium">
              {sub!.comp ? 'Accès complet (offert)' : sub!.plan === 'annual' ? 'Plan annuel actif' : sub!.plan === 'ghost' ? 'Compte en pause' : 'Plan mensuel actif'}
            </p>
          </div>
          {sub!.current_period_end && !sub!.comp && (
            <p className="text-xs text-muted-foreground">
              {sub!.cancel_at_period_end ? 'Se termine le ' : 'Prochain renouvellement le '}
              {new Date(sub!.current_period_end).toLocaleDateString('fr-FR')}.
            </p>
          )}
          {sub!.comp && <p className="text-xs text-muted-foreground">Compte interne, accès illimité.</p>}
          {!sub!.comp && (
            <div className="flex items-center gap-3 mt-4">
              <Button variant="outline" size="sm" className="h-9" disabled={busy === '/api/billing/portal'} onClick={() => go('/api/billing/portal')}>
                {busy === '/api/billing/portal' ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Ouverture...</> : 'Gérer mon abonnement'}
              </Button>
              {!sub!.cancel_at_period_end && (
                <button onClick={() => { setRMsg(''); setStep(1); }} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                  Résilier
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <PlanCard
            title="Mensuel"
            price="20€"
            period="/mois"
            highlight="7 jours gratuits"
            features={['Mots-clés et opportunités', 'Fiche App Store optimisée + publiée', 'Concurrents, avis, analytics']}
            cta="Démarrer l'essai gratuit"
            busy={busy === 'monthly'}
            onClick={() => { setBusy('monthly'); go('/api/billing/checkout', { plan: 'monthly' }); }}
          />
          <PlanCard
            title="Annuel"
            price="200€"
            period="/an"
            highlight="2 mois offerts"
            features={['Tout le plan mensuel', 'Économise ~40€/an', 'Un seul paiement']}
            cta="Choisir l'annuel"
            busy={busy === 'annual'}
            onClick={() => { setBusy('annual'); go('/api/billing/checkout', { plan: 'annual' }); }}
          />
        </div>
      )}

      {rMsg && <p className="text-xs text-emerald-600 mt-4">{rMsg}</p>}
      {error && <p className="text-xs text-destructive mt-4">{error}</p>}
      <p className="text-[11px] text-muted-foreground/70 mt-4">Essai gratuit 7 jours, carte requise. Paiement sécurisé par Stripe. Annulable à tout moment.</p>

      {step > 0 && (
        <RetentionModal
          step={step}
          busy={busy === 'retention'}
          onDiscount={() => retention('discount')}
          onPause={() => retention('pause')}
          onCancel={() => retention('cancel')}
          onNext={() => setStep((s) => s + 1)}
          onClose={() => setStep(0)}
        />
      )}
    </div>
  );
}

// Retention sequence shown when an active user clicks "Résilier": one decision at
// a time — keep with a discount, then pause cheaply, then confirm what they lose.
function RetentionModal({ step, busy, onDiscount, onPause, onCancel, onNext, onClose }: {
  step: number; busy: boolean;
  onDiscount: () => void; onPause: () => void; onCancel: () => void; onNext: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6">
        {step === 1 && (
          <>
            <h3 className="text-base font-semibold">Avant de partir...</h3>
            <p className="text-sm text-muted-foreground mt-2">Reste avec Appolyn à <strong>moitié prix pendant 3 mois</strong> (10€/mois). Le temps de voir tes résultats grandir.</p>
            <div className="flex flex-col gap-2 mt-5">
              <Button className="h-9" disabled={busy} onClick={onDiscount}>{busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Profiter du -50%'}</Button>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={onNext}>Non merci, continuer</button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h3 className="text-base font-semibold">Mets ton compte en pause</h3>
            <p className="text-sm text-muted-foreground mt-2">Plutôt que de tout arrêter, passe à <strong>3€/mois</strong> : ta fiche optimisée, tes langues et tes réglages sont <strong>conservés</strong>, et tu réactives tout en un clic quand tu veux.</p>
            <div className="flex flex-col gap-2 mt-5">
              <Button className="h-9" disabled={busy} onClick={onPause}>{busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Mettre en pause à 3€/mois'}</Button>
              <button className="text-xs text-muted-foreground hover:text-destructive" onClick={onNext}>Non, je veux résilier</button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h3 className="text-base font-semibold">Confirmer la résiliation</h3>
            <p className="text-sm text-muted-foreground mt-2">
              En résiliant, tu perds l&apos;accès à Appolyn : la <strong>gestion de ta fiche dans toutes tes langues</strong>, l&apos;optimisation IA, le suivi des concurrents et avis, et tes analytics. On garde ta config au chaud : si tu reviens, tu la retrouves.
            </p>
            <div className="flex flex-col gap-2 mt-5">
              <Button variant="outline" className="h-9 text-destructive border-destructive/30 hover:bg-destructive/5" disabled={busy} onClick={onCancel}>
                {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Résilier quand même'}
              </Button>
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={onClose}>Garder mon abonnement</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PlanCard({ title, price, period, highlight, features, cta, busy, onClick }: {
  title: string; price: string; period: string; highlight: string; features: string[]; cta: string; busy: boolean; onClick: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium">{title}</p>
        <span className="text-[10px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">{highlight}</span>
      </div>
      <p className="mb-3"><span className="text-2xl font-bold">{price}</span><span className="text-xs text-muted-foreground">{period}</span></p>
      <ul className="space-y-1.5 mb-4 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />{f}</li>
        ))}
      </ul>
      <Button size="sm" className="h-9 w-full" disabled={busy} onClick={onClick}>
        {busy ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Redirection...</> : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />{cta}</>}
      </Button>
    </div>
  );
}
