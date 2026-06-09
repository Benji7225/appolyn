# Journal de refonte Appolyn (9 juin)

Refonte en application au look natif macOS + nouvelle navigation à 7 sections + briques réelles.
Règle d'or : zéro donnée mockée, zéro chemin mort, tout sécurisé. Commit + push + deploy après chaque étape.

## Étape 0 — Refonte UI native macOS + nouvelle nav + 7 sections [FAIT, déployé]
- Thème macOS : accent bleu système, vibrancy (sidebar translucide), scrollbars fines, rampe de bleus pour les
  graphes, police système. Mode sombre conservé et durci (globals.css, tailwind.config.ts).
- Sidebar refondue (`components/dashboard/sidebar.tsx`) : sections groupées (Overview/Analytics, Optimisation:
  Store Optimization/Reviews/Competitors, Croissance: Marketing), sélection en pastille bleue, compte + Réglages
  en bas (inchangé de place).
- Composants partagés `components/dashboard/shell.tsx` : PageHeader, EmptyState (états vides honnêtes), SubNav, StatCard.
- Nouvelles routes :
  - `/dashboard/store` : hub Store Optimization (liens réels vers App Store Page = metadata, Keywords, Audit).
  - `/dashboard/analytics` : vrais revenus/téléchargements 30 j (get-sales) + barres journalières ; MRR/churn marqués
    honnêtement "à venir" (étape B).
  - `/dashboard/competitors` : placeholder honnête (build réel étape E).
  - `/dashboard/marketing` : écran "connecter vos comptes" (organique + payant), AUCUNE stat inventée.
- Pages existantes (metadata, audit, keywords, reviews, apps, settings) intactes et accessibles.
- Vérifs : `tsc --noEmit` OK, `next build` OK (17 routes).

## D — AI Copilot flottant [FAIT, déployé]
- Route `/api/copilot` (Sonnet 4.6) GROUNDÉE sur les vraies données : apps, fiches courantes + score ASO calculé,
  ventes 30j (get-sales) et avis (get-ratings) récupérés en direct. N'invente jamais de chiffres.
- Bulle flottante `components/dashboard/copilot.tsx` montée dans le layout, présente sur toutes les pages :
  chat, suggestions, réponses en français.

## E — Competitors [FAIT, déployé]
- Migration : tables `competitors` + `competitor_snapshots` avec RLS par user_id (jusqu'à 5 concurrents).
- Route `/api/itunes` : proxy serveur de l'API publique iTunes (lookup par lien/ID, recherche par nom), authentifiée.
- Page `/dashboard/competitors` : ajout par lien/ID ou recherche, instantané réel (titre, prix, note, version, captures),
  rafraîchissement qui capture un nouveau snapshot et AFFICHE les changements détectés (diff vs précédent), suppression.

## F — Overview du matin [FAIT, déployé]
- Bloc "Actions recommandées" calculé sur des signaux RÉELS : ASC non connecté, numéro vendeur manquant,
  langues manquantes (vs 22), points ASO à corriger (audit), concurrents non suivis, avis récents à traiter.
  Chaque action pointe vers la bonne page. Aucune reco inventée.
- Conserve les vraies ventes/revenus/notes/avis + graphes existants.

## G — Marketing [FAIT en étape 0]
- Écran de connexion honnête (organique + payant), aucune statistique inventée. Connexions OAuth = plus tard.

## C — Reviews : analyse IA des plaintes [FAIT, déployé]
- Route `/api/analyze-reviews` (Sonnet 4.6, sortie structurée) : récupère les vrais avis via get-ratings, regroupe
  les thèmes récurrents avec leur part (%) et un exemple, + un résumé. Renvoie honnêtement "pas assez d'avis" si < 3.
- Composant `components/dashboard/review-analysis.tsx` inséré en haut de /dashboard/reviews : bouton Analyser,
  thèmes avec barres de pourcentage et sentiment. Pourcentages calculés sur les vrais avis, rien d'inventé.

## Reste à faire (prochaine session)
- B Analytics : edge get-subscription-metrics (MRR/ARR/churn) + revenue par pays + carte mondiale — réel mais vide
  tant que 3MN n'a pas d'abonnés (pré-lancement).
- A Store Optimization : migrer metadata/audit/keywords en vrais sous-onglets de /store + Screenshots (ASC).
- A Store Optimization : migrer metadata/audit/keywords en sous-onglets de /store + Screenshots (ASC) + Keywords réels.
- B Analytics : edge get-subscription-metrics (MRR/ARR/churn) + revenue par pays/plateforme + carte mondiale.
- C Reviews : analyse IA des plaintes (/api/analyze-reviews).
- D AI Copilot flottant (/api/copilot) branché sur les vraies données.
- E Competitors : table + RLS + snapshots iTunes réels + diff/alertes.
- F Overview : synthèse du jour + actions recommandées.
- G Marketing : déjà cadré honnêtement (connexions OAuth = plus tard).
