import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signPayload, APP_URL } from '@/lib/server/social';

// Builds the Google consent URL for YouTube. Authed via the user's Supabase
// session (Bearer); the client then redirects the browser to the returned URL.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: 'YouTube n\'est pas configuré côté serveur.' }, { status: 503 });

  const state = await signPayload({ u: user.id, p: 'youtube', exp: Date.now() + 10 * 60 * 1000 });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${APP_URL}/api/oauth/youtube/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return NextResponse.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
}
