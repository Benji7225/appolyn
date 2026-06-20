import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://appolyn.io'),
  title: "Appolyn — l'ASO automatique pour les développeurs d'apps",
  description:
    "Appolyn optimise et publie ta fiche App Store dans toutes les langues, automatiquement. Analytics réels, ASO piloté par IA : le tout-en-un des développeurs d'apps indé.",
  applicationName: 'Appolyn',
  keywords: [
    'ASO', 'App Store Optimization', 'App Store Connect', 'mots-clés App Store',
    'analytics app', 'développeur iOS indé', 'localisation App Store', 'optimisation fiche App Store',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Appolyn',
    title: "Appolyn — l'ASO automatique pour les développeurs d'apps",
    description: 'Optimise et publie ta fiche App Store dans toutes les langues, automatiquement.',
    url: 'https://appolyn.io',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Appolyn — l'ASO automatique pour les développeurs d'apps",
    description: 'Optimise et publie ta fiche App Store dans toutes les langues, automatiquement.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
