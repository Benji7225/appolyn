'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { checkMetadata, IOS_LIMITS } from '@/lib/metadata-check';

const FIELDS = [
  { key: 'title', label: 'App name (title)', max: IOS_LIMITS.title, hint: 'Indexed. The strongest field for ranking.' },
  { key: 'subtitle', label: 'Subtitle', max: IOS_LIMITS.subtitle, hint: 'Indexed. Use words that are not in the title.' },
  { key: 'keywords', label: 'Keyword field', max: IOS_LIMITS.keywords, hint: 'Hidden. Comma-separated, no spaces.' },
  { key: 'promo', label: 'Promotional text', max: IOS_LIMITS.promo, hint: 'Not indexed. Editable without a new version.' },
] as const;
type Key = (typeof FIELDS)[number]['key'];

const LEVEL = {
  error: 'border-red-500/40 bg-red-500/5 text-red-600 dark:text-red-400',
  warn: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  tip: 'border-border bg-muted/40 text-foreground',
} as const;

export function MetadataChecker() {
  const [v, setV] = useState<Record<Key, string>>({ title: '', subtitle: '', keywords: '', promo: '' });
  const [copied, setCopied] = useState(false);
  const empty = !v.title && !v.subtitle && !v.keywords && !v.promo;
  const res = useMemo(() => checkMetadata(v), [v]);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        {FIELDS.map((f) => {
          const len = v[f.key].length;
          const bad = len > f.max;
          const long = f.key === 'promo';
          const shared = 'w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ' + (bad ? 'border-red-500' : 'border-border');
          return (
            <div key={f.key}>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={f.key} className="text-sm font-medium">{f.label}</label>
                <span className={`text-xs tabular-nums ${bad ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>{len}/{f.max}</span>
              </div>
              {long || f.key === 'keywords' ? (
                <textarea id={f.key} rows={long ? 3 : 2} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} className={shared} />
              ) : (
                <input id={f.key} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} className={shared} />
              )}
              <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${bad ? 'bg-red-500' : 'bg-foreground/70'}`} style={{ width: `${Math.min(100, (len / f.max) * 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">Everything is computed in your browser. Nothing you type is sent or stored.</p>
      </div>

      <div className="space-y-5">
        {empty ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Type or paste your App Store text on the left. You will see here what is over the limit, what is wasted, and a cleaned keyword field you can copy.
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {res.findings.map((f, i) => (
                <li key={i} className={`rounded-lg border px-3 py-2 text-sm ${LEVEL[f.level]}`}>{f.text}</li>
              ))}
            </ul>
            {res.removed.length > 0 && (
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-medium">Cleaned keyword field <span className="text-muted-foreground font-normal">(saves {res.charsSaved} characters)</span></p>
                <code className="mt-2 block break-all rounded-md bg-muted px-3 py-2 text-xs">{res.cleanedKeywords || '—'}</code>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(res.cleanedKeywords).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); }}
                  className="mt-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
                >{copied ? 'Copied' : 'Copy'}</button>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {res.removed.map((r, i) => <li key={i}><span className="text-foreground">{r.term}</span> — {r.reason}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
        <div className="rounded-xl bg-foreground text-background p-5">
          <p className="font-medium">Publish it in 22+ languages in one click</p>
          <p className="mt-1 text-sm opacity-80">Appolyn writes your App Store listing with AI and publishes it through the App Store Connect API.</p>
          <Link href="/signup" className="mt-3 inline-block rounded-lg bg-background text-foreground px-3 py-1.5 text-sm font-medium">Try Appolyn</Link>
        </div>
      </div>
    </div>
  );
}
