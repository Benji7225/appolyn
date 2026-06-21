'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

// Onglet « Compte » des Réglages : l'essentiel du compte. Les autres onglets
// (Abonnement, App Store Connect, Réseaux & SDK, Sécurité, Mes apps, Partage)
// sont juste à côté, dans la barre du haut.
export default function AccountSettings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const signOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="space-y-4 max-w-md">
      <div className="bg-card border border-border/40 rounded-xl p-6">
        <h2 className="text-sm font-medium mb-4">Compte</h2>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={user?.email ?? ''} disabled className="bg-muted/50 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            L&apos;adresse liée à ton compte. Pour la modifier, contacte le support.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border/40 rounded-xl p-6">
        <h2 className="text-sm font-medium mb-1">Session</h2>
        <p className="text-xs text-muted-foreground mb-4">Te déconnecter de ce compte sur cet appareil.</p>
        <Button variant="outline" onClick={signOut} disabled={signingOut} className="h-9">
          <LogOut className="h-4 w-4 mr-1.5" />
          {signingOut ? 'Déconnexion...' : 'Se déconnecter'}
        </Button>
      </div>
    </div>
  );
}
