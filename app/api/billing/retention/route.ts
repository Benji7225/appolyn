import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe, serviceClient, priceIdByLookup } from '@/lib/server/stripe';

// Retention actions on the user's active subscription, in escalation order:
//  - discount : apply -50% for 3 months
//  - pause    : downgrade to the 3€ "pause" plan (keeps their setup, can resume)
//  - cancel   : cancel at period end
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const RETENTION_COUPON = 'appolyn_retention_50_3m';

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { action?: string };
  try { body = await req.json(); } catch { body = {}; }
  const action = body.action ?? '';

  try {
    const db = serviceClient();
    const { data: row } = await db.from('subscriptions').select('stripe_subscription_id,comp').eq('user_id', user.id).maybeSingle();
    const sub = row as { stripe_subscription_id: string | null; comp: boolean } | null;
    if (sub?.comp) return NextResponse.json({ error: 'Compte en accès offert, rien à gérer.' }, { status: 400 });
    const subId = sub?.stripe_subscription_id;
    if (!subId) return NextResponse.json({ error: 'Aucun abonnement actif.' }, { status: 400 });

    const stripe = getStripe();

    if (action === 'discount') {
      await stripe.subscriptions.update(subId, { discounts: [{ coupon: RETENTION_COUPON }] });
      return NextResponse.json({ ok: true, message: 'Remise de 50% appliquée pour 3 mois.' });
    }
    if (action === 'pause') {
      const live = await stripe.subscriptions.retrieve(subId);
      const itemId = live.items.data[0]?.id;
      const ghost = await priceIdByLookup(stripe, 'appolyn_ghost');
      if (!itemId || !ghost) return NextResponse.json({ error: 'Plan pause indisponible.' }, { status: 500 });
      await stripe.subscriptions.update(subId, {
        items: [{ id: itemId, price: ghost }],
        proration_behavior: 'none',
        cancel_at_period_end: false,
      });
      return NextResponse.json({ ok: true, message: 'Compte mis en pause (3€/mois). Ta config est conservée.' });
    }
    if (action === 'cancel') {
      await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
      return NextResponse.json({ ok: true, message: 'Abonnement résilié à la fin de la période en cours.' });
    }
    return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Stripe indisponible.' }, { status: 502 });
  }
}
