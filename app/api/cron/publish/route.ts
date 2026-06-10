import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { publishPlatform, type Platform } from '@/lib/server/publishers';

// Scheduled publisher. Triggered every few minutes by Supabase pg_cron (which
// passes the shared CRON_SECRET). Runs with the service-role key so it can act on
// any user's due posts, then publishes each target through the shared engine.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PLATFORMS: Platform[] = ['youtube', 'facebook', 'instagram', 'tiktok'];

async function run(req: NextRequest) {
  if (!SERVICE_ROLE) return NextResponse.json({ error: 'Service role non configuré.' }, { status: 503 });
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // The expected secret lives in the DB vault; pg_cron sends it as the bearer.
  // Reading it requires the service role, so an anonymous caller can't trigger this.
  const { data: expected } = await sb.rpc('appolyn_cron_secret');
  const auth = req.headers.get('authorization');
  if (!expected || auth !== `Bearer ${expected}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date().toISOString();
  const { data: due } = await sb
    .from('content_posts')
    .select('id,user_id,content_post_targets(platform,status)')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(10);

  const results: { post: string; status: string }[] = [];
  for (const post of (due ?? []) as { id: string; user_id: string; content_post_targets: { platform: string }[] }[]) {
    // Claim atomically: only the run that flips scheduled -> publishing proceeds.
    const { data: claimed } = await sb
      .from('content_posts').update({ status: 'publishing', updated_at: now })
      .eq('id', post.id).eq('status', 'scheduled').select('id');
    if (!claimed || claimed.length === 0) continue;

    let anyOk = false, anyFail = false;
    for (const t of post.content_post_targets) {
      if (!PLATFORMS.includes(t.platform as Platform)) continue;
      const r = await publishPlatform(sb, post.user_id, t.platform as Platform, post.id, 'public');
      if (r.ok) anyOk = true; else anyFail = true;
    }
    const status = anyFail ? 'partial' : (anyOk ? 'published' : 'partial');
    await sb.from('content_posts').update({ status, updated_at: new Date().toISOString() }).eq('id', post.id);
    results.push({ post: post.id, status });
  }
  return NextResponse.json({ processed: results.length, results });
}

export async function POST(req: NextRequest) { return run(req); }
export async function GET(req: NextRequest) { return run(req); }
