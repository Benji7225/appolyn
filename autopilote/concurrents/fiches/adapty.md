# Adapty (adapty.io) — fiche du 2026-11-20

Méthode : recherches WebSearch uniquement (plusieurs requêtes : prix, avis, changelog, SDK, rapports, comparatifs). Aucun WebFetch tenté sur les sites d'éditeurs ni de G2/Capterra (le brief signale qu'ils sont souvent bloqués) : tout vient d'extraits de résultats. Les pages Adapty citées sont donc déclaratives et favorables. Reddit : aucun fil substantiel ressorti. La ligne du CSV (/home/user/appolyn/autopilote/concurrents/liste.csv) a été réutilisée et recoupée.

## Positionnement
- Plateforme d'abonnements in-app : paywalls no-code, A/B tests, analytics d'abonnements, SDK multi-plateformes, envoi d'événements vers outils tiers (https://adapty.io/docs/is-adapty-right-for-me ; https://www.g2.com/products/adapty-io).
- Cible : devs et studios d'apps à abonnement, de l'indé à l'éditeur majeur ; page « Trusted by 9,000+ apps and the world's largest app publishers » (https://adapty.io/double-app-revenue).
- Société basée à New York, équipe distribuée à distance (https://adapty.io/about).
- Concurrents directs visés par ses pages : RevenueCat, Qonversion, Superwall, Firebase, Purchasely, Glassfy (https://adapty.io/compare/superwall/ ; /compare/qonversion ; /compare/firebase/ ; /ja/compare/purchasely/).
- Argument produit déclaré : paywalls qui chargent plus vite que RevenueCat (2 545 ms contre 4 030 ms, mesure Adapty sur iPhone 16, donc non indépendante) (page adapty.io/ja/compare/purchasely et résumés WebSearch).
- Finances (CSV) : environ 6,9 M$/an, estimation Latka d'oct. 2024, non publié par la société (https://getlatka.com/companies/adapty). TechCrunch mars 2025 : rentable. Levée divergente : 2,5 M$ (TechCrunch 2022) contre 0,5 à 2 M$ (Latka, CB Insights, VCBacked).

## Fonctionnalités page par page
Pages vues par titre et extrait uniquement.
- Paywall builder no-code : paywalls natifs iOS et Android, aussi React Native, Flutter, Unity ; 50+ templates et générateur IA selon toolradar.com et buildmvpfast.com (non confirmé sur adapty.io).
- Flows : builder visuel de paywalls et d'onboardings. Disponible sur Android avec SDK v4 (juin 2026) ; le builder « Paywall Builder » et « Onboarding Builder » historiques sont dépréciés au 1er octobre 2026 (https://changelog.adapty.io/).
- A/B testing (https://adapty.io/ab ; https://adapty.io/ga/paywall-ab-testing/) : prix, durées, offres promo, sans release d'app ; résultats en direct par paywall et produit. Noms de variantes lisibles dans l'app via le SDK (sept. 2026).
- Analytics : tableau de bord, cohortes, métriques en temps réel, prédictions de revenu, LTV (https://www.g2.com/products/adapty-io).
- Localisation : listée dans le plan gratuit/Pro (page prix citée par WebSearch).
- Adapty Mail : API serveur pour envoyer profils et transactions, connecteur FunnelFox pour événements de funnels web (changelog 2026).
- Web payments : cité par TechCrunch 2025 (via CSV), bouton de paywall web sur Android depuis SDK 3.15.0.
- Plans de 12 mois en engagement dans les Flows (changelog 2026, iOS SDK 4.3.1+).
- Attribution Adapty : opt-in à l'activation du SDK depuis SDK 4.1 (août 2026).
- Gestion d'avis, ASO, mots-clés, screenshots : non trouvé, hors périmètre.

## Onboarding
- Docs publiques en plusieurs langues, quickstart en 5 étapes, checklist « Getting started success checklist » (https://adapty.io/docs/quickstart-sdk ; https://docs.adapty.io/docs/getting-started-checklist).
- Page « Is Adapty right for me? » qui aide à décider (https://adapty.io/docs/is-adapty-right-for-me).
- Chaque guide SDK suit : installation, configuration, test, release.
- Intégration assistée par IA : guides pour Cursor (ex. https://adapty.io/docs/adapty-cursor-unity).
- Applications exemples sur GitHub pour chaque plateforme (https://adapty.io/docs/fr/sample-apps.md).
- Pages de migration : « switch to adapty » (https://adapty.io/ru/switch-to-adapty/), migrate-from-glassfy-to-adapty (CSV). Case study : 500K utilisateurs quotidiens migrés en une semaine (revendication Adapty).
- Essai : le plan Pro est gratuit sous le seuil, donc pas de carte requise a priori, non confirmé.

## Prix et paliers (divergences)
- Basé sur le MTR (monthly tracked revenue). Annonce février 2026 : fonctions complètes gratuites jusqu'à 5 000 $ de MTR (https://adapty.io/blog/adapty-new-pricing-2026/ et version .md).
- Au-delà : environ 1 % du MTR, add-ons facturés à part, gratuits sous le seuil (WebSearch ; apppricinglab.com/playbook/adapty-review).
- Enterprise : sur devis, support prioritaire (adapty.io/pricing, via WebSearch).
- Divergences : G2 affiche 99 à 499 $/mois (https://www.g2.com/products/adapty-io/pricing) ; un extrait de page Adapty encore indexé dit « Pro 1 %, minimum 99 $/mois » ; des tiers citent encore 10 000 $ gratuit ; une source dit que le minimum de 99 $ a été supprimé en février 2026. La page officielle fait foi : à reconfirmer.
- Comparaison : seuil gratuit 5K contre 2,5K de MTR chez RevenueCat selon apppricinglab.com (non vérifié ici). Qonversion : 10K gratuit (CSV).
- Coût réel d'intégration par un prestataire : https://www.metacto.com/blogs/the-true-cost-of-adapty-pricing-integration-and-expert-setup (non lu).

## Intégrations et connecteurs
- Envoi d'événements d'abonnement vers analytics, attribution et pubs sans code (adapty.io, via WebSearch) ; webhooks (G2).
- Adjust : annuaire de partenaires technologiques (https://www.adjust.com/partners/tech/adapty). Singular (Device ID, oct. 2026, changelog).
- FunnelFox (sept. 2026). Amplitude, Mixpanel, AppsFlyer : non confirmés dans mes résultats (le CSV compare avec AppsFlyer sur G2, sans prouver de connecteur).
- App Store et Google Play comme sources d'achats ; Stripe et web : non trouvé en détail.
- Revendeur : fiche SoftwareOne (https://platform.softwareone.com/product/adapty/PCP-4817-2289).

## SDK
- Sept SDK : iOS, Android, React Native, Flutter, Unity, Capacitor, Kotlin Multiplatform (https://adapty.io/docs/quickstart-sdk).
- Ligne SDK v4 : Flows ; juillet 2026 v4 pour React Native, Flutter, Capacitor, KMP ; Unity installable via Swift Package Manager ; août 2026 SDK 4.1 ; sept. 4.2 ; oct. 4.3 (changelog.adapty.io).
- Prérequis cités : Flutter 3.32+, iOS 15+, Xcode 26+ (https://adapty.io/docs/sdk-installation-flutter ; /sdk-installation-unity).
- Capacitor sorti de bêta en 2026.

## Ce que les utilisateurs louent (sources)
- G2 4,7/5 sur 253 avis (4,8 sur 241 sur un autre instantané), facilité d'usage en tête (24 ou 35 mentions selon la page), gestion de paywalls (15) (https://www.g2.com/compare/adapty-io-vs-appsflyer-vs-revenuecat ; https://www.g2.com/products/adapty-io).
- Capterra UK : un avis loue paywalls, A/B tests, analytics (https://www.capterra.co.uk/software/205858/adapty).
- Tarif gratuit plus généreux que RevenueCat (apppricinglab.com).
- Témoignage « RevenueCat alternatives: why I switched » est écrit sur le blog d'Adapty, donc partisan (https://adapty.io/blog/revenuecat-alternatives-why-i-switched-to-adapty/).

## Ce que les utilisateurs reprochent (sources)
- G2 : problèmes de paywall (8 mentions, 11 sur une autre page) et limites de fonctionnalités (7) (g2.com/compare/adapty-io-vs-appsflyer-vs-revenuecat).
- GetApp et Capterra UK : interface un peu compliquée, mélanger iOS et Android dans l'interface déconseillé (https://www.getapp.co.uk/software/2075991/adapty).
- G2 comparatif : des relecteurs estiment que RevenueCat répond mieux à leurs besoins (https://www.g2.com/compare/adapty-io-vs-revenuecat).
- Capterra : seulement 10 avis, peu de poids (https://www.capterra.com/p/205858/Adapty/).
- Reddit : r/reactnative a un fil « adapty vs revenuecat vs qonversion » sans réponses lisibles ; aucune plainte spécifique trouvée. Critique de templates de paywalls (cité par un blog, auteur et cible incertains).
- Déprécations d'outils (Paywall Builder legacy au 1er oct. 2026) : migration forcée vers Flows (changelog), reproche potentiel, non documenté par des utilisateurs.

## Stratégie SEO
- Blog très actif avec versions Markdown publiques : adapty.io/blog/markdown/{slug}.md et docs en .md (adapty.io/docs/fr/whats-new.md), donc lisibles par les IA.
- Docs multilingues (fr, es, ja, ru, tr, vi) et site traduit (/de/, /pt/, /ua/, /zh/, /ja/, /ru/).
- Pages comparatives : /compare/{revenuecat, qonversion, superwall, firebase, purchasely, in-house-development}, pages « switch-to-adapty » et migration Glassfy.
- Pages par persona : /for-marketers/, /why-adapty/, /double-app-revenue ; pages produit /ab (paywall A/B testing).
- Rapports de données : State of In-App Subscriptions 2024, 2025, 2026 (https://adapty.io/state-of-in-app-subscriptions-2026 ; PDF sur uploads.adapty.io), 2026 : plus de 16 000 apps et 3 Md$ de revenu brut traités en 2025. Reprise presse (ppc.land, appdevelopermagazine.com). Un titre « State of Paywalls 2026 : 78 000+ paywalls » apparaît comme bandeau de pages de blog, rapport propre non confirmé.
- Cas clients : BibleChat (15 M d'utilisateurs) (https://adapty.io/de/case-studies/biblechat/).
- Mots-clés visibles : revenuecat alternative, paywall A/B testing, in-app subscriptions, state of in-app subscriptions.
- Changelog public indexé par mois (changelog.adapty.io/date/2026/N) : contenu frais.
- Outils gratuits : non trouvé.

## Changelog récent (https://changelog.adapty.io/)
- Oct. 2026 : tags personnalisés dans les Flows, Singular Device ID, plans 12 mois (SDK 4.3, iOS 4.3.1+).
- Sept. 2026 : noms de variantes A/B via SDK 4.2, connecteur FunnelFox pour Adapty Mail.
- Août 2026 : SDK 4.1, attribution opt-in, API renommées, dépréciation des builders legacy au 1er oct.
- Juillet 2026 : SDK v4 sur RN, Flutter, Capacitor, KMP.
- Juin 2026 : Flows sur Android, API Adapty Mail.
- Fév. 2026 : nouveau pricing.
- Rien trouvé pour novembre 2026.

## Ce qu'Appolyn peut copier, faire mieux, éviter
- Copier : pages /compare/ et /switch-to-adapty avec guides de migration ; versions .md de tout le blog et des docs ; rapport annuel de données (State of…) avec relais presse ; changelog public indexé par mois ; guides d'intégration pour Cursor/IA ; seuil gratuit lié au revenu de l'utilisateur.
- Faire mieux : Adapty est mono-sujet (abonnements), Appolyn couvre tout le cycle (ASO, avis, lancement) pour l'indé ; plus de lisibilité de prix (Adapty a trois versions concurrentes : 99 $, 10K, 5K) ; pas d'interface dense mélangeant iOS et Android ; preuves sociales sourcées ; page prix unique.
- Éviter : déprécier un outil avec échéance courte sans parcours de migration ; tarifs divergents d'une page à l'autre ; rapports dont la méthode n'est pas publiée ; revendications de performance (vitesse de chargement) sans mesure indépendante.
- Surveiller : Adapty pourrait étendre vers marketing et attribution (opt-in attribution, Adapty Mail, web funnels) : proximité croissante avec les sections paywalls, analytics et finance d'Appolyn. Pour les paywalls, envisager un partenariat ou un connecteur (SDK ouvert) plutôt qu'une concurrence frontale.

## Sources
- https://adapty.io/blog/markdown/adapty-new-pricing-2026.md
- https://adapty.io/blog/adapty-new-pricing-2026/
- https://www.g2.com/products/adapty-io
- https://www.g2.com/products/adapty-io/pricing
- https://www.g2.com/compare/adapty-io-vs-appsflyer-vs-revenuecat
- https://www.g2.com/compare/adapty-io-vs-revenuecat
- https://www.capterra.com/p/205858/Adapty/
- https://www.capterra.co.uk/software/205858/adapty
- https://www.getapp.co.uk/software/2075991/adapty
- https://apppricinglab.com/playbook/adapty-review
- https://toolradar.com/tools/adapty/pricing
- https://www.buildmvpfast.com/blog/revenuecat-vs-superwall-vs-adapty-in-app-subscription-indie-2026
- https://www.metacto.com/blogs/the-true-cost-of-adapty-pricing-integration-and-expert-setup
- https://changelog.adapty.io/
- https://adapty.io/docs/whats-new
- https://adapty.io/docs/quickstart-sdk
- https://adapty.io/docs/is-adapty-right-for-me
- https://adapty.io/docs/sdk-installation-flutter
- https://adapty.io/docs/sdk-installation-unity
- https://adapty.io/ab
- https://adapty.io/compare/superwall/
- https://adapty.io/compare/qonversion
- https://adapty.io/compare/firebase/
- https://adapty.io/about
- https://adapty.io/double-app-revenue
- https://adapty.io/state-of-in-app-subscriptions-2026
- https://uploads.adapty.io/state_of_in_app_subscriptions_2025.pdf
- https://ppc.land/95-of-app-subscription-revenue-goes-to-top-10-adaptys-2026-benchmark-report/
- https://adapty.io/blog/revenuecat-alternatives-why-i-switched-to-adapty/
- https://adapty.io/de/case-studies/biblechat/
- https://www.adjust.com/partners/tech/adapty
- https://getlatka.com/companies/adapty
- https://pol1.lr.ggtyler.dev/r/reactnative/comments/1kdv8os/adapty_vs_revenuecat_vs_qonversion
