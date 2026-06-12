import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe, serviceClient } from '@/lib/server/stripe';

// Opens the Stripe Customer Portal so the user can manage / cancel their plan.
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

  try {
    const db = serviceClient();
    const { data: row } = await db.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    const customerId = (row as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
    if (!customerId) return NextResponse.json({ error: "Aucun abonnement à gérer pour l'instant." }, { status: 400 });
    const stripe = getStripe();
    const origin = req.headers.get('origin') ?? new URL(req.url).origin;
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/settings/billing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Stripe indisponible.' }, { status: 502 });
  }
}
