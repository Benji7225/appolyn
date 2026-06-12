'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChartBar as BarChart3, Sparkles, Upload, History, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <TrustStrip />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo_3MN_(1).png" alt="Appolyn" width={28} height={28} className="rounded-md" />
          <span className="font-semibold text-sm">Appolyn</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">Comment ça marche</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Tarifs</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-sm">Connexion</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="text-sm">Commencer</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <Badge variant="outline" className="mb-6 text-xs font-medium border-border/60 text-muted-foreground">
          ASO piloté par l&apos;IA
        </Badge>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
          Ta fiche App Store,
          <br />
          <span className="text-muted-foreground">dans toutes les langues.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Écris ta fiche une seule fois. L&apos;IA d&apos;Appolyn localise ton titre, ton sous-titre,
          tes mots-clés et ta description dans chaque langue de l&apos;App Store, puis les publie
          directement sur App Store Connect, en un clic. Et tu pilotes tes vraies stats au même endroit.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup">
            <Button size="lg" className="h-12 px-8 text-sm font-medium">
              Commencer gratuitement
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="outline" size="lg" className="h-12 px-8 text-sm font-medium border-border/60">
              Voir comment ça marche
            </Button>
          </Link>
        </div>

        <div className="mt-20 relative">
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background z-10 pointer-events-none rounded-b-2xl" />
          <div className="border border-border/40 rounded-2xl overflow-hidden bg-card shadow-2xl">
            <MetadataPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

