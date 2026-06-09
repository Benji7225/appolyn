'use client';

import { useState, useRef } from 'react';
import { Smartphone, Tablet, Upload, X, ExternalLink, GripVertical, Image as ImageIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type DeviceType = 'iphone-67' | 'iphone-65' | 'iphone-55' | 'ipad-13' | 'ipad-11';

type Screenshot = {
  id: string;
  url: string;
  file?: File;
};

type DeviceMeta = {
  label: string;
  icon: React.ElementType;
  maxCount: number;
  size: string;
  required?: boolean;
};

const DEVICES: Record<DeviceType, DeviceMeta> = {
  'iphone-67': { label: 'iPhone 6.7"', icon: Smartphone, maxCount: 10, size: '1290 × 2796 px', required: true },
  'iphone-65': { label: 'iPhone 6.5"', icon: Smartphone, maxCount: 10, size: '1242 × 2688 px' },
  'iphone-55': { label: 'iPhone 5.5"', icon: Smartphone, maxCount: 10, size: '1242 × 2208 px' },
  'ipad-13':   { label: 'iPad 13"', icon: Tablet, maxCount: 10, size: '2064 × 2752 px' },
  'ipad-11':   { label: 'iPad 11"', icon: Tablet, maxCount: 10, size: '1668 × 2388 px' },
};

function UploadSlot({
  index, screenshot, onAdd, onRemove, isTablet,
}: {
  index: number;
  screenshot?: Screenshot;
  onAdd: (file: File) => void;
  onRemove: () => void;
  isTablet?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draggingOver, setDraggingOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (f.type.startsWith('image/')) onAdd(f);
  };

  const style = isTablet
    ? { width: '108px', minWidth: '108px', aspectRatio: '3/4' }
    : { width: '76px', minWidth: '76px', aspectRatio: '9/19.5' };

  if (screenshot) {
    return (
      <div className="relative group" style={style}>
        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/40 transition-colors pointer-events-none z-10" />
        <div className="absolute top-1.5 left-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-white/70">
          <GripVertical className="h-3.5 w-3.5 drop-shadow" />
        </div>
        <button
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 rounded-full bg-black/60 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 shadow-sm"
        >
          <X className="h-3 w-3" />
        </button>
        <div className="absolute bottom-1.5 left-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-medium bg-black/60 text-white/80 rounded px-1 py-0.5">
            {index + 1}
          </span>
        </div>
        <img
          src={screenshot.url}
          alt={`Screenshot ${index + 1}`}
          className="w-full h-full object-cover rounded-xl"
          style={style}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
      onDragLeave={() => setDraggingOver(false)}
      onDrop={(e) => { e.preventDefault(); setDraggingOver(false); handleFiles(e.dataTransfer.files); }}
      style={style}
      className={cn(
        'rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group',
        draggingOver
          ? 'border-primary bg-primary/5'
          : 'border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/40',
      )}
    >
      <Upload className={cn('h-4 w-4 transition-colors', draggingOver ? 'text-primary' : 'text-muted-foreground/30 group-hover:text-muted-foreground/60')} />
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </button>
  );
}

function DeviceSection({
  device, screenshots, onAdd, onRemove,
}: {
  device: DeviceType;
  screenshots: Screenshot[];
  onAdd: (device: DeviceType, file: File) => void;
  onRemove: (device: DeviceType, id: string) => void;
}) {
  const meta = DEVICES[device];
  const isTablet = device.startsWith('ipad');
  const slots = Array.from({ length: Math.min(meta.maxCount, screenshots.length + 1) });
  const filled = screenshots.length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Device header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <meta.icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium">{meta.label}</span>
            {meta.required && (
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">Requis</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">{meta.size}</p>
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{filled}/{meta.maxCount}</span>
      </div>

      {/* Screenshots row */}
      <div className="p-4">
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-macos">
          {slots.map((_, i) => {
            const shot = screenshots[i];
            return (
              <UploadSlot
                key={shot?.id ?? `empty-${i}`}
                index={i}
                screenshot={shot}
                isTablet={isTablet}
                onAdd={(f) => onAdd(device, f)}
                onRemove={() => shot && onRemove(device, shot.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

type ScreenshotMap = Record<DeviceType, Screenshot[]>;

const EMPTY_MAP: ScreenshotMap = {
  'iphone-67': [], 'iphone-65': [], 'iphone-55': [], 'ipad-13': [], 'ipad-11': [],
};

type View = 'iphone' | 'ipad';

export default function ScreenshotsPage() {
  const [screenshots, setScreenshots] = useState<ScreenshotMap>(EMPTY_MAP);
  const [view, setView] = useState<View>('iphone');

  const handleAdd = (device: DeviceType, file: File) => {
    const url = URL.createObjectURL(file);
    const id = `${device}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setScreenshots((prev) => ({ ...prev, [device]: [...prev[device], { id, url, file }] }));
  };

  const handleRemove = (device: DeviceType, id: string) => {
    setScreenshots((prev) => {
      const shot = prev[device].find((s) => s.id === id);
      if (shot?.url.startsWith('blob:')) URL.revokeObjectURL(shot.url);
      return { ...prev, [device]: prev[device].filter((s) => s.id !== id) };
    });
  };

  const iphoneDevices: DeviceType[] = ['iphone-67', 'iphone-65', 'iphone-55'];
  const ipadDevices: DeviceType[] = ['ipad-13', 'ipad-11'];
  const visibleDevices = view === 'iphone' ? iphoneDevices : ipadDevices;

  const iphoneCount = iphoneDevices.reduce((s, d) => s + screenshots[d].length, 0);
  const ipadCount = ipadDevices.reduce((s, d) => s + screenshots[d].length, 0);
  const totalCount = iphoneCount + ipadCount;

  return (
    <div className="p-8 scrollbar-macos">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Screenshots</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Prévisualisez et organisez vos captures App Store par appareil.
          {totalCount > 0 && <span className="ml-2 text-muted-foreground/60">{totalCount} capture{totalCount > 1 ? 's' : ''}</span>}
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 mb-6">
        <Info className="h-4 w-4 text-blue-500/70 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Prévisualisez et organisez ici. Pour soumettre à l&apos;App Store, utilisez App Store Connect ou Transporter.
          </p>
        </div>
        <a
          href="https://appstoreconnect.apple.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-500/70 hover:text-blue-500 transition-colors shrink-0 whitespace-nowrap"
        >
          App Store Connect <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Device type tabs */}
      <div className="flex items-center gap-1 mb-6 bg-muted/30 rounded-xl p-1 w-fit border border-border/40">
        <button
          onClick={() => setView('iphone')}
          className={cn(
            'flex items-center gap-2 px-4 h-8 rounded-lg text-[13px] font-medium transition-all',
            view === 'iphone'
              ? 'bg-card shadow-sm text-foreground border border-border/50'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Smartphone className="h-3.5 w-3.5" />
          iPhone
          {iphoneCount > 0 && (
            <span className="h-4 min-w-4 px-1 rounded-full bg-primary/15 text-primary text-[10px] font-semibold flex items-center justify-center">
              {iphoneCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setView('ipad')}
          className={cn(
            'flex items-center gap-2 px-4 h-8 rounded-lg text-[13px] font-medium transition-all',
            view === 'ipad'
              ? 'bg-card shadow-sm text-foreground border border-border/50'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Tablet className="h-3.5 w-3.5" />
          iPad
          {ipadCount > 0 && (
            <span className="h-4 min-w-4 px-1 rounded-full bg-primary/15 text-primary text-[10px] font-semibold flex items-center justify-center">
              {ipadCount}
            </span>
          )}
        </button>
      </div>

      {/* Device sections */}
      <div className="space-y-4">
        {visibleDevices.map((device) => (
          <DeviceSection
            key={device}
            device={device}
            screenshots={screenshots[device]}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-border/50">
          <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
            <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium mb-1.5">Aucun screenshot pour l&apos;instant</p>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Cliquez sur un emplacement vide ci-dessus ou glissez-déposez une image pour ajouter un screenshot.
          </p>
        </div>
      )}

      {/* Specs table */}
      <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h3 className="text-[13px] font-medium">Exigences Apple</h3>
        </div>
        <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.entries(DEVICES) as [DeviceType, DeviceMeta][]).map(([, meta]) => (
            <div key={meta.label} className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                <meta.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-medium">{meta.label}</p>
                  {meta.required && <span className="text-[10px] text-emerald-600">Requis</span>}
                </div>
                <p className="text-[11px] text-muted-foreground">{meta.size}</p>
                <p className="text-[11px] text-muted-foreground/60">Max {meta.maxCount} captures</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4">
          <p className="text-[11px] text-muted-foreground/50">
            Formats : PNG, JPEG. Les screenshots 6.7&quot; sont obligatoires et couvrent tous les iPhone si les autres tailles ne sont pas fournies.
          </p>
        </div>
      </div>
    </div>
  );
}
