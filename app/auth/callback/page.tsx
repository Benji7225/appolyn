'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Point d'atterrissage OAuth (Google). Le client Supabase échange automatiquement
// le code/hash présent dans l'URL ; on attend que la session existe AVANT de
// rediriger vers le dashboard, pour éviter la course où le garde du dashboard
// renvoie vers /login parce que la session n'est pas encore prête.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Une erreur OAuth peut revenir en query (?error_description=) ou en hash (#error_description=).
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
    const errDesc = url.searchParams.get('error_description') ?? hash.get('error_description');
    if (errDesc) { setError(errDesc); return; }

    let done = false;
    const finish = () => { if (done) return; done = true; router.replace('/app'); };

    supabase.auth.getSession().then(({ data: { session } }) => { if (session) finish(); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { if (session) finish(); });

    // Garde-fou : si aucune session n'arrive, on renvoie proprement vers /login.
    const t = setTimeout(() => { if (!done) router.replace('/login?auth=timeout'); }, 6000);
    return () => { subscription.unsubscribe(); clearTimeout(t); };
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {error ? (
        <div className="max-w-sm text-center space-y-3">
          <p className="text-sm text-destructive">Connexion Google impossible : {error}</p>
          <a href="/login" className="text-sm text-primary hover:underline">Retour à la connexion</a>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          Connexion en cours…
        </div>
      )}
    </div>
  );
}
