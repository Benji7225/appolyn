import type { SupabaseClient } from '@supabase/supabase-js';

// Churn handling. When a user fully cancels and keeps NO access (no active sub, no
// 3€ pause plan, not comped), we restore each of their apps' App Store metadata to
// the baseline captured the first time Appolyn read it: the originals go back and
// the locales Appolyn added are removed. The destructive ASC work runs in the
// asc-proxy edge function ("restore-snapshot"), authenticated with the service-role
// key. As long as the user keeps any access (notably the 3€ pause plan), nothing is
// touched. Everything here is best-effort and never throws into the webhook.
export async function restoreOnChurn(db: SupabaseClient, stripeCustomerId: string): Promise<void> {
  const { data: subRow } = await db
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  const userId = (subRow as { user_id: string } | null)?.user_id;
  if (!userId) return;

  // Re-read entitlement AFTER the delete was synced. If the user still has any
  // access, keep everything. This is exactly what the 3€ pause plan buys.
  const { data: ent } = await db
    .from('subscriptions')
    .select('status, plan, comp')
    .eq('user_id', userId)
    .maybeSingle();
  const e = ent as { status?: string; plan?: string; comp?: boolean } | null;
  const stillEntitled = !!e && (
    e.comp === true ||
    e.plan === 'pause' ||
    e.status === 'active' ||
    e.status === 'trialing' ||
    e.status === 'past_due'
  );
  if (stillEntitled) return;

  // Every app this user has a baseline for, not yet restored.
  const { data: snaps } = await db
    .from('metadata_snapshots')
    .select('id, asc_app_id, restored_at')
    .eq('user_id', userId)
    .is('restored_at', null);
  const rows = (snaps ?? []) as { id: string; asc_app_id: string | null; restored_at: string | null }[];
  if (rows.length === 0) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;

  for (const row of rows) {
    if (!row.asc_app_id) continue;
    try {
      await fetch(`${url}/functions/v1/asc-proxy?action=restore-snapshot&userId=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: {
          'x-appolyn-service': serviceKey,
          'apikey': serviceKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appId: row.asc_app_id }),
      });
      // The edge sets restored_at on success; record the churn request time too.
      await db.from('metadata_snapshots')
        .update({ churn_requested_at: new Date().toISOString() })
        .eq('id', row.id);
    } catch {
      // best-effort: a failed restore must not crash the webhook
    }
  }
}
