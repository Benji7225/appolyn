'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CircleCheck as CheckCircle2, Clock, Info, Upload, RefreshCw, Globe, CircleAlert } from 'lucide-react';
import type { App } from '@/lib/database.types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const LIMITS = { title: 30, subtitle: 30, keywords: 100, description: 4000, promotional_text: 170 };

const ASC_LOCALES: { code: string; label: string; country: string }[] = [
  { code: 'en-US', label: 'English (US)', country: 'us' },
  { code: 'en-GB', label: 'English (UK)', country: 'gb' },
  { code: 'fr-FR', label: 'French', country: 'fr' },
  { code: 'de-DE', label: 'German', country: 'de' },
  { code: 'es-ES', label: 'Spanish (Spain)', country: 'es' },
  { code: 'es-MX', label: 'Spanish (Mexico)', country: 'mx' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)', country: 'br' },
  { code: 'it-IT', label: 'Italian', country: 'it' },
  { code: 'ja', label: 'Japanese', country: 'jp' },
  { code: 'ko', label: 'Korean', country: 'kr' },
  { code: 'zh-Hans', label: 'Chinese (Simplified)', country: 'cn' },
  { code: 'zh-Hant', label: 'Chinese (Traditional)', country: 'tw' },
  { code: 'nl-NL', label: 'Dutch', country: 'nl' },
  { code: 'sv', label: 'Swedish', country: 'se' },
  { code: 'da', label: 'Danish', country: 'dk' },
  { code: 'fi', label: 'Finnish', country: 'fi' },
  { code: 'nb', label: 'Norwegian', country: 'no' },
  { code: 'pl', label: 'Polish', country: 'pl' },
  { code: 'ru', label: 'Russian', country: 'ru' },
  { code: 'tr', label: 'Turkish', country: 'tr' },
  { code: 'ar-SA', label: 'Arabic', country: 'sa' },
  { code: 'hi', label: 'Hindi', country: 'in' },
];

type LocaleFields = {
  title: string;
  subtitle: string;
  keywords: string;
  description: string;
  promotional_text: string;
  version: string;
  localization_id?: string; // ASC localization ID if fetched
};

type PublishStatus = 'idle' | 'loading' | 'success' | 'error';

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  return (
    <span className={`text-xs tabular-nums ${over ? 'text-destructive' : 'text-muted-foreground'}`}>
      {len}/{max}
    </span>
  );
}

function emptyFields(): LocaleFields {
  return { title: '', subtitle: '', keywords: '', description: '', promotional_text: '', version: '' };
}

