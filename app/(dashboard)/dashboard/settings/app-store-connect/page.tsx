'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleCheck as CheckCircle2, CircleAlert, RefreshCw, Upload } from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type ASCCreds = {
  key_id: string;
  issuer_id: string;
  private_key: string;
  vendor_number: string;
};

export default function AppStoreConnectSettings() {
  const [creds, setCreds] = useState<ASCCreds>({ key_id: '', issuer_id: '', private_key: '', vendor_number: '' });
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);

  useEffect(() => {
    loadCreds();
  }, []);

  // Never reads the private key: it is encrypted server-side and the column is
  // not readable by the browser. A stored row means a key is on file.
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

  // Saves through the edge function, which encrypts the .p8 before storing it.
  // The browser never writes the key to the database directly. An empty
  // private_key means "keep the existing stored key".
  const handleSaveCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setValidationResult(null);

    if (!creds.private_key.trim() && !hasStoredKey) {
      setError('Importe ton fichier de clé privée .p8.');
      setSaving(false);
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
        setError(json.error);
      } else {
        setHasStoredKey(true);
        setCreds((p) => ({ ...p, private_key: '' })); // drop the key from memory
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      setError('Erreur réseau. Réessaie.');
    }
    setSaving(false);
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
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-sm font-medium">Clé API App Store Connect</h2>
        {validationResult === 'valid' && (
          <span className="flex items-center gap-1 text-xs text-emerald-500">
            <CheckCircle2 className="h-3.5 w-3.5" /> Connecté
          </span>
        )}
        {validationResult === 'invalid' && (
          <span className="flex items-center gap-1 text-xs text-red-500">
            <CircleAlert className="h-3.5 w-3.5" /> Identifiants invalides
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
        Génère une clé API dans{' '}
        <a href="https://appstoreconnect.apple.com/access/integrations/api" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
          App Store Connect → Utilisateurs et accès → Intégrations
        </a>
        . Télécharge le fichier .p8 et importe-le ci-dessous avec ton Key ID et ton Issuer ID.
      </p>
      <form onSubmit={handleSaveCreds} className="space-y-4">
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
          <p className="text-xs text-muted-foreground">Affiché à côté de ta clé, dans la liste des clés API (10 caractères).</p>
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
          <p className="text-xs text-muted-foreground">En haut de la page Intégrations, au-dessus de la liste des clés (le même pour toutes tes clés).</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vendor-number">Vendor Number <span className="text-muted-foreground font-normal">(optionnel)</span></Label>
          <Input
            id="vendor-number"
            placeholder="ex. 12345678"
            value={creds.vendor_number}
            onChange={(e) => setCreds((p) => ({ ...p, vendor_number: e.target.value }))}
            className="font-mono text-sm max-w-[220px]"
          />
          <p className="text-xs text-muted-foreground">
            Disponible dans App Store Connect → Ventes et tendances. Nécessaire pour afficher tes vrais téléchargements et revenus.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Clé privée (fichier .p8)</Label>
          <P8FileUpload
            currentKey={creds.private_key}
            alreadyStored={hasStoredKey}
            onChange={(key) => setCreds((p) => ({ ...p, private_key: key }))}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} size="sm">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={validating || !creds.key_id}
            onClick={handleValidate}
          >
            {validating ? (
              <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Vérification...</>
            ) : (
              'Tester la connexion'
            )}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
              Enregistré
            </span>
          )}
        </div>
        {validationResult === 'valid' && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-foreground">Connexion réussie. Tes vraies données sont prêtes à se charger.</span>
            <a href="/dashboard" className="text-primary hover:underline font-medium ml-auto whitespace-nowrap">Voir mes données →</a>
          </div>
        )}
      </form>
    </div>
  );
}

function P8FileUpload({ currentKey, alreadyStored, onChange }: { currentKey: string; alreadyStored: boolean; onChange: (key: string) => void }) {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  // "loaded" = a key is on file (either just picked, or already stored server-side)
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
      <label className="flex items-center gap-3 cursor-pointer group">
        <div className={`flex items-center gap-2.5 px-4 h-10 rounded-lg border text-sm transition-colors ${
          loaded
            ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-500'
            : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border'
        }`}>
          {loaded ? (
            <><CheckCircle2 className="h-4 w-4 shrink-0" />{fileName || (currentKey ? 'Clé chargée' : 'Clé enregistrée')}</>
          ) : (
            <><Upload className="h-4 w-4 shrink-0" />Importer le fichier .p8</>
          )}
        </div>
        <input
          type="file"
          accept=".p8,.txt"
          className="sr-only"
          onChange={handleFile}
        />
        {loaded && (
          <span className="text-xs text-muted-foreground">Cliquer pour remplacer</span>
        )}
      </label>
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
      <p className="text-xs text-muted-foreground mt-1.5">
        Ta clé privée est chiffrée avant stockage et jamais exposée dans le navigateur.
      </p>
    </div>
  );
}
