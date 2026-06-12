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
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="text-sm">Get started</Button>
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
          AI App Store Optimization
        </Badge>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
          Your App Store listing,
          <br />
          <span className="text-muted-foreground">in every language.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Write your metadata once. Appolyn&apos;s AI localizes your title, subtitle, keywords and
          description into every App Store language, then publishes them straight to App Store
          Connect, in one click.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup">
            <Button size="lg" className="h-12 px-8 text-sm font-medium">
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="outline" size="lg" className="h-12 px-8 text-sm font-medium border-border/60">
              See how it works
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
          <Sparkles className="h-3.5 w-3.5" /> 22 languages generated
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
            <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 shrink-0">ready</span>
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
          Built on the official App Store Connect API
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
      title: 'AI localization, everywhere',
      description: 'Title, subtitle, keywords and description, localized for each market by AI, respecting Apple’s exact character limits.',
    },
    {
      icon: Upload,
      title: 'One-click publishing',
      description: 'Push your metadata straight to App Store Connect for every locale. No more copy-pasting across dozens of language fields.',
    },
    {
      icon: BarChart3,
      title: 'Real analytics',
      description: 'Downloads, revenue and ratings pulled live from App Store Connect. Real numbers, never demo data.',
    },
    {
      icon: History,
      title: 'Versioned metadata',
      description: 'Every save is a snapshot. Review, compare and roll back across languages with confidence.',
    },
    {
      icon: Globe,
      title: 'Every App Store region',
      description: 'Manage your listing across all App Store languages and territories from a single place.',
    },
    {
      icon: Shield,
      title: 'Your keys, encrypted',
      description: 'Your App Store Connect API key is encrypted at rest and never exposed in your browser.',
    },
  ];

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Localize once, ship everywhere
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            A focused tool for indie developers who want their app to read like a local in every store.
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
    { num: '01', title: 'Connect App Store Connect', desc: 'Add your API key once. Appolyn talks to Apple securely on your behalf.' },
    { num: '02', title: 'Add your app', desc: 'Point Appolyn at your app with its App Store Connect ID.' },
    { num: '03', title: 'Write once, localize with AI', desc: 'Write your metadata in one language; the AI localizes it into every other.' },
    { num: '04', title: 'Publish in one click', desc: 'Review, push every language to App Store Connect, then track downloads, revenue and ratings.' },
  ];
  return (
    <section id="how-it-works" className="py-24 px-6 border-t border-border/40">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">How it works</h2>
          <p className="text-muted-foreground">Up and running in minutes.</p>
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
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'to start',
      desc: 'Try Appolyn with a single app.',
      features: ['1 app', 'AI metadata localization', 'Real App Store analytics', 'Metadata history'],
      cta: 'Get started free',
      href: '/signup',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      desc: 'For indie developers shipping in every language.',
      features: ['Up to 10 apps', 'Unlimited AI localization', 'One-click publish to App Store Connect', 'Real analytics & ratings', 'Versioned metadata', 'Priority support'],
      cta: 'Start free trial',
      href: '/signup',
      highlighted: true,
    },
    {
      name: 'Studio',
      price: '$49',
      period: 'per month',
      desc: 'For studios with a larger app portfolio.',
      features: ['Unlimited apps', 'Everything in Pro', 'Priority support'],
      cta: 'Get started',
      href: '/signup',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6 border-t border-border/40">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Simple pricing</h2>
          <p className="text-muted-foreground">Start free, upgrade when you need more.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card border-border/40'
              }`}
            >
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
          Ship in every language today
        </h2>
        <p className="text-muted-foreground mb-8">
          Connect your App Store Connect account and publish localized metadata in minutes.
        </p>
        <Link href="/signup">
          <Button size="lg" className="h-12 px-10">
            Get started free
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
          © {new Date().getFullYear()} Appolyn. Built for indie developers.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
