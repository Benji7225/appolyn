import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signPayload, APP_URL } from '@/lib/server/social';

// Builds the Facebook Login consent URL. One connection covers the Facebook Page
// and the linked Instagram Business account.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'pages_manage_metadata',
  'business_management',
  'instagram_basic',
  'instagram_content_publish',
].join(',');

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.META_APP_ID;
  if (!clientId) return NextResponse.json({ error: 'Meta n\'est pas configuré côté serveur.' }, { status: 503 });

  const state = await signPayload({ u: user.id, p: 'meta', exp: Date.now() + 10 * 60 * 1000 });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${APP_URL}/api/oauth/meta/callback`,
    state,
    scope: SCOPES,
    response_type: 'code',
  });
  return NextResponse.json({ url: `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}` });
}
