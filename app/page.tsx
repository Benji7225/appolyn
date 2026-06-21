'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChartBar as BarChart3, Sparkles, Rocket, TrendingUp, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Appolyn',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://appolyn.io',
  description:
    "Appolyn optimise et publie ta fiche App Store dans toutes les langues, automatiquement. Analytics réels et ASO piloté par IA pour les développeurs d'apps indé.",
  publisher: { '@type': 'Organization', name: 'Appolyn', url: 'https://appolyn.io' },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
          Tout ce qui vient après le build de ton app
        </Badge>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
          Build ton app.
          <br />
          <span className="text-muted-foreground">Appolyn fait grandir le reste.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Ta fiche App Store optimisée et publiée dans 22 langues sans que tu touches à App Store Connect.
          Tes vrais chiffres en direct. Et l&apos;IA qui te dit quoi faire pour vendre plus. Tout ce dont
          ton app a besoin une fois codée, au même endroit.
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
        <p className="mt-5 text-xs text-muted-foreground">7 jours gratuits. Sans carte bancaire. Annulable en un clic.</p>

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
    { flag: 'English (US)', title: 'Lumen: Focus Timer', sub: 'Beat distraction, start now' },
    { flag: 'Français', title: 'Lumen : Minuteur Focus', sub: 'Bats les distractions' },
    { flag: 'Deutsch', title: 'Lumen: Fokus-Timer', sub: 'Schluss mit Ablenkung' },
    { flag: '日本語', title: 'Lumen：集中タイマー', sub: '気が散るのを今すぐ断つ' },
    { flag: 'Español', title: 'Lumen: Temporizador', sub: 'Vence las distracciones' },
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
      title: 'Ta fiche optimisée et publiée pour toi',
      description: 'L\'IA réécrit ton titre, tes mots-clés et ta description pour mieux te classer, puis les publie dans 22 langues. Tu ne retouches plus jamais les champs d\'App Store Connect.',
    },
    {
      icon: BarChart3,
      title: 'Tes vrais chiffres, pas des graphiques vides',
      description: 'Téléchargements, revenus, abonnements, rétention, sources d\'install : en direct depuis App Store Connect et ton SDK. Zéro donnée de démo, que du réel.',
    },
    {
      icon: TrendingUp,
      title: 'On te dit quoi faire ensuite',
      description: 'Appolyn lit tes chiffres et te sort des actions claires : un paywall qui ne convertit pas, un avis à traiter, une langue à ajouter. Tu arrêtes de naviguer à l\'aveugle.',
    },
    {
      icon: Rocket,
      title: 'Branche le SDK, tu as tout',
      description: 'Une ligne dans ton app (iOS ou Android) et tes installs, tes utilisateurs et d\'où ils viennent remontent tout seuls. Rien d\'autre à coder.',
    },
    {
      icon: Globe,
      title: 'De quoi te faire connaître',
      description: 'Idées de vidéos courtes, annonces de lancement, publication sur tes réseaux et un vrai site pour ton app : tout est généré depuis ta vraie fiche.',
    },
    {
      icon: Shield,
      title: 'Tes clés restent à toi',
      description: 'Ta clé App Store Connect est chiffrée et ne touche jamais ton navigateur. Appolyn conseille et prépare, c\'est toi qui publies.',
    },
  ];

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Tu as fait le plus dur. Appolyn s&apos;occupe du reste.
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Être trouvé, comprendre tes chiffres, vendre plus, retenir et grandir. Tout au même endroit, pensé pour les devs d&apos;apps indés. Sans jongler entre dix outils.
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
    { num: '01', title: 'Branche ta clé', desc: 'Ajoute ta clé App Store Connect une fois. Appolyn parle à Apple à ta place, en sécurité.' },
    { num: '02', title: 'Ajoute ton app', desc: 'Pointe Appolyn sur ton app. Il récupère ta vraie fiche, tes chiffres et tes avis tout seul.' },
    { num: '03', title: 'Laisse l\'IA bosser', desc: 'Optimise ta fiche, génère tes 22 langues, prépare ton contenu. Tu valides, tu ne réécris rien.' },
    { num: '04', title: 'Publie et suis tout', desc: 'Publie en un clic sur l\'App Store, puis regarde tes téléchargements, revenus et notes au même endroit.' },
  ];
  return (
    <section id="how-it-works" className="py-24 px-6 border-t border-border/40">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">En place en quelques minutes</h2>
          <p className="text-muted-foreground">Pas en quelques jours. Trois clics et ta clé, c&apos;est parti.</p>
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
    'ASO optimisé et publié dans 22 langues',
    'Tes vrais chiffres en direct (ventes, abos, rétention)',
    'Des actions concrètes générées depuis tes données',
    'Contenu, crosspost réseaux et site pour ton app',
    'Suivi des mots-clés et des concurrents',
    'Réponses aux avis assistées par l\'IA',
  ];
  const plans = [
    {
      name: 'Mensuel',
      price: '20 €',
      period: 'par mois',
      desc: '7 jours gratuits, puis 20 €/mois. Tu arrêtes quand tu veux.',
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
      desc: 'Deux mois offerts, environ 16,67 €/mois. Pour ceux qui sont sérieux avec leur app.',
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
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Un seul prix, tout dedans</h2>
          <p className="text-muted-foreground">Pas de paliers, pas de surprises. Tu testes 7 jours gratuitement, sans carte.</p>
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
          Arrête de jongler. Commence à grandir.
        </h2>
        <p className="text-muted-foreground mb-8">
          Branche ta clé App Store Connect et vois ce qu&apos;Appolyn fait pour ton app en quelques minutes. 7 jours gratuits, sans carte.
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
