import { NextRequest, NextResponse } from 'next/server';
import { verifyPayload, encryptToken, signPayload, APP_URL } from '@/lib/server/social';

// Facebook redirects here. We exchange the code, upgrade to a long-lived user
// token, then resolve the user's Page (+ its linked Instagram Business account)
// so publishing later is a single API call. Page token is stored encrypted.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GRAPH = 'https://graph.facebook.com/v21.0';
const back = (q: string) => NextResponse.redirect(`${APP_URL}/dashboard/marketing/organic/content?${q}`);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error_description') || url.searchParams.get('error');

  if (oauthError) return back('error=' + encodeURIComponent(oauthError));
  if (!code || !state) return back('error=' + encodeURIComponent('Réponse OAuth incomplète.'));
  const st = await verifyPayload<{ u: string; p: string }>(state);
  if (!st || st.p !== 'meta') return back('error=' + encodeURIComponent('État OAuth invalide ou expiré.'));

  const clientId = process.env.META_APP_ID!;
  const clientSecret = process.env.META_APP_SECRET!;
  const redirectUri = `${APP_URL}/api/oauth/meta/callback`;

  try {
    // Code -> short-lived user token.
    const shortRes = await fetch(`${GRAPH}/oauth/access_token?` + new URLSearchParams({
      client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code,
    }));
    const short = await shortRes.json() as { access_token?: string; error?: { message?: string } };
    if (!short.access_token) throw new Error(short.error?.message ?? 'Échec du token Facebook.');

    // Short -> long-lived user token (~60 days).
    const longRes = await fetch(`${GRAPH}/oauth/access_token?` + new URLSearchParams({
      grant_type: 'fb_exchange_token', client_id: clientId, client_secret: clientSecret, fb_exchange_token: short.access_token,
    }));
    const long = await longRes.json() as { access_token?: string; expires_in?: number };
    const userToken = long.access_token ?? short.access_token;

    // Resolve the first Page + its linked Instagram Business account.
    const pagesRes = await fetch(`${GRAPH}/me/accounts?` + new URLSearchParams({
      fields: 'id,name,access_token,instagram_business_account{id,username}',
      access_token: userToken,
    }));
    const pages = await pagesRes.json() as {
      data?: { id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }[];
    };
    const page = pages.data?.[0];

    const deposit = await signPayload({
      u: st.u,
      p: 'meta',
      name: page ? `Page ${page.name}` : 'Facebook',
      ext: page?.id ?? '',
      at: await encryptToken(userToken),
      rt: await encryptToken(page?.access_token ?? ''),
      exp_token: new Date(Date.now() + (long.expires_in ?? 60 * 24 * 3600) * 1000).toISOString(),
      scopes: 'facebook,instagram',
      meta: {
        page_id: page?.id ?? '',
        page_name: page?.name ?? '',
        ig_user_id: page?.instagram_business_account?.id ?? '',
        ig_username: page?.instagram_business_account?.username ?? '',
      },
      exp: Date.now() + 5 * 60 * 1000,
    });
    return NextResponse.redirect(`${APP_URL}/dashboard/social/connected#d=${deposit}`);
  } catch (e) {
    return back('error=' + encodeURIComponent(e instanceof Error ? e.message : 'Connexion Meta échouée.'));
  }
}