// Illustrative preview of the metadata localization view.
function MetadataPreview() {
  const rows = [
    { flag: 'English (US)', title: '3 Minutes Now: Focus', sub: 'Block distractions, start now' },
    { flag: 'Français', title: '3 Minutes Now : Focus', sub: 'Bloque les distractions' },
    { flag: 'Deutsch', title: '3 Minutes Now: Fokus', sub: 'Ablenkungen blockieren' },
    { flag: '日本語', title: '3 Minutes Now：集中', sub: '気が散るのを今すぐブロック' },
    { flag: 'Español', title: '3 Minutes Now: Enfoque', sub: 'Bloquea distracciones' },
  ];
  return (
    <div className="p-6 bg-card text-left">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2.5 h-2.5 rounded-full bg-border" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" />
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" /> 22 langues générées
        </div>
      </div>
      <div className="space-y-px bg-border/40 border border-border/40 rounded-xl overflow-hidden">
        {rows.map((r) => (
          <div key={r.flag} className="bg-background px-4 py-3 flex items-center gap-4">
            <span className="text-xs font-medium w-24 shrink-0 text-muted-foreground">{r.flag}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground truncate">{r.sub}</p>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 shrink-0">prêt</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrustStrip() {
  const langs = ['English', 'Français', 'Deutsch', 'Español', '日本語', '한국어', 'Português', 'Italiano', '中文', 'Nederlands'];
  return (
    <div className="border-y border-border/40 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-xs text-muted-foreground mb-6 uppercase tracking-widest">
          Bâti sur l&apos;API officielle App Store Connect
        </p>
        <div className="flex items-center justify-center gap-x-8 gap-y-3 flex-wrap">
          {langs.map((name) => (
            <span key={name} className="text-sm font-medium text-muted-foreground/40">{name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Features() {
  const features = [
    {
      icon: Sparkles,
      title: 'Localisation IA, partout',
      description: 'Titre, sous-titre, mots-clés et description, localisés pour chaque marché par l\'IA, en respectant les limites de caractères exactes d\'Apple.',
    },
    {
      icon: Upload,
      title: 'Publication en un clic',
      description: 'Envoie tes métadonnées directement sur App Store Connect pour chaque langue. Fini le copier-coller dans des dizaines de champs.',
    },
    {
      icon: BarChart3,
      title: 'Analytics réels',
      description: 'Téléchargements, revenus et notes tirés en direct d\'App Store Connect. De vrais chiffres, jamais de données de démo.',
    },
    {
      icon: History,
      title: 'Métadonnées versionnées',
      description: 'Chaque enregistrement est un instantané. Compare, vérifie et reviens en arrière sur toutes tes langues en confiance.',
    },
    {
      icon: Globe,
      title: 'Toutes les régions App Store',
      description: 'Gère ta fiche dans toutes les langues et tous les territoires de l\'App Store depuis un seul endroit.',
    },
    {
      icon: Shield,
      title: 'Tes clés, chiffrées',
      description: 'Ta clé API App Store Connect est chiffrée au repos et n\'est jamais exposée dans ton navigateur.',
    },
  ];

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Localise une fois, publie partout
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Un outil dédié aux développeurs indépendants qui veulent que leur app sonne local dans chaque store.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border/40 border border-border/40 rounded-2xl overflow-hidden">
          {features.map((f) => (
            <div key={f.title} className="bg-card p-8 hover:bg-accent/50 transition-colors">
              <f.icon className="h-5 w-5 mb-4 text-foreground/50" />
              <h3 className="font-medium mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: '01', title: 'Connecte App Store Connect', desc: 'Ajoute ta clé API une fois. Appolyn dialogue avec Apple en toute sécurité pour toi.' },
    { num: '02', title: 'Ajoute ton app', desc: 'Pointe Appolyn vers ton app avec son identifiant App Store Connect.' },
    { num: '03', title: 'Écris une fois, localise avec l\'IA', desc: 'Rédige ta fiche dans une langue ; l\'IA la localise dans toutes les autres.' },
    { num: '04', title: 'Publie en un clic', desc: 'Vérifie, envoie chaque langue sur App Store Connect, puis suis tes téléchargements, revenus et notes.' },
  ];
  return (
    <section id="how-it-works" className="py-24 px-6 border-t border-border/40">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Comment ça marche</h2>
          <p className="text-muted-foreground">Opérationnel en quelques minutes.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="text-4xl font-bold text-muted-foreground/15 mb-3">{step.num}</div>
              <h3 className="font-medium mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const sharedFeatures = [
    'Localisation IA dans 22 langues',
    'Publication en un clic vers App Store Connect',
    'Analytics réels (téléchargements, revenus, notes)',
    'Suivi des concurrents et des mots-clés',
    'Historique versionné des métadonnées',
    'Réponses aux avis assistées par IA',
  ];
  const plans = [
    {
      name: 'Mensuel',
      price: '20 €',
      period: 'par mois',
      desc: 'Essai gratuit de 7 jours, puis 20 €/mois. Annulable à tout moment.',
      features: sharedFeatures,
      cta: 'Commencer l\'essai gratuit',
      href: '/signup',
      highlighted: false,
      badge: null as string | null,
    },
    {
      name: 'Annuel',
      price: '200 €',
      period: 'par an',
      desc: 'Deux mois offerts, soit environ 16,67 €/mois. Le meilleur rapport qualité-prix.',
      features: sharedFeatures,
      cta: 'Choisir l\'annuel',
      href: '/signup',
      highlighted: true,
      badge: '2 mois offerts',
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6 border-t border-border/40">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Un tarif simple</h2>
          <p className="text-muted-foreground">Un seul produit complet. Mensuel ou annuel, à toi de choisir.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col relative ${
                plan.highlighted
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card border-border/40'
              }`}
            >
              {plan.badge && (
                <span className="absolute top-6 right-6 text-[11px] font-medium px-2 py-0.5 rounded-full bg-background/20 text-background">
                  {plan.badge}
                </span>
              )}
              <div className="mb-6">
                <div className={`text-sm font-medium mb-3 ${plan.highlighted ? 'text-background/70' : 'text-muted-foreground'}`}>
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-background/60' : 'text-muted-foreground'}`}>/{plan.period}</span>
                </div>
                <p className={`text-sm mt-2 leading-relaxed ${plan.highlighted ? 'text-background/70' : 'text-muted-foreground'}`}>
                  {plan.desc}
                </p>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <div className={`h-1 w-1 rounded-full flex-shrink-0 ${plan.highlighted ? 'bg-background/50' : 'bg-muted-foreground/50'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}>
                <Button
                  className={`w-full ${plan.highlighted ? 'bg-background text-foreground hover:bg-background/90' : ''}`}
                  variant={plan.highlighted ? 'secondary' : 'outline'}
                  size="sm"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 px-6 border-t border-border/40">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Publie dans toutes les langues dès aujourd&apos;hui
        </h2>
        <p className="text-muted-foreground mb-8">
          Connecte ton compte App Store Connect et publie tes métadonnées localisées en quelques minutes.
        </p>
        <Link href="/signup">
          <Button size="lg" className="h-12 px-10">
            Commencer gratuitement
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo_3MN_(1).png" alt="Appolyn" width={24} height={24} className="rounded-sm" />
          <span className="font-semibold text-sm">Appolyn</span>
        </Link>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Appolyn. Conçu pour les développeurs indépendants.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
          <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link>
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
