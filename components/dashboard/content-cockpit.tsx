'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useDashboard } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Instagram, Music2, Youtube, Facebook, Sparkles, Upload, Plus, Trash2, X,
  Copy, Check, Calendar, Loader2, AlertCircle, FileText, Send, type LucideIcon,
} from 'lucide-react';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Platforms ──────────────────────────────────────────────────────────────
type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook';
const PLATFORMS: { id: Platform; name: string; icon: LucideIcon; color: string }[] = [
  { id: 'tiktok', name: 'TikTok', icon: Music2, color: '#010101' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
];
const platformMeta = (p: Platform) => PLATFORMS.find((x) => x.id === p)!;

// Platforms whose real publishing is wired end-to-end.
const PUBLISH_WIRED: Platform[] = ['youtube', 'facebook', 'instagram', 'tiktok'];

// Facebook + Instagram are both covered by a single Meta (Facebook Login)
// connection, stored under platform 'meta'.
const accountPlatform = (p: Platform): string => (p === 'facebook' || p === 'instagram' ? 'meta' : p);

// ─── Types ──────────────────────────────────────────────────────────────────
type Target = {
  id?: string;
  platform: Platform;
  caption: string;
  hashtags: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  platform_url?: string;
  error?: string;
};
type Post = {
  id: string;
  title: string;
  script: string;
  media_url: string;
  media_type: 'video' | 'image' | 'none';
  scheduled_at: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'partial';
  content_post_targets: Target[];
};

const statusChip: Record<Target['status'], { label: string; cls: string }> = {
  draft: { label: 'Brouillon', cls: 'text-muted-foreground bg-muted border-border' },
  scheduled: { label: 'Planifié', cls: 'text-sky-600 bg-sky-50 border-sky-200' },
  publishing: { label: 'Publication...', cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  published: { label: 'Publié', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  failed: { label: 'Échec', cls: 'text-destructive bg-destructive/10 border-destructive/20' },
};

// ─── Main ───────────────────────────────────────────────────────────────────
export function ContentCockpit() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [connected, setConnected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Post | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: postRows }, { data: accRows }] = await Promise.all([
      supabase
        .from('content_posts')
        .select('id,title,script,media_url,media_type,scheduled_at,status,content_post_targets(id,platform,caption,hashtags,status,platform_url,error)')
        .order('created_at', { ascending: false }),
      supabase.from('social_accounts').select('platform').eq('status', 'connected'),
    ]);
    setPosts((postRows as Post[] | null) ?? []);
    setConnected(((accRows as { platform: string }[] | null) ?? []).map((a) => a.platform));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Un post, des légendes adaptées par l&apos;IA pour chaque plateforme, publiées depuis un seul endroit.
        </p>
        <Button size="sm" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4 mr-1.5" /> Nouveau post
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border border-dashed border-border/60 bg-card/40">
          <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center mb-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium">Aucun post pour l&apos;instant</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md leading-relaxed">
            Crée ton premier post : colle ton script, choisis tes plateformes, et laisse l&apos;IA adapter la légende pour chacune.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4 mr-1.5" /> Nouveau post
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostRow key={p.id} post={p} onEdit={() => setEditing(p)} />
          ))}
        </div>
      )}

      {editing && (
        <PostEditor
          initial={editing === 'new' ? null : editing}
          connected={connected}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Post row (list) ──────────────────────────────────────────────────────────
function PostRow({ post, onEdit }: { post: Post; onEdit: () => void }) {
  return (
    <button
      onClick={onEdit}
      className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium flex-1 truncate">{post.title || 'Sans titre'}</p>
        {post.scheduled_at && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
            <Calendar className="h-3 w-3" />
            {new Date(post.scheduled_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      {post.script && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.script}</p>}
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        {post.content_post_targets.length === 0 && (
          <span className="text-[11px] text-muted-foreground/60">Aucune plateforme</span>
        )}
        {post.content_post_targets.map((t) => {
          const m = platformMeta(t.platform);
          const s = statusChip[t.status];
          return (
            <span key={t.platform} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${s.cls}`}>
              <m.icon className="h-3 w-3" /> {s.label}
            </span>
          );
        })}
      </div>
    </button>
  );
}

// ─── Editor ─────────────────────────────────────────────────────────────────
function PostEditor({ initial, connected, onClose, onSaved }: {
  initial: Post | null;
  connected: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const platformConnected = (p: Platform) => connected.includes(accountPlatform(p));
  const { selectedApp } = useDashboard();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [script, setScript] = useState(initial?.script ?? '');
  const [mediaUrl, setMediaUrl] = useState(initial?.media_url ?? '');
  const [scheduledAt, setScheduledAt] = useState(
    initial?.scheduled_at ? toLocalInput(initial.scheduled_at) : '',
  );
  const [selected, setSelected] = useState<Platform[]>(
    initial?.content_post_targets.map((t) => t.platform) ?? ['tiktok', 'instagram', 'youtube'],
  );
  const [targets, setTargets] = useState<Record<Platform, { caption: string; hashtags: string }>>(() => {
    const base = {} as Record<Platform, { caption: string; hashtags: string }>;
    for (const p of PLATFORMS) base[p.id] = { caption: '', hashtags: '' };
    for (const t of initial?.content_post_targets ?? []) base[t.platform] = { caption: t.caption, hashtags: t.hashtags };
    return base;
  });

  const [uploading, setUploading] = useState(false);
  const [adapting, setAdapting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState<string | null>(initial?.id ?? null);
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('private');
  const [publishing, setPublishing] = useState<Platform | null>(null);
  const [publishingAll, setPublishingAll] = useState(false);
  const [pubResult, setPubResult] = useState<Partial<Record<Platform, { url?: string; error?: string; draft?: boolean }>>>({});

  const togglePlatform = (p: Platform) =>
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));

  const handleUpload = async (file: File) => {
    setUploading(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expirée.');
      const ext = file.name.split('.').pop() ?? 'mp4';
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('content-media').upload(path, file, {
        cacheControl: '3600', upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('content-media').getPublicUrl(path);
      setMediaUrl(pub.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de l\'upload.');
    }
    setUploading(false);
  };

  const handleAdapt = async () => {
    if (!script.trim()) { setError('Ajoute un script avant d\'adapter.'); return; }
    if (selected.length === 0) { setError('Choisis au moins une plateforme.'); return; }
    setAdapting(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/adapt-captions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, script, app: selectedApp?.name ?? '', platforms: selected }),
      });
      const j = await r.json() as { results?: Record<string, { caption: string; hashtags: string }>; error?: string };
      if (j.error) { setError(j.error); }
      else if (j.results) {
        setTargets((prev) => {
          const next = { ...prev };
          for (const [p, v] of Object.entries(j.results!)) next[p as Platform] = v;
          return next;
        });
      }
    } catch {
      setError('Adaptation IA impossible (réseau).');
    }
    setAdapting(false);
  };

  // Saves the post + its per-platform targets, returning the post id (or null on
  // failure). Used both by "Enregistrer" and before publishing.
  const persist = async (): Promise<string | null> => {
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expirée.');
      const scheduledIso = scheduledAt ? new Date(scheduledAt).toISOString() : null;
      const status = scheduledIso ? 'scheduled' : 'draft';
      const postPayload = {
        user_id: user.id,
        app_id: selectedApp?.id ?? null,
        title: title.trim(),
        script: script.trim(),
        media_url: mediaUrl,
        media_type: mediaUrl ? 'video' : 'none',
        scheduled_at: scheduledIso,
        status,
        updated_at: new Date().toISOString(),
      };

      let postId = savedId ?? initial?.id;
      if (postId) {
        const { error: upErr } = await supabase.from('content_posts').update(postPayload).eq('id', postId);
        if (upErr) throw upErr;
      } else {
        const { data, error: insErr } = await supabase.from('content_posts').insert(postPayload).select('id').single();
        if (insErr) throw insErr;
        postId = (data as { id: string }).id;
        setSavedId(postId);
      }
      if (!postId) throw new Error('Post non créé.');
      const pid: string = postId; // const so it stays narrowed inside the map closure

      // Sync targets: upsert selected, delete unselected.
      const rows = selected.map((p) => ({
        post_id: pid,
        platform: p,
        caption: targets[p].caption,
        hashtags: targets[p].hashtags,
        updated_at: new Date().toISOString(),
      }));
      if (rows.length) {
        const { error: tErr } = await supabase.from('content_post_targets').upsert(rows, { onConflict: 'post_id,platform' });
        if (tErr) throw tErr;
      }
      const unselected = PLATFORMS.map((p) => p.id).filter((p) => !selected.includes(p));
      if (unselected.length) {
        await supabase.from('content_post_targets').delete().eq('post_id', pid).in('platform', unselected);
      }
      return pid;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de l\'enregistrement.');
      return null;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const id = await persist();
    setSaving(false);
    if (id) onSaved();
  };

  // Publishes a single already-saved post to one platform.
  const publishOne = async (id: string, p: Platform) => {
    setPubResult((s) => ({ ...s, [p]: {} }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`/api/publish/${p}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id, privacy }),
      });
      const j = await r.json() as { ok?: boolean; url?: string; error?: string; draft?: boolean };
      if (j.error) setPubResult((s) => ({ ...s, [p]: { error: j.error } }));
      else setPubResult((s) => ({ ...s, [p]: { url: j.url, draft: j.draft } }));
    } catch {
      setPubResult((s) => ({ ...s, [p]: { error: 'Publication impossible (réseau).' } }));
    }
  };

  const publishPlatform = async (p: Platform) => {
    setSaving(true);
    const id = await persist();
    setSaving(false);
    if (!id) return;
    setPublishing(p);
    await publishOne(id, p);
    setPublishing(null);
  };

  // Publishes to every selected platform that is connected, in parallel.
  const publishAll = async () => {
    setSaving(true);
    const id = await persist();
    setSaving(false);
    if (!id) return;
    const list = selected.filter((p) => PUBLISH_WIRED.includes(p) && platformConnected(p));
    if (list.length === 0) { setError('Aucune plateforme connectée parmi celles sélectionnées.'); return; }
    setPublishingAll(true);
    await Promise.all(list.map((p) => publishOne(id, p)));
    setPublishingAll(false);
  };

  const handleDelete = async () => {
    if (!initial?.id) return;
    if (!confirm('Supprimer ce post ?')) return;
    setSaving(true);
    await supabase.from('content_posts').delete().eq('id', initial.id);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-xl h-full bg-background border-l border-border shadow-2xl overflow-y-auto scrollbar-macos">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-5 h-14 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{initial ? 'Modifier le post' : 'Nouveau post'}</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="post-title">Titre interne</Label>
            <Input id="post-title" placeholder="ex. Hook doomscrolling jour 1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Script */}
          <div className="space-y-1.5">
            <Label htmlFor="post-script">Idée / script source</Label>
            <textarea
              id="post-script"
              rows={5}
              placeholder="Colle ton script ou ton idée. L'IA s'en sert pour écrire chaque légende."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Media */}
          <div className="space-y-1.5">
            <Label>Vidéo / média</Label>
            <MediaField url={mediaUrl} uploading={uploading} onPick={handleUpload} onClear={() => setMediaUrl('')} />
          </div>

          {/* Platforms */}
          <div className="space-y-1.5">
            <Label>Plateformes</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const on = selected.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[13px] font-medium transition-colors ${
                      on ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <p.icon className="h-4 w-4" style={{ color: on ? p.color : undefined }} />
                    {p.name}
                    {on && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI adapt */}
          <Button variant="outline" size="sm" onClick={handleAdapt} disabled={adapting} className="w-full">
            {adapting ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Adaptation en cours...</> : <><Sparkles className="h-4 w-4 mr-1.5" /> Adapter les légendes avec l&apos;IA</>}
          </Button>

          {/* Per-platform captions */}
          {selected.map((p) => {
            const m = platformMeta(p);
            const conn = platformConnected(p);
            return (
              <div key={p} className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <m.icon className="h-4 w-4" style={{ color: m.color }} />
                  <span className="text-sm font-medium flex-1">{m.name}</span>
                  {conn
                    ? <span className="text-[11px] text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> Connecté</span>
                    : <span className="text-[11px] text-muted-foreground/70">Non connecté</span>}
                </div>
                <textarea
                  rows={3}
                  placeholder="Légende..."
                  value={targets[p].caption}
                  onChange={(e) => setTargets((t) => ({ ...t, [p]: { ...t[p], caption: e.target.value } }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <Input
                  placeholder="#hashtags"
                  value={targets[p].hashtags}
                  onChange={(e) => setTargets((t) => ({ ...t, [p]: { ...t[p], hashtags: e.target.value } }))}
                  className="font-mono text-xs"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <CopyButton text={`${targets[p].caption}\n\n${targets[p].hashtags}`.trim()} />
                  {conn && PUBLISH_WIRED.includes(p) ? (
                    <>
                      {p === 'youtube' && (
                        <select
                          value={privacy}
                          onChange={(e) => setPrivacy(e.target.value as typeof privacy)}
                          className="h-7 rounded-md border border-border bg-background text-xs px-2"
                        >
                          <option value="private">Privé</option>
                          <option value="unlisted">Non répertorié</option>
                          <option value="public">Public</option>
                        </select>
                      )}
                      <button
                        onClick={() => publishPlatform(p)}
                        disabled={publishing === p || saving || publishingAll}
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md px-2.5 py-1 disabled:opacity-50 transition-colors"
                      >
                        {publishing === p || publishingAll ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publication...</> : <><Send className="h-3.5 w-3.5" /> Publier</>}
                      </button>
                    </>
                  ) : !conn ? (
                    <span className="text-[11px] text-muted-foreground">Connecte ce compte pour publier</span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Publication directe bientôt</span>
                  )}
                </div>
                {pubResult[p]?.url && (
                  <p className="text-[11px] text-emerald-600">
                    Publié : <a href={pubResult[p]!.url} target="_blank" rel="noreferrer" className="underline">{pubResult[p]!.url}</a>
                  </p>
                )}
                {pubResult[p]?.draft && !pubResult[p]?.url && (
                  <p className="text-[11px] text-emerald-600">Brouillon envoyé dans ton TikTok, termine la publication dans l&apos;app.</p>
                )}
                {pubResult[p]?.error && <p className="text-[11px] text-destructive">{pubResult[p]!.error}</p>}
              </div>
            );
          })}

          {/* Schedule */}
          <div className="space-y-1.5">
            <Label htmlFor="post-schedule">Programmation (optionnel)</Label>
            <Input id="post-schedule" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="max-w-[260px]" />
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> {error}</p>
          )}
        </div>

        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-5 py-3 flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving || uploading}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          {selected.some((p) => PUBLISH_WIRED.includes(p) && platformConnected(p)) && (
            <Button size="sm" variant="outline" onClick={publishAll} disabled={publishingAll || saving || uploading}>
              {publishingAll ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Publication...</> : <><Send className="h-4 w-4 mr-1.5" /> Publier partout</>}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <div className="flex-1" />
          {initial && (
            <button onClick={handleDelete} className="h-8 w-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bits ─────────────────────────────────────────────────────────────────────
function MediaField({ url, uploading, onPick, onClear }: {
  url: string; uploading: boolean; onPick: (f: File) => void; onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  if (url) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <video src={url} className="h-14 w-14 rounded-md object-cover bg-black" muted />
        <span className="text-xs text-muted-foreground flex-1 truncate">{url.split('/').pop()}</span>
        <button onClick={onClear} className="text-xs text-destructive hover:underline">Retirer</button>
      </div>
    );
  }
  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 h-20 rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors"
      >
        {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Upload...</> : <><Upload className="h-4 w-4" /> Importer une vidéo</>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/*,image/*"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
      />
    </>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      disabled={!text}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary border border-primary/30 hover:bg-primary/5 rounded-md px-2.5 py-1 disabled:opacity-40 transition-colors"
    >
      {copied ? <><Check className="h-3.5 w-3.5" /> Copié</> : <><Copy className="h-3.5 w-3.5" /> Copier</>}
    </button>
  );
}

// datetime-local needs "YYYY-MM-DDTHH:mm" in local time.
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
