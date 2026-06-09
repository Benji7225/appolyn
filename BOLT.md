# Règles de collaboration Bolt ↔ Claude (Appolyn)

Deux intervenants sur ce repo :
- **Claude** : backend, sécurité, intégrations, base de données, IA, déploiement.
- **Bolt** : interface marketing et visuel uniquement.

Le but de ce fichier : éviter qu'on s'écrase mutuellement.

## Bolt peut modifier (interface / visuel seulement)
- `app/(dashboard)/dashboard/marketing/**` (Organique, Publicité)
- Composants d'affichage marketing dans `components/dashboard/` (ex. nouveaux composants de calendrier, composeur de post, cartes de campagne)
- `app/page.tsx` (landing page publique, visuel)

## Bolt ne doit JAMAIS toucher
- `supabase/**` (migrations, edge functions)
- `app/api/**` (routes serveur, IA)
- `lib/**` (supabase, aso, types de base de données)
- `app/(auth)/**` (login, signup)
- `next.config.js`, `package.json`, `tailwind.config.ts`, `app/globals.css` (config + thème global)

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
