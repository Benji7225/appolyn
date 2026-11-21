# Superwall (superwall.com) — fiche du 2026-11-21

Méthode : WebSearch uniquement (WebFetch sur superwall.com : ENOTFOUND, domaine bloqué). Tout vient d'extraits de résultats, y compris pour les pages Superwall (déclaratives et favorables). Capterra : aucun résultat. Reddit : peu de matière (fils via miroirs redlib). La ligne du CSV (/home/user/appolyn/autopilote/concurrents/liste.csv) a été reprise et recoupée.

## Positionnement
- Passé d'éditeur de paywalls à une « infrastructure d'abonnement pour iOS, Android et web » : paywalls, campagnes, ciblage, expériences, plus entitlements, purchase APIs, webhooks (https://superwall.com/docs/support/faq/2801653905-how-does-superwalls-pricing-work.md).
- Titre des docs : « Subscription Infrastructure for $1.5B+ in Annual Subscription Revenue » (revendication Superwall, non auditée) (superwall.com/docs/*.md).
- Page « 100 % gratuite et ouverte, alternative à RevenueCat » (https://superwall.com/solutions/the-100-free-and-open-revenuecat-alternative) et guide de migration (https://superwall.com/docs/dashboard/guides/migrating-from-revenuecat-to-superwall.md).
- Cible : devs mobiles, de l'indé à l'éditeur ; pages par stade (/solutions/by-stage/indies) et par équipe (/solutions/by-team/agencies) (superwall.com/solutions).
- Financement : 7,5 M$ au total selon l'annonce de l'acquisition de Tangent (https://superwall.com/blog/superwall-acquires-tangent-and-raises-7.5m) ; CB Insights 3 M$, VCBacked 4,2 M$ (https://www.cbinsights.com/company/superwall/financials ; https://www.vcbacked.co/company/superwall), probablement antérieurs. Valuation : non trouvée.
- Revenu : 3,6 M$ d'ARR et environ 2 000 clients payants en juin 2025 (Latka, https://getlatka.com/companies/superwall.com/interviews/superwall-jake-mor-2025 ; https://founderpath.com/resources/jake-mor-superwall-3-6m-arr-mobile-paywalls). arr.club affiche 9 M$ sans source ni date (https://www.arr.club/superwall) : à ne pas retenir. Aucun chiffre 2026 trouvé.
- Acquisition de Tangent (consultance de monétisation) en juillet 2026 : service géré de conception et d'exécution d'expériences de paywall, aussi pour des apps non clientes (blog superwall.com/blog/whats-new-july-2026).
- Concurrents directs : RevenueCat, Adapty (page https://adapty.io/compare/superwall/).

## Fonctionnalités page par page
Pages vues par titre et extrait uniquement.
- Paywall editor no-code, galerie de templates (plus de 200 selon une source tierce, non confirmé) : https://superwall.com/features/template-gallery ; https://superwall.com/docs/dashboard/templates.md. Modèle d'essai gratuit : https://superwall.com/solutions/design-your-trial-template.
- Campagnes et ciblage (règles, audiences, placements) : https://superwall.com/docs/dashboard/dashboard-campaigns/campaigns-structure.md.
- Expériences / A/B tests de paywalls sans release App Store (https://superwall.com/blog/meet-paywall-experiments ; avis Product Hunt). Kit gratuit « Paywall Experimentation System » (modèle Notion, avril 2026) et site paywallexperiments.com (blog superwall.com/blog.md ; resultats WebSearch).
- Plugin Figma, analytics de churn, système de permissions (changelog du 31/01/2026, https://superwall.com/changelog/superwall-product-updates-figma-plugin-churn-analytics-permission-system-2026-01-31).
- AI Chat Builder et Editor MCP, attribution full-funnel (juin 2026, https://superwall.com/blog/whats-new-june-2026).
- Superwall AI (assistant du dashboard) et CLI (produits, campagnes, paywalls, analytics, API) (juillet 2026, https://superwall.com/blog/whats-new-july-2026 ; https://superwall.com/docs/dashboard/guides/superwall-cli.md).
- Web checkout propulsé par Stripe, requiert iOS SDK 4.2.0+ ; Managed Payments (Stripe marchand officiel, taxes gérées via Stripe Connect), codes de réduction web (août 2026) (https://superwall.com/docs/web-checkout.md ; blog whats-new-august-2026).
- Attribution Meta Ads (août 2026, api.superwall.me/blog/whats-new-august-2026).
- Rétention : campagnes de rétention avec variantes de langue (changelog nov. 2026, superwall.com/changelog).
- Reçus : « free receipt validation » (superwall.com/solutions).
- ASO, avis, mots-clés, screenshots : non trouvé, hors périmètre.

## Onboarding
- Docs publiques par SDK, llms.txt et llms-full.txt par plateforme (https://superwall.com/docs/expo/llms-full.txt ; https://superwall.com/docs/web-checkout/llms.txt), pages « vibe coding » pour agents IA (https://superwall.com/docs/kmp/guides/vibe-coding.md).
- Superwall Skill et installeur npx pour agents, CLI utilisable par humains et agents (blog juillet 2026).
- Dépannage documenté (paywall inattendu, ancien paywall persistant) : https://superwall.com/docs/support/troubleshooting/troubleshooting-unexpected-paywall-behavior.md.
- Migration RevenueCat : guide dédié ; commande `superwall migrate` avec aperçu sans écriture (changelog nov. 2026).
- Étapes d'inscription, carte requise, essai : non trouvé (je ne me suis pas inscrit).

## Prix et paliers (divergences)
- Offre actuelle : Indie 0 $/mois jusqu'à 10 k$ de MAR (revenu attribué mensuel), puis 1 % du MAR total ; Startup 49 $/mois + 1 % ; Scale 199 $/mois + 1 % ; Enterprise sur devis (https://toolradar.com/tools/superwall/pricing ; https://pricepush.app/blog/superwall-vs-revenuecat-numbers ; WebSearch sur superwall.com/pricing.md).
- Divergence : la page prix indique « + 1 % du MAR » sans seuil pour Startup et Scale, la FAQ dit « moins de 10 k$ de MAR gratuit » (https://superwall.com/docs/support/faq/2801653905-how-does-superwalls-pricing-work). Assiette (premier dollar ou au-delà de 10 k$) : non tranché.
- Ancien modèle à la conversion (0,20 $ par conversion, 250 conversions gratuites par mois), conservable par les clients existants ; encore cité par des listings (https://superwall.com/blog/superwall-new-pricing-and-superwall-manifesto ; https://api.superwall.me/blog/superwalls-new-pricing-more-aligned-generous-and-transparent).
- L'infrastructure d'abonnement (entitlements, purchase APIs, webhooks) est annoncée gratuite à toute échelle ; seul le produit paywall est facturé sur le revenu qu'il génère (FAQ ci-dessus).
- Comparatifs tiers : https://newly.app/guides/revenuecat-vs-superwall ; https://www.sequenzy.com/blog/revenuecat-vs-superwall.

## Intégrations et connecteurs
- Amplitude, Mixpanel : envoi automatique des événements d'abonnement et de paiement (https://superwall.com/docs/integrations/amplitude ; /integrations/mixpanel).
- AppsFlyer : revenus par campagne (superwall.com/integrations.md). Braze, OneSignal : page solution « App Store data vers Braze, Amplitude, OneSignal » (https://superwall.com/solutions/seamlessly-integrate-app-store-data-with-braze-amplitude-onesignal).
- Segment : « bientôt » sur la page intégrations, mais cité dans les 30+ intégrations no-code de la page d'accueil. Statut contradictoire.
- Stripe : web checkout. Meta Ads : attribution (août 2026). RevenueCat : coexistence possible, RevenueCat gère les achats et Superwall les paywalls (comparatifs tiers).
- Dashboard integrations : https://superwall.com/docs/dashboard/integrations.

## SDK
- iOS et plateformes Apple, Android, React Native, Flutter, Expo, Unity, web, KMP, tous open source sur GitHub (superwall.com, page d'accueil via WebSearch ; https://github.com/superwall).
- Versions vues : iOS 4.19.1 (https://superwall.com/docs/ios/changelog), Android 2.9.0 en octobre 2026, Expo 1.7.0 (qui embarque Android 2.8.8 et iOS 4.18.2) (https://superwall.com/docs/expo/changelog).
- Android : Google Play Billing 9.1.0 avant l'échéance du 31/08/2026, API minimale 23 (blog août 2026). Option `eventTrackingBehavior` sur Android et Expo (juillet 2026).

## Ce que les utilisateurs louent (sources)
- Product Hunt : 5,0/5 sur 13 avis ; itération rapide sans revue App Store, éditeur clair, mises à jour en temps réel, « saved us 100s of dev hours » (https://www.producthunt.com/products/superwall/reviews). Échantillon petit et auto-sélectionné.
- G2 : un seul avis, 4,0/5, salue les paywalls dynamiques modifiables sans les redévelopper ; G2 note qu'il n'y a pas assez d'avis (https://www.g2.com/products/superwall/reviews).
- Comparatifs tiers : plus fort que RevenueCat sur le test de paywalls, RevenueCat plus mature sur l'infrastructure (https://www.buildmvpfast.com/blog/revenuecat-vs-superwall-vs-adapty-in-app-subscription-indie-2026 ; sequenzy.com).
- Étude de cas Superwall (partisane) : un indé revenu de RevenueCat à Superwall, revenu doublé (https://superwall.com/case-studies/how-an-indie-developer-switched-from-revenuecat-back-to-superwall).

## Ce que les utilisateurs reprochent (sources)
- Coût : un utilisateur Reddit le juge un peu plus cher (https://redlib.hbubli.cc/r/iOSProgramming/comments/1i2wbxm/revenuecat_vs_superwall).
- Bug anecdotique : prix vides au démarrage à froid, corrigé par la config (https://dev.to/astraedus/my-superwall-paywall-showed-blank-prices-on-cold-start-two-bugs-one-was-a-default-7kc), un seul cas.
- Produit centré paywalls : « Superwall pour les paywalls, RevenueCat plus holistique » (commentaire Reddit, même fil).
- Assiette du 1 % et seuils incohérents entre pages (voir Prix) : confusion constatée par un analyste (pricepush.app).
- Page concurrente d'Adapty le décrit plus lent au chargement (https://adapty.io/compare/superwall/) : source partisane, non vérifiée.
- G2 : trop peu d'avis pour des plaintes ; Capterra : non trouvé.

## Stratégie SEO
- Docs et blog servis en .md (superwall.com/blog.md, /docs/*.md, /pricing.md, /integrations.md) plus llms.txt par section : lisible par les IA.
- Pages « solutions » par stade, équipe, cas d'usage (indies, agences, essai gratuit, validation de reçus, intégrations App Store data) ; page « alternative gratuite et ouverte à RevenueCat ».
- Pages de fonctionnalités : /features, /features/template-gallery, /templates.
- Outils gratuits : galerie de templates, paywallexperiments.com et kit Notion ; pas de calculateur trouvé.
- Pages programmatiques : non trouvé de motif clair (pas de milliers de pages générées repérées).
- Blog : mensuel « What's New in {mois} 2026 », annonces, manifeste de prix, « Superwall Ships! 2025 Year in Review » (https://superwall.com/blog/superwall-ships-recap), études de cas.
- Mots-clés visibles : revenuecat alternative, paywall experiments, paywall builder, subscription infrastructure, web checkout.
- Miroir de domaines : api.superwall.me, superwall.dev, superwall-me/Superwall-iOS apparaissent en résultats (contenu dupliqué possible).
- Beaucoup de comparatifs tiers : newly.app, toolradar.com, pricepush.app, sequenzy.com, airbridge.io, similarlabs.com.

## Changelog récent (https://superwall.com/changelog)
- Nov. 2026 : `superwall migrate` en aperçu, repli de langue des campagnes de rétention, précision Apple Pay pour Managed Payments sur pages teleport.
- Oct. 2026 : Android SDK 2.9.0 (contenu non lu).
- Août 2026 : attribution Meta Ads, SDK KMP et web, codes de réduction web checkout, Google Play Billing 9.1.0.
- Juil. 2026 : acquisition de Tangent et 7,5 M$, Superwall AI, CLI, Managed Payments.
- Juin 2026 : AI Chat Builder, Editor MCP, attribution full-funnel.
- Avril 2026 : « What's New » (contenu non lu) ; janvier 2026 : plugin Figma, analytics de churn, permissions.

## Ce qu'Appolyn peut copier, faire mieux, éviter
- Copier : docs et blog en .md et llms.txt ; CLI et Skill pour agents ; guide de migration chiffré depuis un concurrent ; recap mensuel « What's New » ; kits gratuits (Notion, templates) ; pages « solutions » par stade (indie).
- Faire mieux : un prix lisible avec une seule version (Superwall mélange Indie/Startup/Scale, ancien modèle à la conversion, seuils contradictoires) ; couvrir le cycle complet (ASO, avis, lancement), là où Superwall reste centré monétisation ; preuves sociales plus nombreuses (G2 : 1 avis).
- Éviter : un % du revenu des indés sans palier clair ; chiffres de revenu cumulé non audités en titre de docs ; pages miroirs de domaines.
- Surveiller : Tangent (service géré), web checkout Stripe et attribution, qui rapprochent Superwall des sections paywalls, finance et marketing d'Appolyn. Option : connecteur ou partenariat (SDK open source) plutôt que concurrence frontale.

## Sources
- https://superwall.com/pricing.md
- https://superwall.com/docs/support/faq/2801653905-how-does-superwalls-pricing-work.md
- https://superwall.com/blog/superwall-new-pricing-and-superwall-manifesto
- https://api.superwall.me/blog/superwalls-new-pricing-more-aligned-generous-and-transparent
- https://toolradar.com/tools/superwall/pricing
- https://pricepush.app/blog/superwall-vs-revenuecat-numbers
- https://newly.app/guides/revenuecat-vs-superwall
- https://www.sequenzy.com/blog/revenuecat-vs-superwall
- https://www.buildmvpfast.com/blog/revenuecat-vs-superwall-vs-adapty-in-app-subscription-indie-2026
- https://superwall.com/changelog
- https://superwall.com/changelog/superwall-product-updates-figma-plugin-churn-analytics-permission-system-2026-01-31
- https://superwall.com/blog/whats-new-april-2026
- https://superwall.com/blog/whats-new-june-2026
- https://superwall.com/blog/whats-new-july-2026
- https://api.superwall.me/blog/whats-new-august-2026
- https://superwall.com/blog/superwall-acquires-tangent-and-raises-7.5m
- https://superwall.com/docs/ios/changelog
- https://superwall.com/docs/expo/changelog
- https://superwall.com/docs/dashboard/guides/superwall-cli.md
- https://superwall.com/docs/dashboard/guides/migrating-from-revenuecat-to-superwall.md
- https://superwall.com/docs/web-checkout.md
- https://superwall.com/integrations.md
- https://superwall.com/docs/integrations/amplitude
- https://superwall.com/solutions
- https://superwall.com/solutions/the-100-free-and-open-revenuecat-alternative
- https://superwall.com/features/template-gallery
- https://superwall.com/case-studies/how-an-indie-developer-switched-from-revenuecat-back-to-superwall
- https://www.g2.com/products/superwall/reviews
- https://www.producthunt.com/products/superwall/reviews
- https://redlib.hbubli.cc/r/iOSProgramming/comments/1i2wbxm/revenuecat_vs_superwall
- https://dev.to/astraedus/my-superwall-paywall-showed-blank-prices-on-cold-start-two-bugs-one-was-a-default-7kc
- https://adapty.io/compare/superwall/
- https://getlatka.com/companies/superwall.com/interviews/superwall-jake-mor-2025
- https://www.cbinsights.com/company/superwall/financials
- https://www.vcbacked.co/company/superwall
- https://www.arr.club/superwall
