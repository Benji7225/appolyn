import { NextRequest, NextResponse } from 'next/server';
import { verifyPayload, encryptToken, signPayload, APP_URL } from '@/lib/server/social';

// Google redirects here after consent. We verify the signed state, exchange the
// code for tokens (client secret stays server-side), read the channel, encrypt
// the tokens, and hand a signed "deposit" to the browser via the URL fragment.
// The browser then writes the (already encrypted) tokens to its own row under RLS.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const back = (q: string) =>
  NextResponse.redirect(`${APP_URL}/dashboard/marketing/organic/content?${q}`);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError) return back(`error=${encodeURIComponent(oauthError)}`);
  if (!code || !state) return back('error=' + encodeURIComponent('Réponse OAuth incomplète.'));

  const st = await verifyPayload<{ u: string; p: string }>(state);
  if (!st || st.p !== 'youtube') return back('error=' + encodeURIComponent('État OAuth invalide ou expiré.'));

  const clientId = process.env.YOUTUBE_CLIENT_ID!;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET!;

  // Exchange authorization code -> tokens.
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${APP_URL}/api/oauth/youtube/callback`,
      grant_type: 'authorization_code',
    }),
  });
  const tok = await tokenRes.json() as {
    access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; error?: string;
  };
  if (!tokenRes.ok || !tok.access_token) {
    return back('error=' + encodeURIComponent('Échec de l\'échange de token Google.'));
  }

  // Read the channel (name + id) so we can show "Connecté : <chaîne>".
  let name = 'YouTube';
  let ext = '';
  try {
    const chRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    const ch = await chRes.json() as { items?: { id: string; snippet?: { title?: string } }[] };
    const item = ch.items?.[0];
    if (item) { name = item.snippet?.title ?? 'YouTube'; ext = item.id ?? ''; }
  } catch { /* non-fatal: connection still works without channel metadata */ }

  const deposit = await signPayload({
    u: st.u,
    p: 'youtube',
    name,
    ext,
    at: await encryptToken(tok.access_token),
    rt: await encryptToken(tok.refresh_token ?? ''),
    exp_token: new Date(Date.now() + (tok.expires_in ?? 3600) * 1000).toISOString(),
    scopes: tok.scope ?? '',
    exp: Date.now() + 5 * 60 * 1000,
  });

  return NextResponse.redirect(`${APP_URL}/dashboard/social/connected#d=${deposit}`);
}
