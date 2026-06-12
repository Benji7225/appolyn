import { PageHeader, SubNav } from '@/components/dashboard/shell';

// Shared chrome for every Settings sub-page: one title + a tab bar. Each tab is a
// real route so the URL is shareable and the browser back button works.
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8">
      <PageHeader title="Réglages" description="Gère ton compte et tes intégrations." />
      <SubNav
        items={[
          { href: '/dashboard/settings', label: 'Compte' },
          { href: '/dashboard/settings/apps', label: 'Mes apps' },
          { href: '/dashboard/settings/security', label: 'Sécurité' },
          { href: '/dashboard/settings/app-store-connect', label: 'App Store Connect' },
        ]}
      />
      {children}
    </div>
  );
}
