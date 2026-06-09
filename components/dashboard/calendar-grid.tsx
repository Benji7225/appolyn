'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Instagram, Music2, Youtube, Twitter, Plus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarPost = {
  id: string;
  title: string;
  channel: 'instagram' | 'tiktok' | 'youtube' | 'x';
  date: string; // ISO yyyy-mm-dd
  time?: string;
  status: 'draft' | 'scheduled' | 'published';
};

export type NewPostData = {
  channels: string[];
  content: string;
  date: string;
  status: 'draft' | 'scheduled';
};

type ChannelMeta = { icon: LucideIcon; color: string; label: string };

const CHANNEL_META: Record<string, ChannelMeta> = {
  instagram: { icon: Instagram, color: '#E1306C', label: 'Instagram' },
  tiktok:    { icon: Music2,    color: '#010101', label: 'TikTok' },
  youtube:   { icon: Youtube,   color: '#FF0000', label: 'YouTube' },
  x:         { icon: Twitter,   color: '#1DA1F2', label: 'X' },
};

const STATUS_DOT: Record<CalendarPost['status'], string> = {
  scheduled: 'border-l-sky-400',
  draft:     'border-l-amber-400',
  published: 'border-l-emerald-400',
};

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getMonday(d: Date) {
  const day = d.getDay();
  return addDays(d, day === 0 ? -6 : 1 - day);
}

// ─── Sample seed data ─────────────────────────────────────────────────────────

function buildSamplePosts(): CalendarPost[] {
  const mon = getMonday(new Date());
  return [
    { id: 's1', title: 'Démo fonctionnalité principale', channel: 'instagram', date: toISO(addDays(mon, 0)), time: '10:00', status: 'scheduled' },
    { id: 's2', title: 'Tutorial onboarding', channel: 'tiktok', date: toISO(addDays(mon, 1)), time: '14:00', status: 'draft' },
    { id: 's3', title: "Retour d'expérience", channel: 'youtube', date: toISO(addDays(mon, 3)), time: '09:00', status: 'scheduled' },
    { id: 's4', title: 'Thread : coulisses du prod', channel: 'x', date: toISO(addDays(mon, 4)), time: '18:00', status: 'draft' },
    { id: 's5', title: 'Reels : top 3 astuces', channel: 'instagram', date: toISO(addDays(mon, 7)), time: '11:00', status: 'scheduled' },
    { id: 's6', title: 'Shorts nouvelle fonctionnalité', channel: 'youtube', date: toISO(addDays(mon, 9)), time: '15:00', status: 'draft' },
  ];
}

// ─── Post pill (inside week cell) ────────────────────────────────────────────

function PostPill({ post, onClick }: { post: CalendarPost; onClick: () => void }) {
  const meta = CHANNEL_META[post.channel];
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn('w-full text-left rounded-md border-l-2 bg-accent/50 hover:bg-accent px-2 py-1 transition-colors', STATUS_DOT[post.status])}
    >
      <div className="flex items-center gap-1 min-w-0">
        <meta.icon className="h-2.5 w-2.5 shrink-0" style={{ color: meta.color }} />
        <span className="text-[11px] font-medium truncate leading-tight">{post.title}</span>
      </div>
      {post.time && <span className="text-[10px] text-muted-foreground/60 ml-3.5">{post.time}</span>}
    </button>
  );
}

// ─── Post detail modal ────────────────────────────────────────────────────────

