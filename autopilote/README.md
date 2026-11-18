# Appolyn en pilote automatique

> Ce dossier est la mémoire de l'agent qui améliore Appolyn seul, chaque nuit, pendant que Benjamin s'occupe de Vision.
> Branche de travail : `autopilote`. Créé le 18/11/2026. Lu en entier au début de CHAQUE passage.

## La mission

Benjamin relancera Appolyn dans environ 10 à 12 mois (fin 2027). Il ne veut rien avoir à faire d'ici là : pas de relecture,
pas de décision, pas de question. Le jour où il revient, il branche ses clés (Stripe, Google, Meta, TikTok…) et tout doit
marcher, à jour face aux concurrents de ce moment-là.

Ton travail : améliorer le produit en boucle, une section à la fois, en partant de ce que font les concurrents et de ce que
veulent les développeurs. Un livrable solide et vérifié par passage, pas dix choses à moitié faites.

## Ce qu'est Appolyn

« Tout ce qui vient après le build de ton app. » Un SaaS pour développeurs iOS indés (souvent seuls), ~20 €/mois.
Ambition : le Shopify des apps indés, l'endroit unique où l'on fait grandir son app une fois codée.
- Fiche App Store optimisée par l'IA et publiée en 22+ langues via l'API App Store Connect, en un clic.
- Vrais chiffres : téléchargements, revenus, abonnements, rétention, sources d'installation, finance.
- Avis + réponses IA, suivi des concurrents (données iTunes réelles), mots-clés et classements.
- Site public d'app par slug (`/site/<slug>`), kit presse, screenshots, paywalls, lancement, idées de contenu,
  programmation et cross-post sur les réseaux, notifications.
- SDK iOS `Benji7225/appolyn-ios` (StoreKit 2, attribution, `isSubscribed()`), dossier `sdk/`.
- Blog SEO quotidien généré côté serveur (`app/api/cron/blog`, table Supabase `blog_posts`, déclenché par pg_cron).
- Interface en français, tutoiement, ton direct. Pas de jargon gratuit.

Docs déjà là, à lire au premier passage puis au besoin : `ANALYSE-CONCURRENTS.md` (Postback, AppSprint, Astro, Appfigures,
les reproches des utilisateurs), `ROADMAP.md`, `BACKLOG.md`, `WISHLIST.md`, `SEO-PLAN.md`, `DECISIONS-DESIGN.md`.

## Les sections et leurs concurrents de référence

Rotation dans cet ordre (une section par passage, puis on recommence au début avec un regard neuf) :

