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
};

module.exports = nextConfig;
