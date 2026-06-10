'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CircleAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Finalises a social connection. The OAuth callback handed us a signed deposit in
// the URL fragment containing the ALREADY-ENCRYPTED tokens. We decode it (no secret
// needed, we never decrypt here) and write the row under the user's own RLS.
type Deposit = {
  u: string; p: string; name?: string; ext?: string;
  at?: string; rt?: string; exp_token?: string; scopes?: string;
};

function decodeDeposit(d: string): Deposit | null {
  try {
    const body = d.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const json = new TextDecoder().decode(Uint8Array.from(atob(body), (c) => c.charCodeAt(0)));
    return JSON.parse(json) as Deposit;
  } catch {
    return null;
  }
}

export default function SocialConnectedPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const d = params.get('d');
      const payload = d ? decodeDeposit(d) : null;
      if (!payload) { setError('Lien de connexion invalide.'); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== payload.u) { setError('Session invalide. Reconnecte-toi puis réessaie.'); return; }

      const { error: upErr } = await supabase.from('social_accounts').upsert({
        user_id: user.id,
        platform: payload.p,
        account_name: payload.name ?? '',
        external_id: payload.ext ?? '',
        access_token: payload.at ?? '',
        refresh_token: payload.rt ?? '',
        token_expires_at: payload.exp_token ?? null,
        scopes: payload.scopes ?? '',
        status: 'connected',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform' });

      if (upErr) { setError('Enregistrement impossible : ' + upErr.message); return; }

      // Wipe the fragment (so the deposit isn't left in history) and go back.
      window.history.replaceState(null, '', '/dashboard/social/connected');
      router.replace(`/dashboard/marketing/organic/content?connected=${payload.p}`);
    })();
  }, [router]);

  return (
    <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
      {error ? (
        <><CircleAlert className="h-4 w-4 text-destructive" /> {error}</>
      ) : (
        <><Loader2 className="h-4 w-4 animate-spin" /> Finalisation de la connexion...</>
      )}
    </div>
  );
}
