'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  CircleCheck as CheckCircle2, Clock, Info, Upload, RefreshCw, Globe,
  CircleAlert, Sparkles, ChevronDown, ChevronUp, Languages, Layers,
} from 'lucide-react';

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
  localization_id?: string;
  info_localization_id?: string;
};

type GenFields = {
  title: string;
  subtitle: string;
  keywords: string;
  description: string;
  promotional_text: string;
};

type PublishStatus = 'idle' | 'loading' | 'success' | 'error';

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const pct = len / max;
  return (
    <span className={`text-xs tabular-nums font-medium ${len > max ? 'text-destructive' : pct > 0.85 ? 'text-amber-500' : 'text-muted-foreground/50'}`}>
      {len}/{max}
    </span>
  );
}

function emptyFields(): LocaleFields {
  return { title: '', subtitle: '', keywords: '', description: '', promotional_text: '', version: '' };
}

function FieldRow({ label, hint, value, max, onChange, textarea, rows: r = 3 }: {
  label: string; hint?: string; value: string; max: number;
  onChange: (v: string) => void; textarea?: boolean; rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[13px] font-medium">{label}</Label>
        <CharCount value={value} max={max} />
      </div>
      {textarea ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={r}
          className="resize-none text-sm leading-relaxed"
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
      )}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function GenField({ label, value, max, onChange, textarea }: {
  label: string; value: string; max: number; onChange: (v: string) => void; textarea?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <CharCount value={value} max={max} />
      </div>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={label === 'Description' ? 5 : 2} className="resize-none text-sm" />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
      )}
    </div>
  );
}

