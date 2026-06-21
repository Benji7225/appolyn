import { PageHeader, SubNav } from '@/components/dashboard/shell';

// Section Site : un seul titre + une barre d'onglets (façon Réglages / Marketing),
// pas de sous-entrées dans le menu de gauche. Chaque onglet est une vraie route.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader title="Site" description="Le site marketing de ton app : sa page, ses pages annexes (FAQ, légales…) et ses réglages." />
      <SubNav
        items={[
          { href: '/app/site', label: 'Vue d\'ensemble' },
          { href: '/app/site/pages', label: 'Pages' },
          { href: '/app/site/settings', label: 'Réglages du site' },
        ]}
      />
      {children}
    </div>
  );
}
