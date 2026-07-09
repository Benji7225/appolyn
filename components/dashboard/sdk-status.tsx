'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Loader2, Radio } from 'lucide-react';

// « Le SDK est-il branché ? » : LA réponse que le dev attend, en clair. On regarde
// si l'app sélectionnée a reçu le moindre signal du SDK (sdk_events). Lecture via
// RLS (le dev ne voit que ses apps). Tant que rien n'est arrivé, on re-sonde en
// direct pour que le passage au vert soit immédiat quand le dev lance son app.
// Réutilisable (pop-up SDK, Connexions, états vides des pages Utilisateurs…).

export type SdkStatus = { loading: boolean; clients: number; events: number; lastEvent: string | null; justArrived: boolean };

const db = supabase as unknown as { from: (t: string) => any };

export function useSdkStatus(appId?: string): SdkStatus {
  const [s, setS] = useState<SdkStatus>({ loading: true, clients: 0, events: 0, lastEvent: null, justArrived: false });
  const prevEvents = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    if (!appId) { setS({ loading: false, clients: 0, events: 0, lastEvent: null, justArrived: false }); return; }
    prevEvents.current = 0;
    setS((p) => ({ ...p, loading: true }));

    const fetchOnce = async () => {
      try {
        const [clientsRes, eventsRes, lastRes] = await Promise.all([
          db.from('sdk_clients').select('id', { count: 'exact', head: true }).eq('app_id', appId),
          db.from('sdk_events').select('id', { count: 'exact', head: true }).eq('app_id', appId),
          db.from('sdk_events').select('created_at').eq('app_id', appId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (cancelled) return;
        const events = eventsRes.count ?? 0;
        const justArrived = prevEvents.current === 0 && events > 0;
        prevEvents.current = events;
        setS({ loading: false, clients: clientsRes.count ?? 0, events, lastEvent: (lastRes.data?.created_at as string) ?? null, justArrived });
        // Une fois le 1er signal reçu, plus besoin de sonder.
        if (events > 0 && timer) { clearInterval(timer); timer = undefined; }
      } catch { if (!cancelled) setS((p) => ({ ...p, loading: false })); }
    };

    fetchOnce();
    // Sondage léger tant que rien n'est arrivé (s'arrête tout seul au 1er signal).
    timer = setInterval(fetchOnce, 5000);
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [appId]);
  return s;
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return "à l'instant";
  const m = s / 60; if (m < 60) return `il y a ${Math.round(m)} min`;
  const h = m / 60; if (h < 48) return `il y a ${Math.round(h)} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

// Bandeau de statut clair, à poser là où le dev branche / consulte le SDK.
export function SdkStatusBanner({ appId }: { appId?: string }) {
  const { loading, clients, events, lastEvent, justArrived } = useSdkStatus(appId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Vérification du branchement…
      </div>
    );
  }
  if (events === 0) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5 text-xs">
        <p className="font-medium text-amber-600 inline-flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 animate-pulse" /> En écoute… lance ton app</p>
        <p className="text-muted-foreground mt-1 leading-relaxed">
          Le SDK n&apos;a encore rien envoyé depuis cette app. Vérifie que la ligne <code className="font-mono">Appolyn.start(key:)</code> est bien appelée au lancement (le fichier seul ne suffit pas) et que tu as relancé un build. Dès qu&apos;un lancement passe, ça devient vert ici, en direct.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2.5 text-xs">
      <p className="font-medium text-emerald-600 inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> {justArrived ? 'Premier signal reçu 🎉' : 'Branché et fonctionnel'}</p>
      <p className="text-muted-foreground mt-1">
        {clients.toLocaleString('fr-FR')} utilisateur{clients > 1 ? 's' : ''} · dernier signal {timeAgo(lastEvent)}.
      </p>
    </div>
  );
}
