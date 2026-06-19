# Appolyn — Roadmap "le Shopify des développeurs d'apps mobiles"

> ⭐ **NORTH STAR (Benji, sérieux, 19/06) : Appolyn doit devenir LE prochain Shopify des développeurs d'applications mobiles.** Pas juste un outil ASO : la plateforme tout-en-un où un dev indé gère TOUT le business de son app (être trouvé, comprendre, monétiser, retenir, ACQUÉRIR/GRANDIR : SEO, blogs, marketing, contenu, pub). Tout ce qui va dans ce sens se construit en autonomie, sans demander.
> Mandat : déploie tout en continu, loops ~10 min, cycle perpétuel (cf ci-dessous), rends le produit beaucoup plus complet en autonomie.
> Domaine **appolyn.io ACHETÉ** + ajouté au projet Vercel (apex + www). Reste = DNS chez le registrar (NS → `ns1/ns2.vercel-dns.com`, ou A → `76.76.21.21`). Action Benji, puis vérif auto Vercel.
> **On est à ~30% du produit final (estimation Benji). Voir GRAND.** Ce n'est pas une liste finie : c'est un moteur d'idées qui se réalimente.
> Règle absolue : **zéro donnée mockée**. On ne construit que ce qui marche sur de la donnée RÉELLE (API iTunes publique gratuite, API App Store Connect avec la clé du dev, données SDK). Les features gated sur une dépendance externe vont dans BACKLOG ⛔, pas ici.

