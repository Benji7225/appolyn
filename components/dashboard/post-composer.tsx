'use client';

import { useState } from 'react';
import { X, Instagram, Music2, Youtube, Twitter, Calendar, Image as ImageIcon, Smile, CircleCheck as CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Channel = { id: string; label: string; icon: React.ElementType; color: string };

const CHANNELS: Channel[] = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'tiktok',    label: 'TikTok',    icon: Music2,    color: '#010101' },
  { id: 'youtube',   label: 'YouTube',   icon: Youtube,   color: '#FF0000' },
  { id: 'x',         label: 'X',         icon: Twitter,   color: '#1DA1F2' },
];

const LIMITS: Record<string, number> = {
  instagram: 2200, tiktok: 2200, youtube: 5000, x: 280,
};

type Props = {
  onClose: () => void;
  prefillDate?: string;
  onSave?: (post: { channels: string[]; content: string; date: string; status: 'draft' | 'scheduled' }) => void;
};

export function PostComposer({ onClose, prefillDate, onSave }: Props) {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [date, setDate] = useState(prefillDate ?? '');
  const [time, setTime] = useState('09:00');
  const [saved, setSaved] = useState(false);

  const toggleChannel = (id: string) =>
    setSelectedChannels((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const limit = selectedChannels.length
    ? Math.min(...selectedChannels.map((id) => LIMITS[id] ?? 2200))
    : 2200;
  const remaining = limit - content.length;
  const isOverLimit = remaining < 0;
  const canSave = selectedChannels.length > 0 && content.trim().length > 0 && !isOverLimit;

  const handleSave = (status: 'draft' | 'scheduled') => {
    if (status === 'scheduled' && !canSave) return;
    if (status === 'draft' && (!content.trim() || isOverLimit)) return;
    setSaved(true);
    onSave?.({ channels: selectedChannels, content, date, status });
    setTimeout(() => { setSaved(false); onClose(); }, 700);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
          <h2 className="text-sm font-semibold">Nouveau post</h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
          {/* Channel selector */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Canaux</p>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => {
                const selected = selectedChannels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className={cn(
                      'flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[13px] font-medium transition-all',
                      selected ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30',
                    )}
                    style={selected ? { backgroundColor: ch.color } : {}}
                  >
                    <ch.icon className="h-3.5 w-3.5" />
                    {ch.label}
                    {selected && <CheckCircle2 className="h-3 w-3 opacity-80" />}
                  </button>
                );
              })}
            </div>
            {selectedChannels.length === 0 && (
              <p className="text-[11px] text-muted-foreground/60 mt-2">Sélectionnez au moins un canal</p>
            )}
          </div>

          {/* Content area */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Contenu</p>
            <div className={cn('relative rounded-xl border transition-colors', isOverLimit ? 'border-destructive' : 'border-border focus-within:border-ring/60')}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Rédigez votre post ici…"
                rows={6}
                className="w-full bg-transparent px-4 pt-3 pb-10 text-sm resize-none focus:outline-none placeholder:text-muted-foreground/50 leading-relaxed"
              />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors">
                    <ImageIcon className="h-3.5 w-3.5" />
                  </button>
                  <button className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors">
                    <Smile className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className={cn('text-[11px] tabular-nums', isOverLimit ? 'text-destructive font-medium' : remaining <= 40 ? 'text-amber-500' : 'text-muted-foreground/60')}>
                  {remaining}
                </span>
              </div>
            </div>
            {selectedChannels.includes('x') && (
              <p className="text-[11px] text-muted-foreground/60 mt-1.5 flex items-center gap-1">
                <Twitter className="h-3 w-3" /> X limite : 280 caractères
              </p>
            )}
          </div>

          {/* Schedule */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Planification (optionnel)
            </p>
            <div className="flex items-center gap-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-28 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/50 flex items-center justify-between gap-3">
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Annuler</button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave('draft')}
              disabled={!content.trim() || isOverLimit}
              className="h-8 px-4 rounded-lg border border-border text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sauver brouillon
            </button>
            <button
              onClick={() => handleSave('scheduled')}
              disabled={!canSave}
              className={cn(
                'h-8 px-4 rounded-lg text-[13px] font-medium transition-all',
                saved ? 'bg-emerald-500 text-white' :
                canSave ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
                'bg-primary/30 text-primary-foreground/50 cursor-not-allowed',
              )}
            >
              {saved ? 'Enregistré !' : date ? 'Planifier' : 'Publier maintenant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
