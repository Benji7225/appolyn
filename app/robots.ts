import type { MetadataRoute } from 'next';

// Robots : on laisse Google indexer le site public (landing, blog, docs, legal)
// et on bloque tout l'espace privé (dashboard, API, auth). Pointe vers le sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app/', '/api/', '/auth/', '/login', '/signup'],
      },
    ],
    sitemap: 'https://appolyn.io/sitemap.xml',
    host: 'https://appolyn.io',
  };
}
