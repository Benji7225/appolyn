'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Sparkles, RefreshCw, CircleCheck as CheckCircle2, CircleAlert, MessageSquare, Send } from 'lucide-react';
import type { App } from '@/lib/database.types';
import { ReviewAnalysis } from '@/components/dashboard/review-analysis';
import { useDashboard } from '@/lib/app-context';
import { getCache, setCache } from '@/lib/cache';

type ReviewsSnapshot = { reviews: Review[]; avg: number | null; count: number | null };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  territory: string;
  createdDate: string;
  reviewerNickname: string;
  responseBody: string | null;
};

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { apps, selectedApp: ctxApp } = useDashboard();
  const selectedAppId = ctxApp?.id ?? '';
  const [hasCreds, setHasCreds] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(0); // 0 = all

  // per-review reply state
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [drafting, setDrafting] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [published, setPublished] = useState<Record<string, boolean>>({});
  const [replyError, setReplyError] = useState<Record<string, string>>({});

  useEffect(() => { checkCreds(); }, []);

  const checkCreds = async () => {
    const { data } = await supabase.from('asc_credentials').select('id').maybeSingle();
    setHasCreds(!!data);
  };

  const selectedApp = apps.find((a) => a.id === selectedAppId);

  const loadReviews = useCallback(async (app: App, silent = false) => {
    if (!app.asc_app_id) { setReviews([]); return; }
    if (!silent) setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=get-ratings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: app.asc_app_id, limit: 50 }),
      });
      const json = await r.json() as { reviews?: Review[]; averageRating?: number | null; ratingCount?: number | null; error?: string };
      if (json.error) { setError(json.error); }
      else {
        const snap: ReviewsSnapshot = { reviews: json.reviews ?? [], avg: json.averageRating ?? null, count: json.ratingCount ?? null };
        setReviews(snap.reviews); setAvg(snap.avg); setCount(snap.count);
        setCache(`reviews:${app.id}`, snap);
      }
    } catch {
      setError('Connexion à App Store Connect impossible.');
    }
    setLoading(false);
  }, []);

  // Auto-load on arrival: show the last real snapshot instantly, revalidate in
  // the background. No manual refresh needed.
  useEffect(() => {
    if (selectedApp && hasCreds) {
      const cached = getCache<ReviewsSnapshot>(`reviews:${selectedApp.id}`);
      if (cached) { setReviews(cached.reviews); setAvg(cached.avg); setCount(cached.count); }
      loadReviews(selectedApp, !!cached);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAppId, hasCreds]);

  const draftWithAI = async (rev: Review) => {
    setDrafting(rev.id); setReplyError((p) => ({ ...p, [rev.id]: '' }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('/api/draft-review-reply', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: selectedApp?.name, rating: rev.rating, title: rev.title, review: rev.body, territory: rev.territory,
        }),
      });
      const json = await r.json() as { reply?: string; error?: string };
      if (json.error) setReplyError((p) => ({ ...p, [rev.id]: json.error! }));
      else setDrafts((p) => ({ ...p, [rev.id]: json.reply ?? '' }));
    } catch {
      setReplyError((p) => ({ ...p, [rev.id]: 'Échec de la génération. Réessaie.' }));
    }
    setDrafting(null);
  };

  const publishReply = async (rev: Review) => {
    const text = (drafts[rev.id] ?? '').trim();
    if (!text) return;
    setPublishing(rev.id); setReplyError((p) => ({ ...p, [rev.id]: '' }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${SUPABASE_URL}/functions/v1/asc-proxy?action=respond-review`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: rev.id, responseBody: text }),
      });
      const json = await r.json() as { success?: boolean; error?: string };
      if (json.error) setReplyError((p) => ({ ...p, [rev.id]: json.error! }));
      else {
        setPublished((p) => ({ ...p, [rev.id]: true }));
        setReviews((prev) => prev.map((x) => x.id === rev.id ? { ...x, responseBody: text } : x));
      }
    } catch {
      setReplyError((p) => ({ ...p, [rev.id]: 'Échec de la publication. Réessaie.' }));
    }
    setPublishing(null);
  };

  const filtered = filter === 0 ? reviews : reviews.filter((r) => r.rating === filter);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Avis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lis et réponds à tes avis App Store{avg != null && count != null ? ` · ${avg.toFixed(1)}★ (${count.toLocaleString('fr-FR')})` : ''}.
          </p>
        </div>
        {hasCreds && selectedApp?.asc_app_id && (
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <FilterChip active={filter === 0} onClick={() => setFilter(0)}>Tous</FilterChip>
            {[5, 4, 3, 2, 1].map((n) => (
              <FilterChip key={n} active={filter === n} onClick={() => setFilter(n)}>{n}★</FilterChip>
            ))}
          </div>
        )}
      </div>

      {!hasCreds ? (
        <Guide message="Connecte ta clé API App Store Connect dans les Réglages pour charger tes avis et y répondre." href="/dashboard/settings" cta="Ouvrir les Réglages" />
      ) : !selectedApp?.asc_app_id ? (
        <Guide message="Renseigne l'App ID App Store Connect de cette app dans Mes apps pour charger ses avis." href="/dashboard/settings/apps" cta="Ouvrir Mes apps" />
      ) : (
        <>
          <ReviewAnalysis />

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-5">
              <CircleAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive leading-relaxed">{error}</p>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Chargement des avis…</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl border border-border/40 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-medium mb-2">{reviews.length === 0 ? 'Aucun avis pour l’instant' : 'Aucun avis pour ce filtre'}</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                {reviews.length === 0 ? 'Les avis apparaîtront ici dès que des utilisateurs noteront ton app.' : 'Essaie un autre filtre de note.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((rev) => (
                <div key={rev.id} className="bg-card border border-border/40 rounded-xl p-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Stars n={rev.rating} />
                      <span className="text-sm font-medium truncate">{rev.reviewerNickname || 'Anonyme'}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{rev.territory}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{new Date(rev.createdDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {rev.title && <p className="text-sm font-medium mb-1">{rev.title}</p>}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{rev.body}</p>

                  {rev.responseBody && !published[rev.id] ? (
                    <div className="bg-muted/40 rounded-lg p-3 border border-border/30">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Ta réponse</p>
                      <p className="text-sm leading-relaxed">{rev.responseBody}</p>
                    </div>
                  ) : published[rev.id] ? (
                    <div className="flex items-center gap-1.5 text-sm text-emerald-500">
                      <CheckCircle2 className="h-4 w-4" /> Réponse publiée
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        rows={3}
                        placeholder="Écris une réponse, ou génère-la avec l'IA…"
                        className="resize-none text-sm"
                        value={drafts[rev.id] ?? ''}
                        onChange={(e) => setDrafts((p) => ({ ...p, [rev.id]: e.target.value }))}
                      />
                      {replyError[rev.id] && <p className="text-xs text-destructive">{replyError[rev.id]}</p>}
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => draftWithAI(rev)} disabled={drafting === rev.id}>
                          {drafting === rev.id
                            ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Rédaction…</>
                            : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Rédiger avec l'IA</>}
                        </Button>
                        <Button size="sm" onClick={() => publishReply(rev)} disabled={publishing === rev.id || !(drafts[rev.id] ?? '').trim()}>
                          {publishing === rev.id
                            ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Publication…</>
                            : <><Send className="h-3.5 w-3.5 mr-1.5" />Publier la réponse</>}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 h-8 rounded-lg border transition-colors ${active ? 'bg-foreground text-background border-foreground' : 'bg-card border-border/40 text-muted-foreground hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}

function Guide({ message, href, cta }: { message: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl border border-border/40 flex items-center justify-center mb-4">
        <MessageSquare className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
      <a href={href} className="text-sm text-emerald-400 hover:underline">{cta} →</a>
    </div>
  );
}
