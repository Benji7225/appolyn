'use client';

// One ring used everywhere a keyword is scored (Keywords, Concurrents, App Store
// Page). Coloured ARC (popularity: high = good = green, difficulty: low = good =
// green; inverse logic), NUMBER in black, unfilled TRACK in light grey.
export function MetricRing({ score, tone, diameter = 30 }: {
  score?: number;
  tone: 'popularity' | 'difficulty';
  diameter?: number;
}) {
  if (score == null) {
    return <div className="rounded-full bg-muted animate-pulse shrink-0" style={{ width: diameter, height: diameter }} />;
  }
  const s = Math.max(0, Math.min(100, score));
  const good = tone === 'popularity' ? s >= 60 : s < 40;
  const mid = tone === 'popularity' ? s >= 35 : s < 70;
  const stroke = good ? '#10b981' : mid ? '#f59e0b' : '#f43f5e';
  const sw = diameter <= 32 ? 3 : 3.5;
  const r = diameter / 2 - sw;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - s / 100);
  const fs = diameter <= 30 ? 'text-[9px]' : 'text-[11px]';
  return (
    <div className="relative shrink-0" style={{ width: diameter, height: diameter }} title={`${score}/100`}>
      <svg viewBox={`0 0 ${diameter} ${diameter}`} width={diameter} height={diameter} className="-rotate-90">
        <circle cx={diameter / 2} cy={diameter / 2} r={r} fill="none" stroke="currentColor" strokeWidth={sw} className="text-muted-foreground/15" />
        <circle cx={diameter / 2} cy={diameter / 2} r={r} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center ${fs} font-bold tabular-nums text-foreground`}>{score}</span>
    </div>
  );
}
