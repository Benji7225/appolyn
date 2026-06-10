import type { SupabaseClient } from '@supabase/supabase-js';
import { decryptToken, encryptToken } from './social';

// Shared publishing engine. The same code path serves both the user-triggered
// publish routes (RLS client) and the scheduled cron (service-role client). The
// caller provides the Supabase client; everything here is platform logic.

export type Platform = 'youtube' | 'facebook' | 'instagram' | 'tiktok';
export type Privacy = 'public' | 'unlisted' | 'private';
export type PublishResult = { ok: boolean; url?: string; draft?: boolean; error?: string };

type Target = { id: string; platform: string; caption: string; hashtags: string };
type Post = { id: string; title: string; media_url: string; content_post_targets: Target[] };
type Account = {
  access_token: string; refresh_token: string; token_expires_at: string | null;
  external_id: string; meta: { page_id?: string; ig_user_id?: string } | null;
};

const GRAPH = 'https://graph.facebook.com/v21.0';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const accountPlatform = (p: Platform) => (p === 'facebook' || p === 'instagram' ? 'meta' : p);

async function loadContext(sb: SupabaseClient, userId: string, postId: string, platform: Platform) {
  const { data: post } = await sb
    .from('content_posts')
    .select('id,title,media_url,content_post_targets(id,platform,caption,hashtags)')
    .eq('id', postId).eq('user_id', userId).single();
  if (!post) throw new Error('Post introuvable.');
  const p = post as Post;
  const target = p.content_post_targets.find((t) => t.platform === platform);
  if (!target) throw new Error(`Aucune cible ${platform} sur ce post.`);
  if (!p.media_url) throw new Error('Ajoute une vidéo avant de publier.');
  const { data: acc } = await sb.from('social_accounts')
    .select('*').eq('user_id', userId).eq('platform', accountPlatform(platform)).maybeSingle();
  if (!acc) throw new Error(`${platform} n'est pas connecté.`);
  return { post: p, target, account: acc as Account };
}

const captionText = (t: Target) => `${(t.caption ?? '').trim()}\n\n${t.hashtags ?? ''}`.trim();

// ── YouTube ─────────────────────────────────────────────────────────────────
async function publishYoutube(sb: SupabaseClient, userId: string, post: Post, target: Target, account: Account, privacy: Privacy): Promise<PublishResult> {
  let accessToken = await decryptToken(account.access_token);
  const expMs = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  if (!accessToken || Date.now() > expMs - 60_000) {
    const refreshToken = await decryptToken(account.refresh_token);
    if (!refreshToken) return { ok: false, error: 'Session YouTube expirée. Reconnecte ton compte.' };
    const rr = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID!, client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        refresh_token: refreshToken, grant_type: 'refresh_token',
      }),
    });
    const rt = await rr.json() as { access_token?: string; expires_in?: number };
    if (!rr.ok || !rt.access_token) return { ok: false, error: 'Impossible de rafraîchir la session YouTube. Reconnecte ton compte.' };
    accessToken = rt.access_token;
    await sb.from('social_accounts').update({
      access_token: await encryptToken(accessToken),
      token_expires_at: new Date(Date.now() + (rt.expires_in ?? 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId).eq('platform', 'youtube');
  }

  const caption = (target.caption ?? '').trim();
  const lines = caption.split('\n');
  const title = (lines[0] || post.title || 'Vidéo').slice(0, 100);
  const description = `${lines.slice(1).join('\n').trim()}\n\n${target.hashtags ?? ''}`.trim();
  const tags = (target.hashtags ?? '').split(/\s+/).map((t) => t.replace(/^#/, '')).filter(Boolean).slice(0, 15);

  const mediaRes = await fetch(post.media_url);
  if (!mediaRes.ok) throw new Error('Vidéo introuvable dans le stockage.');
  const contentType = mediaRes.headers.get('content-type') || 'video/*';
  const buf = Buffer.from(await mediaRes.arrayBuffer());

  const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': contentType, 'X-Upload-Content-Length': String(buf.length),
    },
    body: JSON.stringify({ snippet: { title, description, tags, categoryId: '22' }, status: { privacyStatus: privacy, selfDeclaredMadeForKids: false } }),
  });
  if (!init.ok) throw new Error(`Init upload YouTube refusé (${init.status}). ${(await init.text()).slice(0, 200)}`);
  const uploadUrl = init.headers.get('location');
  if (!uploadUrl) throw new Error('Pas d\'URL d\'upload renvoyée par YouTube.');
  const up = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType, 'Content-Length': String(buf.length) }, body: buf });
  const result = await up.json() as { id?: string; error?: { message?: string } };
  if (!up.ok || !result.id) throw new Error(result.error?.message ?? `Upload YouTube échoué (${up.status}).`);
  return { ok: true, url: `https://youtu.be/${result.id}` };
}

