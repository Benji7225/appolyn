'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  LogOut, CreditCard, Key, Link2, Shield, Smartphone, Share2, ArrowRight, type LucideIcon,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

// Réglages « par COMPTE » : valent pour tout ton espace Appolyn, quelle que soit l'app.
const ACCOUNT: { href: string; icon: LucideIcon; title: string; desc: string }[] = [
  { href: '/app/settings/app-store-connect', icon: Key, title: 'App Store Connect', desc: 'Ta clé API (.p8) qui relie Appolyn à Apple. Elle débloque tes vraies données pour toutes tes apps.' },
  { href: '/app/settings/billing', icon: CreditCard, title: 'Abonnement', desc: 'Ton offre Appolyn et ta facturation.' },
  { href: '/app/settings/connections', icon: Link2, title: 'Réseaux & publicité', desc: 'Connecte tes réseaux sociaux et tes régies pub pour publier et suivre tes performances.' },
  { href: '/app/settings/security', icon: Shield, title: 'Sécurité', desc: 'Mot de passe et accès à ton compte.' },
];

// Réglages « par APP » : propres à l'app sélectionnée en haut.
const PER_APP: { href: string; icon: LucideIcon; title: string; desc: string }[] = [
  { href: '/app/settings/apps', icon: Smartphone, title: 'Mes apps', desc: 'Ajoute tes apps et leur identifiant App Store Connect.' },
  { href: '/app/settings/connections', icon: Key, title: 'Clé SDK', desc: 'La clé à brancher dans ton app (iOS / Android) pour remonter installs, utilisateurs et revenus.' },
  { href: '/app/settings/share', icon: Share2, title: 'Kit de partage', desc: 'Lien, badge App Store officiel et bannière, prêts à coller partout.' },
];

function SettingCard({ href, icon: Icon, title, desc }: { href: string; icon: LucideIcon; title: string; desc: string }) {
  return (
    <Link href={href} className="group rounded-xl border border-border/50 bg-card p-4 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
          <Icon className="h-[18px] w-[18px] text-foreground" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="text-sm font-medium mt-3">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
    </Link>
  );
}

export default function SettingsHub() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const signOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="space-y-8">
      {/* Compte */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold">Ton compte Appolyn</h2>
            <p className="text-xs text-muted-foreground">Vaut pour tout ton espace, quelle que soit l&apos;app.</p>
          </div>
          {user?.email && <span className="text-xs text-muted-foreground truncate">{user.email}</span>}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {ACCOUNT.map((c) => <SettingCard key={c.title} {...c} />)}
        </div>
      </section>

      {/* App sélectionnée */}
      <section>
        <h2 className="text-sm font-semibold mb-1">L&apos;app sélectionnée</h2>
        <p className="text-xs text-muted-foreground mb-3">Propre à l&apos;app choisie en haut de l&apos;écran.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {PER_APP.map((c) => <SettingCard key={c.title} {...c} />)}
        </div>
      </section>

      {/* Session */}
      <section className="pt-2 border-t border-border/40">
        <Button variant="outline" onClick={signOut} disabled={signingOut} className="h-9">
          <LogOut className="h-4 w-4 mr-1.5" />
          {signingOut ? 'Déconnexion...' : 'Se déconnecter'}
        </Button>
      </section>
    </div>
  );
}