function PostDetail({ post, onClose, onDelete }: { post: CalendarPost; onClose: () => void; onDelete: (id: string) => void }) {
  const meta = CHANNEL_META[post.channel];
  const statusLabel = { draft: 'Brouillon', scheduled: 'Planifié', published: 'Publié' }[post.status];
  const statusCls = {
    draft: 'text-amber-600 bg-amber-50 border-amber-200',
    scheduled: 'text-sky-600 bg-sky-50 border-sky-200',
    published: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  }[post.status];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full sm:max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${meta.color}18` }}>
              <meta.icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
            </div>
            <span className="text-sm font-medium">{meta.label}</span>
          </div>
          <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full border', statusCls)}>{statusLabel}</span>
        </div>
        <p className="text-sm font-medium mb-1">{post.title}</p>
        {post.time && <p className="text-xs text-muted-foreground">{post.date} à {post.time}</p>}
        <div className="mt-5 flex items-center gap-2">
          <button onClick={onClose} className="flex-1 h-8 rounded-lg border border-border text-[13px] text-muted-foreground hover:bg-accent transition-colors">Fermer</button>
          <button onClick={() => { onDelete(post.id); onClose(); }} className="h-8 px-3 rounded-lg border border-destructive/30 text-[13px] text-destructive hover:bg-destructive/5 transition-colors">Supprimer</button>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar grid ────────────────────────────────────────────────────────────

type Props = {
  onNewPost: (prefillDate?: string) => void;
  newPostData?: NewPostData;
};

export function CalendarGrid({ onNewPost, newPostData }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [posts, setPosts] = useState<CalendarPost[]>(buildSamplePosts);
  const [selected, setSelected] = useState<CalendarPost | null>(null);
  const [view, setView] = useState<'week' | 'list'>('week');
  const lastMergedRef = useRef('');

  useEffect(() => {
    if (!newPostData?.content || newPostData.channels.length === 0) return;
    const key = newPostData.channels.join(',') + '|' + newPostData.content + '|' + newPostData.date;
    if (lastMergedRef.current === key) return;
    lastMergedRef.current = key;
    const ts = Date.now();
    const incoming: CalendarPost[] = newPostData.channels.map((ch, i) => ({
      id: `new-${ts}-${i}`,
      title: newPostData.content.slice(0, 60) + (newPostData.content.length > 60 ? '…' : ''),
      channel: ch as CalendarPost['channel'],
      date: newPostData.date || toISO(new Date()),
      status: newPostData.status,
    }));
    setPosts((prev) => [...prev, ...incoming]);
  }, [newPostData]);

  const monday = addDays(getMonday(new Date()), weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const today = toISO(new Date());

  const monthLabel = (() => {
    const months = new Set(days.map((d) => d.getMonth()));
    if (months.size === 1) return `${MONTH_LABELS[days[0].getMonth()]} ${days[0].getFullYear()}`;
    const arr = Array.from(months);
    return `${MONTH_LABELS[arr[0]]} – ${MONTH_LABELS[arr[1]]} ${days[6].getFullYear()}`;
  })();

  const postsForDay = (iso: string) =>
    posts.filter((p) => p.date === iso).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((o) => o - 1)} className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-sm font-medium min-w-[11rem] text-center">{monthLabel}</span>
          <button onClick={() => setWeekOffset((o) => o + 1)} className="h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-[12px] text-primary hover:underline ml-1">
              Aujourd&apos;hui
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden text-[12px]">
            <button onClick={() => setView('week')} className={cn('px-3 h-7 transition-colors', view === 'week' ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50')}>Semaine</button>
            <button onClick={() => setView('list')} className={cn('px-3 h-7 border-l border-border transition-colors', view === 'list' ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50')}>Liste</button>
          </div>
          <button onClick={() => onNewPost()} className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Nouveau post
          </button>
        </div>
      </div>

      {view === 'week' ? (
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {days.map((d) => {
              const iso = toISO(d);
              const isToday = iso === today;
              return (
                <div key={iso} className="px-1.5 py-2 text-center border-r border-border/50 last:border-r-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]}</p>
                  <div className={cn('mx-auto mt-1 h-6 w-6 flex items-center justify-center rounded-full text-xs font-medium', isToday ? 'bg-primary text-primary-foreground' : 'text-foreground')}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7 min-h-[200px]">
            {days.map((d) => {
              const iso = toISO(d);
              const dayPosts = postsForDay(iso);
              const isToday = iso === today;
              return (
                <div
                  key={iso}
                  onClick={() => onNewPost(iso)}
                  className={cn('border-r border-border/50 last:border-r-0 p-1.5 space-y-1 cursor-pointer hover:bg-accent/20 transition-colors group min-h-[80px]', isToday && 'bg-primary/[0.03]')}
                >
                  {dayPosts.map((post) => (
                    <PostPill key={post.id} post={post} onClick={() => setSelected(post)} />
                  ))}
                  {dayPosts.length === 0 && (
                    <div className="h-full min-h-[48px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Aucun post planifié.</p>
          ) : (
            posts
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''))
              .map((post) => {
                const meta = CHANNEL_META[post.channel];
                const dotCls = { draft: 'bg-amber-400', scheduled: 'bg-sky-400', published: 'bg-emerald-400' }[post.status];
                return (
                  <button key={post.id} onClick={() => setSelected(post)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-accent/40 transition-colors text-left">
                    <div className={cn('h-2 w-2 rounded-full shrink-0', dotCls)} />
                    <meta.icon className="h-3.5 w-3.5 shrink-0" style={{ color: meta.color }} />
                    <span className="text-sm flex-1 truncate">{post.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{post.date}{post.time ? ` ${post.time}` : ''}</span>
                  </button>
                );
              })
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {[{ label: 'Planifié', cls: 'bg-sky-400' }, { label: 'Brouillon', cls: 'bg-amber-400' }, { label: 'Publié', cls: 'bg-emerald-400' }].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={cn('h-2 w-2 rounded-full', l.cls)} />
            <span className="text-[11px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {selected && <PostDetail post={selected} onClose={() => setSelected(null)} onDelete={(id) => setPosts((p) => p.filter((x) => x.id !== id))} />}
    </div>
  );
}
