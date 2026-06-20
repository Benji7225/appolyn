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
  asa_token?: string;
  // Capture-max (directive Benji « la data c'est la clé ») : le SDK peut envoyer
  // des signaux techniques supplémentaires (session, mode sombre, accessibilité…)
  // qu'on conserve sans colonne dédiée. L'index signature les accepte tous.
  [key: string]: unknown;
};

// Clés à NE PAS recopier dans le contexte d'event : secrets, identifiants déjà en
// colonne, ou champs traités à part. Tout le reste du body est conservé tel quel.
const CTX_DENY = new Set(['sdk_key', 'idfv', 'asa_token', 'properties', 'event', 'value', 'currency']);

export async function POST(req: NextRequest) {
  let body: Body;
  try { body = (await req.json()) as Body; } catch { return NextResponse.json({ ok: false, error: 'bad json' }, { status: 200 }); }

  const key = (body.sdk_key ?? '').trim();
  const idfv = (body.idfv ?? '').trim();
  const event = (body.event ?? '').trim() || 'launch';
  if (!key || !idfv) return NextResponse.json({ ok: false, error: 'missing sdk_key or idfv' }, { status: 200 });

  // Server-side geo from the request IP (Vercel injects these headers). More
  // reliable than the device locale for attribution; the device region stays for
  // language/UX. City is URL-encoded in the header.
  const ipCountry = (req.headers.get('x-vercel-ip-country') || '').trim().toUpperCase() || null;
  const ipCityRaw = req.headers.get('x-vercel-ip-city');
  const ipCity = ipCityRaw ? decodeURIComponent(ipCityRaw).trim() || null : null;

  try {
    const db = serviceClient() as unknown as { from: (t: string) => any };

    // Resolve the app by its SDK key. Unknown key => accept silently (2xx) so the
    // SDK doesn't retry forever; nothing is stored.
    const { data: app } = await db.from('apps').select('id, user_id').eq('sdk_key', key).maybeSingle();
    if (!app) return NextResponse.json({ ok: false, error: 'unknown key' }, { status: 200 });

    const now = new Date().toISOString();
    const isRevenue = REVENUE_EVENTS.has(event) && typeof body.value === 'number' && body.value > 0;
    const value = isRevenue ? Number(body.value) : 0;

    // Self-reported source (e.g. an onboarding "How did you hear about us?" answer
    // sent via Appolyn.setSource). The most reliable signal — it overrides any
    // guessed source, with full confidence.
    const props = (body.properties ?? {}) as Record<string, unknown>;
    const sourceChannel = event === 'source' && typeof props.channel === 'string' && props.channel.trim()
      ? props.channel.trim()
      : null;

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
      ip_country: ipCountry,
      ip_city: ipCity,
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
      if (sourceChannel) { update.attributed_source = sourceChannel; update.confidence = 1; }
      await db.from('sdk_clients').update(update).eq('id', existing.id);
      clientId = existing.id as string;
    } else {
      // First time we see this device: figure out where it came from, automatically.
      //   1. Apple Search Ads (via the SDK's AdServices token) — exact, from Apple.
      //   2. Otherwise it's Organic. A source the dev passes via Appolyn.setSource
      //      (e.g. from an onboarding question) always wins — no link to paste.
      let attr: AttrResult = { source: null, linkId: null, confidence: null };
      const asaToken = (body.asa_token ?? '').trim();
      if (asaToken) {
        const asa = await resolveAppleSearchAds(asaToken);
        if (asa) attr = asa;
      }
      if (!attr.source) attr = { source: 'Organic', linkId: null, confidence: null };
      // A source the user declared themselves wins over any guess.
      if (sourceChannel) attr = { source: sourceChannel, linkId: null, confidence: 1 };
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

    // CAPTURE-MAX, sans migration : on conserve TOUT le contexte technique de l'event
    // dans la colonne JSON `properties` (sous `_ctx`), en plus des properties métier.
    // Privacy-safe : que des signaux anonymes (jamais IDFA ni PII), on exclut secrets
    // et colonnes dédiées (CTX_DENY). Tout nouveau champ envoyé par le SDK est ainsi
    // capté automatiquement, sans changement de schéma.
    const ctx: Record<string, unknown> = { ip_country: ipCountry, ip_city: ipCity };
    for (const [k, v] of Object.entries(body)) {
      if (!CTX_DENY.has(k) && v !== undefined && v !== null) ctx[k] = v;
    }
    const enrichedProps = { ...((body.properties ?? {}) as Record<string, unknown>), _ctx: ctx };

    await db.from('sdk_events').insert({
      app_id: app.id,
      client_id: clientId ?? null,
      idfv,
      event,
      value: isRevenue ? value : null,
      currency: body.currency ?? null,
      properties: enrichedProps,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Real server error => 500 so the SDK requeues and retries on next launch.
    return NextResponse.json({ ok: false, error: 'server' }, { status: 500 });
  }
}

type AttrResult = { source: string | null; linkId: string | null; confidence: number | null };

// Apple Search Ads: if the SDK sent an AdServices attribution token, ask Apple
// whether this install came from an ASA campaign. Exact and automatic (no link
// needed). Best-effort: the token can be briefly unavailable just after install,
// in which case we return null and let the other signals decide.
async function resolveAppleSearchAds(token: string): Promise<AttrResult | null> {
  try {
    const r = await fetch('https://api-adservices.apple.com/api/v1/', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: token,
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { attribution?: boolean };
    if (j?.attribution === true) return { source: 'Apple Search Ads', linkId: null, confidence: 1 };
    return null;
  } catch {
    return null;
  }
}

