import type { SupabaseClient } from '@supabase/supabase-js';

// Churn handling. The chosen approach (simplest + safest): when a user joins we
// snapshot their original App Store metadata; if they fully cancel, we restore
// that original so they get back exactly what they had before Appolyn touched it.
// The restore writes to App Store Connect, so it's wired carefully and only runs
// when a real snapshot exists. Until the ASC restore action is enabled, this only
// records the churn (no destructive action) — never a fake "done".
export async function restoreOnChurn(db: SupabaseClient, stripeCustomerId: string): Promise<void> {
  const { data: row } = await db
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  const userId = (row as { user_id: string } | null)?.user_id;
  if (!userId) return;

  const { data: snap } = await db
    .from('metadata_snapshots')
    .select('id, restored_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  // No snapshot or already restored: nothing to do.
  if (!snap || (snap as { restored_at: string | null }).restored_at) return;

  // TODO(restore): call the ASC restore once the asc-proxy "restore-snapshot"
  // action is enabled. Intentionally a no-op for now (no fake action).
  await db
    .from('metadata_snapshots')
    .update({ churn_requested_at: new Date().toISOString() })
    .eq('id', (snap as { id: string }).id);
}
