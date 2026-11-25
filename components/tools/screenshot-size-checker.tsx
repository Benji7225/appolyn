'use client';

import { useRef, useState } from 'react';
import { judgeFile, pngHasAlpha, SIZE_SETS, MAX_PER_SET, type FileVerdict } from '@/lib/screenshot-sizes';

const NEED = { required: 'Obligatoire', conditional: 'Selon l’app', optional: 'Optionnel' } as const;

function readSize(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    img.src = url;
  });
}

export function ScreenshotSizeChecker() {
  const [rows, setRows] = useState<FileVerdict[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function run(files: FileList | File[]) {
    setBusy(true);
    const out: FileVerdict[] = [];
    for (const f of Array.from(files)) {
      try {
        const { w, h } = await readSize(f);
        const alpha = f.type === 'image/png' ? pngHasAlpha(new Uint8Array(await f.arrayBuffer())) : false;
        out.push(judgeFile(f.name, f.type, w, h, alpha));
      } catch {
        out.push({ name: f.name, w: 0, h: 0, ok: false, match: null, problems: ['Image illisible : fichier abîmé ou format non pris en charge par ton navigateur.'], suggestion: null });
      }
    }
    setRows(out);
    setBusy(false);
  }

  // Compte par set (taille + orientation) pour la limite de 10.
  const counts = new Map<string, number>();
  for (const r of rows) if (r.match) counts.set(r.match.set.label, (counts.get(r.match.set.label) ?? 0) + 1);
  const over = Array.from(counts.entries()).filter(([, n]) => n > MAX_PER_SET);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold">Check your files</h2>
        <p className="mt-1 text-sm text-muted-foreground">Drop your screenshots. We read the pixel size, the format and the transparency, locally. Nothing is uploaded.</p>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) void run(e.dataTransfer.files); }}
          className="mt-4 rounded-xl border border-dashed border-border p-8 text-center"
        >
          <button type="button" onClick={() => input.current?.click()} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40">Choose images</button>
          <p className="mt-2 text-xs text-muted-foreground">or drag them here. PNG or JPEG.</p>
          <input ref={input} type="file" multiple accept="image/png,image/jpeg" className="hidden" onChange={(e) => { if (e.target.files?.length) void run(e.target.files); e.target.value = ''; }} />
        </div>
        {busy && <p className="mt-3 text-sm text-muted-foreground" role="status">Reading files…</p>}
        {rows.length > 0 && (
          <ul className="mt-4 space-y-2">
            {rows.map((r, i) => (
              <li key={i} className={`rounded-lg border p-3 text-sm ${r.ok ? 'border-border bg-muted/40' : 'border-red-500/40 bg-red-500/5'}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium break-all">{r.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{r.w} × {r.h}</span>
                </div>
                {r.ok && r.match && <p className="mt-1 text-muted-foreground">OK : {r.match.set.label}, {r.match.orientation === 'portrait' ? 'portrait' : 'landscape'}.</p>}
                {r.problems.map((p) => <p key={p} className="mt-1 text-red-600 dark:text-red-400">{p}</p>)}
                {r.suggestion && <p className="mt-1 text-muted-foreground">{r.suggestion}</p>}
              </li>
            ))}
          </ul>
        )}
        {over.map(([label, n]) => (
          <p key={label} className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">{n} files for “{label}”: App Store Connect keeps at most {MAX_PER_SET} per size.</p>
        ))}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Accepted sizes (iPhone and iPad)</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pixels, portrait (flip them for landscape). At least 1 and up to {MAX_PER_SET} screenshots per size. PNG or JPEG, no transparency. If your UI is the same across sizes, the largest set is enough: App Store Connect scales it down.</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr><th className="px-3 py-2 font-medium">Display set</th><th className="px-3 py-2 font-medium">Sizes (px)</th><th className="px-3 py-2 font-medium">Status</th></tr>
            </thead>
            <tbody>
              {SIZE_SETS.map((s) => (
                <tr key={s.id} className="border-t border-border align-top">
                  <td className="px-3 py-2"><span className="font-medium">{s.label}</span><span className="block text-xs text-muted-foreground">{s.note}</span></td>
                  <td className="px-3 py-2 tabular-nums whitespace-nowrap">{s.sizes.map(([w, h]) => <span key={w + 'x' + h} className="block">{w} × {h}</span>)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{NEED[s.need]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Source: Apple, “Screenshot specifications” (App Store Connect help), read on 25 Nov 2026. Mac, Apple TV, Apple Vision Pro and Apple Watch sizes are on the same Apple page.</p>
      </section>
    </div>
  );
}