| Section (`app/(dashboard)/app/…`) | Concurrents à étudier en priorité |
|---|---|
| `keywords` | Astro, AppTweak, Appfigures, AppSprint, Sensor Tower |
| `localization` | AppSprint, Postback, Lokalise, AppTweak |
| `apps` (fiche App Store, éditeur ASO) | AppTweak, App Radar, Postback, Astro |
| `screenshots` | AppLaunchpad, Previewed, Screenshots.pro, Picasso |
| `analytics` | RevenueCat, Appfigures, Adapty, App Store Connect |
| `finance` | RevenueCat, ChartMogul, Baremetrics |
| `paywalls` | Superwall, RevenueCat Paywalls, Adapty |
| `reviews` | Appbot, AppFollow, Appfigures |
| `competitors` | Sensor Tower, Appfigures, AppTweak |
| `launch` | Product Hunt kits, LaunchKit, checklists d'indés |
| `content-ideas` et la programmation de posts | Buffer, Metricool, Typefully, Postiz, Later |
| `site` (site public d'app) | Carrd, LaunchKit, AppLanding, Framer templates |
| `press-kit` | presskit(), Appfigures, kits presse d'indés connus |
| `clients` (attribution, SDK) | RevenueCat, Adapty, AppsFlyer, Branch |
| `notifications` | OneSignal, RevenueCat alerts |
| `health` | Appfigures, Sentry, Crashlytics (vue « santé de l'app ») |
| `onboarding` | onboarding de RevenueCat, Superwall, Linear |
| `settings` (connexions) | tout ce qui demande une clé : écran clair, pas à pas |
| SEO (1 passage sur 4) | voir plus bas |

## Un passage, étape par étape

1. `git fetch origin && git merge origin/main` (main bouge rarement ; en cas de conflit, garder les deux intentions).
2. Lire ce README, les 10 dernières entrées de `JOURNAL.md`, `BACKLOG-AUTO.md`, et la fiche de la section du jour dans
   `sections/` si elle existe.
3. Choisir la section : la suivante dans la rotation (voir la dernière entrée du journal). Tous les 4 passages, c'est un
   passage SEO.
4. Recherche, sur le vrai web (WebSearch, WebFetch) : comment les 2 ou 3 concurrents de la section l'organisent
   aujourd'hui (pages produit, docs, changelogs, captures dans les articles, avis d'utilisateurs, Reddit, X). Noter les
   sources. Ne rien inventer : si une info n'est pas trouvée, l'écrire.
5. Écrire ou mettre à jour `sections/<section>.md` : à quoi sert la section, ce que le dev veut y faire en 30 secondes,
   ce que font les concurrents (avec sources et date), ce qui manque chez nous, ce qu'on a décidé et pourquoi.
6. Implémenter UNE amélioration de bout en bout (code, textes FR, états vides, erreurs, mobile). La plus utile d'abord.
7. Vérifier : `npm ci` si besoin, puis `npm run typecheck`, `npm run lint` et `npm run build`. Si le build exige des
   variables d'environnement, mettre des valeurs factices dans la commande (jamais dans un fichier commité). Si ça ne passe
   pas, réparer ; si c'est irréparable dans le passage, annuler le changement plutôt que pousser du code cassé.
8. Committer sur `autopilote` (message en français, clair), pousser `origin autopilote`.
9. Ajouter une entrée en haut de `JOURNAL.md` (date, section, ce qui a été fait, vérifications, ce qui reste), mettre à jour
   `BACKLOG-AUTO.md` et `A-LIRE-AU-RETOUR.md`.

## Passage SEO (1 sur 4)

Le domaine `appolyn.io` est jeune ; le but est d'être bien référencé dans 12 mois, avec de la qualité, pas une ferme
à articles (voir `SEO-PLAN.md`, à suivre). Les articles du blog sont générés en production par la route
`app/api/cron/blog` à partir d'une liste de sujets qui tourne en boucle. Leviers, par ordre :
1. Le générateur : une liste de sujets bien plus large, sans doublon possible (ne jamais reprendre un sujet déjà publié),
   des sujets choisis sur de vraies recherches de développeurs, des liens internes vers les pages d'Appolyn.
2. Les outils gratuits qui rankent (pilier 1 de `SEO-PLAN.md`) : vérificateur de fiche, recherche de mots-clés, tailles
   de screenshots… une page publique = un outil utile qui mène à l'inscription.
3. Le SEO technique : métadonnées, données structurées, maillage, sitemap, vitesse.
Langue : anglais pour le blog et les outils publics (l'audience mondiale), l'app reste en français.

## Les connecteurs

Tout ce qui demande une clé (Stripe, OAuth Google, Meta, TikTok, X, YouTube, Anthropic, App Store Connect…) se code
derrière des variables d'environnement, avec un écran de connexion clair et un état « pas encore branché » propre.
Chaque clé nécessaire est listée dans `CONNECTEURS-A-FOURNIR.md` : nom de la variable, où l'obtenir (pas à pas),
ce qu'elle débloque. Jamais de vraie clé dans le dépôt.

## Règles absolues

- Travailler UNIQUEMENT sur la branche `autopilote`. Jamais de commit ni de push sur `main`.
- Ne rien déployer (pas de Vercel, pas de Netlify, pas de Supabase).
- Aucun secret dans le dépôt, aucun appel à des services payants avec de vraies clés.
- Ne pas toucher aux prix, aux offres ni à la configuration Stripe. Ne rien envoyer à de vrais utilisateurs (mails,
  notifications).
- Base de données : uniquement de nouveaux fichiers dans `supabase/migrations/`, jamais appliqués ; les lister dans
  `A-LIRE-AU-RETOUR.md` (« à appliquer avant de déployer »).
- Ne jamais supprimer une fonctionnalité existante sans la remplacer par mieux, et le justifier dans le journal.
- Faits vérifiables seulement : pas de chiffres inventés, pas de fausses promesses dans les textes.
- Un passage qui ne trouve rien d'utile à faire écrit pourquoi dans le journal et s'arrête proprement.

## Au retour de Benjamin

`A-LIRE-AU-RETOUR.md` doit toujours dire, en une page : ce qui est prêt, les clés à fournir, les migrations à appliquer,
et comment passer en production (fusionner `autopilote` dans `main`, appliquer les migrations, déployer).