// ── Facebook Page ───────────────────────────────────────────────────────────
async function publishFacebook(_sb: SupabaseClient, _userId: string, post: Post, target: Target, account: Account): Promise<PublishResult> {
  const pageId = account.meta?.page_id || account.external_id;
  const pageToken = await decryptToken(account.refresh_token);
  if (!pageId || !pageToken) return { ok: false, error: 'Aucune Page Facebook liée. Reconnecte Meta.' };
  const r = await fetch(`${GRAPH}/${pageId}/videos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_url: post.media_url, description: captionText(target), access_token: pageToken }),
  });
  const j = await r.json() as { id?: string; error?: { message?: string } };
  if (!r.ok || !j.id) throw new Error(j.error?.message ?? `Publication Facebook refusée (${r.status}).`);
  return { ok: true, url: `https://www.facebook.com/${j.id}` };
}

// ── Instagram Reel ──────────────────────────────────────────────────────────
async function publishInstagram(_sb: SupabaseClient, _userId: string, post: Post, target: Target, account: Account): Promise<PublishResult> {
  const igUserId = account.meta?.ig_user_id;
  const pageToken = await decryptToken(account.refresh_token);
  if (!igUserId || !pageToken) return { ok: false, error: 'Aucun compte Instagram Business lié à ta Page. Reconnecte Meta.' };
  const createRes = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_type: 'REELS', video_url: post.media_url, caption: captionText(target), access_token: pageToken }),
  });
  const created = await createRes.json() as { id?: string; error?: { message?: string } };
  if (!createRes.ok || !created.id) throw new Error(created.error?.message ?? 'Création du média Instagram refusée.');
  let ready = false;
  for (let i = 0; i < 20; i++) {
    await sleep(2500);
    const stRes = await fetch(`${GRAPH}/${created.id}?fields=status_code&access_token=${encodeURIComponent(pageToken)}`);
    const st = await stRes.json() as { status_code?: string };
    if (st.status_code === 'FINISHED') { ready = true; break; }
    if (st.status_code === 'ERROR') throw new Error('Instagram n\'a pas pu traiter la vidéo (format/durée ?).');
  }
  if (!ready) throw new Error('Vidéo encore en traitement chez Instagram. Réessaie dans une minute.');
  const pubRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: created.id, access_token: pageToken }),
  });
  const pub = await pubRes.json() as { id?: string; error?: { message?: string } };
  if (!pubRes.ok || !pub.id) throw new Error(pub.error?.message ?? 'Publication Instagram refusée.');
  return { ok: true };
}

// ── TikTok (draft to inbox) ─────────────────────────────────────────────────
async function publishTiktok(_sb: SupabaseClient, _userId: string, post: Post, _target: Target, account: Account): Promise<PublishResult> {
  const accessToken = await decryptToken(account.access_token);
  if (!accessToken) return { ok: false, error: 'Session TikTok expirée. Reconnecte ton compte.' };
  const mediaRes = await fetch(post.media_url);
  if (!mediaRes.ok) throw new Error('Vidéo introuvable dans le stockage.');
  const buf = Buffer.from(await mediaRes.arrayBuffer());
  if (buf.length > 64 * 1024 * 1024) throw new Error('Vidéo trop lourde pour le sandbox TikTok (max 64 Mo).');
  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
    method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ source_info: { source: 'FILE_UPLOAD', video_size: buf.length, chunk_size: buf.length, total_chunk_count: 1 } }),
  });
  const init = await initRes.json() as { data?: { publish_id?: string; upload_url?: string }; error?: { message?: string } };
  if (!initRes.ok || !init.data?.upload_url) throw new Error(init.error?.message || `Init TikTok refusé (${initRes.status}).`);
  const up = await fetch(init.data.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(buf.length), 'Content-Range': `bytes 0-${buf.length - 1}/${buf.length}` },
    body: buf,
  });
  if (!up.ok) throw new Error(`Upload TikTok échoué (${up.status}).`);
  return { ok: true, draft: true };
}

// ── Dispatcher ──────────────────────────────────────────────────────────────
// Loads context, marks the target "publishing", runs the platform publisher, and
// writes the final status. Never throws: returns a PublishResult.
export async function publishPlatform(
  sb: SupabaseClient, userId: string, platform: Platform, postId: string, privacy: Privacy = 'public',
): Promise<PublishResult> {
  let targetId: string | null = null;
  try {
    const { post, target, account } = await loadContext(sb, userId, postId, platform);
    targetId = target.id;
    await sb.from('content_post_targets').update({ status: 'publishing', error: '' }).eq('id', target.id);

    let result: PublishResult;
    if (platform === 'youtube') result = await publishYoutube(sb, userId, post, target, account, privacy);
    else if (platform === 'facebook') result = await publishFacebook(sb, userId, post, target, account);
    else if (platform === 'instagram') result = await publishInstagram(sb, userId, post, target, account);
    else result = await publishTiktok(sb, userId, post, target, account);

    if (result.ok) {
      await sb.from('content_post_targets').update({
        status: 'published', platform_url: result.url ?? '', published_at: new Date().toISOString(), error: '',
      }).eq('id', target.id);
    } else {
      await sb.from('content_post_targets').update({ status: 'failed', error: result.error ?? 'Échec.' }).eq('id', target.id);
    }
    return result;
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Échec de la publication.';
    if (targetId) await sb.from('content_post_targets').update({ status: 'failed', error }).eq('id', targetId);
    return { ok: false, error };
  }
}
