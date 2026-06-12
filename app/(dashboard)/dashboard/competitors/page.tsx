'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { PageHeader, EmptyState } from '@/components/dashboard/shell';
import { Swords, Plus, RefreshCw, Star, Trash2, ArrowUpRight, Search } from 'lucide-react';

// New tables aren't in the generated Database types yet; use an untyped view.
const db = supabase as unknown as {
  from: (t: string) => any;
};

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

// Notable changes between the two latest snapshots.
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
  const [snaps, setSnaps] = useState<Record<string, Snap[]>>({}); // by competitor_id, desc
  const [input, setInput] = useState('');
  const [country, setCountry] = useState('us');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ITunesResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { load(true); }, []);

  // Live search as you type (debounced). A URL/id resolves to one result, a name
  // searches the store. The user then clicks "+" to add. No search button.
  useEffect(() => {
    const v = input.trim();
    if (!v) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(() => { runSearch(v); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, country]);

  const authHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' };
  };

  // Competitor snapshots go stale after a few hours; on arrival we silently
  // capture a fresh one if needed so the page is always up to date without a
  // manual "refresh" button (and without spamming a snapshot on every visit).
  const STALE_MS = 6 * 60 * 60 * 1000;

  const load = async (autoRefresh = false) => {
    const { data: comps } = await db.from('competitors').select('*').order('created_at', { ascending: true });
    const list = (comps ?? []) as Competitor[];
    setCompetitors(list);
    const { data: ss } = await db.from('competitor_snapshots').select('*').order('captured_at', { ascending: false });
    const grouped: Record<string, Snap[]> = {};
    for (const s of (ss ?? []) as Snap[]) (grouped[s.competitor_id] ??= []).push(s);
    setSnaps(grouped);
    setLoaded(true);
    if (autoRefresh && list.length > 0) {
      let newest = 0;
      for (const c of list) { const t = grouped[c.id]?.[0]?.captured_at; if (t) newest = Math.max(newest, new Date(t).getTime()); }
      const anyMissing = list.some((c) => !(grouped[c.id]?.length));
      if (anyMissing || Date.now() - newest > STALE_MS) refreshAll();
    }
  };

  const lookup = async (idOrUrl: string): Promise<ITunesResult | null> => {
    const r = await fetch(`/api/itunes?action=lookup&id=${encodeURIComponent(idOrUrl)}&country=${country}`, { headers: await authHeader() });
    const j = await r.json();
    if (j.error) { setError(j.error); return null; }
    return j.result as ITunesResult;
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
    setError(''); setBusy(true);
    try {
      if (competitors.length >= 5) { setError('Limite de 5 concurrents atteinte.'); setBusy(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      const { data: inserted, error: insErr } = await db.from('competitors')
        .insert({ user_id: user?.id, itunes_id: res.itunesId, country, name: res.title })
        .select().single();
      if (insErr) { setError(insErr.message.includes('duplicate') ? 'Ce concurrent est déjà suivi.' : insErr.message); setBusy(false); return; }
      await captureSnapshot(inserted.id, res);
      setInput(''); setResults([]);
      await load();
    } catch {
      setError('Ajout impossible.');
    }
    setBusy(false);
  };

  const runSearch = async (v: string) => {
    setError('');
    try {
      // URL or numeric id -> resolve one app; otherwise search by name.
      if (/id\d{6,}/.test(v) || /^\d{6,}$/.test(v) || v.includes('apps.apple.com')) {
        const res = await lookup(v);
        setResults(res ? [res] : []);
      } else {
        const r = await fetch(`/api/itunes?action=search&term=${encodeURIComponent(v)}&country=${country}`, { headers: await authHeader() });
        const j = await r.json();
        if (j.error) { setError(j.error); setResults([]); }
        else setResults((j.results ?? []) as ITunesResult[]);
      }
    } catch { setError('Recherche impossible.'); }
    setSearching(false);
  };

  const refreshAll = async () => {
    setRefreshing(true); setError('');
    for (const c of competitors) {
      const res = await lookup(c.itunes_id);
      if (res) await captureSnapshot(c.id, res);
    }
    await load(false);
    setRefreshing(false);
  };

  const remove = async (id: string) => {
    await db.from('competitors').delete().eq('id', id);
    await load();
  };

  if (loaded && competitors.length === 0 && results.length === 0) {
    return (
      <div className="p-8 scrollbar-macos">
        <PageHeader title="Concurrents" description="Surveille jusqu'à 5 apps concurrentes et sois alerté quand elles bougent." />
        <AddBar input={input} setInput={setInput} country={country} setCountry={setCountry} searching={searching} />
        {error && <p className="text-xs text-destructive mt-3">{error}</p>}
        <SearchResults results={results} onPick={addByResult} busy={busy} />
        <div className="mt-6">
          <EmptyState
            icon={Swords}
            title="Ajoute ton premier concurrent"
            description="Tape le nom d'une app concurrente (ou colle son lien App Store) : la recherche se fait toute seule. Clique le + pour la suivre. Appolyn prend un instantané réel de sa fiche et détecte les changements automatiquement."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 scrollbar-macos">
      <PageHeader
        title="Concurrents"
        description="Données réelles de l'App Store public, mises à jour automatiquement. Les changements de fiche sont détectés tout seuls."
        actions={
          refreshing && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Mise à jour...
            </span>
          )
        }
      />

      <AddBar input={input} setInput={setInput} country={country} setCountry={setCountry} searching={searching} />
      {error && <p className="text-xs text-destructive mt-3">{error}</p>}

      <SearchResults results={results} onPick={addByResult} busy={busy} />

      {/* Tracked competitors */}
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

function AddBar({
  input, setInput, country, setCountry, searching,
}: {
  input: string; setInput: (v: string) => void; country: string; setCountry: (v: string) => void;
  searching: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 flex-1 min-w-[260px] rounded-lg border border-border/60 bg-card px-3 h-10">
        {searching
          ? <RefreshCw className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />
          : <Search className="h-4 w-4 text-muted-foreground shrink-0" />}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tape un nom d'app, un lien App Store ou un identifiant..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <select value={country} onChange={(e) => setCountry(e.target.value)}
        className="h-10 rounded-lg border border-border/60 bg-card px-2 text-sm">
        {['us', 'fr', 'gb', 'de', 'es', 'it', 'jp', 'br', 'ca'].map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
      </select>
    </div>
  );
}

function SearchResults({ results, onPick, busy }: {
  results: ITunesResult[]; onPick: (r: ITunesResult) => void; busy: boolean;
}) {
  if (results.length === 0) return null;
  return (
    <div className="mt-4 rounded-xl border border-border/50 bg-card divide-y divide-border/40">
      {results.map((res) => (
        <button key={res.itunesId} onClick={() => onPick(res)} disabled={busy}
          className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/40 transition-colors disabled:opacity-50">
          {res.iconUrl && <Image src={res.iconUrl} alt="" width={36} height={36} className="rounded-lg shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{res.title}</p>
            <p className="text-xs text-muted-foreground truncate">{res.sellerName} · {res.genre}</p>
          </div>
          <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      ))}
    </div>
  );
}
