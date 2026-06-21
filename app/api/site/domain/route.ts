import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Connexion d'un DOMAINE PERSO au site d'une app : ajoute le domaine au projet
// Vercel (via l'API), le stocke sur le site du dev, et renvoie les enregistrements
// DNS à poser + le statut de vérification. Le middleware sert ensuite le site sur ce
// domaine. Le dev pointe juste son DNS, une fois.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PROJECT_ID = 'prj_Ym1KgA1G3c8uFqx8UJfGwfb6yjyF';
const TEAM_ID = 'team_6qrFpUndm8MLBXgygAJZy263';

type VercelDomain = { name?: string; verified?: boolean; verification?: { type: string; domain: string; value: string; reason?: string }[]; error?: { code?: string; message?: string } };

const vercel = (path: string, init?: RequestInit) =>
  fetch(`https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${TEAM_ID}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

// Enregistrements DNS recommandés : apex = A, sous-domaine = CNAME.
function dnsRecords(domain: string): { type: string; name: string; value: string }[] {
  const parts = domain.split('.');
  const isApex = parts.length <= 2;
  if (isApex) return [{ type: 'A', name: '@', value: '76.76.21.21' }];
  return [{ type: 'CNAME', name: parts[0], value: 'cname.vercel-dns.com' }];
}

const normalize = (d: string) => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
const validDomain = (d: string) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d);

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  if (!process.env.VERCEL_API_TOKEN) return NextResponse.json({ error: 'Domaines non configurés sur le serveur.' }, { status: 503 });

  // Client lié à l'utilisateur (RLS) : il ne peut toucher QUE ses propres sites.
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  let body: { appId?: string; domain?: string; action?: 'add' | 'status' | 'remove' };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Requête invalide' }, { status: 400 }); }
  const appId = (body.appId ?? '').trim();
  const action = body.action ?? 'add';
  const domain = normalize(body.domain ?? '');
  if (!appId) return NextResponse.json({ error: 'App manquante.' }, { status: 400 });
  if (action !== 'status' && (!domain || !validDomain(domain))) return NextResponse.json({ error: 'Domaine invalide.' }, { status: 400 });

  // Le dev possède-t-il ce site ? (RLS le garantit, on lit pour récupérer overrides.)
  const { data: site } = await (sb as unknown as { from: (t: string) => any }).from('published_sites')
    .select('overrides').eq('app_id', appId).maybeSingle();
  if (!site) return NextResponse.json({ error: 'Publie d\'abord ton site.' }, { status: 404 });
  const overrides = (site.overrides ?? {}) as Record<string, unknown>;

  const saveDomain = async (value: string | null) => {
    const next = { ...overrides };
    if (value) next.domain = value; else delete next.domain;
    await (sb as unknown as { from: (t: string) => any }).from('published_sites')
      .update({ overrides: Object.keys(next).length ? next : null, updated_at: new Date().toISOString() }).eq('app_id', appId);
  };

  try {
    if (action === 'remove') {
      const target = (overrides.domain as string) || domain;
      if (target) await vercel(`/v9/projects/${PROJECT_ID}/domains/${encodeURIComponent(target)}`, { method: 'DELETE' });
      await saveDomain(null);
      return NextResponse.json({ ok: true, removed: true });
    }

    if (action === 'add') {
      const addRes = await vercel(`/v10/projects/${PROJECT_ID}/domains`, { method: 'POST', body: JSON.stringify({ name: domain }) });
      const addJson = await addRes.json() as VercelDomain;
      // « déjà rattaché à ce projet » n'est pas une erreur.
      if (!addRes.ok && addJson.error?.code !== 'domain_already_in_use_by_this_project') {
        return NextResponse.json({ error: addJson.error?.message ?? 'Impossible d\'ajouter ce domaine (il est peut-être déjà utilisé ailleurs).' }, { status: 400 });
      }
      await saveDomain(domain);
    }

    // Statut de vérification (add OU status).
    const target = action === 'status' ? ((overrides.domain as string) || domain) : domain;
    if (!target) return NextResponse.json({ ok: true, verified: false, domain: null, records: [] });
    const cfgRes = await vercel(`/v9/projects/${PROJECT_ID}/domains/${encodeURIComponent(target)}`);
    const cfg = await cfgRes.json() as VercelDomain;
    const txt = (cfg.verification ?? []).filter((v) => v.type === 'TXT').map((v) => ({ type: 'TXT', name: v.domain, value: v.value }));
    return NextResponse.json({
      ok: true,
      domain: target,
      verified: !!cfg.verified,
      records: [...dnsRecords(target), ...txt],
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur domaine' }, { status: 502 });
  }
}
