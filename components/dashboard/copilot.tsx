'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, X, ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'Pourquoi optimiser mon sous-titre ?',
  'Trouve-moi 20 mots-clés',
  'Résume mes avis récents',
  'Traduis ma fiche en allemand',
];

export function Copilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/copilot', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const json = await r.json() as { reply?: string; error?: string };
      if (json.error) setError(json.error);
      else setMessages((m) => [...m, { role: 'assistant', content: json.reply ?? '' }]);
    } catch {
      setError('Connexion impossible. Réessaie.');
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-105 transition-transform"
          title="Copilote IA"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-2.5rem)] rounded-2xl border border-border/60 vibrancy-strong shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="h-12 px-4 flex items-center justify-between border-b border-border/40 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Copilote</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3 scrollbar-macos">
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground">
                <p className="mb-3">Pose-moi une question sur ton ASO, tes mots-clés, tes avis ou tes revenus. Je m'appuie sur tes vraies données.</p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-[13px] px-3 py-2 rounded-lg border border-border/50 hover:bg-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-wrap',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-foreground',
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-accent rounded-2xl px-3.5 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Composer */}
          <div className="p-3 border-t border-border/40 shrink-0">
            <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
                }}
                rows={1}
                placeholder="Écris ta question..."
                className="flex-1 resize-none bg-transparent text-[13px] outline-none max-h-28 placeholder:text-muted-foreground"
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 shrink-0"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
