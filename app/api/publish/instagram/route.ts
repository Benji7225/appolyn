import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptToken } from '@/lib/server/social';

// Publishes the post's video as an Instagram Reel. IG fetches the video from its
// public URL: create a media container, wait for processing, then publish.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GRAPH = 'https://graph.facebook.com/v21.0';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    .select('id,title,media_url,content_post_targets(id,platform,caption,hashtags)')
    .eq('id', body.postId).single();
  if (!post) return NextResponse.json({ error: 'Post introuvable.' }, { status: 404 });
  const p = post as { media_url: string; content_post_targets: { id: string; platform: string; caption: string; hashtags: string }[] };
  const target = p.content_post_targets.find((t) => t.platform === 'instagram');
  if (!target) return NextResponse.json({ error: 'Aucune cible Instagram sur ce post.' }, { status: 400 });
  if (!p.media_url) return NextResponse.json({ error: 'Ajoute une vidéo avant de publier sur Instagram.' }, { status: 400 });

  const { data: acc } = await sb.from('social_accounts').select('*').eq('platform', 'meta').maybeSingle();
  if (!acc) return NextResponse.json({ error: 'Instagram n\'est pas connecté (via Meta).' }, { status: 400 });
  const row = acc as { refresh_token: string; meta: { ig_user_id?: string } | null };
  const igUserId = row.meta?.ig_user_id;
  const pageToken = await decryptToken(row.refresh_token);
  if (!igUserId || !pageToken) {
    return NextResponse.json({ error: 'Aucun compte Instagram Business lié à ta Page. Vérifie le lien Page/Insta puis reconnecte Meta.' }, { status: 400 });
  }

  await sb.from('content_post_targets').update({ status: 'publishing', error: '' }).eq('id', target.id);

  try {
    const caption = `${(target.caption ?? '').trim()}\n\n${target.hashtags ?? ''}`.trim();
    // 1) Create the media container (Reel).
    const createRes = await fetch(`${GRAPH}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_type: 'REELS', video_url: p.media_url, caption, access_token: pageToken }),
    });
    const created = await createRes.json() as { id?: string; error?: { message?: string } };
    if (!createRes.ok || !created.id) throw new Error(created.error?.message ?? 'Création du média Instagram refusée.');

    // 2) Wait for IG to finish processing the video (bounded).
    let ready = false;
    for (let i = 0; i < 20; i++) {
      await sleep(2500);
      const stRes = await fetch(`${GRAPH}/${created.id}?fields=status_code&access_token=${encodeURIComponent(pageToken)}`);
      const st = await stRes.json() as { status_code?: string };
      if (st.status_code === 'FINISHED') { ready = true; break; }
      if (st.status_code === 'ERROR') throw new Error('Instagram n\'a pas pu traiter la vidéo (format/durée ?).');
    }
    if (!ready) throw new Error('Vidéo encore en traitement chez Instagram. Réessaie la publication dans une minute.');

    // 3) Publish.
    const pubRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: created.id, access_token: pageToken }),
    });
    const pub = await pubRes.json() as { id?: string; error?: { message?: string } };
    if (!pubRes.ok || !pub.id) throw new Error(pub.error?.message ?? 'Publication Instagram refusée.');

    await sb.from('content_post_targets').update({
      status: 'published', platform_post_id: pub.id, platform_url: '', published_at: new Date().toISOString(), error: '',
    }).eq('id', target.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Échec de la publication.';
    await sb.from('content_post_targets').update({ status: 'failed', error: message }).eq('id', target.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
