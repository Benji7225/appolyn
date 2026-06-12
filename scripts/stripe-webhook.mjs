// Creates the Stripe webhook endpoint for Appolyn and stores its signing secret
// in .env (gitignored) WITHOUT printing it. Run: node --env-file=.env scripts/stripe-webhook.mjs
import Stripe from 'stripe';
import { appendFileSync } from 'node:fs';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) { console.error('STRIPE_SECRET_KEY manquante'); process.exit(1); }
const stripe = new Stripe(key);

const URL = 'https://appolyn.vercel.app/api/billing/webhook';
const EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

const list = await stripe.webhookEndpoints.list({ limit: 100 });
const existing = list.data.find((w) => w.url === URL);
if (existing) {
  console.log(`Webhook deja present (${existing.id}). Le secret n'est visible qu'a la creation.`);
  console.log('Si STRIPE_WEBHOOK_SECRET manque dans .env, supprime ce endpoint dans Stripe puis relance ce script.');
  process.exit(0);
}

const wh = await stripe.webhookEndpoints.create({ url: URL, enabled_events: EVENTS });
appendFileSync('.env', `\nSTRIPE_WEBHOOK_SECRET=${wh.secret}\n`);
console.log(`Webhook cree (${wh.id}). Secret ecrit dans .env (non affiche).`);
