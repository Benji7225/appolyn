import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe, serviceClient, syncSubscription } from '@/lib/server/stripe';
import { restoreOnChurn } from '@/lib/server/churn';

// Stripe webhook: keeps the local subscriptions table in sync with Stripe and
// triggers churn handling (restore the user's original metadata) on cancellation.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook non configuré.' }, { status: 503 });

  const sig = req.headers.get('stripe-signature') ?? '';
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return NextResponse.json({ error: `Signature invalide: ${e instanceof Error ? e.message : ''}` }, { status: 400 });
  }

  const db = serviceClient();
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'checkout.session.completed': {
        // For checkout.session.completed, fetch the subscription to sync fully.
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.subscription) {
            const sub = await getStripe().subscriptions.retrieve(
              typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
            );
            await syncSubscription(db, sub);
          }
        } else {
          await syncSubscription(db, event.data.object as Stripe.Subscription);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(db, sub);
        // Churn: restore the user's metadata to how it was when they joined.
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        await restoreOnChurn(db, customerId);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    // Acknowledge to avoid infinite retries on a non-recoverable error, but log.
    console.error('webhook handling error', e);
  }
  return NextResponse.json({ received: true });
}
