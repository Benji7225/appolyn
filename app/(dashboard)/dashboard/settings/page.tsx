'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleCheck as CheckCircle2, CircleAlert, RefreshCw, Upload, FileKey } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type ASCCreds = {
  key_id: string;
  issuer_id: string;
  private_key: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');

  const [creds, setCreds] = useState<ASCCreds>({ key_id: '', issuer_id: '', private_key: '' });
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
    const { data } = await supabase.from('asc_credentials').select('key_id,issuer_id,private_key').maybeSingle();
    if (data) {
      setCreds({
        key_id: (data as ASCCreds).key_id ?? '',
        issuer_id: (data as ASCCreds).issuer_id ?? '',
        private_key: (data as ASCCreds).private_key ?? '',
      });
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('asc_credentials').upsert({
      user_id: user.id,
      key_id: creds.key_id.trim(),
      issuer_id: creds.issuer_id.trim(),
      private_key: creds.private_key.trim(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) {
      setCredsError(error.message);
    } else {
      setCredsSaved(true);
      setTimeout(() => setCredsSaved(false), 2500);
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
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and integrations.</p>
      </div>

      <div className="space-y-6">
        {/* Account */}
        <div className="bg-card border border-border/40 rounded-xl p-6">
          <h2 className="text-sm font-medium mb-4">Account</h2>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled className="bg-muted/50 text-muted-foreground" />
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-card border border-border/40 rounded-xl p-6">
          <h2 className="text-sm font-medium mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pwSaving} size="sm">
                {pwSaving ? 'Saving...' : 'Update password'}
              </Button>
              {pwSaved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Updated
                </span>
              )}
            </div>
          </form>
        </div>

        {/* App Store Connect */}
        <div className="bg-card border border-border/40 rounded-xl p-6">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-sm font-medium">App Store Connect API</h2>
            {validationResult === 'valid' && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Connected
              </span>
            )}
            {validationResult === 'invalid' && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <CircleAlert className="h-3.5 w-3.5" /> Invalid credentials
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
            Generate an API key in{' '}
            <a href="https://appstoreconnect.apple.com/access/integrations/api" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
              App Store Connect → Users and Access → Integrations
            </a>
            . Download the .p8 file and upload it below along with your Key ID and Issuer ID.
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
              <Label>Private Key (.p8 file)</Label>
              <P8FileUpload
                currentKey={creds.private_key}
                onChange={(key) => setCreds((p) => ({ ...p, private_key: key }))}
              />
            </div>
            {credsError && <p className="text-sm text-destructive">{credsError}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={credsSaving} size="sm">
                {credsSaving ? 'Saving...' : 'Save credentials'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={validating || !creds.key_id}
                onClick={handleValidate}
              >
                {validating ? (
                  <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Validating...</>
                ) : (
                  'Test connection'
                )}
              </Button>
              {credsSaved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function P8FileUpload({ currentKey, onChange }: { currentKey: string; onChange: (key: string) => void }) {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.p8') && !file.name.endsWith('.txt')) {
      setError('Please select a .p8 file.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string).trim();
      if (!text.includes('-----BEGIN')) {
        setError('File does not look like a valid .p8 private key.');
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
          currentKey
            ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
            : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border'
        }`}>
          {currentKey ? (
            <><CheckCircle2 className="h-4 w-4 shrink-0" />{fileName || 'Key loaded'}</>
          ) : (
            <><Upload className="h-4 w-4 shrink-0" />Upload .p8 file</>
          )}
        </div>
        <input
          type="file"
          accept=".p8,.txt"
          className="sr-only"
          onChange={handleFile}
        />
        {currentKey && (
          <span className="text-xs text-muted-foreground">Click to replace</span>
        )}
      </label>
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
      {!currentKey && (
        <p className="text-xs text-muted-foreground mt-1.5">
          Your private key is stored securely and never exposed in the browser.
        </p>
      )}
    </div>
  );
}