export default function MetadataPage() {
  const { selectedApp } = useApp();
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
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [generated, setGenerated] = useState<Record<string, GenFields>>({});
  const [genErrors, setGenErrors] = useState<Record<string, string>>({});
  const [genOpen, setGenOpen] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [savedAll, setSavedAll] = useState(false);
  const [publishingAll, setPublishingAll] = useState(false);
  const [publishAllResults, setPublishAllResults] = useState<{ locale: string; ok: boolean; error?: string }[]>([]);
  const [publishAllMsg, setPublishAllMsg] = useState('');

  useEffect(() => { checkCreds(); }, []);

  useEffect(() => {
    if (selectedApp) {
      loadLocaleData(selectedApp.id, selectedLocale);
      loadHistory(selectedApp.id);
    }
  }, [selectedApp?.id, selectedLocale]);

  const checkCreds = async () => {
    const { data } = await supabase.from('asc_credentials').select('id').maybeSingle();
    setHasCreds(!!data);
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
    if (!selectedApp) return;
    setSaving(true);
    const country = ASC_LOCALES.find((l) => l.code === selectedLocale)?.country ?? selectedLocale;

    await supabase
      .from('app_localizations')
      .update({ is_current: false })
      .eq('app_id', selectedApp.id)
      .eq('country_code', country)
      .eq('is_current', true);

    await supabase.from('app_localizations').insert({
      app_id: selectedApp.id,
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
    loadHistory(selectedApp.id);
    setTimeout(() => setSaved(false), 2500);
  };

  const fetchFromASC = async () => {
    setLoadingAsc(true);
    setPublishError('');
    try {
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
      const json = await r.json() as {
        versionId?: string;
        localizations?: { locale: string; id: string | null; infoLocalizationId: string | null; title: string; subtitle: string; keywords: string; description: string; promotionalText: string }[];
        error?: string;
      };
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
          localization_id: match.id ?? undefined,
          info_localization_id: match.infoLocalizationId ?? undefined,
        }));
      } else {
        setPublishError(`No localization found for ${selectedLocale} in App Store Connect.`);
      }
    } catch {
      setPublishError('Failed to connect to App Store Connect.');
    }
    setLoadingAsc(false);
  };

  const handlePublish = async () => {
    if (!fields.localization_id && !fields.info_localization_id) {
      setPublishError('Fetch from App Store Connect first to link this locale.');
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
          infoLocalizationId: fields.info_localization_id,
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
        const country = ASC_LOCALES.find((l) => l.code === selectedLocale)?.country ?? selectedLocale;
        await supabase.from('app_localizations')
          .update({ last_published_at: new Date().toISOString() })
          .eq('app_id', selectedApp!.id)
          .eq('country_code', country)
          .eq('is_current', true);
        setTimeout(() => setPublishStatus('idle'), 3000);
      }
    } catch {
      setPublishError('Network error. Try again.');
      setPublishStatus('error');
    }
  };

  const handleGenerateAll = async () => {
    if (!fields.title.trim()) { setGenError('Renseigne au moins le titre de base avant de générer.'); return; }
    setGenerating(true); setGenError(''); setGenerated({}); setGenErrors({}); setGenOpen(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const targets = ASC_LOCALES.filter((l) => l.code !== selectedLocale).map((l) => ({ code: l.code, label: l.label }));
      const r = await fetch('/api/generate-metadata', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base: {
            locale: selectedLocale,
            title: fields.title, subtitle: fields.subtitle, keywords: fields.keywords,
            description: fields.description, promotional_text: fields.promotional_text,
          },
          targetLocales: targets,
        }),
      });
      const json = await r.json() as { localizations?: Record<string, GenFields>; errors?: Record<string, string>; error?: string };
      if (json.error) { setGenError(json.error); }
      else { setGenerated(json.localizations ?? {}); setGenErrors(json.errors ?? {}); }
    } catch {
      setGenError('La génération a échoué. Réessaie.');
    }
    setGenerating(false);
  };

  const editGen = (code: string, key: keyof GenFields, value: string) =>
    setGenerated((prev) => ({ ...prev, [code]: { ...prev[code], [key]: value } }));

  const handleSaveAllGenerated = async () => {
    if (!selectedApp) return;
    setSavingAll(true);
    for (const [code, gf] of Object.entries(generated)) {
      const country = ASC_LOCALES.find((l) => l.code === code)?.country ?? code;
      await supabase.from('app_localizations').update({ is_current: false })
        .eq('app_id', selectedApp.id).eq('country_code', country).eq('is_current', true);
      await supabase.from('app_localizations').insert({
        app_id: selectedApp.id, country_code: country,
        title: gf.title, subtitle: gf.subtitle, keywords: gf.keywords,
        description: gf.description, promotional_text: gf.promotional_text,
        version: fields.version, is_current: true,
      });
    }
    setSavingAll(false); setSavedAll(true); loadHistory(selectedApp.id);
    setTimeout(() => setSavedAll(false), 3000);
  };

  const handlePublishAllToASC = async () => {
    if (!hasCreds || !selectedApp?.asc_app_id) {
      setPublishAllMsg('Connect your App Store Connect key and set the ASC App ID first.');
      return;
    }
    setPublishingAll(true); setPublishAllMsg(''); setPublishAllResults([]);
    const localizations = [
      {
        locale: selectedLocale,
        title: fields.title, subtitle: fields.subtitle, keywords: fields.keywords,
        description: fields.description, promotionalText: fields.promotional_text,
      },
      ...Object.entries(generated).map(([locale, gf]) => ({
        locale,
        title: gf.title, subtitle: gf.subtitle, keywords: gf.keywords,
        description: gf.description, promotionalText: gf.promotional_text,
      })),
    ];
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=publish-localizations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appId: selectedApp.asc_app_id, localizations }),
      });
      const json = await r.json() as { editable?: boolean; published?: number; total?: number; results?: { locale: string; ok: boolean; error?: string }[]; error?: string };
      if (json.error) { setPublishAllMsg(json.error); setPublishingAll(false); return; }
      setPublishAllResults(json.results ?? []);
      setPublishAllMsg(`${json.published ?? 0}/${json.total ?? 0} langues publiées dans App Store Connect.`);
      const okLocales = (json.results ?? []).filter((x) => x.ok).map((x) => x.locale);
      for (const loc of okLocales) {
        const country = ASC_LOCALES.find((l) => l.code === loc)?.country ?? loc;
        await supabase.from('app_localizations')
          .update({ last_published_at: new Date().toISOString() })
          .eq('app_id', selectedApp.id).eq('country_code', country).eq('is_current', true);
      }
    } catch {
      setPublishAllMsg('La publication a échoué. Réessaie.');
    }
    setPublishingAll(false);
  };

  const f = (key: keyof typeof LIMITS) => ({
    value: fields[key] ?? '',
    onChange: (v: string) => setFields((prev) => ({ ...prev, [key]: v })),
  });

  if (!selectedApp) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-24 text-center">
        <Layers className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-medium mb-2">Aucune app sélectionnée</h2>
        <p className="text-sm text-muted-foreground">Sélectionne une app dans la barre en haut.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl scrollbar-macos overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">App Store Page</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Édite les métadonnées de <span className="font-medium text-foreground">{selectedApp.name}</span> par langue.
          </p>
        </div>

        {/* Locale selector */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 px-3 h-9 rounded-lg border border-border bg-card text-sm flex-1 max-w-xs">
            <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <select
              className="flex-1 bg-transparent text-foreground focus:outline-none text-sm"
              value={selectedLocale}
              onChange={(e) => setSelectedLocale(e.target.value)}
            >
              {ASC_LOCALES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ASC Actions bar */}
        {hasCreds && (
          <div className="flex items-center gap-3 mb-5 p-4 bg-card border border-border/60 rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium">App Store Connect</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedApp.asc_app_id
                  ? `App ID ${selectedApp.asc_app_id}`
                  : 'Définis l\'App ID ASC dans Apps pour activer la synchro.'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchFromASC} disabled={loadingAsc || !selectedApp.asc_app_id} className="shrink-0 h-8">
              {loadingAsc ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              {loadingAsc ? 'Récupération...' : 'Récupérer'}
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={publishStatus === 'loading' || (!fields.localization_id && !fields.info_localization_id)}
              className="shrink-0 h-8"
            >
              {publishStatus === 'loading' ? (
                <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Publication...</>
              ) : publishStatus === 'success' ? (
                <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Publié</>
              ) : (
                <><Upload className="h-3.5 w-3.5 mr-1.5" />Publier</>
              )}
            </Button>
          </div>
        )}

        {!hasCreds && (
          <div className="flex items-start gap-2.5 p-3.5 bg-muted/50 rounded-lg mb-5 border border-border/40">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connecte ta clé App Store Connect dans les <a href="/dashboard/settings" className="underline hover:text-foreground">Réglages</a> pour activer la publication directe.
            </p>
          </div>
        )}

        {publishError && (
          <div className="flex items-start gap-2.5 p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg mb-5">
            <CircleAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive leading-relaxed">{publishError}</p>
          </div>
        )}

        {/* AI generation banner */}
        <div className="flex items-center gap-3 mb-5 p-4 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 border border-emerald-500/20 rounded-xl">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Languages className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium">Générer toutes les langues</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              L&apos;IA localise tes champs dans les {ASC_LOCALES.length - 1} autres langues en respectant les limites Apple.
            </p>
          </div>
          <Button size="sm" onClick={handleGenerateAll} disabled={generating} className="shrink-0 h-8">
            {generating ? (
              <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Génération...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Générer ({ASC_LOCALES.length - 1})</>
            )}
          </Button>
        </div>

        {genError && (
          <div className="flex items-start gap-2.5 p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg mb-5">
            <CircleAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive leading-relaxed">{genError}</p>
          </div>
        )}

        {/* Fields */}
        <div className="bg-card border border-border/60 rounded-xl divide-y divide-border/40 overflow-hidden mb-5">
          <div className="p-5 space-y-5">
            <FieldRow label="Titre" value={fields.title} max={LIMITS.title} onChange={(v) => setFields((p) => ({ ...p, title: v }))} />
            <FieldRow label="Sous-titre" value={fields.subtitle} max={LIMITS.subtitle} onChange={(v) => setFields((p) => ({ ...p, subtitle: v }))} />
            <FieldRow
              label="Mots-clés"
              hint="Séparés par des virgules, sans espaces. iOS seulement."
              value={fields.keywords}
              max={LIMITS.keywords}
              onChange={(v) => setFields((p) => ({ ...p, keywords: v }))}
            />
          </div>
          <div className="p-5 space-y-5">
            <FieldRow label="Description" value={fields.description} max={LIMITS.description} onChange={(v) => setFields((p) => ({ ...p, description: v }))} textarea rows={8} />
            <FieldRow
              label="Texte promotionnel"
              hint="Peut être mis à jour sans nouvelle version."
              value={fields.promotional_text}
              max={LIMITS.promotional_text}
              onChange={(v) => setFields((p) => ({ ...p, promotional_text: v }))}
              textarea
              rows={3}
            />
          </div>
          <div className="p-5">
            <div className="space-y-1.5 max-w-[160px]">
              <Label className="text-[13px] font-medium">Version</Label>
              <Input
                placeholder="1.0.0"
                value={fields.version}
                onChange={(e) => setFields((p) => ({ ...p, version: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 mb-8">
          <Button onClick={handleSave} disabled={saving} className="h-9">
            {saving ? 'Enregistrement...' : 'Enregistrer le brouillon'}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
              Enregistré
            </span>
          )}
        </div>

        {/* Generated languages */}
        {Object.keys(generated).length > 0 && (
          <div className="bg-card border border-border/60 rounded-xl p-5 mb-5">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div>
                <h2 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  Langues générées
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Object.keys(generated).length} langues. Relis, ajuste, puis enregistre.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {savedAll && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                    Enregistré
                  </span>
                )}
                <Button size="sm" variant="outline" onClick={handleSaveAllGenerated} disabled={savingAll} className="h-8">
                  {savingAll ? 'Enregistrement...' : 'Enregistrer en brouillon'}
                </Button>
                <Button size="sm" onClick={handlePublishAllToASC} disabled={publishingAll || !hasCreds} className="h-8">
                  {publishingAll ? (
                    <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Publication...</>
                  ) : (
                    <><Upload className="h-3.5 w-3.5 mr-1.5" />Publier dans ASC</>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-0">
              {ASC_LOCALES.filter((l) => generated[l.code]).map((l) => {
                const gf = generated[l.code];
                const isOpen = genOpen === l.code;
                return (
                  <div key={l.code} className="border-b border-border/40 last:border-0">
                    <button
                      onClick={() => setGenOpen(isOpen ? null : l.code)}
                      className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-accent/20 -mx-1 px-1 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[13px] font-medium shrink-0">{l.label}</span>
                        <span className="text-xs text-muted-foreground truncate">· {gf.title}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-muted-foreground/60 tabular-nums hidden sm:inline">
                          T {gf.title.length}/{LIMITS.title} · S {gf.subtitle.length}/{LIMITS.subtitle}
                        </span>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="pb-4 space-y-4">
                        <GenField label="Titre" value={gf.title} max={LIMITS.title} onChange={(v) => editGen(l.code, 'title', v)} />
                        <GenField label="Sous-titre" value={gf.subtitle} max={LIMITS.subtitle} onChange={(v) => editGen(l.code, 'subtitle', v)} />
                        <GenField label="Mots-clés" value={gf.keywords} max={LIMITS.keywords} onChange={(v) => editGen(l.code, 'keywords', v)} />
                        <GenField label="Description" value={gf.description} max={LIMITS.description} onChange={(v) => editGen(l.code, 'description', v)} textarea />
                        <GenField label="Texte promotionnel" value={gf.promotional_text} max={LIMITS.promotional_text} onChange={(v) => editGen(l.code, 'promotional_text', v)} textarea />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {Object.keys(genErrors).length > 0 && (
              <p className="text-xs text-muted-foreground mt-4">
                {Object.keys(genErrors).length} langue(s) non générée(s) :{' '}
                {Object.keys(genErrors).map((c) => ASC_LOCALES.find((l) => l.code === c)?.label ?? c).join(', ')}.
              </p>
            )}

            {publishAllMsg && (
              <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-border/40">
                <p className="text-xs text-foreground">{publishAllMsg}</p>
                {publishAllResults.some((x) => !x.ok) && (
                  <ul className="mt-2 space-y-1">
                    {publishAllResults.filter((x) => !x.ok).map((x) => (
                      <li key={x.locale} className="text-xs text-destructive">
                        {ASC_LOCALES.find((l) => l.code === x.locale)?.label ?? x.locale} : {x.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-card border border-border/60 rounded-xl p-5">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Historique
          </h2>
          <div className="space-y-0">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-4 py-2.5 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[13px] truncate">{h.title || '(sans titre)'}</span>
                  {h.is_current && <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">Actuel</Badge>}
                  <span className="text-[11px] text-muted-foreground uppercase shrink-0">{h.country_code}</span>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {new Date(h.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
