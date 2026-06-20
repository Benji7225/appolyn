'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleCheck as CheckCircle2 } from 'lucide-react';

export default function SecuritySettings() {
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
    } else {
      setSaved(true);
      setNewPassword('');
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <h2 className="text-sm font-medium mb-4">Mot de passe</h2>
      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Nouveau mot de passe</Label>
          <Input
            id="new-password"
            type="password"
            placeholder="Au moins 8 caractères"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} size="sm">
            {saving ? 'Enregistrement...' : 'Mettre à jour'}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
              Mis à jour
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
