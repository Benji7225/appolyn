# Règles de collaboration Bolt ↔ Claude (Appolyn)

Deux intervenants sur ce repo :
- **Claude** : backend, sécurité, intégrations, base de données, IA, déploiement.
- **Bolt** : interface marketing et visuel uniquement.

Le but de ce fichier : éviter qu'on s'écrase mutuellement.

## Bolt peut modifier (public + visuel)
- `app/(dashboard)/dashboard/marketing/**` (Organique, Publicité, sous-routes)
- `app/page.tsx` (landing page publique) et **nouvelles pages publiques** (ex. `app/pricing/`, `app/about/`, `app/help/`)
- **Nouveaux** composants de présentation autonomes (ex. calendrier de contenu, composeur de post, cartes de campagne, hero de landing). Les créer comme nouveaux fichiers.

## Bolt ne doit JAMAIS toucher
- `supabase/**` (migrations, edge functions)
- `app/api/**` (routes serveur, IA)
- `lib/**` (supabase, aso, types de base de données)
- `app/(auth)/**` (login, signup)
- `next.config.js`, `package.json`, `tailwind.config.ts`, `app/globals.css` (config + thème global)
- **Les pages du dashboard branchées aux vraies données (gérées par Claude)** : `app/(dashboard)/dashboard/page.tsx` (Overview), `analytics/`, `reviews/`, `competitors/`, `metadata/`, `keywords/`, `audit/`, `apps/`, `settings/`.
- **Les composants partagés/branchés** : `components/dashboard/sidebar.tsx`, `shell.tsx`, `copilot.tsx`, `review-analysis.tsx`, `add-app-dialog.tsx`.

Règle simple : Bolt = tout ce qui est PUBLIC et purement visuel (marketing, landing, pricing, nouveaux composants). Claude = tout ce qui est branché aux vraies données et au backend.

## Secrets
- N'ajoute AUCUNE variable d'environnement ni clé API.
- La connexion Supabase publique est déjà dans `next.config.js`. Les vrais secrets (.p8, clé Anthropic, service role) vivent sur Vercel/Supabase, hors du repo. Dans l'aperçu Bolt, l'IA et App Store Connect ne marcheront pas : c'est normal, ça remarche une fois déployé.

## Style à respecter (mode clair)
- Cartes : `rounded-xl border border-border bg-card`
- Texte secondaire : `text-muted-foreground`
- Accent / actions : `text-primary` (bleu), boutons `bg-primary text-primary-foreground`
- Survol : `hover:bg-accent`
- Garder l'esprit épuré clair (façon dashboard SaaS moderne).

## Workflow (important)
1. Bolt travaille sur la branche **`bolt-marketing`**, jamais directement sur `main`.
2. Avant de commencer une session Bolt : récupérer la dernière version du repo.
3. Quand Bolt a fini : pousser sur `bolt-marketing` et prévenir Claude, qui relit et fusionne dans `main`.
4. Ne jamais éditer en même temps que Claude sur les mêmes fichiers.
