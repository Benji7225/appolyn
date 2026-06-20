/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // @napi-rs/canvas ships a native .node binary — keep it external so webpack
  // requires it at runtime instead of trying to bundle the binary.
  experimental: { serverComponentsExternalPackages: ['@napi-rs/canvas'] },
  // Cles Supabase publiques (cote client). L'anon key est concue pour etre
  // exposee dans le navigateur, la securite reelle est assuree par les RLS.
  // Inscrites ici pour que le build fonctionne sur n'importe quel hebergeur
  // sans configuration d'environnement supplementaire.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://zlczyxyvwnvjhhcqqhzc.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsY3p5eHl2d252amhoY3FxaHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTU0OTIsImV4cCI6MjA5NjQ5MTQ5Mn0.kPSr-Ge-KP53JEpLQ92fIJCC9iwWZz0vzLIIOMuY4dQ',
  },
  async redirects() {
    return [
      // Domaine canonique : tout ce qui arrive sur le domaine Vercel par defaut
      // est redirige vers appolyn.io (l'app ne doit jamais s'afficher en .vercel.app).
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'appolyn.vercel.app' }],
        destination: 'https://appolyn.io/:path*',
        permanent: true,
      },
      // Le dashboard vit desormais sous /app : les anciens liens /dashboard/*
      // redirigent proprement (filet de securite + marque-pages).
      { source: '/dashboard', destination: '/app', permanent: true },
      { source: '/dashboard/:path*', destination: '/app/:path*', permanent: true },
      // Fusion ASO : App Store Page + Screenshots fondus dans Localisation.
      { source: '/app/metadata', destination: '/app/localization', permanent: true },
      { source: '/app/screenshots', destination: '/app/localization', permanent: true },
      // Analyse concurrentielle IA fondue dans la fiche d'un concurrent.
      { source: '/app/competitor-analysis', destination: '/app/competitors', permanent: true },
    ];
  },
};

module.exports = nextConfig;
