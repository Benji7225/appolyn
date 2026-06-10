import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptToken, encryptToken } from '@/lib/server/social';

// Publishes a saved post's video to the user's YouTube channel. Auth is the
// user's Supabase session: every DB read/write runs under their RLS. The stored
// OAuth tokens are decrypted server-side only; refreshed if expired.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Privacy = 'public' | 'unlisted' | 'private';

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // A client scoped to the user's JWT: PostgREST runs as them, RLS applies.
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { postId?: string; privacy?: Privacy };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }); }
  const postId = body.postId;
  const privacy: Privacy = body.privacy ?? 'private';
  if (!postId) return NextResponse.json({ error: 'postId manquant' }, { status: 400 });

  // Load the post + its YouTube target.
  const { data: post } = await sb
    .from('content_posts')
    .select('id,title,media_url,content_post_targets(id,platform,caption,hashtags)')
    .eq('id', postId)
    .single();
  if (!post) return NextResponse.json({ error: 'Post introuvable.' }, { status: 404 });
  const p = post as { id: string; title: string; media_url: string; content_post_targets: { id: string; platform: string; caption: string; hashtags: string }[] };
  const target = p.content_post_targets.find((t) => t.platform === 'youtube');
  if (!target) return NextResponse.json({ error: 'Aucune cible YouTube sur ce post.' }, { status: 400 });
  if (!p.media_url) return NextResponse.json({ error: 'Ajoute une vidéo au post avant de publier sur YouTube.' }, { status: 400 });

  // Load + decrypt the connected account.
  const { data: acc } = await sb.from('social_accounts').select('*').eq('platform', 'youtube').maybeSingle();
  if (!acc) return NextResponse.json({ error: 'YouTube n\'est pas connecté.' }, { status: 400 });
  const row = acc as { access_token: string; refresh_token: string; token_expires_at: string | null };

  // Refresh the access token if it is missing or about to expire.
  let accessToken = await decryptToken(row.access_token);
  const expMs = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  if (!accessToken || Date.now() > expMs - 60_000) {
    const refreshToken = await decryptToken(row.refresh_token);
    if (!refreshToken) return NextResponse.json({ error: 'Session YouTube expirée. Reconnecte ton compte.' }, { status: 400 });
    const rr = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const rt = await rr.json() as { access_token?: string; expires_in?: number };
    if (!rr.ok || !rt.access_token) {
      return NextResponse.json({ error: 'Impossible de rafraîchir la session YouTube. Reconnecte ton compte.' }, { status: 400 });
    }
    accessToken = rt.access_token;
    await sb.from('social_accounts').update({
      access_token: await encryptToken(accessToken),
      token_expires_at: new Date(Date.now() + (rt.expires_in ?? 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('platform', 'youtube');
  }

  // Build title/description/tags from the adapted caption.
  const caption = (target.caption ?? '').trim();
  const lines = caption.split('\n');
  const title = (lines[0] || p.title || 'Vidéo').slice(0, 100);
  const description = `${lines.slice(1).join('\n').trim()}\n\n${target.hashtags ?? ''}`.trim();
  const tags = (target.hashtags ?? '').split(/\s+/).map((t) => t.replace(/^#/, '')).filter(Boolean).slice(0, 15);

  await sb.from('content_post_targets').update({ status: 'publishing', error: '' }).eq('id', target.id);

  try {
    // Fetch the media from Supabase Storage (public URL).
    const mediaRes = await fetch(p.media_url);
    if (!mediaRes.ok) throw new Error('Vidéo introuvable dans le stockage.');
    const contentType = mediaRes.headers.get('content-type') || 'video/*';
    const buf = Buffer.from(await mediaRes.arrayBuffer());

    // Resumable upload: init, then PUT the bytes.
    const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': contentType,
        'X-Upload-Content-Length': String(buf.length),
      },
      body: JSON.stringify({
        snippet: { title, description, tags, categoryId: '22' },
        status: { privacyStatus: privacy, selfDeclaredMadeForKids: false },
      }),
    });
    if (!init.ok) {
      const t = await init.text();
      throw new Error(`Init upload YouTube refusé (${init.status}). ${t.slice(0, 200)}`);
    }
    const uploadUrl = init.headers.get('location');
    if (!uploadUrl) throw new Error('Pas d\'URL d\'upload renvoyée par YouTube.');

    const up = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType, 'Content-Length': String(buf.length) },
      body: buf,
    });
    const result = await up.json() as { id?: string; error?: { message?: string } };
    if (!up.ok || !result.id) {
      throw new Error(result.error?.message ?? `Upload YouTube échoué (${up.status}).`);
    }

    const videoUrl = `https://youtu.be/${result.id}`;
    await sb.from('content_post_targets').update({
      status: 'published',
      platform_post_id: result.id,
      platform_url: videoUrl,
      published_at: new Date().toISOString(),
      error: '',
    }).eq('id', target.id);

    return NextResponse.json({ ok: true, url: videoUrl, privacy });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Échec de la publication.';
    await sb.from('content_post_targets').update({ status: 'failed', error: message }).eq('id', target.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
