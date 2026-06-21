import { ImageResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { siteTheme } from '@/lib/site-theme';

// Favicon DYNAMIQUE du site public d'une app = l'icône de l'app du dev (pas celle
// d'Appolyn). On passe par la convention de fichier `icon` (et non par
// metadata.icons) car Next 13.5 supprime les icônes-fichier quand on définit
// metadata.icons SANS émettre l'URL externe → plus aucun favicon. Cette route, étant
// un segment enfant, prime sur app/icon.png pour toutes les pages sous /site/[slug].

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';
export const revalidate = 86400; // l'icône d'une app change rarement

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Row = { asc_app_id: string; country: string; content: Record<string, unknown> | null; overrides: { title?: string; accent?: string } | null };

// Résout l'icône : App Store public (à jour) si l'app est sortie, sinon la capture
// stockée à la publication. Renvoie aussi de quoi dessiner un repli de marque
// (initiale + accent) quand aucune icône n'est disponible (ex. app pré-lancement
// dont le snapshot n'a pas capté l'icône).
async function resolve(slug: string): Promise<{ url: string | null; letter: string; accent: string; onAccent: string }> {
  const { data } = await sb.from('published_sites').select('asc_app_id, country, content, overrides').eq('slug', slug).eq('status', 'published').maybeSingle();
  const row = (data as Row) ?? null;
  const c = (row?.content ?? {}) as Record<string, unknown>;
  const name = (row?.overrides?.title?.trim()) || (typeof c.title === 'string' ? c.title : '') || 'App';
  const theme = siteTheme(row?.overrides?.accent);

  let url: string | null = null;
  if (row) {
    try {
      const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(row.asc_app_id)}&country=${encodeURIComponent(row.country || 'fr')}`, { next: { revalidate: 3600 } });
      const j = await r.json() as { results?: { artworkUrl512?: string; artworkUrl100?: string }[] };
      url = j.results?.[0]?.artworkUrl512 ?? j.results?.[0]?.artworkUrl100 ?? null;
    } catch { /* repli sur la capture */ }
    if (!url) url = (typeof c.artworkUrl === 'string' && c.artworkUrl) || (typeof c.iconUrl === 'string' && c.iconUrl) || null;
  }
  const letter = name.trim().charAt(0).toUpperCase() || 'A';
  return { url, letter, accent: theme.accent, onAccent: theme.onAccent };
}

export default async function Icon({ params }: { params: { slug: string } }) {
  const { url, letter, accent, onAccent } = await resolve(params.slug);
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: url ? '#ffffff' : accent }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={url} width={64} height={64} style={{ borderRadius: 14 }} />
        ) : (
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: onAccent }}>{letter}</div>
        )}
      </div>
    ),
    { ...size },
  );
}
