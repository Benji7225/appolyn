import Stripe from 'stripe';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-only Stripe + service-role Supabase helpers. The secret key and the
// service role key live in Vercel env, never in the browser.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY manquante');
  return new Stripe(key);
}

export function serviceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function priceIdByLookup(stripe: Stripe, lookupKey: string): Promise<string | null> {
  const r = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  return r.data[0]?.id ?? null;
}

export const PLAN_LOOKUP: Record<string, string> = {
  monthly: 'appolyn_monthly',
  annual: 'appolyn_annual',
  ghost: 'appolyn_ghost',
};

// Find or create the Stripe customer for a user, persisting the id on the
// subscriptions row so the webhook can map customer -> user.
export async function getOrCreateCustomer(stripe: Stripe, db: SupabaseClient, userId: string, email: string): Promise<string> {
  const { data: row } = await db.from('subscriptions').select('stripe_customer_id').eq('user_id', userId).maybeSingle();
  const existing = (row as { stripe_customer_id: string | null } | null)?.stripe_customer_id;
  if (existing) return existing;
  const customer = await stripe.customers.create({ email, metadata: { user_id: userId } });
  await db.from('subscriptions').upsert(
    { user_id: userId, stripe_customer_id: customer.id, status: 'none', updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  );
  return customer.id;
}

// Reflect a Stripe subscription onto the local subscriptions row.
export async function syncSubscription(db: SupabaseClient, sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const item = sub.items.data[0];
  const priceLookup = item?.price?.lookup_key ?? null;
  const plan = priceLookup === 'appolyn_annual' ? 'annual' : priceLookup === 'appolyn_ghost' ? 'ghost' : priceLookup === 'appolyn_monthly' ? 'monthly' : null;
  const status = sub.status === 'active' || sub.status === 'trialing' ? (plan === 'ghost' ? 'ghost' : 'active') : sub.status;
  // current_period_end moved onto the subscription item in recent Stripe API versions.
  const periodEndUnix = (item as unknown as { current_period_end?: number })?.current_period_end
    ?? (sub as unknown as { current_period_end?: number }).current_period_end
    ?? null;
  await db.from('subscriptions').update({
    stripe_subscription_id: sub.id,
    status,
    plan,
    cancel_at_period_end: sub.cancel_at_period_end,
    current_period_end: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('stripe_customer_id', customerId);
}
