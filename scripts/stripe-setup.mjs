// One-off, idempotent Stripe catalog setup for Appolyn.
// Run: node --env-file=.env scripts/stripe-setup.mjs
// Creates the product, prices (monthly / annual / ghost) referenced by lookup_key,
// and the "first month at 1€" coupon. Safe to re-run: it skips what already exists.
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) { console.error('STRIPE_SECRET_KEY manquante'); process.exit(1); }
const stripe = new Stripe(key);
const mode = key.startsWith('sk_live') ? 'LIVE' : 'TEST';
console.log(`Stripe mode: ${mode}`);

async function ensureProduct() {
  const list = await stripe.products.list({ limit: 100, active: true });
  const found = list.data.find((p) => p.metadata?.appolyn === 'true' || p.name === 'Appolyn');
  if (found) { console.log(`Produit OK: ${found.id}`); return found; }
  const p = await stripe.products.create({
    name: 'Appolyn',
    description: "ASO tout-en-un pour devs indie iOS : mots-clés, fiche App Store optimisée et publiée, concurrents, avis.",
    metadata: { appolyn: 'true' },
  });
  console.log(`Produit cree: ${p.id}`);
  return p;
}

async function ensurePrice(productId, lookupKey, { amount, interval, nickname }) {
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (existing.data.length) { console.log(`Prix OK (${lookupKey}): ${existing.data[0].id}`); return existing.data[0]; }
  const price = await stripe.prices.create({
    product: productId,
    currency: 'eur',
    unit_amount: amount,
    recurring: { interval },
    lookup_key: lookupKey,
    nickname,
  });
  console.log(`Prix cree (${lookupKey}): ${price.id} = ${(amount / 100).toFixed(2)}€/${interval}`);
  return price;
}

async function ensureCoupon() {
  const id = 'appolyn_first_month_1eur';
  try {
    const c = await stripe.coupons.retrieve(id);
    console.log(`Coupon OK: ${c.id}`);
    return c;
  } catch {
    const c = await stripe.coupons.create({
      id,
      name: '1er mois a 1€',
      amount_off: 1900, // 19€ off on a 20€ first invoice -> 1€
      currency: 'eur',
      duration: 'once',
    });
    console.log(`Coupon cree: ${c.id}`);
    return c;
  }
}

const product = await ensureProduct();
await ensurePrice(product.id, 'appolyn_monthly', { amount: 2000, interval: 'month', nickname: 'Appolyn mensuel' });
await ensurePrice(product.id, 'appolyn_annual', { amount: 20000, interval: 'year', nickname: 'Appolyn annuel (2 mois offerts)' });
await ensurePrice(product.id, 'appolyn_ghost', { amount: 300, interval: 'month', nickname: 'Appolyn pause (conserve tes publications)' });
await ensureCoupon();
console.log('Setup Stripe termine.');
