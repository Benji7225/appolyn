'use client';

import Link from 'next/link';
import { Workflow, CreditCard, Bell, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/shell';

// Hub de la section Application (page parent façon Shopify) : les parcours dans
// l'app du dev, tous alimentés par le SDK.
const tools = [
  {
    href: '/app/onboarding',
    icon: Workflow,
    title: 'Onboarding',
    desc: "L'entonnoir de ton onboarding : à quel écran tes utilisateurs décrochent, avec un conseil IA pour le corriger.",
  },
  {
    href: '/app/paywalls',
    icon: CreditCard,
    title: 'Paywalls',
    desc: "La conversion vue → achat de chaque écran d'abonnement, et lequel convertit le mieux.",
  },
  {
    href: '/app/notifications',
    icon: Bell,
    title: 'Notifications',
    desc: 'Ton taux d\'opt-in : combien de tes utilisateurs acceptent de recevoir des notifications.',
  },
];

export default function ApplicationPage() {
  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Application"
        description="Les parcours dans ton app : onboarding, paywalls, notifications. Tout se remplit tout seul une fois le SDK branché."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group rounded-xl border border-border/50 bg-card p-5 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                <t.icon className="h-[18px] w-[18px] text-foreground" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-sm font-medium mt-3">{t.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
