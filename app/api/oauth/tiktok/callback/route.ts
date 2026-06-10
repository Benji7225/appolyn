import { NextRequest, NextResponse } from 'next/server';
import { verifyPayload, encryptToken, signPayload, APP_URL } from '@/lib/server/social';

// TikTok redirects here. Exchange the code for tokens (sandbox client) and store
// them encrypted. open_id identifies the connected creator.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const back = (q: string) => NextResponse.redirect(`${APP_URL}/dashboard/marketing/organic/content?${q}`);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error_description') || url.searchParams.get('error');

  if (oauthError) return back('error=' + encodeURIComponent(oauthError));
  if (!code || !state) return back('error=' + encodeURIComponent('Réponse OAuth incomplète.'));
  const st = await verifyPayload<{ u: string; p: string }>(state);
  if (!st || st.p !== 'tiktok') return back('error=' + encodeURIComponent('État OAuth invalide ou expiré.'));

  const clientKey = process.env.TIKTOK_SANDBOX_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_SANDBOX_CLIENT_SECRET!;

  try {
    const tokRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${APP_URL}/api/oauth/tiktok/callback`,
      }),
    });
    const tok = await tokRes.json() as {
      access_token?: string; refresh_token?: string; open_id?: string; expires_in?: number; scope?: string; error?: string; error_description?: string;
    };
    if (!tok.access_token) throw new Error(tok.error_description ?? tok.error ?? 'Échec du token TikTok.');

    const deposit = await signPayload({
      u: st.u,
      p: 'tiktok',
      name: 'TikTok',
      ext: tok.open_id ?? '',
      at: await encryptToken(tok.access_token),
      rt: await encryptToken(tok.refresh_token ?? ''),
      exp_token: new Date(Date.now() + (tok.expires_in ?? 86400) * 1000).toISOString(),
      scopes: tok.scope ?? '',
      exp: Date.now() + 5 * 60 * 1000,
    });
    return NextResponse.redirect(`${APP_URL}/dashboard/social/connected#d=${deposit}`);
  } catch (e) {
    return back('error=' + encodeURIComponent(e instanceof Error ? e.message : 'Connexion TikTok échouée.'));
  }
}
