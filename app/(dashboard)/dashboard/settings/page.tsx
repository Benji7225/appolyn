'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User } from '@supabase/supabase-js';

export default function AccountSettings() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <h2 className="text-sm font-medium mb-4">Compte</h2>
      <div className="space-y-1.5 max-w-md">
        <Label>Email</Label>
        <Input value={user?.email ?? ''} disabled className="bg-muted/50 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          L&apos;adresse liée à ton compte. Pour la modifier, contacte le support.
        </p>
      </div>
    </div>
  );
}
