'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

export function AddAppDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [bundleId, setBundleId] = useState('');
  const [ascAppId, setAscAppId] = useState('');
  const [platform, setPlatform] = useState<'ios' | 'android' | 'both'>('ios');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error } = await supabase.from('apps').insert({
      user_id: user.id,
      name,
      bundle_id: bundleId,
      platform,
      asc_app_id: ascAppId.trim(),
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setOpen(false);
      setName('');
      setBundleId('');
      setAscAppId('');
      setPlatform('ios');
      setLoading(false);
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 text-sm">
          <Plus className="h-4 w-4" />
          Ajouter une app
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une app</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="app-name">Nom de l&apos;app</Label>
            <Input
              id="app-name"
              placeholder="Mon app géniale"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bundle-id">Bundle ID</Label>
            <Input
              id="bundle-id"
              placeholder="com.exemple.monapp"
              value={bundleId}
              onChange={(e) => setBundleId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asc-app-id">App ID App Store Connect <span className="text-muted-foreground font-normal">(recommandé)</span></Label>
            <Input
              id="asc-app-id"
              placeholder="ex. 6774912134"
              value={ascAppId}
              onChange={(e) => setAscAppId(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Visible dans l&apos;URL App Store Connect : appstoreconnect.apple.com/apps/<span className="font-mono text-foreground">123456789</span>/… Nécessaire pour charger les vraies données.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="platform">Plateforme</Label>
            <select
              id="platform"
              className="w-full text-sm bg-background border border-input rounded-md px-3 h-10 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as 'ios' | 'android' | 'both')}
            >
              <option value="ios">iOS</option>
              <option value="android">Android</option>
              <option value="both">Les deux</option>
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
