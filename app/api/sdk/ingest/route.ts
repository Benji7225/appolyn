import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/server/stripe';

// Appolyn SDK ingest. The iOS SDK POSTs device + event payloads here. We resolve
// the app by its sdk_key, upsert the device into sdk_clients (deduped on IDFV),
// aggregate revenue, append the event, and best-effort attribute the first install
// to a recent tracked-link click. Writes use the service role (bypasses RLS); the
// owner reads its own rows through RLS. No PII beyond the device's IDFV.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REVENUE_EVENTS = new Set(['purchase', 'subscribe', 'renewal']);

type Body = {
  sdk_key?: string;
  idfv?: string;
  event?: string;
  value?: number;
  currency?: string;
  properties?: Record<string, unknown>;
  platform?: string;
  device_model?: string;
  device_class?: string;
  os_name?: string;
  os_version?: string;
  app_version?: string;
  app_build?: string;
  bundle_id?: string;
  locale?: string;
  language?: string;
  region?: string;
  timezone?: string;
  screen_w?: number;
  screen_h?: number;
  is_simulator?: boolean;
  install_date?: string;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try { body = (await req.json()) as Body; } catch { return NextResponse.json({ ok: false, error: 'bad json' }, { status: 200 }); }

  const key = (body.sdk_key ?? '').trim();
  const idfv = (body.idfv ?? '').trim();
  const event = (body.event ?? '').trim() || 'launch';
  if (!key || !idfv) return NextResponse.json({ ok: false, error: 'missing sdk_key or idfv' }, { status: 200 });

  try {
    const db = serviceClient() as unknown as { from: (t: string) => any };

    // Resolve the app by its SDK key. Unknown key => accept silently (2xx) so the
    // SDK doesn't retry forever; nothing is stored.
    const { data: app } = await db.from('apps').select('id, user_id').eq('sdk_key', key).maybeSingle();
    if (!app) return NextResponse.json({ ok: false, error: 'unknown key' }, { status: 200 });

    const now = new Date().toISOString();
    const isRevenue = REVENUE_EVENTS.has(event) && typeof body.value === 'number' && body.value > 0;
    const value = isRevenue ? Number(body.value) : 0;

    const deviceFields = {
      platform: body.platform ?? 'ios',
      device_model: body.device_model ?? null,
      device_class: body.device_class ?? null,
      os_name: body.os_name ?? null,
      os_version: body.os_version ?? null,
      app_version: body.app_version ?? null,
      app_build: body.app_build ?? null,
      bundle_id: body.bundle_id ?? null,
      locale: body.locale ?? null,
      language: body.language ?? null,
      region: body.region ?? null,
      timezone: body.timezone ?? null,
      screen_w: typeof body.screen_w === 'number' ? body.screen_w : null,
      screen_h: typeof body.screen_h === 'number' ? body.screen_h : null,
      is_simulator: !!body.is_simulator,
      install_date: body.install_date ?? null,
      last_seen: now,
    };

    const { data: existing } = await db
      .from('sdk_clients')
      .select('id, purchases, total_revenue')
      .eq('app_id', app.id)
      .eq('idfv', idfv)
      .maybeSingle();

    let clientId: string | undefined;

    if (existing) {
      const update: Record<string, unknown> = { ...deviceFields };
      if (isRevenue) {
        update.purchases = (existing.purchases ?? 0) + 1;
        update.total_revenue = Number(existing.total_revenue ?? 0) + value;
        update.has_purchased = true;
        update.currency = body.currency ?? null;
      }
      await db.from('sdk_clients').update(update).eq('id', existing.id);
      clientId = existing.id as string;
    } else {
      // First time we see this device: best-effort attribution to a recent click.
      const attr = await attribute(db, app.user_id as string, body.region ?? null);
      const insert: Record<string, unknown> = {
        app_id: app.id,
        idfv,
        ...deviceFields,
        first_seen: now,
        purchases: isRevenue ? 1 : 0,
        total_revenue: isRevenue ? value : 0,
        has_purchased: isRevenue,
        currency: isRevenue ? (body.currency ?? null) : null,
        attributed_source: attr.source,
        attributed_link_id: attr.linkId,
        confidence: attr.confidence,
      };
      const { data: created } = await db.from('sdk_clients').insert(insert).select('id').single();
      clientId = created?.id as string | undefined;
    }

    await db.from('sdk_events').insert({
      app_id: app.id,
      client_id: clientId ?? null,
      idfv,
      event,
      value: isRevenue ? value : null,
      currency: body.currency ?? null,
      properties: body.properties ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Real server error => 500 so the SDK requeues and retries on next launch.
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 });
  }
}

// Light attribution: match the install to the owner's most recent tracked-link
// click in the same country within 24h. Country + recency only => confidence 0.5.
// A precise match will come from richer signals (deferred-deeplink/fingerprint).
async function attribute(
  db: { from: (t: string) => any },
  userId: string,
  region: string | null,
): Promise<{ source: string | null; linkId: string | null; confidence: number | null }> {
  if (!userId || !region) return { source: null, linkId: null, confidence: null };
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: click } = await db
      .from('signal_clicks')
      .select('link_id, country, ts, signal_links!inner(source, user_id)')
      .eq('signal_links.user_id', userId)
      .eq('country', region)
      .gte('ts', since)
      .order('ts', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (click?.link_id) {
      return { source: click.signal_links?.source ?? null, linkId: click.link_id, confidence: 0.5 };
    }
  } catch { /* attribution is best-effort, never block ingest */ }
  return { source: null, linkId: null, confidence: null };
}
