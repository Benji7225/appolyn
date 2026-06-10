import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptToken } from '@/lib/server/social';

// Publishes the post's video to the connected Facebook Page. Facebook fetches the
// video from its public Supabase Storage URL, so we don't push bytes ourselves.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GRAPH = 'https://graph.facebook.com/v21.0';

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
  const target = p.content_post_targets.find((t) => t.platform === 'facebook');
  if (!target) return NextResponse.json({ error: 'Aucune cible Facebook sur ce post.' }, { status: 400 });
  if (!p.media_url) return NextResponse.json({ error: 'Ajoute une vidéo avant de publier sur Facebook.' }, { status: 400 });

  const { data: acc } = await sb.from('social_accounts').select('*').eq('platform', 'meta').maybeSingle();
  if (!acc) return NextResponse.json({ error: 'Facebook n\'est pas connecté.' }, { status: 400 });
  const row = acc as { external_id: string; refresh_token: string; meta: { page_id?: string } | null };
  const pageId = row.meta?.page_id || row.external_id;
  const pageToken = await decryptToken(row.refresh_token);
  if (!pageId || !pageToken) return NextResponse.json({ error: 'Aucune Page Facebook liée. Reconnecte Meta.' }, { status: 400 });

  await sb.from('content_post_targets').update({ status: 'publishing', error: '' }).eq('id', target.id);

  try {
    const description = `${(target.caption ?? '').trim()}\n\n${target.hashtags ?? ''}`.trim();
    const r = await fetch(`${GRAPH}/${pageId}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_url: p.media_url, description, access_token: pageToken }),
    });
    const j = await r.json() as { id?: string; error?: { message?: string } };
    if (!r.ok || !j.id) throw new Error(j.error?.message ?? `Publication Facebook refusée (${r.status}).`);

    const postUrl = `https://www.facebook.com/${j.id}`;
    await sb.from('content_post_targets').update({
      status: 'published', platform_post_id: j.id, platform_url: postUrl, published_at: new Date().toISOString(), error: '',
    }).eq('id', target.id);
    return NextResponse.json({ ok: true, url: postUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Échec de la publication.';
    await sb.from('content_post_targets').update({ status: 'failed', error: message }).eq('id', target.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
