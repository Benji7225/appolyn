import { PageHeader, SubNav } from '@/components/dashboard/shell';

// Shared chrome for every Settings sub-page: one title + a tab bar. Each tab is a
// real route so the URL is shareable and the browser back button works.
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8">
      <PageHeader title="Réglages" description="Gère ton compte et tes intégrations." />
      <SubNav
        items={[
          { href: '/app/settings', label: 'Compte' },
          { href: '/app/settings/billing', label: 'Abonnement' },
          { href: '/app/settings/apps', label: 'Mes apps' },
          { href: '/app/settings/connections', label: 'Comptes connectés' },
          { href: '/app/settings/security', label: 'Sécurité' },
          { href: '/app/settings/app-store-connect', label: 'App Store Connect' },
        ]}
      />
      {children}
    </div>
  );
}
