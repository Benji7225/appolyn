'use client';

import { useState, useRef } from 'react';
import { PageHeader, SubNav } from '@/components/dashboard/shell';
import { Monitor, Smartphone, Tablet, Upload, X, Info, ExternalLink, GripVertical, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeviceType = 'iphone-67' | 'iphone-65' | 'iphone-55' | 'ipad-13' | 'ipad-11';

type Screenshot = {
  id: string;
  url: string;
  file?: File;
};

type DeviceMeta = {
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  ratio: string;
  maxCount: number;
  size: string;
};

const DEVICES: Record<DeviceType, DeviceMeta> = {
  'iphone-67': { label: 'iPhone 6.7"', shortLabel: '6.7"', icon: Smartphone, ratio: '9/19.5', maxCount: 10, size: '1290 × 2796 px' },
  'iphone-65': { label: 'iPhone 6.5"', shortLabel: '6.5"', icon: Smartphone, ratio: '9/19.5', maxCount: 10, size: '1242 × 2688 px' },
  'iphone-55': { label: 'iPhone 5.5"', shortLabel: '5.5"', icon: Smartphone, ratio: '9/16', maxCount: 10, size: '1242 × 2208 px' },
  'ipad-13':   { label: 'iPad 13"', shortLabel: 'iPad 13"', icon: Tablet, ratio: '3/4', maxCount: 10, size: '2064 × 2752 px' },
  'ipad-11':   { label: 'iPad 11"', shortLabel: 'iPad 11"', icon: Tablet, ratio: '3/4', maxCount: 10, size: '1668 × 2388 px' },
};

const STORE_NAV = [
  { href: '/dashboard/store', label: 'App Store Page' },
  { href: '/dashboard/store/screenshots', label: 'Screenshots' },
];

// ─── Upload slot ──────────────────────────────────────────────────────────────

function UploadSlot({
  index, screenshot, onAdd, onRemove,
}: {
  index: number;
  screenshot?: Screenshot;
  onAdd: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draggingOver, setDraggingOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (f.type.startsWith('image/')) onAdd(f);
  };

  if (screenshot) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/30 transition-colors pointer-events-none z-10 rounded-xl" />
        <div className="absolute top-1.5 left-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onRemove}
            className="h-6 w-6 rounded-full bg-background/90 border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors shadow-sm"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="absolute bottom-1.5 left-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-medium bg-background/90 border border-border rounded px-1.5 py-0.5 text-muted-foreground shadow-sm">
            {index + 1}
          </span>
        </div>
        <img
          src={screenshot.url}
          alt={`Screenshot ${index + 1}`}
          className="w-full h-full object-cover rounded-xl"
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
      className={cn(
        'w-full h-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group',
        draggingOver
          ? 'border-primary bg-primary/5'
          : 'border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/40',
      )}
    >
      <Upload className={cn('h-5 w-5 transition-colors', draggingOver ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-muted-foreground/70')} />
      <span className={cn('text-[11px] transition-colors', draggingOver ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-muted-foreground/60')}>
        Ajouter
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </button>
  );
}

// ─── Device section ───────────────────────────────────────────────────────────

function DeviceScreenshots({
  device, screenshots, onAdd, onRemove,
}: {
  device: DeviceType;
  screenshots: Screenshot[];
  onAdd: (device: DeviceType, file: File) => void;
  onRemove: (device: DeviceType, id: string) => void;
}) {
  const meta = DEVICES[device];
  const slots = Array.from({ length: Math.min(meta.maxCount, screenshots.length + 1) });
  const [ratio] = meta.ratio.split('/').map(Number);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <meta.icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{meta.label}</span>
        <span className="text-[11px] text-muted-foreground">{meta.size}</span>
        <span className="ml-auto text-[11px] text-muted-foreground">{screenshots.length}/{meta.maxCount}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-macos">
        {slots.map((_, i) => {
          const shot = screenshots[i];
          const aspectStyle = device.startsWith('ipad')
            ? { width: '110px', minWidth: '110px', aspectRatio: '3/4' }
            : { width: '80px', minWidth: '80px', aspectRatio: '9/19.5' };
          return (
            <div key={shot?.id ?? `empty-${i}`} style={aspectStyle}>
              <UploadSlot
                index={i}
                screenshot={shot}
                onAdd={(f) => onAdd(device, f)}
                onRemove={() => shot && onRemove(device, shot.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ScreenshotMap = Record<DeviceType, Screenshot[]>;

const EMPTY_MAP: ScreenshotMap = {
  'iphone-67': [], 'iphone-65': [], 'iphone-55': [], 'ipad-13': [], 'ipad-11': [],
};

export default function ScreenshotsPage() {
  const [screenshots, setScreenshots] = useState<ScreenshotMap>(EMPTY_MAP);
  const [activeView, setActiveView] = useState<'phone' | 'tablet'>('phone');
  const totalCount = Object.values(screenshots).reduce((s, a) => s + a.length, 0);

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

  const phoneDevices: DeviceType[] = ['iphone-67', 'iphone-65', 'iphone-55'];
  const tabletDevices: DeviceType[] = ['ipad-13', 'ipad-11'];
  const visibleDevices = activeView === 'phone' ? phoneDevices : tabletDevices;

  return (
    <div className="p-8 max-w-5xl scrollbar-macos">
      <PageHeader
        title="Screenshots"
        description="Visualisez et gérez vos captures App Store par appareil."
        actions={
          totalCount > 0 ? (
            <span className="text-sm text-muted-foreground">{totalCount} capture{totalCount > 1 ? 's' : ''}</span>
          ) : undefined
        }
      />
      <SubNav items={STORE_NAV} />

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border mb-6">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Prévisualisez et organisez vos screenshots ici. Pour soumettre à l&apos;App Store, utilisez App Store Connect ou Transporter.
          </p>
        </div>
        <a
          href="https://appstoreconnect.apple.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
        >
          App Store Connect <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Device type switcher */}
      <div className="flex items-center gap-1 mb-6 bg-muted/40 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveView('phone')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeView === 'phone' ? 'bg-card shadow-sm text-foreground border border-border/50' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Smartphone className="h-4 w-4" /> iPhone
          {phoneDevices.some((d) => screenshots[d].length > 0) && (
            <span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
              {phoneDevices.reduce((s, d) => s + screenshots[d].length, 0)}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveView('tablet')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeView === 'tablet' ? 'bg-card shadow-sm text-foreground border border-border/50' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Tablet className="h-4 w-4" /> iPad
          {tabletDevices.some((d) => screenshots[d].length > 0) && (
            <span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
              {tabletDevices.reduce((s, d) => s + screenshots[d].length, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Device sections */}
      <div className="space-y-8">
        {visibleDevices.map((device) => (
          <DeviceScreenshots
            key={device}
            device={device}
            screenshots={screenshots[device]}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {/* Empty state hint */}
      {totalCount === 0 && (
        <div className="mt-10 flex flex-col items-center justify-center text-center py-12 rounded-2xl border border-dashed border-border/60">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <ImageIcon className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-medium mb-1">Aucun screenshot</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Cliquez sur un emplacement vide ou glissez-déposez une image pour ajouter un screenshot.
          </p>
        </div>
      )}

      {/* Guidelines */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Exigences Apple</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.entries(DEVICES) as [DeviceType, DeviceMeta][]).map(([, meta]) => (
            <div key={meta.label} className="flex items-start gap-2.5">
              <meta.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium">{meta.label}</p>
                <p className="text-[11px] text-muted-foreground">{meta.size}</p>
                <p className="text-[11px] text-muted-foreground/70">Max {meta.maxCount} captures</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-4">
          Formats acceptés : PNG, JPEG. Les screenshots iPhone 6.7&quot; sont obligatoires et s&apos;afficheront sur tous les iPhone si les autres formats ne sont pas fournis.
        </p>
      </div>
    </div>
  );
}
