'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AddAppDialog } from '@/components/dashboard/add-app-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Smartphone, Pencil, CircleCheck as CheckCircle2, X } from 'lucide-react';
import { useDashboard } from '@/lib/app-context';
import type { App } from '@/lib/database.types';

// "Mes apps" lives inside Réglages (no isolated /dashboard/apps page). Manage the
// connected apps and their App Store Connect App ID here.
export default function SettingsAppsPage() {
  const { reloadApps } = useDashboard();
  const [apps, setApps] = useState<App[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [ascAppId, setAscAppId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => { loadApps(); }, []);

  const loadApps = async () => {
    const { data } = await supabase.from('apps').select('*').order('created_at', { ascending: false });
    if (data) setApps((data ?? []) as App[]);
  };

  const afterChange = async () => { await loadApps(); await reloadApps(); };

  const handleDelete = async (id: string) => {
    if (!confirm('Retirer cette app ? Ses données suivies seront supprimées.')) return;
    setDeleting(id);
    await supabase.from('apps').delete().eq('id', id);
    setApps((prev) => prev.filter((a) => a.id !== id));
    setDeleting(null);
    reloadApps();
  };

  const startEdit = (app: App) => {
    setEditing(app.id);
    setAscAppId(app.asc_app_id ?? '');
  };

  const handleSaveAscId = async (app: App) => {
    setSaving(true);
    await supabase.from('apps').update({ asc_app_id: ascAppId.trim() }).eq('id', app.id);
    setApps((prev) => prev.map((a) => a.id === app.id ? { ...a, asc_app_id: ascAppId.trim() } : a));
    setSaving(false);
    setEditing(null);
    setSaved(app.id);
    reloadApps();
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-sm font-medium">Mes apps</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gère tes applications connectées et leur identifiant App Store Connect.</p>
        </div>
        <AddAppDialog onCreated={afterChange} />
      </div>

      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border/60 bg-card/40">
          <div className="w-14 h-14 rounded-2xl border border-border/40 flex items-center justify-center mb-4">
            <Smartphone className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium mb-2">Aucune app pour l&apos;instant</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Ajoute ta première app pour suivre ses téléchargements, ses mots-clés et sa fiche App Store.
          </p>
          <AddAppDialog onCreated={afterChange} />
        </div>
      ) : (
        <div className="grid gap-3">
          {apps.map((app) => (
            <div key={app.id} className="bg-card border border-border/40 rounded-xl p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm truncate">{app.name}</h3>
                      <Badge variant="outline" className="text-xs h-5 capitalize">{app.platform}</Badge>
                      {saved === app.id && (
                        <span className="flex items-center gap-1 text-xs text-emerald-500">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Enregistré
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{app.bundle_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    Ajoutée le {new Date(app.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <button
                    onClick={() => editing === app.id ? setEditing(null) : startEdit(app)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Modifier l'App ID App Store Connect"
                  >
                    {editing === app.id ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(app.id)}
                    disabled={deleting === app.id}
                    className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    title="Retirer cette app"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {editing === app.id && (
                <div className="mt-4 pt-4 border-t border-border/40">
                  <p className="text-xs text-muted-foreground mb-2">
                    Identifiant App Store Connect, visible dans l&apos;URL de ton app :{' '}
                    <span className="font-mono">appstoreconnect.apple.com/apps/<strong>123456789</strong>/...</span>
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="ex. 123456789"
                      value={ascAppId}
                      onChange={(e) => setAscAppId(e.target.value)}
                      className="h-9 max-w-[220px] font-mono text-sm"
                    />
                    <Button size="sm" className="h-9" disabled={saving} onClick={() => handleSaveAscId(app)}>
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                  {app.asc_app_id && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Actuel : <span className="font-mono text-foreground">{app.asc_app_id}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
