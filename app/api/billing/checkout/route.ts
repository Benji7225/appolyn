import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe, serviceClient, priceIdByLookup, getOrCreateCustomer, PLAN_LOOKUP } from '@/lib/server/stripe';

// Creates a Stripe Checkout Session for the chosen plan and returns its URL.
// Monthly gets the "first month at 1€" coupon applied automatically.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { plan?: string };
  try { body = await req.json(); } catch { body = {}; }
  const plan = body.plan ?? 'monthly';
  const lookup = PLAN_LOOKUP[plan];
  if (!lookup) return NextResponse.json({ error: 'Plan inconnu.' }, { status: 400 });

  try {
    const stripe = getStripe();
    const db = serviceClient();
    const priceId = await priceIdByLookup(stripe, lookup);
    if (!priceId) return NextResponse.json({ error: 'Tarif introuvable côté Stripe.' }, { status: 500 });
    const customerId = await getOrCreateCustomer(stripe, db, user.id, user.email ?? '');

    const origin = req.headers.get('origin') ?? new URL(req.url).origin;
    const isMonthly = plan === 'monthly';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // Card required (filters tire-kickers); monthly gets a 7-day free trial,
      // annual is billed straight away (committed buyers).
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard/settings/billing?checkout=success`,
      cancel_url: `${origin}/dashboard/settings/billing?checkout=cancel`,
      subscription_data: {
        metadata: { user_id: user.id },
        ...(isMonthly ? { trial_period_days: 7 } : {}),
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Stripe indisponible.' }, { status: 502 });
  }
}
