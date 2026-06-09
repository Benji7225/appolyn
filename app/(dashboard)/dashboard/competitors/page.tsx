'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { Swords, Plus, RefreshCw, Star, Trash2, ArrowUpRight, Search, X } from 'lucide-react';

const db = supabase as unknown as { from: (t: string) => any };

type Snap = {
  id: string; competitor_id: string; captured_at: string; title: string | null;
  price: number | null; currency: string | null; average_rating: number | null;
  rating_count: number | null; version: string | null; icon_url: string | null; screenshot_count: number | null;
};
type Competitor = { id: string; itunes_id: string; country: string; name: string | null };
type ITunesResult = {
  itunesId: string; title: string; sellerName: string; genre: string; price: number; currency: string;
  averageRating: number | null; ratingCount: number | null; version: string; iconUrl: string; screenshotCount: number; url: string;
};

function fmtPrice(p: number | null, cur: string | null) {
  if (p == null) return '—';
  if (p === 0) return 'Gratuit';
  return `${p} ${cur ?? ''}`.trim();
}

function changes(cur: Snap, prev?: Snap): string[] {
  if (!prev) return [];
  const out: string[] = [];
  if ((cur.title ?? '') !== (prev.title ?? '')) out.push(`Titre : "${prev.title}" → "${cur.title}"`);
  if ((cur.price ?? 0) !== (prev.price ?? 0)) out.push(`Prix : ${fmtPrice(prev.price, prev.currency)} → ${fmtPrice(cur.price, cur.currency)}`);
  if ((cur.version ?? '') !== (prev.version ?? '')) out.push(`Version : ${prev.version} → ${cur.version}`);
  if ((cur.screenshot_count ?? 0) !== (prev.screenshot_count ?? 0)) out.push(`Captures : ${prev.screenshot_count} → ${cur.screenshot_count}`);
  const dr = (cur.rating_count ?? 0) - (prev.rating_count ?? 0);
  if (dr) out.push(`Avis : ${dr > 0 ? '+' : ''}${dr}`);
  return out;
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [snaps, setSnaps] = useState<Record<string, Snap[]>>({});
  const [input, setInput] = useState('');
  const [country, setCountry] = useState('us');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<ITunesResult[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { load(); }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const authHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' };
  };

  const load = async () => {
    const { data: comps } = await db.from('competitors').select('*').order('created_at', { ascending: true });
    const list = (comps ?? []) as Competitor[];
    setCompetitors(list);
    const { data: ss } = await db.from('competitor_snapshots').select('*').order('captured_at', { ascending: false });
    const grouped: Record<string, Snap[]> = {};
    for (const s of (ss ?? []) as Snap[]) (grouped[s.competitor_id] ??= []).push(s);
    setSnaps(grouped);
    setLoaded(true);
  };

  const lookup = async (idOrUrl: string): Promise<ITunesResult | null> => {
    const r = await fetch(`/api/itunes?action=lookup&id=${encodeURIComponent(idOrUrl)}&country=${country}`, { headers: await authHeader() });
    const j = await r.json();
    if (j.error) { setError(j.error); return null; }
    return j.result as ITunesResult;
  };

  const search = useCallback(async (term: string, countryCode: string) => {
    if (term.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setSuggestionsLoading(true); setShowSuggestions(true);
    const r = await fetch(`/api/itunes?action=search&term=${encodeURIComponent(term)}&country=${countryCode}`, { headers: await authHeader() });
    const j = await r.json();
    setSuggestions((j.results ?? []) as ITunesResult[]);
    setSuggestionsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (v: string) => {
    setInput(v);
    setError('');
    // URLs and IDs: don't show dropdown suggestions
    if (/id\d{6,}/.test(v) || /^\d{6,}$/.test(v) || v.includes('apps.apple.com')) {
      setSuggestions([]); setShowSuggestions(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v, country), 320);
  };

  const captureSnapshot = async (competitorId: string, res: ITunesResult) => {
    const { data: { user } } = await supabase.auth.getUser();
    await db.from('competitor_snapshots').insert({
      competitor_id: competitorId, user_id: user?.id,
      title: res.title, price: res.price, currency: res.currency,
      average_rating: res.averageRating, rating_count: res.ratingCount,
      version: res.version, icon_url: res.iconUrl, screenshot_count: res.screenshotCount,
    });
  };

  const addByResult = async (res: ITunesResult) => {
    setError(''); setBusy(true); setSuggestions([]); setShowSuggestions(false);
    try {
      if (competitors.length >= 5) { setError('Limite de 5 concurrents atteinte.'); setBusy(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      const { data: inserted, error: insErr } = await db.from('competitors')
        .insert({ user_id: user?.id, itunes_id: res.itunesId, country, name: res.title })
        .select().single();
      if (insErr) { setError(insErr.message.includes('duplicate') ? 'Ce concurrent est déjà suivi.' : insErr.message); setBusy(false); return; }
      await captureSnapshot(inserted.id, res);
      setInput('');
      await load();
    } catch { setError('Ajout impossible.'); }
    setBusy(false);
  };

  const handleAdd = async () => {
    const v = input.trim();
    if (!v) return;
    setError(''); setSuggestions([]); setShowSuggestions(false);
    if (/id\d{6,}/.test(v) || /^\d{6,}$/.test(v) || v.includes('apps.apple.com')) {
      setBusy(true);
      const res = await lookup(v);
      setBusy(false);
      if (res) await addByResult(res);
    } else {
      // If suggestions already loaded, add the first one
      if (suggestions.length > 0) { await addByResult(suggestions[0]); return; }
      setBusy(true);
      const r = await fetch(`/api/itunes?action=search&term=${encodeURIComponent(v)}&country=${country}`, { headers: await authHeader() });
      const j = await r.json();
      setBusy(false);
      if (j.error) setError(j.error);
      else setSuggestions((j.results ?? []) as ITunesResult[]);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true); setError('');
    for (const c of competitors) {
      const res = await lookup(c.itunes_id);
      if (res) await captureSnapshot(c.id, res);
    }
    await load();
    setRefreshing(false);
  };

  const remove = async (id: string) => {
    await db.from('competitors').delete().eq('id', id);
    await load();
  };

  if (loaded && competitors.length === 0) {
    return (
      <div className="p-8 scrollbar-macos">
        <PageHeader title="Competitors" description="Surveille jusqu'à 5 apps concurrentes et sois alerté quand elles bougent." />
        <SearchBar
          input={input} setInput={handleInputChange} country={country} setCountry={setCountry}
          onAdd={handleAdd} busy={busy} suggestions={suggestions} suggestionsLoading={suggestionsLoading}
          showSuggestions={showSuggestions} onSelectSuggestion={addByResult} onClear={() => { setInput(''); setSuggestions([]); setShowSuggestions(false); }}
          inputRef={inputRef} dropRef={dropRef}
        />
        {error && <p className="text-xs text-destructive mt-3">{error}</p>}
        <div className="mt-6">
          <EmptyState
            icon={Swords}
            title="Ajoute ton premier concurrent"
            description="Tape le nom d'une app pour voir les suggestions en temps réel, ou colle un lien App Store. Appolyn prend un instantané réel et détecte les changements."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Competitors"
        description="Données réelles de l'App Store public. Rafraîchis pour capturer un nouvel instantané et voir ce qui a changé."
        actions={
          competitors.length > 0 && (
            <button onClick={refreshAll} disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Rafraîchir tout
            </button>
          )
        }
      />

      <SearchBar
        input={input} setInput={handleInputChange} country={country} setCountry={setCountry}
        onAdd={handleAdd} busy={busy} suggestions={suggestions} suggestionsLoading={suggestionsLoading}
        showSuggestions={showSuggestions} onSelectSuggestion={addByResult} onClear={() => { setInput(''); setSuggestions([]); setShowSuggestions(false); }}
        inputRef={inputRef} dropRef={dropRef}
      />
      {error && <p className="text-xs text-destructive mt-3">{error}</p>}

      <div className="mt-6 space-y-4">
        {competitors.map((c) => {
          const list = snaps[c.id] ?? [];
          const cur = list[0];
          const diff = cur ? changes(cur, list[1]) : [];
          return (
            <div key={c.id} className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-3">
                {cur?.icon_url && <Image src={cur.icon_url} alt="" width={44} height={44} className="rounded-xl shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{cur?.title ?? c.name ?? c.itunes_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtPrice(cur?.price ?? null, cur?.currency ?? null)} · v{cur?.version ?? '—'} · {cur?.screenshot_count ?? 0} captures
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
                  {cur?.average_rating != null ? cur.average_rating.toFixed(2) : '—'}
                  <span className="text-muted-foreground/60">({cur?.rating_count ?? 0})</span>
                </div>
                <a href={`https://apps.apple.com/${country}/app/id${c.itunes_id}`} target="_blank" rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground shrink-0" title="Voir sur l'App Store">
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive shrink-0" title="Retirer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {diff.length > 0 && (
                <div className="mt-3 pl-1 border-l-2 border-primary/40">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-primary/80 mb-1 pl-2">Changements détectés</p>
                  <ul className="space-y-0.5 pl-2">
                    {diff.map((d, i) => <li key={i} className="text-xs text-muted-foreground">{d}</li>)}
                  </ul>
                </div>
              )}
              {list.length <= 1 && (
                <p className="text-[11px] text-muted-foreground/70 mt-2">Premier instantané pris. Rafraîchis plus tard pour détecter les changements.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type SearchBarProps = {
  input: string; setInput: (v: string) => void; country: string; setCountry: (v: string) => void;
  onAdd: () => void; busy: boolean; suggestions: ITunesResult[]; suggestionsLoading: boolean;
  showSuggestions: boolean; onSelectSuggestion: (r: ITunesResult) => void; onClear: () => void;
  inputRef: React.RefObject<HTMLInputElement>; dropRef: React.RefObject<HTMLDivElement>;
};

function SearchBar({
  input, setInput, country, setCountry, onAdd, busy, suggestions, suggestionsLoading,
  showSuggestions, onSelectSuggestion, onClear, inputRef, dropRef,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[260px]" ref={dropRef}>
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 h-10">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onAdd(); if (e.key === 'Escape') onClear(); }}
            onFocus={() => { if (suggestions.length > 0) {} }}
            placeholder="Tape un nom d'app, lien ou identifiant..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {input && (
            <button onClick={onClear} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Live suggestions dropdown */}
        {showSuggestions && (input.length >= 2) && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-40 max-h-64 overflow-y-auto">
            {suggestionsLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Recherche...
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun résultat</p>
            ) : (
              <div className="p-1.5 space-y-0.5">
                {suggestions.slice(0, 8).map((res) => (
                  <button
                    key={res.itunesId}
                    onClick={() => onSelectSuggestion(res)}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-accent transition-colors"
                  >
                    {res.iconUrl && (
                      <Image src={res.iconUrl} alt="" width={32} height={32} className="rounded-lg shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{res.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{res.sellerName} · {res.genre}</p>
                    </div>
                    {res.averageRating != null && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Star className="h-3 w-3 fill-current text-amber-400" />
                        {res.averageRating.toFixed(1)}
                      </div>
                    )}
                    <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <select value={country} onChange={(e) => setCountry(e.target.value)}
        className="h-10 rounded-lg border border-border/60 bg-card px-2 text-sm">
        {['us', 'fr', 'gb', 'de', 'es', 'it', 'jp', 'br', 'ca'].map((c) => (
          <option key={c} value={c}>{c.toUpperCase()}</option>
        ))}
      </select>

      <button onClick={onAdd} disabled={busy}
        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
        {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Ajouter
      </button>
    </div>
  );
}
