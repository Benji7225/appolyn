'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChartBar as BarChart3, Search, FileText, TrendingUp, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <LogoStrip />
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
          <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
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
          App Store Optimization Platform
        </Badge>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
          Grow your app
          <br />
          <span className="text-muted-foreground">with better ASO.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
          Keyword research, metadata management, and analytics — everything indie developers need to rank higher and convert more downloads.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup">
            <Button size="lg" className="h-12 px-8 text-sm font-medium">
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg" className="h-12 px-8 text-sm font-medium border-border/60">
              See features
            </Button>
          </Link>
        </div>

        <div className="mt-20 relative">
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background z-10 pointer-events-none rounded-b-2xl" />
          <div className="border border-border/40 rounded-2xl overflow-hidden bg-card shadow-2xl">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="p-6 bg-card text-left">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2.5 h-2.5 rounded-full bg-border" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" />
        <div className="flex-1" />
        <div className="h-5 w-32 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Downloads', value: '12,847', change: '+18%' },
          { label: 'Revenue', value: '$3,240', change: '+12%' },
          { label: 'Rating', value: '4.8', change: '+0.2' },
          { label: 'Active Apps', value: '3', change: '' },
        ].map((card) => (
          <div key={card.label} className="bg-background border border-border/40 rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">{card.label}</div>
            <div className="text-xl font-semibold">{card.value}</div>
            {card.change && <div className="text-xs text-emerald-400 mt-0.5">{card.change}</div>}
          </div>
        ))}
      </div>
      <div className="bg-background border border-border/40 rounded-xl p-4 h-28 flex items-end gap-1">
        {[40, 55, 45, 70, 60, 80, 75, 90, 85, 95, 88, 100].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-foreground/15 rounded-sm"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function LogoStrip() {
  const apps = ['Fastic', 'Headspace', 'Duolingo', 'Calm', 'Notion', 'Readwise'];
  return (
    <div className="border-y border-border/40 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-xs text-muted-foreground mb-6 uppercase tracking-widest">Trusted by indie developers building apps like</p>
        <div className="flex items-center justify-center gap-12 flex-wrap">
          {apps.map((name) => (
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
      icon: Search,
      title: 'Keyword Research',
      description: 'Find high-impact keywords with popularity scores, difficulty ratings, and competitor rankings — all in one view.',
    },
    {
      icon: FileText,
      title: 'Metadata Editor',
      description: 'Edit your app title, subtitle, keywords, and description with character counts and best-practice guidance.',
    },
    {
      icon: BarChart3,
      title: 'Download Analytics',
      description: 'Track downloads, revenue, and ratings over time with clean, minimal charts that surface what matters.',
    },
    {
      icon: TrendingUp,
      title: 'Ranking Tracker',
      description: 'Monitor your keyword positions and see exactly where your app ranks against competitors.',
    },
    {
      icon: Globe,
      title: 'Country Insights',
      description: 'Analyze performance across App Store regions and identify untapped markets for your app.',
    },
    {
      icon: Shield,
      title: 'Metadata History',
      description: 'Every metadata save creates a snapshot. Roll back or compare versions to understand what drove changes.',
    },
  ];

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Everything you need to rank
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            A focused set of tools designed specifically for indie developers — no bloat, no enterprise noise.
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
    { num: '01', title: 'Add your app', desc: 'Connect your iOS or Android app with your bundle ID and start tracking.' },
    { num: '02', title: 'Research keywords', desc: 'Search keywords, compare difficulty and popularity, find gaps your competitors miss.' },
    { num: '03', title: 'Optimize metadata', desc: 'Update your title, subtitle, and keywords directly in the editor with live character counts.' },
    { num: '04', title: 'Track growth', desc: 'Monitor downloads, revenue, and ratings to measure the impact of every change.' },
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
      name: 'Indie',
      price: '$0',
      period: 'forever',
      desc: 'Perfect for trying out Appolyn with one app.',
      features: ['1 app', '50 keyword searches/mo', 'Basic analytics', 'Metadata editor'],
      cta: 'Get started free',
      href: '/signup',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      desc: 'For serious indie developers tracking multiple apps.',
      features: ['10 apps', 'Unlimited keyword searches', 'Advanced analytics', 'Metadata history', 'Country insights', 'Priority support'],
      cta: 'Start free trial',
      href: '/signup',
      highlighted: true,
    },
    {
      name: 'Studio',
      price: '$49',
      period: 'per month',
      desc: 'For studios managing a large app portfolio.',
      features: ['Unlimited apps', 'Unlimited searches', 'Team access', 'API access', 'Custom reports', 'Dedicated support'],
      cta: 'Contact us',
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
          Start optimizing today
        </h2>
        <p className="text-muted-foreground mb-8">
          Join hundreds of indie developers using Appolyn to grow their apps in the store.
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
          <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
