'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Instagram, Music2, Youtube, Facebook, Search, Megaphone,
  ChevronDown, CheckCircle2, Circle, type LucideIcon,
} from 'lucide-react';

// At-a-glance marketing channels in the top bar: organic + paid platforms,
// logos coloured when the account is connected and greyed out when not, with a
// one-click link to connect. No invented metrics — it only reflects the real
// connection state from social_accounts.
type Ch = { id: string; account: string | null; name: string; icon: LucideIcon; color: string };

const ORGANIC: Ch[] = [
  { id: 'tiktok', account: 'tiktok', name: 'TikTok', icon: Music2, color: '#010101' },
  { id: 'instagram', account: 'meta', name: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'youtube', account: 'youtube', name: 'YouTube', icon: Youtube, color: '#FF0000' },
  { id: 'facebook', account: 'meta', name: 'Facebook', icon: Facebook, color: '#1877F2' },
];

// Ad platforms aren't wired yet (no integration), so they're always "à venir".
const PAID: Ch[] = [
  { id: 'asa', account: null, name: 'Apple Search Ads', icon: Search, color: '#0071E3' },
  { id: 'meta-ads', account: null, name: 'Meta Ads', icon: Facebook, color: '#1877F2' },
  { id: 'tiktok-ads', account: null, name: 'TikTok Ads', icon: Music2, color: '#010101' },
  { id: 'google-uac', account: null, name: 'Google UAC', icon: Megaphone, color: '#4285F4' },
];

function Dropdown({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full right-0 mt-1.5 z-50 w-[280px] rounded-xl border border-border bg-popover text-popover-foreground shadow-xl shadow-black/10 p-2">
        {children}
      </div>
    </>
  );
}

function Row({ ch, connected, href, soon }: { ch: Ch; connected: boolean; href: string; soon?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors">
      <span
        className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
        style={connected ? { backgroundColor: `${ch.color}18` } : undefined}
      >
        <ch.icon className={`h-4 w-4 ${connected ? '' : 'text-muted-foreground/35'}`}
          style={connected ? { color: ch.color } : undefined} />
      </span>
      <span className={`text-[13px] flex-1 truncate ${connected ? '' : 'text-muted-foreground'}`}>{ch.name}</span>
      {soon ? (
        <span className="text-[10px] text-muted-foreground/60 shrink-0">Bientôt</span>
      ) : connected ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
      ) : (
        <span className="text-[11px] text-primary shrink-0">Connecter</span>
      )}
    </Link>
  );
}

export function ChannelSwitcher() {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('social_accounts').select('platform').eq('status', 'connected').then(({ data }) => {
      setConnected(((data as { platform: string }[] | null) ?? []).map((a) => a.platform));
    });
  }, []);

  const isOn = (ch: Ch) => !!ch.account && connected.includes(ch.account);
  const nbOn = ORGANIC.filter(isOn).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-8 pl-2 pr-2 rounded-lg hover:bg-white/10 transition-colors"
        title="Canaux marketing">
        <span className="flex items-center -space-x-1">
          {ORGANIC.map((ch) => (
            <span key={ch.id}
              className="h-5 w-5 rounded-full flex items-center justify-center ring-1 ring-neutral-950"
              style={{ backgroundColor: isOn(ch) ? ch.color : '#3f3f46' }}>
              <ch.icon className="h-3 w-3 text-white" />
            </span>
          ))}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
      </button>

      <Dropdown open={open} onClose={() => setOpen(false)}>
        <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Organique</span>
          <span className="text-muted-foreground/60 normal-case tracking-normal">{nbOn}/{ORGANIC.length} connecté{nbOn > 1 ? 's' : ''}</span>
        </p>
        {ORGANIC.map((ch) => (
          <Row key={ch.id} ch={ch} connected={isOn(ch)} href="/dashboard/marketing/organic" />
        ))}
        <div className="my-1.5 border-t border-border" />
        <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Publicité</p>
        {PAID.map((ch) => (
          <Row key={ch.id} ch={ch} connected={false} href="/dashboard/marketing/paid" soon />
        ))}
        <div className="my-1.5 border-t border-border" />
        <Link href="/dashboard/marketing/organic" onClick={() => setOpen(false)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] text-primary hover:bg-accent transition-colors">
          <Circle className="h-3.5 w-3.5" /> Gérer tous les canaux
        </Link>
      </Dropdown>
    </div>
  );
}
