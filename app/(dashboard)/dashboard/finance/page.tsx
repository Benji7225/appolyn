'use client';

// ── Finance (module en préparation, MASQUÉ de la navigation) ──────────────────
// Accessible uniquement par l'URL /dashboard/finance pour validation. Modèle
// "asset-light" : Appolyn ne prête JAMAIS son propre argent (activité régulée,
// risque crédit). On met le dev en relation avec un partenaire qui avance le
// cash contre un %, en s'appuyant sur les données de ventes ASC déjà intégrées
// comme underwriting. Aucune donnée chiffrée ici n'est réelle tant que le
// partenaire et le volume ne sont pas là : tout est présenté honnêtement.

import { useState } from 'react';
import { Banknote, Clock, ShieldCheck, TrendingUp, ArrowRight, Info } from 'lucide-react';

const eur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export default function FinancePage() {
  const [pending, setPending] = useState(5000);
  // Illustratif uniquement : avance ~ 85% du montant en attente, frais ~ 2% / mois.
  const advance = Math.round(pending * 0.85);
  const fee = Math.round(pending * 0.02);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 mb-3">
          <Info className="h-3 w-3" /> Module en préparation — visible pour validation
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Trésorerie</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Apple te paie 30 à 60 jours après tes ventes. Avance ta trésorerie dès maintenant et
          réinvestis sans attendre, sur la base de tes ventes App Store réelles déjà connectées à Appolyn.
        </p>
      </div>

      {/* How it works */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: TrendingUp, title: 'On lit tes ventes', desc: 'Tes revenus App Store réels (déjà connectés) servent à estimer une avance, sans paperasse.' },
          { icon: Banknote, title: 'Un partenaire avance', desc: 'Un fournisseur de capital partenaire verse le cash en quelques jours. Appolyn ne prête pas lui-même.' },
          { icon: Clock, title: 'Remboursé par Apple', desc: 'Le partenaire se rembourse sur tes versements Apple à venir, contre un pourcentage clair.' },
        ].map((s) => (
          <div key={s.title} className="rounded-xl border border-border bg-card card-pop p-5">
            <s.icon className="h-5 w-5 text-foreground/60 mb-3" />
            <h3 className="text-sm font-medium mb-1">{s.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Illustrative simulator */}
      <div className="rounded-xl border border-border bg-card card-pop p-6 mb-6">
        <h2 className="text-sm font-medium mb-1">Simuler une avance</h2>
        <p className="text-xs text-muted-foreground mb-5">Estimation indicative. Les conditions réelles dépendront du partenaire de financement.</p>

        <label className="text-xs text-muted-foreground">Montant Apple en attente</label>
        <input
          type="range" min={500} max={50000} step={500} value={pending}
          onChange={(e) => setPending(Number(e.target.value))}
          className="w-full mt-2 accent-[hsl(var(--primary))]"
        />
        <div className="text-xl font-semibold tracking-tight tabular-nums mt-1">{eur(pending)}</div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-border/40">
          <div>
            <p className="text-xs text-muted-foreground">Avance estimée</p>
            <p className="text-2xl font-semibold tracking-tight text-emerald-600 tabular-nums">{eur(advance)}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">≈ 85 % du montant en attente</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Frais estimés</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{eur(fee)}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">≈ 2 % / mois, indicatif</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-foreground/60 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium mb-0.5">Asset-light, et c&apos;est volontaire</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Appolyn ne prête jamais son propre argent (c&apos;est une activité régulée). On apporte la donnée,
            les clients et l&apos;intégration ; un partenaire agréé porte le capital et le risque. Ce module s&apos;activera
            une fois un partenaire de financement signé et un volume de devs suffisant atteint.
          </p>
          <button className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline">
            Me prévenir au lancement <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
