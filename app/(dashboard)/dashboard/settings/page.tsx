'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleCheck as CheckCircle2, CircleAlert, RefreshCw, Upload, User, Lock, Key, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type ASCCreds = {
  key_id: string;
  issuer_id: string;
  private_key: string;
  vendor_number: string;
};

type Section = 'general' | 'asc';

const sections: { id: Section; label: string; icon: typeof User; desc: string }[] = [
  { id: 'general', label: 'Général', icon: User, desc: 'Compte et mot de passe' },
  { id: 'asc', label: 'App Store Connect', icon: Key, desc: 'Clé API et identifiants' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('general');
  const [user, setUser] = useState<UserType | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');

  const [creds, setCreds] = useState<ASCCreds>({ key_id: '', issuer_id: '', private_key: '', vendor_number: '' });
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [credsSaving, setCredsSaving] = useState(false);
  const [credsSaved, setCredsSaved] = useState(false);
  const [credsError, setCredsError] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    loadCreds();
  }, []);

  const loadCreds = async () => {
    const { data } = await supabase.from('asc_credentials').select('key_id,issuer_id,vendor_number').maybeSingle();
    if (data) {
      setCreds({
        key_id: (data as ASCCreds).key_id ?? '',
        issuer_id: (data as ASCCreds).issuer_id ?? '',
        private_key: '',
        vendor_number: (data as ASCCreds).vendor_number ?? '',
      });
      setHasStoredKey(true);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSaving(true);
    setPwError('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwError(error.message);
    } else {
      setPwSaved(true);
      setNewPassword('');
      setTimeout(() => setPwSaved(false), 2500);
    }
    setPwSaving(false);
  };

  const handleSaveCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredsSaving(true);
    setCredsError('');
    setValidationResult(null);

    if (!creds.private_key.trim() && !hasStoredKey) {
      setCredsError('Importe ton fichier .p8.');
      setCredsSaving(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=save-credentials`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key_id: creds.key_id.trim(),
          issuer_id: creds.issuer_id.trim(),
          private_key: creds.private_key.trim(),
          vendor_number: creds.vendor_number.trim(),
        }),
      });
      const json = await r.json() as { success?: boolean; error?: string };
      if (json.error) {
        setCredsError(json.error);
      } else {
        setHasStoredKey(true);
        setCreds((p) => ({ ...p, private_key: '' }));
        setCredsSaved(true);
        setTimeout(() => setCredsSaved(false), 2500);
      }
    } catch {
      setCredsError('Erreur réseau. Réessaie.');
    }
    setCredsSaving(false);
  };

  const handleValidate = async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(
        `${SUPABASE_URL}/functions/v1/asc-proxy?action=validate-credentials`,
        { headers: { Authorization: `Bearer ${session?.access_token}`, 'apikey': SUPABASE_ANON_KEY } }
      );
      const json = await r.json() as { valid?: boolean };
      setValidationResult(json.valid ? 'valid' : 'invalid');
    } catch {
      setValidationResult('invalid');
    }
    setValidating(false);
  };

  return (
    <div className="flex min-h-full">
      {/* Left nav — fixed width, Shopify-style */}
      <aside className="w-64 shrink-0 border-r border-border p-6">
        <h1 className="text-lg font-semibold tracking-tight mb-6">Paramètres</h1>
        <nav className="space-y-0.5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors',
                activeSection === s.id
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )}
            >
              <s.icon className={cn('h-4 w-4 shrink-0', activeSection === s.id ? 'text-foreground' : 'text-muted-foreground')} />
              <div className="flex-1 min-w-0">
                <p className="truncate">{s.label}</p>
              </div>
              <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 transition-transform', activeSection === s.id ? 'text-foreground rotate-90' : 'text-muted-foreground/40')} />
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-8 max-w-2xl">
        {activeSection === 'general' && (
          <div className="space-y-6">
            <SectionHeader
              title="Général"
              desc="Ton adresse email et ton mot de passe."
            />

            {/* Account info */}
            <SettingsCard title="Informations du compte">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/40">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-base font-semibold text-emerald-400 shrink-0">
                    {(user?.email ?? 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{(user?.email ?? '').split('@')[0] || 'Compte'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email ?? '—'}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Adresse email</Label>
                  <Input value={user?.email ?? ''} disabled className="bg-muted/50 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">L&apos;email ne peut pas être modifié pour l&apos;instant.</p>
                </div>
              </div>
            </SettingsCard>

            {/* Change password */}
            <SettingsCard
              title="Mot de passe"
              icon={Lock}
            >
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="8 caractères minimum"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="max-w-sm"
                  />
                </div>
                {pwError && <p className="text-sm text-destructive">{pwError}</p>}
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={pwSaving} size="sm">
                    {pwSaving ? 'Sauvegarde...' : 'Mettre à jour'}
                  </Button>
                  {pwSaved && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Mis à jour
                    </span>
                  )}
                </div>
              </form>
            </SettingsCard>
          </div>
        )}

        {activeSection === 'asc' && (
          <div className="space-y-6">
            <SectionHeader
              title="App Store Connect"
              desc="Connecte ton compte développeur Apple pour récupérer tes vraies données."
            />

            {/* Status badge */}
            <SettingsCard
              title="Statut de la connexion"
              icon={Key}
              badge={
                validationResult === 'valid' ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Connecté
                  </span>
                ) : validationResult === 'invalid' ? (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <CircleAlert className="h-3.5 w-3.5" /> Invalide
                  </span>
                ) : hasStoredKey ? (
                  <span className="text-xs text-muted-foreground">Clé enregistrée</span>
                ) : undefined
              }
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                Génère une clé API dans{' '}
                <a
                  href="https://appstoreconnect.apple.com/access/integrations/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2 hover:no-underline"
                >
                  App Store Connect → Utilisateurs → Intégrations
                </a>
                . Télécharge le fichier .p8 et remplis les champs ci-dessous.
              </p>
            </SettingsCard>

            <SettingsCard title="Identifiants API">
              <form onSubmit={handleSaveCreds} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="key-id">Key ID</Label>
                    <Input
                      id="key-id"
                      placeholder="XXXXXXXXXX"
                      value={creds.key_id}
                      onChange={(e) => setCreds((p) => ({ ...p, key_id: e.target.value }))}
                      required
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor-number">
                      Vendor Number
                      <span className="text-muted-foreground font-normal ml-1">(optionnel)</span>
                    </Label>
                    <Input
                      id="vendor-number"
                      placeholder="ex. 12345678"
                      value={creds.vendor_number}
                      onChange={(e) => setCreds((p) => ({ ...p, vendor_number: e.target.value }))}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="issuer-id">Issuer ID</Label>
                  <Input
                    id="issuer-id"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={creds.issuer_id}
                    onChange={(e) => setCreds((p) => ({ ...p, issuer_id: e.target.value }))}
                    required
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Clé privée (.p8)</Label>
                  <P8FileUpload
                    currentKey={creds.private_key}
                    alreadyStored={hasStoredKey}
                    onChange={(key) => setCreds((p) => ({ ...p, private_key: key }))}
                  />
                </div>
                <div className="pt-1 border-t border-border/40">
                  <p className="text-xs text-muted-foreground mb-1">
                    Le numéro vendeur est requis pour voir tes téléchargements et revenus réels (Sales &amp; Trends).
                  </p>
                </div>
                {credsError && <p className="text-sm text-destructive">{credsError}</p>}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button type="submit" disabled={credsSaving} size="sm">
                    {credsSaving ? 'Sauvegarde...' : 'Enregistrer'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={validating || !creds.key_id}
                    onClick={handleValidate}
                  >
                    {validating ? (
                      <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Vérification…</>
                    ) : (
                      'Tester la connexion'
                    )}
                  </Button>
                  {credsSaved && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Enregistré
                    </span>
                  )}
                </div>
              </form>
            </SettingsCard>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-2">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

function SettingsCard({
  title, icon: Icon, children, badge,
}: {
  title: string;
  icon?: typeof User;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function P8FileUpload({ currentKey, alreadyStored, onChange }: { currentKey: string; alreadyStored: boolean; onChange: (key: string) => void }) {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const loaded = !!currentKey || alreadyStored;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.p8') && !file.name.endsWith('.txt')) {
      setError('Sélectionne un fichier .p8.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string).trim();
      if (!text.includes('-----BEGIN')) {
        setError('Ce fichier ne ressemble pas à une clé privée .p8 valide.');
        return;
      }
      onChange(text);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <label className="inline-flex items-center gap-3 cursor-pointer">
        <div className={cn(
          'flex items-center gap-2.5 px-4 h-10 rounded-lg border text-sm transition-colors',
          loaded
            ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
            : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border',
        )}>
          {loaded ? (
            <><CheckCircle2 className="h-4 w-4 shrink-0" />{fileName || (currentKey ? 'Clé chargée' : 'Clé enregistrée')}</>
          ) : (
            <><Upload className="h-4 w-4 shrink-0" />Importer le fichier .p8</>
          )}
        </div>
        {loaded && <span className="text-xs text-muted-foreground">Cliquer pour remplacer</span>}
        <input type="file" accept=".p8,.txt" className="sr-only" onChange={handleFile} />
      </label>
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
      <p className="text-xs text-muted-foreground mt-1.5">
        Ta clé privée est chiffrée avant stockage et n&apos;est jamais exposée dans le navigateur.
      </p>
    </div>
  );
}
