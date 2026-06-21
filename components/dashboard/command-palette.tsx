'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, LayoutGrid, LineChart, Users,
  Globe, Star, Swords, Megaphone, Banknote, Settings, Key, Smartphone, Link2,
  CreditCard, Shield, Store, HeartPulse, Sparkles, Bell, type LucideIcon,
} from 'lucide-react';

type Cmd = { label: string; href: string; group: string; icon: LucideIcon; keywords?: string };

// Toutes les destinations de l'app, accessibles au clavier (⌘K / Ctrl+K).
const COMMANDS: Cmd[] = [
  { label: 'Accueil', href: '/app', group: 'Pilotage', icon: LayoutGrid, keywords: 'home dashboard accueil' },
  { label: "Santé de l'app", href: '/app/health', group: 'Pilotage', icon: HeartPulse, keywords: 'sante health score global' },
  { label: 'Analytics', href: '/app/analytics', group: 'Pilotage', icon: LineChart, keywords: 'revenus ventes abonnements analytics entonnoir retention' },
  { label: 'Utilisateurs', href: '/app/clients', group: 'Pilotage', icon: Users, keywords: 'utilisateurs users installs clients attribution sdk donnees profil' },
  { label: 'Application', href: '/app/application', group: 'Application', icon: Smartphone, keywords: 'application hub section parcours onboarding paywall notifications' },
  { label: 'Onboarding', href: '/app/onboarding', group: 'Application', icon: Smartphone, keywords: 'onboarding entonnoir funnel ecrans decrochage drop-off parcours utilisateur' },
  { label: 'Paywalls', href: '/app/paywalls', group: 'Application', icon: CreditCard, keywords: 'paywall abonnement conversion vue achat ecran abonnement monetisation' },
  { label: 'Notifications', href: '/app/notifications', group: 'Application', icon: Bell, keywords: 'notifications opt-in push autorisation retention' },
  { label: 'Localisation', href: '/app/localization', group: 'ASO', icon: Globe, keywords: 'langues marches couverture localization fiche app store titre sous-titre mots-cles description screenshots captures scores aso' },
  { label: 'Mots-clés', href: '/app/keywords', group: 'ASO', icon: Search, keywords: 'mots-cles keywords rang recherche' },
  { label: 'Avis', href: '/app/reviews', group: 'Marché', icon: Star, keywords: 'avis reviews notes reponses' },
  { label: 'Concurrents', href: '/app/competitors', group: 'Marché', icon: Swords, keywords: 'concurrents competitors analyse ia teardown strategie differenciation positionnement' },
  { label: 'Marketing', href: '/app/marketing', group: 'Marketing', icon: Megaphone, keywords: 'marketing hub section croissance contenu publicite lancement partage' },
  { label: 'Marketing — Organique', href: '/app/marketing/organic', group: 'Marketing', icon: Megaphone, keywords: 'cross-post contenu organique reseaux' },
  { label: 'Marketing — Publicité', href: '/app/marketing/paid', group: 'Marketing', icon: Megaphone, keywords: 'pub ads campagnes' },
  { label: 'Annonces de lancement', href: '/app/launch-posts', group: 'Marketing', icon: Megaphone, keywords: 'launch posts product hunt reddit twitter x annonce ia' },
  { label: 'Kit de partage', href: '/app/share', group: 'Marketing', icon: Link2, keywords: 'partage badge app store smart banner lien qr' },
  { label: 'Site', href: '/app/site', group: 'Marketing', icon: Globe, keywords: 'site web landing page seo referencement google confidentialite support smart app banner telecharger' },
  { label: 'Idées de contenu', href: '/app/content-ideas', group: 'Marketing', icon: Sparkles, keywords: 'contenu idees hooks tiktok reels shorts video ia' },
  { label: 'Trésorerie', href: '/app/finance', group: 'Finance', icon: Banknote, keywords: 'finance tresorerie cash' },
  { label: 'Réglages', href: '/app/settings', group: 'Réglages', icon: Settings, keywords: 'settings reglages compte' },
  { label: 'App Store Connect', href: '/app/settings/app-store-connect', group: 'Réglages', icon: Key, keywords: 'cle p8 asc connexion api' },
  { label: 'Mes apps', href: '/app/settings/apps', group: 'Réglages', icon: Smartphone, keywords: 'apps applications ajouter' },
  { label: 'Connexions', href: '/app/settings/connections', group: 'Réglages', icon: Link2, keywords: 'sdk reseaux connexions integrations' },
  { label: 'Abonnement', href: '/app/settings/billing', group: 'Réglages', icon: CreditCard, keywords: 'abonnement facturation stripe billing' },
  { label: 'Sécurité', href: '/app/settings/security', group: 'Réglages', icon: Shield, keywords: 'securite mot de passe' },
  { label: 'ASO', href: '/app/store', group: 'ASO', icon: Store, keywords: 'aso store hub optimisation app store' },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K ouvre/ferme partout.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('appolyn:command-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('appolyn:command-palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [open]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return COMMANDS;
    return COMMANDS.filter((c) => (`${c.label} ${c.group} ${c.keywords ?? ''}`).toLowerCase().includes(t));
  }, [q]);

  useEffect(() => { setActive(0); }, [q]);

  const go = useCallback((href: string) => { setOpen(false); router.push(href); }, [router]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const r = results[active]; if (r) go(r.href); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg rounded-2xl bg-background border border-border shadow-2xl overflow-hidden" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-2 px-4 border-b border-border/60">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Aller à… (page, réglage, outil)"
            className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground border border-border/60 rounded px-1.5 py-0.5 shrink-0">Esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-auto scrollbar-macos py-2">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-6 text-center">Aucun résultat.</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.href}
                onClick={() => go(r.href)}
                onMouseEnter={() => setActive(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === active ? 'bg-accent' : 'hover:bg-accent/50'}`}
              >
                <r.icon className={`h-4 w-4 shrink-0 ${i === active ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm flex-1">{r.label}</span>
                <span className="text-[11px] text-muted-foreground">{r.group}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
