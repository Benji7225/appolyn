'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Plus, RefreshCw, Check, ChevronLeft, Store } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type AscApp = { id: string; name: string; bundleId: string };

export function AddAppDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'loading' | 'pick' | 'manual'>('loading');
  const [ascApps, setAscApps] = useState<AscApp[]>([]);
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null);

  // Manual form (fallback / Android / apps not on App Store Connect)
  const [name, setName] = useState('');
  const [bundleId, setBundleId] = useState('');
  const [ascAppId, setAscAppId] = useState('');
  const [platform, setPlatform] = useState<'ios' | 'android' | 'both'>('ios');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // When the dialog opens, try to load the user's REAL apps straight from App
  // Store Connect so they just click one (zero typing — Benji's "tout
  // automatique"). Already-added apps are shown disabled. Falls back to the
  // manual form if ASC isn't connected yet or the call fails.
  const loadAscApps = useCallback(async () => {
    setMode('loading');
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setMode('manual'); return; }
      const [existing, r] = await Promise.all([
        supabase.from('apps').select('asc_app_id'),
        fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=list-apps`, {
          headers: { Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_ANON_KEY },
        }),
      ]);
      const already = new Set(
        ((existing.data ?? []) as { asc_app_id: string | null }[])
          .map((a) => a.asc_app_id)
          .filter((x): x is string => !!x),
      );
      setExistingIds(already);
      const j = await r.json() as { apps?: AscApp[]; error?: string };
      if (!r.ok || j.error || !j.apps || j.apps.length === 0) { setMode('manual'); return; }
      setAscApps(j.apps);
      setMode('pick');
    } catch {
      setMode('manual');
    }
  }, []);

  useEffect(() => { if (open) loadAscApps(); }, [open, loadAscApps]);

  const resetForm = () => {
    setName(''); setBundleId(''); setAscAppId(''); setPlatform('ios');
    setError(''); setAdding(null);
  };

  // One click on an ASC app = added, everything prefilled from App Store Connect.
  const addFromAsc = async (app: AscApp) => {
    setAdding(app.id); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAdding(null); return; }
    const { error: insErr } = await supabase.from('apps').insert({
      user_id: user.id,
      name: app.name,
      bundle_id: app.bundleId,
      platform: 'ios',
      asc_app_id: app.id,
    });
    if (insErr) { setError(insErr.message); setAdding(null); return; }
    setOpen(false); resetForm(); onCreated();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error: insErr } = await supabase.from('apps').insert({
      user_id: user.id,
      name,
      bundle_id: bundleId,
      platform,
      asc_app_id: ascAppId.trim(),
    });

    if (insErr) {
      setError(insErr.message);
      setLoading(false);
    } else {
      setOpen(false);
      resetForm();
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

        {mode === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" /> Chargement de tes apps App Store Connect…
          </div>
        )}

        {mode === 'pick' && (
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-3">
              Choisis ton app : on remplit tout automatiquement depuis App Store Connect.
            </p>
            <div className="space-y-1.5 max-h-[320px] overflow-auto scrollbar-macos -mx-1 px-1">
              {ascApps.map((a) => {
                const added = existingIds.has(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    disabled={added || adding !== null}
                    onClick={() => addFromAsc(a)}
                    className="w-full flex items-center gap-3 text-left rounded-lg border border-border/50 bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-accent/40 transition-colors disabled:opacity-60 disabled:cursor-default"
                  >
                    <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Store className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.name}</p>
                      <p className="text-xs text-muted-foreground truncate font-mono">{a.bundleId}</p>
                    </div>
                    {added ? (
                      <span className="text-[11px] text-muted-foreground shrink-0 inline-flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Déjà ajoutée
                      </span>
                    ) : adding === a.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            {error && <p className="text-sm text-destructive mt-3">{error}</p>}
            <button
              type="button"
              onClick={() => { resetForm(); setMode('manual'); }}
              className="text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
            >
              Saisir une app manuellement →
            </button>
          </div>
        )}

        {mode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {ascApps.length > 0 && (
              <button
                type="button"
                onClick={() => setMode('pick')}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Revenir à mes apps App Store Connect
              </button>
            )}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
