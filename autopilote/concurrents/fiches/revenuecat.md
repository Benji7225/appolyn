# RevenueCat (revenuecat.com) — fiche du 2026-11-21

Méthode : WebSearch uniquement (11 requêtes : prix, changelog, avis, Reddit, intégrations, SDK, rapport, financement, docs IA). WebFetch sur revenuecat.com : ENOTFOUND (domaine hors liste autorisée de la session). Les pages revenuecat.com citées viennent donc d'extraits de résultats de recherche, pas de lecture directe : à recouper. Reddit : aucun fil direct lisible, seulement des citations reprises par un blog tiers. Ligne CSV réutilisée (/home/user/appolyn/autopilote/concurrents/liste.csv).

## Positionnement
- SDK et backend d'abonnements in-app (entitlements, offerings, webhooks, analytics), puis couche « growth » : Paywalls, Funnels web-to-app, Experiments, Customer Center, Audiences, Early Payouts (https://www.revenuecat.com/blog/company/everything-we-announced-at-app-growth-annual-2026).
- Cible : devs mobiles de l'indé à l'entreprise ; page dédiée aux indés (https://revenuecat.com/indies).
- Réf. du marché : rapport State of Subscription Apps 2026, 115 000+ apps et plus de 16 Md$ de revenu dans l'échantillon (revenu des apps clientes, pas de RevenueCat) (https://www.revenuecat.com/state-of-subscription-apps-2026/ ; https://9to5mac.com/2026/03/04/new-report-looks-into-the-sustainability-of-the-subscription-app-market-for-2026/).
- Financement : Series C de 50 M$ en mai 2025, menée par Bain Capital Ventures (https://techcrunch.com/2025/05/22/revenuecat-raises-50m-as-it-expands-beyond-mobile-app-monetization ; https://www.businesswire.com/news/home/20250522835623/en). Un mini Series C de 12 M$ en avril 2024 (Adjacent), soit 62 M$ de Series C au total et 100 M$ levés (source : résultats WebSearch, relayant Yahoo/AOL).
- Valuation : non confirmée par la société. Estimation tierce 500 M$ pour un revenu de 30 M$ (https://multiples.vc/private-comps/revenuecat), à traiter comme estimation, non vérifiée.
- Effectif : « plus de 100 » (https://builtin.com/articles/revenuecat-raises-50m-series-c-20250528) contre 185 (tipranks.com, données LinkedIn) : divergent.
- Revenu annuel confirmé par la société : non trouvé (le 30 M$ ci-dessus vient de multiples.vc seulement).

## Fonctionnalités page par page
Pages vues par titre et extrait de recherche uniquement.
- Paywalls : éditeur avec refonte à barre latérale, import Figma (docs dédiées depuis janv. 2026), sorties anticipées (exit offers) pour SDK hybrides (janv. 2026), AI Editor (https://www.revenuecat.com/docs/tools/paywalls/change-log). Rendu : iOS 15+, Android 7+, macOS 12+ ; l'éditeur ne s'affiche pas dans Unity Editor (https://www.revenuecat.com/docs/tools/paywalls/installation.md). Anciens « paywalls legacy » non supportés sur Unity, Cordova, Capacitor.
- Experiments : tests A/B, résultats en temps réel avec LTV 12 mois prédite (oct. 2026), recommandations de gagnant et brouillons (https://www.revenuecat.com/blog/company/everything-we-announced-at-app-growth-annual-2026 ; www-docs.revenuecat.com/changelog).
- Funnels : parcours web-to-app bâtis avec le même moteur que Paywalls, nœud Experiment, paiements Stripe et Paddle, sans frais de plateforme supplémentaires annoncés (https://www.revenuecat.com/blog/engineering/launch-party-june-26-the-new-features-you-should-know).
- Express Checkout : boutons Apple Pay et Google Pay sur paywalls et funnels web (même source juin 2026).
- Web Billing / Stripe : section de docs pour achats web (https://www.revenuecat.com/docs/llms.txt).
- Customer Center : iOS, Mac Catalyst, Android ; macOS et tvOS non supportés (https://www.revenuecat.com/docs/tools/customer-center/customer-center-installation.md).
- Audiences et Early Payouts : annoncés oct. 2026, détails non trouvés.
- Charts / analytics d'abonnements : cités par G2 (non lu en détail).
- Gestion d'avis, ASO, mots-clés, fiches store : non trouvé, hors périmètre.

## Onboarding
- Docs publiques avec quickstart ; prérequis : configurer produits, entitlements et offerings dans le dashboard avant le code (https://www.revenuecat.com/docs/getting-started/quickstart.md).
- Le quickstart mentionne Stripe Projects pour créer compte, projet et clés d'API depuis le terminal ou un agent IA (même source).
- Docs en .md et index llms.txt / llms-full.txt (https://www.revenuecat.com/docs/llms.txt ; https://www.revenuecat.com/docs/llms-full.txt).
- Serveur MCP hébergé (https://mcp.revenuecat.ai/mcp, clé API v2 ou OAuth) et AI Toolkit avec skills (« npx skills add RevenueCat/ai-toolkit ») pour configurer entitlements et offerings sans dashboard (https://www.revenuecat.com/docs/tools/mcp.md ; https://www.revenuecat.com/docs/tools/ai-toolkit.md).
- Essai/carte : plan gratuit sous le seuil, carte requise ou non : non trouvé.

## Prix et paliers (divergences)
- Pro : gratuit jusqu'à 2 500 $ de MTR (monthly tracked revenue), puis 1 % du MTR (https://www.revenuecat.com/guides/revenuecat-replit/decide-how-to-monetize ; https://revenuecat.com/pricing via WebSearch).
- Assiette : usagepricing.com affirme que le 1 % s'applique à tout le MTR du mois dès le franchissement (effet de falaise), pas seulement à l'excédent ; taux passé de 1,2 % à 1 % en sept. 2023 (https://www.usagepricing.com/blueprint/revenuecat). Non confirmé par le site officiel ici.
- frontdeskreview.com : le MTR serait calculé en brut, avant commission des stores (https://frontdeskreview.com/software/subscription-analytics/revenuecat/), non confirmé.
- Enterprise : sur devis ; conditions selon durée d'engagement, MTR, fonctions et aide à l'implémentation, remises de volume (https://www.revenuecat.com/jp/pricing.md).
- Divergences : le CSV et une fiche précédente citent G2 « à partir de 1 700 $/mois » (palier Scale) ; non retrouvé dans cette session. costbench.com affirme « pas de plan gratuit », contredit par toutes les autres sources (https://costbench.com/software/subscription-billing/revenuecat/free-plan/).
- Comparaison : Adapty gratuit jusqu'à 5 000 $ de MTR (fiche adapty.md, apppricinglab.com).
- Page officielle à reconfirmer.

## Intégrations et connecteurs
- Analytique : Amplitude, Mixpanel (revenu, conversions d'essai, renouvellements envoyés automatiquement) (https://www.revenuecat.com/docs/integrations/third-party-integrations/mixpanel.md ; /amplitude.md).
- Attribution : AppsFlyer, Adjust, Airbridge, Apple Search Ads, Branch, Meta Ads (https://revenuecat.com/partners/technology).
- Paiement : Paddle et app Stripe Dashboard (même page).
- Marketing : Iterable (revenuecat.partnerpage.io/partners/technology/iterable).
- Webhooks : base de toutes les intégrations (https://www.revenuecat.com/blog/engineering/integrations).
- Programme de partenaires agences (ex. Very Good Ventures, revenuecat.com/partners/agency).
- Liste complète : https://www.revenuecat.com/docs/integrations/third-party-integrations.md (non lue en entier).

## SDK
- iOS et plateformes Apple, Android, React Native, Expo, Flutter, Kotlin Multiplatform, Cordova, Capacitor, Unity, Web, Roku (https://www.revenuecat.com/docs/getting-started/installation.md ; https://www.revenuecat.com/docs/platform-resources/sdk-reference.md).
- SDK open source sur GitHub (ex. purchases-ios), numéros de version courants : non trouvé.
- Couverture inégale selon le composant (Paywalls, Customer Center), voir plus haut.

## Ce que les utilisateurs louent (sources)
- G2 : 4,8/5 sur 207 avis (195 sur les pages de comparatif) ; facilité d'usage (16 mentions), intégrations faciles (14) (https://www.g2.com/products/RevenueCat/reviews ; https://www.g2.com/compare/adapty-io-vs-appsflyer-vs-revenuecat).
- Capterra : 4,7/5 sur 47 avis ; installation « super easy », doc claire, bon SDK, évite de bâtir son système (https://www.capterra.com/p/212540/RevenueCat).
- Softwareadvice : support décrit comme rapide et professionnel par certains (https://www.softwareadvice.com/publishing-and-subscriptions/revenuecat-profile/reviews).
- Gratuit tant que l'app gagne peu (pricing officiel).
- Avantage de maturité : « leads on infrastructure maturity » (formule de la page comparative d'Adapty, donc source concurrente) (https://adapty.io/compare/superwall/).

## Ce que les utilisateurs reprochent (sources)
- G2 : problèmes de paywall (6 mentions), fonctions limitées (3) : petits échantillons (g2.com/compare/adapty-io-vs-appsflyer-vs-revenuecat).
- Capterra : un avis 1 étoile « great idea, terrible execution and terrible support » ; un autre à 3/5 dit que ça se dégrade ; un avis canadien sur la difficulté d'obtenir de l'aide (https://capterra.com/p/212540/RevenueCat/reviews ; https://www.capterra.ca/reviews/212540/revenuecat).
- Softwareadvice : support jugé inacceptable après une panne (https://www.softwareadvice.com/publishing-and-subscriptions/revenuecat-profile/reviews).
- Communauté FlutterFlow : difficultés d'intégration (https://community.flutterflow.io/ask-the-community/post/problems-with-revenuecat-CKXNJscHO1CLrCs).
- Reddit via blog tiers : « couche d'abstraction inutile sur StoreKit 2 » pour les apps simples (https://www.buildmvpfast.com/blog/revenuecat-vs-superwall-vs-adapty-in-app-subscription-indie-2026) ; fil original non lu.
- Trustpilot : 7 avis, texte non lu (https://nz.trustpilot.com/review/www.revenuecat.com).
- Concepts entitlements/offerings jugés difficiles : noté dans le CSV, pas retrouvé avec source directe ici.
- Beaucoup d'avis anciens (2020-2021) selon la fiche précédente ; non revérifié.

## Stratégie SEO
- Rapport annuel State of Subscription Apps : page principale plus déclinaisons par catégorie (business, gaming, productivity, education, utilities, shopping) et insights en deux parties, PDF de plus de 330 pages derrière un formulaire newsletter (https://www.revenuecat.com/state-of-subscription-apps-2026 ; /sosa-26-insights ; /sosa-2026-insights-part-2). Forte reprise presse (9to5mac, heise.de, ppc.land).
- Outils gratuits : App Store Revenue Calculator (https://www.revenuecat.com/app-store-revenue-calculator), App Store & Google Play Fee Calculator (/app-store-fee-calculator), calculateur « Braavo + RevenueCat » (/calculator ; partenariat non vérifié).
- Pages programmatiques : variantes locales de pages (/jp/, /cat/ pour pricing et blog), pages de partenaires/agences (/partners/agency/{nom}), pages d'intégrations par outil dans les docs ; ampleur exacte : non trouvé.
- Blog : catégories company, engineering, growth, versions .md publiques de chaque article (ex. blog/growth/subscription-app-trends-benchmarks-2026.md), articles de lancement (« launch party »), changelog de Paywalls en blog.
- Docs très indexées avec miroirs (www-docs., production-docs.) et formats pour IA (llms.txt, .md).
- Pages de positionnement : /why-revenuecat, /indies, /for-developers.md, /plans.
- Mots-clés visibles : subscription app trends/benchmarks 2026, in-app subscription pricing, app store revenue calculator, revenuecat alternatives (fortement exploité par les tiers et concurrents : https://adapty.io/compare-revenuecat).
- Contenus de guides par outil : https://www.revenuecat.com/guides/revenuecat-replit/decide-how-to-monetize (monétiser une app générée par IA).
- Changelog public : https://www-docs.revenuecat.com/changelog.

## Changelog récent
- Oct. 2026 (App Growth Annual, 29 oct.) : Paywalls AI Editor, Funnels, résultats d'Experiments en temps réel avec LTV 12 mois prédite, AI Toolkit, mises à jour RevenueCat Web, Early Payouts, Audiences (https://www.revenuecat.com/blog/company/everything-we-announced-at-app-growth-annual-2026).
- Juin 2026 : nœud Experiment dans Funnels, Stripe et Paddle, Express Checkout (Apple Pay/Google Pay) (blog launch-party-june-26).
- Janv. 2026 : exit offers pour SDK hybrides, éditeur Paywalls à barre latérale, import Figma documenté (docs/tools/paywalls/change-log).
- Autres 2026 : recommandations de gagnant dans Experiments, expériences en brouillon (changelog principal, dates non précisées).
- Nov. 2026 : rien trouvé.

## Ce qu'Appolyn peut copier, faire mieux, éviter
- Copier : rapport annuel de données décliné par catégorie avec relais presse ; calculateurs gratuits ancrés sur ses propres benchmarks ; docs et blog en .md, llms.txt, serveur MCP et skills pour agents IA ; changelog public ; pages /indies dédiées ; seuil gratuit lié au revenu de l'utilisateur.
- Faire mieux : RevenueCat est centré sur l'abonnement, Appolyn couvre tout le cycle indé (ASO, avis, lancement, fiche store) ; onboarding sans le détour dashboard/entitlements/offerings que les utilisateurs jugent difficile ; support humain réactif visible ; page de prix unique expliquant l'assiette (falaise ou excédent) que les tiers contestent.
- Éviter : assiette de facturation ambiguë, qui engendre des articles tiers contradictoires ; support lent sur un produit critique (paiements) ; rapport dont l'accès exige un formulaire sans résumé public chiffré fiable ; fonctionnalités à couverture inégale selon SDK sans tableau clair.
- Surveiller : extension vers le web (Funnels, Stripe, Paddle) et vers les agents IA (MCP, AI Toolkit) : RevenueCat se rapproche d'une plateforme de croissance. Intégration plutôt que concurrence frontale : lire ses données (webhooks, API v2, MCP) et les croiser avec l'ASO et les avis dans Appolyn.

## Sources
- https://www.revenuecat.com/blog/company/everything-we-announced-at-app-growth-annual-2026
- https://www.revenuecat.com/blog/engineering/launch-party-june-26-the-new-features-you-should-know
- https://www.revenuecat.com/docs/tools/paywalls/change-log
- https://www.revenuecat.com/docs/tools/paywalls/installation.md
- https://www.revenuecat.com/docs/tools/customer-center/customer-center-installation.md
- https://www.revenuecat.com/docs/getting-started/quickstart.md
- https://www.revenuecat.com/docs/getting-started/installation.md
- https://www.revenuecat.com/docs/platform-resources/sdk-reference.md
- https://www.revenuecat.com/docs/llms.txt
- https://www.revenuecat.com/docs/tools/mcp.md
- https://www.revenuecat.com/docs/tools/ai-toolkit.md
- https://www.revenuecat.com/docs/integrations/third-party-integrations.md
- https://revenuecat.com/partners/technology
- https://revenuecat.com/pricing
- https://www.revenuecat.com/jp/pricing.md
- https://www.revenuecat.com/guides/revenuecat-replit/decide-how-to-monetize
- https://www.revenuecat.com/state-of-subscription-apps-2026/
- https://www.revenuecat.com/app-store-revenue-calculator
- https://www.revenuecat.com/app-store-fee-calculator
- https://revenuecat.com/indies
- https://www.usagepricing.com/blueprint/revenuecat
- https://frontdeskreview.com/software/subscription-analytics/revenuecat/
- https://costbench.com/software/subscription-billing/revenuecat/free-plan/
- https://www.g2.com/products/RevenueCat/reviews
- https://www.g2.com/compare/adapty-io-vs-appsflyer-vs-revenuecat
- https://www.capterra.com/p/212540/RevenueCat
- https://capterra.com/p/212540/RevenueCat/reviews
- https://www.capterra.ca/reviews/212540/revenuecat
- https://www.softwareadvice.com/publishing-and-subscriptions/revenuecat-profile/reviews
- https://nz.trustpilot.com/review/www.revenuecat.com
- https://community.flutterflow.io/ask-the-community/post/problems-with-revenuecat-CKXNJscHO1CLrCs
- https://www.buildmvpfast.com/blog/revenuecat-vs-superwall-vs-adapty-in-app-subscription-indie-2026
- https://9to5mac.com/2026/03/04/new-report-looks-into-the-sustainability-of-the-subscription-app-market-for-2026/
- https://ppc.land/ai-apps-earn-41-more-per-user-but-churn-30-faster-revenuecat-finds/
- https://techcrunch.com/2025/05/22/revenuecat-raises-50m-as-it-expands-beyond-mobile-app-monetization
- https://www.businesswire.com/news/home/20250522835623/en
- https://builtin.com/articles/revenuecat-raises-50m-series-c-20250528
- https://multiples.vc/private-comps/revenuecat
- https://adapty.io/compare/superwall/
- https://adapty.io/compare-revenuecat
