import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signPayload, APP_URL } from '@/lib/server/social';

// Builds the TikTok consent URL (sandbox client). Scopes cover reading basic
// profile info and uploading/posting videos.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SCOPES = 'user.info.basic,video.publish,video.upload';

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientKey = process.env.TIKTOK_SANDBOX_CLIENT_KEY;
  if (!clientKey) return NextResponse.json({ error: 'TikTok n\'est pas configuré côté serveur.' }, { status: 503 });

  const state = await signPayload({ u: user.id, p: 'tiktok', exp: Date.now() + 10 * 60 * 1000 });
  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: `${APP_URL}/api/oauth/tiktok/callback`,
    response_type: 'code',
    scope: SCOPES,
    state,
  });
  return NextResponse.json({ url: `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}` });
}
