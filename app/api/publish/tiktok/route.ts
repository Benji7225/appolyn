import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptToken } from '@/lib/server/social';

// Uploads the post's video to the creator's TikTok as a DRAFT (inbox). In the
// sandbox / before app audit, TikTok only allows landing the video as a draft
// that the creator finishes and posts manually in the TikTok app.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const MAX_BYTES = 64 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { postId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }); }
  if (!body.postId) return NextResponse.json({ error: 'postId manquant' }, { status: 400 });

  const { data: post } = await sb
    .from('content_posts')
    .select('id,media_url,content_post_targets(id,platform,caption,hashtags)')
    .eq('id', body.postId).single();
  if (!post) return NextResponse.json({ error: 'Post introuvable.' }, { status: 404 });
  const p = post as { media_url: string; content_post_targets: { id: string; platform: string; caption: string; hashtags: string }[] };
  const target = p.content_post_targets.find((t) => t.platform === 'tiktok');
  if (!target) return NextResponse.json({ error: 'Aucune cible TikTok sur ce post.' }, { status: 400 });
  if (!p.media_url) return NextResponse.json({ error: 'Ajoute une vidéo avant de publier sur TikTok.' }, { status: 400 });

  const { data: acc } = await sb.from('social_accounts').select('*').eq('platform', 'tiktok').maybeSingle();
  if (!acc) return NextResponse.json({ error: 'TikTok n\'est pas connecté.' }, { status: 400 });
  const accessToken = await decryptToken((acc as { access_token: string }).access_token);
  if (!accessToken) return NextResponse.json({ error: 'Session TikTok expirée. Reconnecte ton compte.' }, { status: 400 });

  await sb.from('content_post_targets').update({ status: 'publishing', error: '' }).eq('id', target.id);

  try {
    const mediaRes = await fetch(p.media_url);
    if (!mediaRes.ok) throw new Error('Vidéo introuvable dans le stockage.');
    const buf = Buffer.from(await mediaRes.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new Error('Vidéo trop lourde pour le sandbox TikTok (max 64 Mo).');

    // 1) Init a FILE_UPLOAD to the inbox (single chunk).
    const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        source_info: { source: 'FILE_UPLOAD', video_size: buf.length, chunk_size: buf.length, total_chunk_count: 1 },
      }),
    });
    const init = await initRes.json() as { data?: { publish_id?: string; upload_url?: string }; error?: { code?: string; message?: string } };
    if (!initRes.ok || !init.data?.upload_url) {
      throw new Error(init.error?.message || `Init TikTok refusé (${initRes.status}).`);
    }

    // 2) Upload the bytes.
    const up = await fetch(init.data.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(buf.length),
        'Content-Range': `bytes 0-${buf.length - 1}/${buf.length}`,
      },
      body: buf,
    });
    if (!up.ok) throw new Error(`Upload TikTok échoué (${up.status}).`);

    await sb.from('content_post_targets').update({
      status: 'published',
      platform_post_id: init.data.publish_id ?? '',
      platform_url: '',
      published_at: new Date().toISOString(),
      error: '',
    }).eq('id', target.id);
    // It lands as a draft the creator finishes in the TikTok app.
    return NextResponse.json({ ok: true, draft: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Échec de la publication.';
    await sb.from('content_post_targets').update({ status: 'failed', error: message }).eq('id', target.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
