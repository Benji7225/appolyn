const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type AppListing = { appName: string; genre: string; listing: string; url: string };

// Récupère le texte de la fiche de l'app du dev pour l'IA (idées de contenu,
// annonces…). Source 1 : App Store public (iTunes, FR puis US). Source 2, en
// repli : App Store Connect via l'edge asc-proxy avec le token du dev — ce qui
// fait MARCHER ces outils AVANT la sortie de l'app (fiche encore en préparation),
// pile au moment où on prépare son lancement. Zéro donnée inventée.
export async function getAppListing(ascAppId: string, token: string): Promise<AppListing> {
  let appName = '', genre = '', listing = '', url = '';
  if (!ascAppId) return { appName, genre, listing, url };

  // 1) App Store public (app déjà sortie)
  for (const country of ['fr', 'us']) {
    try {
      const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(ascAppId)}&country=${country}`, { headers: { 'User-Agent': 'Appolyn/1.0' } });
      const j = await r.json() as { results?: Record<string, unknown>[] };
      const app = (j.results ?? [])[0];
      if (app) {
        appName = (app.trackName as string) ?? appName;
        genre = (app.primaryGenreName as string) ?? genre;
        url = (app.trackViewUrl as string) ?? url;
        const subtitle = (app.subtitle as string) ?? '';
        const desc = ((app.description as string) ?? '').slice(0, 1500);
        listing = [subtitle, desc].filter(Boolean).join('\n');
        if (listing) return { appName, genre, listing, url };
      }
    } catch { /* essaie le pays suivant, puis ASC */ }
  }

  // 2) Repli App Store Connect (fiche en préparation / pré-lancement)
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-localizations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: ascAppId }),
    });
    const j = await r.json() as { localizations?: { locale: string; title?: string; subtitle?: string; description?: string }[] };
    const locs = j.localizations ?? [];
    const pick = locs.find((l) => l.locale?.startsWith('fr') && (l.description || l.subtitle))
      ?? locs.find((l) => l.description || l.subtitle)
      ?? locs[0];
    if (pick) {
      if (!appName) appName = pick.title ?? '';
      listing = [pick.subtitle, (pick.description ?? '').slice(0, 1500)].filter(Boolean).join('\n');
    }
  } catch { /* géré par l'appelant */ }

  if (!url) url = `https://apps.apple.com/app/id${ascAppId}`;
  return { appName, genre, listing, url };
}
