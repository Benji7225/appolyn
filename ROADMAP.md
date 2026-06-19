# Appolyn — Roadmap "tout-en-un indie hacker mobile"

> Cadré le 19/06 (mandat Benji : déploie tout en continu, loops ~10 min, rends le produit beaucoup plus complet en autonomie, vision = l'outil tout-en-un PARFAIT pour les indie hackers qui font des apps mobiles).
> Règle absolue : **zéro donnée mockée**. On ne construit que ce qui marche sur de la donnée RÉELLE (API iTunes publique gratuite, API App Store Connect avec la clé du dev, données SDK). Les features gated sur une dépendance externe vont dans BACKLOG ⛔, pas ici.

## Cycle de vie d'un dev indé mobile (ce que l'outil doit couvrir)
Construire → Lancer → **ASO** → Acquérir → **Monétiser** → Retenir → Analyser → Grandir.
Appolyn est déjà fort sur ASO + métadonnées. On comble le reste, en réel.

## Priorisation (haut = on fait d'abord ; réel + buildable + déployable)

### P1 — Réel, immédiat, fort levier (à faire en premier)
1. **Couverture de localisation** (transformer le « Bientôt » du hub Store en vraie page) : sur la donnée déjà récupérée par la page App Store (locales présentes/brouillon/publiées), montrer X/39 langues couvertes, lesquelles manquent, statut de publication + score ASO par langue, et 1 clic « générer les langues manquantes » (la brique IA existe déjà). 100% réel, self-contained.
2. **Suivi de position des mots-clés dans le temps** : table `keyword_ranks` (snapshot quotidien du rang réel iTunes via `computeKeywordMetrics`/recherche), graphe d'évolution par mot-clé, delta J/J-7. La recherche de rang existe déjà ponctuellement → on historise. Cron quotidien (pattern pg_cron déjà en place).
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
