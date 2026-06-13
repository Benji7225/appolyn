import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/server/stripe';

// Signal link redirect + click tracking. Visiting /s/<slug> logs an anonymous
// click (geo from Vercel edge headers, platform/device from the user-agent — no
// personal data, no cookies) then 302-redirects to the link's destination.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function platformOf(ua: string): string {
  if (/iphone/i.test(ua)) return 'iOS';
  if (/ipad/i.test(ua)) return 'iPadOS';
  if (/android/i.test(ua)) return 'Android';
  if (/macintosh|mac os/i.test(ua)) return 'macOS';
  if (/windows/i.test(ua)) return 'Windows';
  return 'Web';
}

function deviceOf(ua: string): string {
  if (/ipad/i.test(ua)) return 'iPad';
  if (/iphone/i.test(ua)) return 'iPhone';
  if (/android/i.test(ua)) {
    const m = ua.match(/Android[^;]*;\s*([^;)]+)/i);
    return (m?.[1] ?? 'Android').trim().slice(0, 40);
  }
  return platformOf(ua);
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const home = new URL('/', req.url);
  try {
    const db = serviceClient() as unknown as { from: (t: string) => any };
    const { data: link } = await db
      .from('signal_links')
      .select('id, destination_url, destination_url_android')
      .eq('slug', params.slug)
      .maybeSingle();

    const dest = (link as { id: string; destination_url: string; destination_url_android: string | null } | null);
    if (!dest) return NextResponse.redirect(home, 302);

    const h = req.headers;
    const ua = h.get('user-agent') ?? '';
    const city = h.get('x-vercel-ip-city');
    await db.from('signal_clicks').insert({
      link_id: dest.id,
      country: h.get('x-vercel-ip-country') ?? null,
      city: city ? decodeURIComponent(city) : null,
      device: deviceOf(ua),
      platform: platformOf(ua),
      ua: ua.slice(0, 300),
    });

    // Cross-platform: Android users go to Google Play when a Play link is set,
    // everyone else (iOS / web) goes to the App Store destination.
    const isAndroid = /android/i.test(ua);
    let target = (isAndroid && dest.destination_url_android) ? dest.destination_url_android : dest.destination_url;
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
    return NextResponse.redirect(target, 302);
  } catch {
    return NextResponse.redirect(home, 302);
  }
}