export default function MetadataPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedLocale, setSelectedLocale] = useState('en-US');
  const [fields, setFields] = useState<LocaleFields>(emptyFields());
  const [history, setHistory] = useState<{ id: string; title: string; country_code: string; created_at: string; is_current: boolean }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('idle');
  const [publishError, setPublishError] = useState('');
  const [ascVersionId, setAscVersionId] = useState('');
  const [hasCreds, setHasCreds] = useState(false);
  const [loadingAsc, setLoadingAsc] = useState(false);

  useEffect(() => { loadApps(); checkCreds(); }, []);

  useEffect(() => {
    if (selectedAppId) {
      loadLocaleData(selectedAppId, selectedLocale);
      loadHistory(selectedAppId);
    }
  }, [selectedAppId, selectedLocale]);

  const checkCreds = async () => {
    const { data } = await supabase.from('asc_credentials').select('id').maybeSingle();
    setHasCreds(!!data);
  };

  const loadApps = async () => {
    const { data } = await supabase.from('apps').select('*').order('created_at', { ascending: false });
    const rows = (data ?? []) as App[];
    setApps(rows);
    if (rows.length > 0) setSelectedAppId(rows[0].id);
  };

  const loadLocaleData = useCallback(async (appId: string, locale: string) => {
    const country = ASC_LOCALES.find((l) => l.code === locale)?.country ?? locale;
    const { data } = await supabase
      .from('app_localizations')
      .select('*')
      .eq('app_id', appId)
      .eq('country_code', country)
      .eq('is_current', true)
      .maybeSingle();
    if (data) {
      const d = data as Record<string, unknown>;
      setFields({
        title: (d.title as string) ?? '',
        subtitle: (d.subtitle as string) ?? '',
        keywords: (d.keywords as string) ?? '',
        description: (d.description as string) ?? '',
        promotional_text: (d.promotional_text as string) ?? '',
        version: (d.version as string) ?? '',
        localization_id: (d.localization_id as string) ?? undefined,
      });
    } else {
      setFields(emptyFields());
    }
  }, []);

  const loadHistory = async (appId: string) => {
    const { data } = await supabase
      .from('app_localizations')
      .select('id,title,country_code,created_at,is_current')
      .eq('app_id', appId)
      .order('created_at', { ascending: false })
      .limit(15);
    if (data) setHistory((data ?? []) as typeof history);
  };

  const handleSave = async () => {
    if (!selectedAppId) return;
    setSaving(true);
    const country = ASC_LOCALES.find((l) => l.code === selectedLocale)?.country ?? selectedLocale;

    await supabase
      .from('app_localizations')
      .update({ is_current: false })
      .eq('app_id', selectedAppId)
      .eq('country_code', country)
      .eq('is_current', true);

    await supabase.from('app_localizations').insert({
      app_id: selectedAppId,
      country_code: country,
      title: fields.title,
      subtitle: fields.subtitle,
      keywords: fields.keywords,
      description: fields.description,
      promotional_text: fields.promotional_text,
      version: fields.version,
      is_current: true,
    });

    setSaving(false);
    setSaved(true);
    loadHistory(selectedAppId);
    setTimeout(() => setSaved(false), 2500);
  };

  const fetchFromASC = async () => {
    setLoadingAsc(true);
    setPublishError('');
    try {
      const selectedApp = apps.find((a) => a.id === selectedAppId);
      if (!selectedApp?.asc_app_id) {
        setPublishError('Set the App Store Connect App ID in the Apps page first.');
        setLoadingAsc(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-localizations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appId: selectedApp.asc_app_id }),
      });
      const json = await r.json() as { versionId?: string; localizations?: { locale: string; id: string; title: string; subtitle: string; keywords: string; description: string; promotionalText: string }[]; error?: string };
      if (json.error) { setPublishError(json.error); setLoadingAsc(false); return; }

      setAscVersionId(json.versionId ?? '');
      const match = json.localizations?.find((l) => l.locale === selectedLocale);
      if (match) {
        setFields((prev) => ({
          ...prev,
          title: match.title ?? prev.title,
          subtitle: match.subtitle ?? prev.subtitle,
          keywords: match.keywords ?? prev.keywords,
          description: match.description ?? prev.description,
          promotional_text: match.promotionalText ?? prev.promotional_text,
          localization_id: match.id,
        }));
      } else {
        setPublishError(`No localization found for ${selectedLocale} in App Store Connect.`);
      }
    } catch (e) {
      setPublishError('Failed to connect to App Store Connect.');
    }
    setLoadingAsc(false);
  };

  const handlePublish = async () => {
    if (!fields.localization_id) {
      setPublishError('Fetch from App Store Connect first to get the localization ID.');
      return;
    }
    setPublishStatus('loading');
    setPublishError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=update-localization`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          localizationId: fields.localization_id,
          title: fields.title,
          subtitle: fields.subtitle,
          keywords: fields.keywords,
          description: fields.description,
          promotionalText: fields.promotional_text,
        }),
      });
      const json = await r.json() as { success?: boolean; error?: string };
      if (json.error) {
        setPublishError(json.error);
        setPublishStatus('error');
      } else {
        setPublishStatus('success');
        // update published_at
        const country = ASC_LOCALES.find((l) => l.code === selectedLocale)?.country ?? selectedLocale;
        await supabase.from('app_localizations')
          .update({ last_published_at: new Date().toISOString() })
          .eq('app_id', selectedAppId)
          .eq('country_code', country)
          .eq('is_current', true);
        setTimeout(() => setPublishStatus('idle'), 3000);
      }
    } catch {
      setPublishError('Network error. Try again.');
      setPublishStatus('error');
    }
  };

  const f = (key: keyof typeof LIMITS) => ({
    value: fields[key] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value })),
  });

  if (apps.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-medium mb-2">No apps yet</h2>
        <p className="text-sm text-muted-foreground">Add an app from the Overview page first.</p>
      </div>
    );
  }

  const selectedApp = apps.find((a) => a.id === selectedAppId);

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Metadata Editor</h1>
          <p className="text-sm text-muted-foreground mt-1">Edit and publish your App Store metadata per locale.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="text-sm bg-card border border-border/40 rounded-lg px-3 h-9 text-foreground focus:outline-none"
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
          >
            {apps.map((app) => (
              <option key={app.id} value={app.id}>{app.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 bg-card border border-border/40 rounded-lg px-2 h-9">
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <select
              className="text-sm bg-transparent text-foreground focus:outline-none"
              value={selectedLocale}
              onChange={(e) => setSelectedLocale(e.target.value)}
            >
              {ASC_LOCALES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ASC Actions */}
      {hasCreds && (
        <div className="flex items-center gap-3 mb-5 p-4 bg-card border border-border/40 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">App Store Connect</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedApp?.asc_app_id
                ? `App ID: ${selectedApp.asc_app_id}`
                : 'Set App Store Connect App ID in Apps settings to enable sync.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchFromASC} disabled={loadingAsc || !selectedApp?.asc_app_id} className="shrink-0">
            {loadingAsc ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
            {loadingAsc ? 'Fetching...' : 'Fetch from ASC'}
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={publishStatus === 'loading' || !fields.localization_id}
            className="shrink-0"
          >
            {publishStatus === 'loading' ? (
              <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Publishing...</>
            ) : publishStatus === 'success' ? (
              <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Published</>
            ) : (
              <><Upload className="h-3.5 w-3.5 mr-1.5" />Publish to ASC</>
            )}
          </Button>
        </div>
      )}

      {!hasCreds && (
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg mb-5">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Connect your App Store Connect API key in <a href="/dashboard/settings" className="underline hover:text-foreground">Settings</a> to enable direct publishing.
          </p>
        </div>
      )}

      {publishError && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-5">
          <CircleAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive leading-relaxed">{publishError}</p>
        </div>
      )}

      {/* Fields */}
      <div className="bg-card border border-border/40 rounded-xl p-6 space-y-6 mb-6">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>App Title</Label>
            <CharCount value={fields.title} max={LIMITS.title} />
          </div>
          <Input placeholder="My Awesome App" {...f('title')} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Subtitle</Label>
            <CharCount value={fields.subtitle} max={LIMITS.subtitle} />
          </div>
          <Input placeholder="The best app for..." {...f('subtitle')} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Keywords</Label>
            <CharCount value={fields.keywords} max={LIMITS.keywords} />
          </div>
          <Input placeholder="productivity,tasks,notes,organize" {...f('keywords')} />
          <p className="text-xs text-muted-foreground">Separate with commas, no spaces. iOS only.</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Description</Label>
            <CharCount value={fields.description} max={LIMITS.description} />
          </div>
          <Textarea placeholder="Describe your app..." rows={8} className="resize-none" {...f('description')} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Promotional Text</Label>
            <CharCount value={fields.promotional_text} max={LIMITS.promotional_text} />
          </div>
          <Textarea placeholder="Short promo text shown above description..." rows={3} className="resize-none" {...f('promotional_text')} />
          <p className="text-xs text-muted-foreground">Can be updated without a new app version.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Version</Label>
          <Input
            placeholder="1.0.0"
            value={fields.version}
            onChange={(e) => setFields((p) => ({ ...p, version: e.target.value }))}
            className="max-w-[160px]"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="h-9">
            {saving ? 'Saving...' : 'Save draft'}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-card border border-border/40 rounded-xl p-6">
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            History
          </h2>
          <div className="space-y-0">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-4 py-2.5 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm truncate">{h.title || '(untitled)'}</span>
                  {h.is_current && <Badge variant="outline" className="text-xs h-4 px-1.5">Current</Badge>}
                  <span className="text-xs text-muted-foreground uppercase shrink-0">{h.country_code}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(h.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
