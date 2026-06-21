import { PageHeader, SubNav } from '@/components/dashboard/shell';

// Shared chrome for every Settings sub-page: one title + a tab bar. Each tab is a
// real route so the URL is shareable and the browser back button works.
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8">
      <PageHeader title="Réglages" description="À gauche, ce qui vaut pour tout ton compte Appolyn. À droite, ce qui est propre à l'app sélectionnée." />
      <SubNav
        items={[
          { href: '/app/settings', label: 'Vue d\'ensemble' },
          { href: '/app/settings/billing', label: 'Abonnement' },
          { href: '/app/settings/app-store-connect', label: 'App Store Connect' },
          { href: '/app/settings/connections', label: 'Réseaux & SDK' },
          { href: '/app/settings/security', label: 'Sécurité' },
          { href: '/app/settings/apps', label: 'Mes apps' },
          { href: '/app/settings/share', label: 'Kit de partage' },
        ]}
      />
      {children}
    </div>
  );
}