## ♾️ Cycle perpétuel (mode d'opération, NE JAMAIS s'arrêter)
1. Prendre le prochain item à plus fort levier (P1→P4, puis le vivier d'idées ci-dessous).
2. CONSTRUIRE (pas du polish cosmétique : de la vraie valeur produit).
3. Vérifier : `tsc` + `next lint` + `next build` verts.
4. Commit LOCAL → `git push origin main` → **deploy Vercel prod** (autorisé en continu). Edge → redéployer via CLI Supabase si changée.
5. **RE-ANALYSER tout le projet** : parcourir les pages une par une, chercher défauts, incohérences, manques, frictions vues du dev cible.
6. **BRAINSTORMER** de nouvelles idées (qu'est-ce qui rendrait le produit plus complet/parfait/automatique) → les ajouter à cette roadmap.
7. Retour à 1. Sans fin.

## 🎯 La cible (qui / pourquoi / besoins)
**Qui :** indie hacker / dev solo (ou duo) d'apps mobiles, souvent vibe-coder, pas expert marketing/ASO, peu de temps, fait tout seul (build + launch + growth). Pour l'instant iOS, Android plus tard.
**Pourquoi Appolyn :** ne plus "naviguer à l'aveugle" ni jongler entre 5 outils (App Store Connect + RevenueCat + AppFigures + un cross-poster + un outil de mots-clés…). UN endroit, où l'expertise est rendue **automatique** et **simple** (zéro jargon, 1 clic, assisté IA).
**Ses jobs-to-be-done (ce qu'il doit pouvoir faire SANS effort) :**
- Être trouvé → ASO (mots-clés, métadonnées, localisation, A/B).
- Comprendre sa perf → analytics réel (installs, **entonnoir de conversion**, revenu, rétention, cohortes).
- Monétiser → optimisation paywall/abos, offres, expériences de prix.
- Garder ses users contents → avis/notes (répondre, sentiment, alertes).
- Acquérir → contenu organique cross-post, pub (plus tard), parrainage.
- Décider → recommandations, alertes, "actions du jour", benchmarks de catégorie.
**Boussole produit :** le plus AUTOMATIQUE et le plus SIMPLE possible pour lui. S'il doit comprendre/configurer/chercher, c'est un échec.

## 💡 Vivier d'idées (à piocher + enrichir en continu ; déplacer vers P1-P4 quand mûr)
- **ASO** : reverse-ASO (mots-clés où les concurrents rankent), clustering/suggestions de mots-clés, A/B product page (PPO) + custom product pages, In-App Events, lint d'optimisation (longueurs/redondances), alertes mots-clés saisonniers/concurrents.
- **Analytics** : entonnoir ASC (impressions→vues→installs→conversion), rétention par cohorte (SDK), MRR movement + refunds, ARPU/LTV par source/cohorte, **benchmark vs catégorie**, détection d'anomalies (pic/chute).
- **Avis/réputation** : tendance sentiment, alertes chute de note, mise en avant des avis à répondre, "avis → idées de features" (extraction des demandes).
- **Monétisation** : offres d'abo (intro/promo/win-back via ASC), A/B de prix, analyse conversion d'essai.
- **Acquisition / GROWTH (pilier Shopify, prioritaire) :** ✅ **press-kit auto FAIT+DÉPLOYÉ (19/06)** (`/dashboard/press-kit`, données App Store réelles, export Markdown). ✅ **checklist de lancement FAITE+DÉPLOYÉE (19/06)** (`/dashboard/launch` : 3 phases avant/jour J/après, 22 étapes actionnables, progression sauvegardée par app via table `launch_checklist`, liens directs vers chaque outil Appolyn) ; moteur de **SEO/blog pour l'app du dev** (générer un mini-site/landing + articles SEO POUR son app, hébergés/exportables) ; **page de pré-lancement / waitlist** ; améliorer le cross-post social ; **liens de parrainage / programme d'affiliation** ; Search Ads ; **smart App Banner / deep links** ; génération IA de visuels de store + posts. Objectif : le dev fait TOUTE sa croissance depuis Appolyn.
- **Ops/portfolio** : digest quotidien + alertes, "actions du jour", **vue multi-apps (portfolio)**, export/rapports PDF, partage/équipe.
- **Onboarding/UX** : wizard plein-écran, visite guidée avec données d'exemple, aide in-app, palette de commandes (⌘K), polish dark mode.
- **Plateforme** : **Google Play / Android** (ASO + analytics), symétrie iOS.
- **IA** : copilote ASO proactif (suggère ET agit), rédaction IA des release notes, sélection IA des meilleurs mots-clés, teardown IA d'un concurrent.

## 🧠 Brainstorm 19/06 (re-analyse post-Lancement) — idées fraîches
- **Health/Growth score global de l'app** (façon score de crédit Shopify) : 1 nombre qui combine score ASO + couverture langues + notes/avis + complétude du lancement → "où en est mon app" en un coup d'œil, avec les 3 actions prioritaires. Très "tableau de bord Shopify".
- **Accueil enrichi "Actions du jour"** : tirer la progression de la checklist de lancement + langues manquantes + avis sans réponse + rang en baisse → une vraie to-do priorisée sur l'accueil.
- **Suivi de position des charts** (catégorie/pays) dans le temps via RSS top charts Apple (gratuit, réel) — complément du rank par mot-clé.
- **Générateur IA de release notes** par version + langue (réel : on a la clé Anthropic + les langues).
- ✅ **FAIT+DÉPLOYÉ (19/06)** — **Palette de commandes ⌘K** (`CommandPalette` montée dans le layout, ⌘K/Ctrl+K ou bouton topbar « Aller à… », recherche + navigation clavier vers toutes les pages). Confort power-user, ressenti instantané.
- **Onboarding wizard plein-écran** (déjà en P3, à mûrir) : enchaîner connexion ASC → ajout app → SDK en un flux guidé.
- **PROCHAIN BUILD (décidé) : P1.2 Suivi de position des mots-clés dans le temps** (table d'historique + capture + sparkline/delta) = la preuve que l'ASO bouge, fort levier, 100% réel iTunes.

## Cycle de vie d'un dev indé mobile (ce que l'outil doit couvrir)
Construire → Lancer → **ASO** → Acquérir → **Monétiser** → Retenir → Analyser → Grandir.
Appolyn est déjà fort sur ASO + métadonnées. On comble le reste, en réel.

## Priorisation (haut = on fait d'abord ; réel + buildable + déployable)

### P1 — Réel, immédiat, fort levier (à faire en premier)
1. ✅ **FAIT + DÉPLOYÉ (19/06)** — **Couverture de localisation** : page `/dashboard/localization` (couverture % réelle X/39, langues couvertes vs marchés à conquérir, statut publié/brouillon via `get-localizations`), distincte de l'éditeur, pointe vers App Store Page pour générer/publier. Câblée sidebar + hub (« Bientôt » supprimé). **Évolutions possibles plus tard :** score ASO par langue directement sur la vue, tri des marchés manquants par taille de marché, bouton « générer cette langue » par puce.
2. ✅ **FAIT+DÉPLOYÉ (19/06)** — **Suivi de position des mots-clés dans le temps** : table `keyword_rank_history` (1 point/jour via upsert, RLS), capture auto à chaque calcul de métriques (loadFor + nouvelle recherche), **sparkline d'évolution du rang + delta places gagnées/perdues** dans le panneau déplié de chaque mot-clé. 100% réel iTunes. **Évolution possible :** cron quotidien pour capturer même sans visite (aujourd'hui = capture à chaque visite de la page, 1/jour max) + historiser popularité/difficulté aussi.
3. **Réputation : tendance des notes & avis dans le temps** : historiser la note moyenne + volume (ASC `get-ratings` / RSS), sentiment des avis par thème dans le temps (la brique `analyze-reviews` existe), alerte visuelle si la note chute. Réel.

### P2 — Réel, plus gros, très fort levier ASO
4. **App Store Connect Analytics Reports API** (le vrai entonnoir ASO) : impressions → vues de fiche → téléchargements → taux de conversion, par source (recherche/navigation/référents), par territoire. C'est LA métrique ASO. API asynchrone (on demande un rapport, on le télécharge quand prêt) → action edge `request-analytics-report` + `get-analytics-report` + stockage. Réel dès que le dev a connecté ASC et a du trafic ; bloc vide honnête sinon.
5. **Gestion des offres d'abonnement** (intro / promo / win-back via ASC) : créer/éditer les offres promotionnelles d'un abo depuis Appolyn (levier monétisation direct). API ASC subscriptions. Réel.
6. **A/B Product Page (PPO) + pages produit personnalisées** via ASC : créer un test de page produit, suivre le gagnant. Réel via API ASC.

### P3 — Ops / rétention / "ne plus naviguer à l'aveugle"
7. **Digest quotidien + alertes** (rang qui chute, nouvel avis 1★, pic de ventes, langue à publier) : centre de notifs existe déjà → ajouter les notices dérivées de la donnée réelle + (si provider email branché) un email récap. Email = dépendance externe → la partie in-app d'abord (réelle), l'email quand Benji branche Resend/equivalent.
8. **"Actions du jour"** enrichi sur l'accueil : déjà un bloc « Actions recommandées » → l'alimenter avec les nouveaux signaux (langues manquantes, rang en baisse, avis sans réponse, offre absente).

### P4 — Gros chantiers / dépendances (plus tard, notés pour ne pas oublier)
9. **Google Play / Android** : ASO + analytics Android. Énorme, nécessite Google Play Developer API + OAuth + comptes. Symétrique de l'iOS. À cadrer (gros).
10. **App preview / vidéos + what's-new par langue** : éditer les release notes par version+langue (réel via ASC), gérer les aperçus vidéo.
11. **Search Ads / régies pub** : nécessite OAuth comptes pub → BACKLOG ⛔.

## Garde-fous
- Chaque feature : tsc + next lint + next build verts AVANT commit, puis **deploy prod** (autorisé en continu par Benji, 19/06).
- Réutiliser l'existant (composants partagés `shell.tsx`, `metric-ring`, `lib/cache`, `lib/aso`, edge `asc-proxy`, pattern pg_cron+Vault) — ne PAS reconstruire (Appolyn est mature, vérifier le code avant de coder).
- FR partout. Tout instantané (cache de session). Tout automatique (le dev ne configure rien).
