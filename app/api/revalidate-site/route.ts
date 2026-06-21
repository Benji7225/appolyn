import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Rafraîchit immédiatement le site public d'un dev après qu'il a (re)publié, pour
// qu'il voie son site à jour tout de suite (sinon il faut attendre le cache ISR).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let slug = '';
  try { slug = String(((await req.json()) as { slug?: string }).slug ?? '').trim(); } catch { /* invalid body */ }
  if (!slug) return NextResponse.json({ error: 'no slug' }, { status: 400 });

  // Le slug doit appartenir à l'utilisateur (RLS owner sur published_sites).
  const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: row } = await auth.from('published_sites').select('id').eq('slug', slug).eq('user_id', user.id).maybeSingle();
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });

  revalidatePath(`/site/${slug}`);
  return NextResponse.json({ ok: true });
}
