# Qonversion (qonversion.io) — fiche du 2026-11-25

Méthode : WebSearch uniquement (12 requêtes standard : fonctionnalités, prix, changelog, intégrations, SDK, avis G2/Capterra, Reddit/alternatives, Product Hunt/Trustpilot, blog et outils, comparatif RevenueCat/Adapty, financement, no-code et remote config). WebFetch tenté une fois sur documentation.qonversion.io/docs/llms.txt : échec ENOTFOUND (documentation.qonversion.io bloqué ; qonversion.io non testé en direct, apparaît seulement dans les résultats). Tout vient de titres et d'extraits de recherche, y compris des docs en .md ; aucune page lue en entier. Plusieurs sources sont des pages de concurrents (Adapty) ou des agrégateurs, donc partiales. La ligne du CSV (/home/user/appolyn/autopilote/concurrents/liste.csv, ligne Qonversion) a été recoupée ; corrections signalées.

## Positionnement
- Plateforme d'abonnements in-app pour apps mobiles : infrastructure d'achats, analytics d'abonnements, tests A/B de paywalls (https://qonversion.io/ ; https://qonversion.io/llms.txt).
- Cible : indés et petites équipes mobiles (CSV) ; le seuil gratuit de 10 K$ de revenu suivi par mois est mis en avant face à RevenueCat, qui afficherait 2,5 K$ (https://qonversion.io/revenuecat-alternative, affirmation éditeur).
- Qonversion intègre l'attribution dans la plateforme d'abonnements, selon un blog tiers (https://theswiftk.it.com/blog/revenuecat-vs-adapty-vs-qonversion-ios), avis d'un seul auteur.
- Société fondée en 2019, basée à San Francisco selon Latka ; Michael Stysin co-fondateur et CEO (https://getlatka.com/companies/qonversion).
- Effectif : 15 (Latka, d'après LinkedIn), 11-50 (Wellfound), 20 (Bouncewatch) ; divergences (https://getlatka.com/companies/qonversion ; https://wellfound.com/company/qonversion ; https://www.bouncewatch.com/explore/startup/qonversion).
- Revenu : environ 1,7 M$ par an en oct. 2024 selon Latka, 1,1 M$ sur une autre page Latka (https://getlatka.com/companies/qonversion ; https://getlatka.com/companies/qonversion/team). Estimation, non publié par l'entreprise.
- Financement : 2,9 M$ en deux tours dont 2 M$ de seed en décembre 2021 (Latka) ; 2,77 M$ en trois tours selon CB Insights, dernier tour 1,92 M$ le 10 déc. 2021 (https://www.cbinsights.com/company/qonversion/financials). Divergence ; le CSV cite aussi VCBacked 2,0 M$ (non revérifié).
- Concurrents cités par G2 : Adapty, RevenueCat, Chargebee (https://www.g2.com/products/qonversion/competitors/alternatives).

## Fonctionnalités page par page
- Infrastructure d'achats : le SDK récupère les produits, gère l'achat et vérifie l'accès premium actif en trois méthodes (https://qonversion.io/ via la recherche).
- Analytics : temps réel de l'installation au churn, conversion essai vers payant, revenu de renouvellement (https://qonversion.io/). Article sur le MRR et sur la LTV d'abonnement dans le blog (https://qonversion.io/blog).
- Paywall experiments : tests de prix, d'interface de paywall ou de parcours avant paywall sans nouvelle build ; segmentation par pays, date d'installation, version d'app, gratuit ou payant ; répartition de trafic, visualisation, significativité statistique (https://documentation.qonversion.io/docs/paywall-experiments ; https://qonversion.io/blog/paywall-experiments-for-subscription-apps). Adapty affirme que son A/B est plus avancé (https://adapty.io/compare/qonversion), source concurrente.
- No-Codes : constructeur glisser-déposer de paywalls, onboarding et écrans promo sans nouvelle version ; composants et propriétés, conteneurs de mise en page ; mise à jour 2026 avec analytics de performance et logique conditionnelle ; SDK iOS 6.7.0+ et Android No-Codes 1.6.0+ (https://documentation.qonversion.io/docs/no-codes ; https://qonversion.io/blog/product-update-late-march-2026).
- Remote Configs : fichier JSON clé-valeur pour onboarding, interface de paywall ou prix ; ciblage par date d'installation et version d'app ; états brouillon, actif, archivé ; ils remplacent les Offerings pour toute nouvelle intégration (https://documentation.qonversion.io/docs/remote-config ; https://documentation.qonversion.io/docs/migrate-offerings-to-remote-configs.md ; https://qonversion.io/remote-configs).
- Plan Growth : Apple Search Ads, A/B Experiments, Refund Keeper, intégrations avancées, export de données brutes (via https://toolradar.com/tools/qonversion/pricing, agrégateur).
- Web Funnel en bêta pour vendre des abonnements sur le web (changelog, https://documentation.qonversion.io/changelog, date non lisible).
- Nouvelle section Customers et moteur de cohortes (billets produit juillet 2026, voir Changelog).
- Identité utilisateur et attribution Apple Search Ads : mentionnées seulement comme fonctionnalités de plan ; pages de détail non trouvées.
- Hors périmètre Appolyn, non trouvé : ASO, mots-clés, avis App Store, screenshots, site d'app.

## Onboarding
- Guide « Getting started » et quickstart dans la doc : connexion du store, configuration des produits, installation du SDK (https://documentation.qonversion.io/docs/getting-started ; https://documentation.qonversion.io/docs/quickstart ; https://documentation.qonversion.io/docs/product-setup-store-connection-1).
- Apps d'exemple (https://documentation.qonversion.io/docs/sample-apps).
- Mode de lancement « analytics » pour brancher les analytics sans gérer les achats (https://documentation.qonversion.io/docs/launch-analytics-mode).
- Guides de migration depuis Glassfy et vers de nouveaux SDK (https://documentation.qonversion.io/docs/qonversion-sdk-major-version ; CSV pour Glassfy).
- Avis Capterra : installation initiale un peu longue (via CSV, source Capterra non relue ici).
- Essai : un agrégateur cite 14 jours (via CSV), non confirmé par l'éditeur.

## Prix et paliers (divergences)
- Free : jusqu'à 10 K$ de MTR (https://qonversion.io/pricing ; https://qonversion.io/llms.txt).
- Starter : 0,6 % du MTR, soit 6 $ par 1 K$ (https://qonversion.io/revenuecat-alternative ; https://toolradar.com/tools/qonversion/pricing).
- Growth : 0,8 % du MTR (toolradar).
- Enterprise : sur devis, support technique prioritaire et responsable de compte.
- Divergences : un annuaire écrit 0,6 $/mois (erreur d'unité probable) ; SpotSaaS affiche un Starter à 99 $/mois, contradictoire (https://www.spotsaas.com/product/qonversion/pricing). La page officielle vue par la recherche ne montrait qu'une matrice de fonctions, sans taux.
- Base du MTR (avant ou après commission des stores) : non trouvé.
- Coût réel d'intégration chiffré par une agence tierce : https://www.metacto.com/blogs/the-true-cost-of-qonversion-pricing-integration-and-expert-setup (non lu).

## Intégrations et connecteurs
- Analytics et marketing : Amplitude, Mixpanel, Firebase ; attribution : Adjust, AppsFlyer ; serveur : webhooks, Amazon S3, Slack (https://documentation.qonversion.io/reference/v4/integrations.md ; https://documentation.qonversion.io/docs/integrations-overview).
- Le site cite aussi Singular et CleverTap (https://qonversion.io/integrations) ; Tenjin existe dans la doc (https://documentation.qonversion.io/edit/tenjin).
- Création d'intégration par API (POST) avec activation et pause.
- Qonversion n'envoie pas l'événement de downgrade aux intégrations pour éviter des écarts de données (doc v4).
- Paiements web : Paddle ajouté en juin 2026, avec App Store, Google Play et Stripe (changelog).
- Redesign de la page Intégrations en juin 2026 (billet produit, voir plus bas).
- RevenueCat, App Store Connect API pour fiches : non trouvé.

## SDK
- iOS (Swift Package Manager, repo qonversion/qonversion-ios-sdk), Android (Kotlin), Flutter, React Native, Unity, Cordova, Capacitor, Web, macOS/Catalyst (https://documentation.qonversion.io/docs/install-sdk ; https://documentation.qonversion.io/docs/installation ; https://github.com/qonversion).
- Versions minimales citées : iOS 6.0.0, React Native 10.0.0, Flutter 11.0.0, Unity 9.0.0. La page « major version » plus ancienne cite iOS 5 et Unity 6 : divergence à vérifier.
- No-Codes SDK intégré à iOS, paquet séparé sur Android.
- Cordova 7.x et Capacitor 1.x en février 2026, guides de migration (https://documentation.qonversion.io/docs/jan-2026-migration-guide-capacitor-1).
- Open source : dépôts GitHub publics de l'organisation ; la licence exacte n'a pas été lue. Adapty prétend que son propre SDK est 100 % open source, ce qui suggère un point de comparaison.
- Une page Swift dit ne gérer que le mode analytics : possiblement dépassée.

## Ce que les utilisateurs louent (sources)
- G2 : 4,9 sur 43 avis ; facilité d'usage, installation rapide, bon tableau de bord (https://www.g2.com/products/qonversion/reviews ; https://www.g2.com/survey_responses/qonversion-review-8748355).
- Capterra : 4,6 sur 5 avis, titre « Qonversion is Amazing » 5/5 (https://www.capterra.com/p/199523/Qonversion/).
- TrustRadius : 10/10 sur 1 avis (https://www.trustradius.com/products/qonversion).
- Échantillons faibles ; le profil G2 serait inactif depuis plus d'un an (https://www.g2.com/products/qonversion/features).
- Reddit : non trouvé (aucun fil retrouvé). Trustpilot : aucun avis (https://www.trustpilot.com/review/qonversion.io). Product Hunt : page existante, notes non lues (https://www.producthunt.com/posts/qonversion-io).

## Ce qu'ils reprochent (sources)
- G2 : fonctionnalités limitées par rapport aux concurrents (https://www.g2.com/products/qonversion/reviews, cité par le CSV).
- Software Advice : bugs sur codes promo et design de paywall (https://www.softwareadvice.com/marketing/qonversion-profile, via CSV). GetApp : lacunes de documentation (via CSV).
- Adapty : A/B moins avancé (https://adapty.io/compare/qonversion), source concurrente.
- Note de G2 plus haute que RevenueCat (4,9 contre 4,8) mais sur 43 avis contre 209 : faible poids (https://www.g2.com/compare/qonversion-vs-revenuecat).
- Aucune plainte de facturation ou de support trouvée.

## Stratégie SEO
- Pages alternatives dédiées : /revenuecat-alternative, /adapty-alternative, /glassfy-alternative (https://qonversion.io/revenuecat-alternative ; CSV pour les deux autres).
- Pages produit : /remote-configs, /integrations, /pricing (liens ci-dessus).
- Blog paginé (au moins 13 pages) avec catégories Analytics, News, Product updates (https://qonversion.io/blog ; https://qonversion.io/blog/13 ; https://qonversion.io/blog/productupdates/).
- Billets : tests de paywall, no-code paywall, MRR, LTV, bibliothèque de facturation, démarrage d'une app à abonnement (https://qonversion.io/blog/subscription-app-paywall-no-code-builder ; https://qonversion.io/blog/billing-library ; https://qonversion.io/blog/getting-started-with-subscription-based-apps-must-have-tools-metrics-and-tips).
- Mises à jour mensuelles : https://qonversion.io/blog/product-update-february-2026 ; https://qonversion.io/blog/product-update-late-march-2026.
- Guides, ebooks et cours par e-mail sur onboarding, A/B et paywalls (recherche sur le blog).
- Docs publiques en .md et llms.txt, ce qui les rend lisibles par les IA (https://qonversion.io/llms.txt).
- Outils gratuits ou calculateurs : non trouvé. Pages programmatiques : non trouvé.
- Mots-clés visibles : revenuecat alternative, adapty alternative, glassfy alternative, paywall experiments, subscription app paywall no code. Les pages comparatives Adapty le ciblent en retour.
- Présent sur G2, Capterra, SoftwareAdvice, GetApp, TrustRadius, SourceForge, AlternativeTo (https://alternativeto.net/software/qonversion).

## Changelog récent
- Août 2026 : API d'invalidation du cache Remote Config, option « freeze assignments », rollout en pourcentage appliqué (https://documentation.qonversion.io/changelog).
- Juin 2026 : Paddle comme fournisseur de paiement web.
- Avril 2026 : meilleure gestion de la période de grâce pour MRR/ARR.
- Février 2026 : Cordova 7.x, Capacitor 1.x.
- Blog produit : cohortes, rotation de clé secrète, tests StoreKit (juillet), Customers et Remote Configs redesignés (fin juillet). Dates exactes non confirmées, caches incohérents.
- Annonces Apple relayées : commissions UE au 1er octobre 2026, ad groups Apple Ads avec âge ou genre sans attribution dès septembre 2026 (billets de blog, non vérifiés).
- Septembre à novembre 2026 : non trouvé.

## Ce qu'Appolyn peut copier / faire mieux / éviter
- Copier : pages « X alternative » honnêtes, guide de migration quand un concurrent ferme, docs en .md et llms.txt, billets produit mensuels.
- Copier : seuil gratuit généreux comme argument de prix.
- Faire mieux : Appolyn lie abonnements, avis, ASO et lancement ; Qonversion s'arrête à l'abonnement et à l'analytics.
- Faire mieux : outils gratuits et pages programmatiques (absents chez Qonversion) sur LTV, MRR, prix d'abonnement.
- Éviter : page de prix sans taux ; base du MTR non définie ; docs en désordre avec versions minimales contradictoires.
- Surveiller : si Appolyn propose paywalls et `isSubscribed()`, la comparaison avec Qonversion, RevenueCat et Adapty viendra vite ; le seuil gratuit à 10 K$ est la référence à égaler.

## Sources
- https://qonversion.io/
- https://qonversion.io/llms.txt
- https://qonversion.io/pricing
- https://qonversion.io/revenuecat-alternative
- https://qonversion.io/remote-configs
- https://qonversion.io/integrations
- https://qonversion.io/blog
- https://qonversion.io/blog/13
- https://qonversion.io/blog/productupdates/
- https://qonversion.io/blog/paywall-experiments-for-subscription-apps
- https://qonversion.io/blog/subscription-app-paywall-no-code-builder
- https://qonversion.io/blog/billing-library
- https://qonversion.io/blog/getting-started-with-subscription-based-apps-must-have-tools-metrics-and-tips
- https://qonversion.io/blog/product-update-february-2026
- https://qonversion.io/blog/product-update-late-march-2026
- https://documentation.qonversion.io/changelog
- https://documentation.qonversion.io/docs/paywall-experiments
- https://documentation.qonversion.io/docs/no-codes
- https://documentation.qonversion.io/docs/remote-config
- https://documentation.qonversion.io/docs/migrate-offerings-to-remote-configs.md
- https://documentation.qonversion.io/docs/integrations-overview
- https://documentation.qonversion.io/reference/v4/integrations.md
- https://documentation.qonversion.io/docs/install-sdk
- https://documentation.qonversion.io/docs/installation
- https://documentation.qonversion.io/docs/quickstart
- https://documentation.qonversion.io/docs/getting-started
- https://documentation.qonversion.io/docs/launch-analytics-mode
- https://documentation.qonversion.io/docs/qonversion-sdk-major-version
- https://documentation.qonversion.io/docs/jan-2026-migration-guide-capacitor-1
- https://documentation.qonversion.io/docs/sample-apps
- https://documentation.qonversion.io/docs/product-setup-store-connection-1
- https://github.com/qonversion
- https://www.g2.com/products/qonversion/reviews
- https://www.g2.com/products/qonversion/features
- https://www.g2.com/products/qonversion/competitors/alternatives
- https://www.g2.com/survey_responses/qonversion-review-8748355
- https://www.g2.com/compare/qonversion-vs-revenuecat
- https://www.capterra.com/p/199523/Qonversion/
- https://www.trustradius.com/products/qonversion
- https://www.trustpilot.com/review/qonversion.io
- https://www.producthunt.com/posts/qonversion-io
- https://www.softwareadvice.com/marketing/qonversion-profile
- https://alternativeto.net/software/qonversion
- https://toolradar.com/tools/qonversion/pricing
- https://www.spotsaas.com/product/qonversion/pricing
- https://www.metacto.com/blogs/the-true-cost-of-qonversion-pricing-integration-and-expert-setup
- https://adapty.io/compare/qonversion
- https://theswiftk.it.com/blog/revenuecat-vs-adapty-vs-qonversion-ios
- https://getlatka.com/companies/qonversion
- https://getlatka.com/companies/qonversion/team
- https://www.cbinsights.com/company/qonversion/financials
- https://wellfound.com/company/qonversion
- https://www.bouncewatch.com/explore/startup/qonversion
- /home/user/appolyn/autopilote/concurrents/liste.csv (ligne Qonversion)
