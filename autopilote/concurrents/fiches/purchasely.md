# Purchasely (purchasely.com) — fiche du 2026-11-26

Méthode : WebFetch sur www.purchasely.com : ENOTFOUND (domaine bloqué, à autoriser dans les paramètres réseau de la session). Tout vient d'extraits WebSearch (docs.purchasely.com, G2, Capterra, Software Advice, pages Adjust et OneSignal, pub.dev, pages comparatives d'Adapty). Le blog purchasely.com et les pages marketing du site n'ont pas été lus ni indexés dans les résultats : « Page officielle non lue ». Reddit : aucun fil trouvé. Aucune inscription. La ligne du CSV (/home/user/appolyn/autopilote/concurrents/liste.csv) a été reprise et recoupée.

## Positionnement
- Plateforme d'abonnement avec « technologie unique de paywalls natifs no-code » (extrait de la fiche partenaire Adjust, https://www.adjust.com/partners/tech/partner/purchasely) ; le builder permet de tester prix, textes, design et tout élément du paywall (même source).
- Se décrit aussi comme « Subscription Platform » : paywalls, A/B tests, analytics de revenus et d'abonnés, messages in-app (Capterra, https://www.capterra.com/p/252429/Purchasely/ ; Software Advice, https://www.softwareadvice.com/mobile-analytics/purchasely-profile/).
- Cible : apps à abonnement de taille moyenne à grande et équipes marketing/produit, société basée à Paris (CSV ; Purchasely n'a pas été lu sur son site). Pilotage par le marketing, sans passer par une release store.
- Positionnement natif iOS/Android, là où Superwall est présenté comme plutôt web selon un guide RevenueCat (https://www.revenuecat.com/blog/growth/guide-to-mobile-paywalls-subscription-apps) : source concurrente, à prendre avec prudence.
- Financement : environ 2 à 2,2 M$ en 2021 (CB Insights 2,14 M$ ; ZoomInfo 2,1 M$) ; valorisation Dealroom 8 à 12 M$ (CSV, sources non rouvertes). Revenu : non trouvé.
- Concurrents directs : RevenueCat, Adapty, Qonversion, Superwall (comparatifs G2 https://www.g2.com/compare/purchasely-vs-revenuecat-vs-qonversion ; page Adapty https://adapty.io/compare/purchasely/).

## Fonctionnalités page par page
Pages vues par extrait uniquement (docs, agrégateurs).
- Placements : un écran (paywall) par emplacement du parcours, modifiable à tout moment depuis la console (https://docs.purchasely.com/docs/faq-product-and-roadmap).
- Flows : parcours multi-étapes avec routage conditionnel, introduits en 5.3 en bêta pour clients sélectionnés (même page ; https://docs.purchasely.com/changelog/53). Usage onboarding : placement `ONBOARDING` dans les exemples de migration v6 (https://docs.purchasely.com/docs/migrating-from-sdk-5-to-6).
- A/B tests : jusqu'à 26 variantes, assignation déterministe par hash de l'identifiant utilisateur, significativité bayésienne (docs FAQ produit ci-dessus). Tests de prix, textes, design (Adjust, Airbridge https://www.airbridge.io/blog/top-3-paywall-builder-solutions-for-subscription-apps).
- Web checkout : basé sur Stripe Payment Links, no-code, disponible depuis le SDK 5.3 ; les transactions web alimentent les résultats d'A/B tests et les dashboards revenus (docs FAQ produit). Web checkout Android ajouté en 5.5 (https://docs.purchasely.com/changelog/55).
- Bring Your Own Screen / Paywall : intégrer son ancien paywall natif comme variante d'une expérience, ou un écran natif dans un flow (https://docs.purchasely.com/docs/bring-your-own-paywall ; changelog 5.6, https://docs.purchasely.com/changelog/56) ; visibilité conditionnelle (5.6).
- SDK 6.0 : engagement 12 mois et tags personnalisés pour contenu dynamique (https://docs.purchasely.com/changelog/60-12-month-commitment-and-personalized-tags).
- Analytics : revenus en temps réel, analyse des abonnés (Capterra ; Software Advice). Détail des métriques : non trouvé.
- Modes : Full (Purchasely gère et valide les achats) ou Observer (l'app garde ses achats) ; défaut passé de Full en v5 à Observer en v6 (https://docs.purchasely.com/docs/migrating-from-v5-to-v6-android).
- Plugin IA (dépôt Purchasely-AI-Plugin, https://github.com/Purchasely/Purchasely-AI-Plugin/pull/18) : contenu non lu.
- ASO, avis, localisation, screenshots, lancement, kit presse : non trouvé, hors périmètre.

## Onboarding
- Docs publiques par plateforme avec guides de migration et mode bac à sable (docs.purchasely.com, extraits) ; llms.txt publié (https://docs.purchasely.com/llms.txt).
- FAQ d'intégration : https://docs.purchasely.com/docs/faq-integration (non lue en détail).
- Tests sandbox recommandés avant release en mode Observer (changelog 6.0).
- Retarder l'affichage pendant splash, onboarding, login ou consentement : désactiver l'affichage à l'initialisation puis le réactiver (changelog 6.0).
- Inscription, essai, carte requise, démo obligatoire : non trouvé. FitGap indique pas d'essai gratuit (https://us.fitgap.com/products/006450/purchasely) ; Entreprise = contacter les ventes.

## Prix et paliers (divergences)
- Prix public : aucun. G2 et TrustRadius : pas de prix publié (https://www.g2.com/products/purchasely/pricing).
- Divergences d'agrégateurs, toutes non vérifiées : 25 $/mois (Software Advice) ; 1 800 $/mois (FitGap, avec palier entreprise sur devis) ; 10 $/mois (SaaSworthy, CSV). Essai ou gratuit : sources contradictoires (CSV).
- Référence : G2 affiche RevenueCat dès 1 700 $/mois (page de comparaison G2), mais cette valeur est elle-même contestable.
- Conclusion : modèle probablement sur devis ; ne pas retenir de chiffre.

## Intégrations et connecteurs
- Capterra : 11 intégrations dont Adjust, Airship, Amplitude, AppsFlyer (https://www.capterra.co.uk/software/1030449/purchasely).
- GetApp : Amplitude, Firebase ; Software Advice : Mixpanel, Segment (liens GetApp/Software Advice ci-dessus).
- Docs : Amplitude, Adjust, Braze, Firebase, Segment (https://purchasely.gitbook.io/purchasely/3.4/integrations), Brevo (https://docs.purchasely.com/docs/brevo), Sendinblue (gitbook), OneSignal (https://onesignal.com/integrations/purchasely).
- Adjust : événements d'abonnement envoyés en serveur à serveur, avec identifiant Adjust associé dans le SDK et jeton d'événement (https://docs.purchasely.com/docs/adjust).
- Stripe : web checkout. Liste complète à jour : non trouvée.

## SDK
- Natifs iOS et Android ; wrappers Flutter, React Native, Cordova, et d'autres (non vérifié) (https://docs.purchasely.com/general/release-notes ; https://github.com/Purchasely/Purchasely-Cordova/releases).
- SDK 6.0 majeur avec ruptures : initialisation par builder, modèle de présentation unique, API d'actions fine remplaçant l'intercepteur global (https://docs.purchasely.com/docs/migrating-from-sdk-5-to-6).
- Versions vues : natifs 6.2.0 iOS et Android ; Flutter 6.0.0 (pub.dev, https://pub.dev/documentation/purchasely_flutter/6.0.0/ ; doc de migration Flutter https://docs.purchasely.com/docs/migrating-from-v5-to-v6-flutter).
- Android 6.x : Kotlin 2.2 et Gradle 9.3 minimum ; minSdk 23 obligatoire annoncé (changelog 5.6 et migration Android).
- Les wrappers suivent les SDK natifs avec décalage (tableaux de versions du changelog 5.4, https://docs.purchasely.com/changelog/54). Licence open source : non trouvé.

## Ce que les utilisateurs louent (sources)
- G2 : 4,2/5 sur 11 avis (CSV) ; une comparaison donne 4,2 sur 10 et une autre 4,5 sur 18 (G2, liens ci-dessus) : compteur incohérent. Points cités : paywall builder facile à utiliser, mise en place rapide, A/B tests, mises à jour à distance (https://www.g2.com/products/purchasely/reviews ; Capterra).
- Capterra : 5,0 sur 3 avis (CSV). Échantillon très faible.
- Étiquettes d'avantages sur Software Advice : no code, analyse de revenus en temps réel, builder convivial.

## Ce que les utilisateurs reprochent (sources)
- G2 : cher (2 mentions), limites de fonctionnalités (1), UI du builder difficile, documentation à améliorer (https://www.g2.com/compare/purchasely-vs-revenuecat-vs-qonversion). Très peu d'avis.
- Pas de prix public, devis obligatoire (G2, TrustRadius).
- Ruptures de version : SDK 6.0 majeur avec migration, mode par défaut changé (docs de migration).
- Flows réservés à des clients sélectionnés en bêta lors de leur lancement (changelog 5.3).
- Comparatifs Adapty : source partisane, non reprise (https://adapty.io/compare/purchasely/).
- Reddit : non trouvé.

## Stratégie SEO
Site éditeur non lu : cette section est lacunaire.
- Types de pages : documentation (docs.purchasely.com, versionnée 3.4, 5.6, 6.x, plus changelog en pages numérotées), pages d'intégration (docs et fiches partenaires Adjust, OneSignal), fiches annuaires (G2, Capterra, GetApp, Software Advice, FitGap, Business of Apps https://www.businessofapps.com/marketplace/purchasely, Product Hunt).
- Outils gratuits : non trouvé.
- Pages programmatiques : non trouvé (pas de motif repéré).
- Blog : non indexé dans les résultats ; contenus externes signés Purchasely (AppTweak « 10 Tips to Optimize Your App Paywall » https://www.apptweak.com/en/aso-blog/10-tips-to-optimize-your-app-paywall ; Unity https://unity.com/fr/resources/jean-francois-grang-purchasely-subscription-monetization). Page « Paywall Guidelines » dans les anciennes docs (https://docs.purchasely.com/v/2.8/advanced-features/paywall-guidelines).
- Mots-clés visibles : paywall builder, no-code paywall, subscription platform, A/B testing paywall, Purchasely alternative (page Adapty), web checkout.
- Docs versionnées sur plusieurs hôtes (gitbook.io et docs.purchasely.com) : risque de contenu dupliqué.
- Adapty cible la requête « Purchasely alternative » dans plusieurs langues (adapty.io/compare/purchasely/, /de, /ja, /pl, /tr, /zh).

## Changelog récent (https://docs.purchasely.com/general/release-notes)
- SDK 6.0 : majeur, builder d'initialisation, présentation unifiée, actions granulaires, engagement 12 mois, tags personnalisés ; natifs 6.2.0.
- 5.6 : Bring Your Own Screen, visibilité conditionnelle, minSdk 23 à venir.
- 5.5 : web checkout Android, Kotlin 2.1 puis 2.2 prévu T1 2026, correctifs de stabilité.
- 5.4 : 5.4.2 corrige un souci des 5.4.0 et 5.4.1 sur iOS.
- 5.3 : web checkout et flows (bêta).
- Dates précises de publication : non trouvées dans les extraits.

## Ce qu'Appolyn peut copier, faire mieux, éviter
- Copier : docs versionnées avec llms.txt ; guides de migration ; fiches d'intégration par partenaire (Adjust, OneSignal : lien retour) ; test A/B avec méthode statistique expliquée ; pont natif/web checkout.
- Faire mieux : afficher un prix public (Purchasely n'en a aucun, les agrégateurs divergent de 10 à 1 800 $/mois) ; viser l'indé, pas les grands comptes ; couvrir ASO, avis et lancement ; collecter plus d'avis publics (G2 : 10 à 18 selon la page) ; blog et outils gratuits qui manquent.
- Éviter : ruptures majeures de SDK avec changement de mode par défaut ; fonctionnalités en bêta sur invitation ; docs sur plusieurs hôtes.
- Surveiller : flows (onboarding) et web checkout Stripe, proches des sections paywalls et onboarding d'Appolyn ; option de connecteur Observer plutôt que concurrence frontale.

## Sources
- https://www.capterra.com/p/252429/Purchasely/
- https://www.capterra.co.uk/software/1030449/purchasely
- https://www.softwareadvice.com/mobile-analytics/purchasely-profile/
- https://www.getapp.com/business-intelligence-analytics-software/a/purchasely
- https://www.g2.com/products/purchasely/reviews
- https://www.g2.com/products/purchasely/pricing
- https://www.g2.com/compare/purchasely-vs-revenuecat-vs-qonversion
- https://us.fitgap.com/products/006450/purchasely
- https://www.businessofapps.com/marketplace/purchasely
- https://www.adjust.com/partners/tech/partner/purchasely
- https://onesignal.com/integrations/purchasely
- https://docs.purchasely.com/docs/faq-product-and-roadmap
- https://docs.purchasely.com/docs/bring-your-own-paywall
- https://docs.purchasely.com/docs/adjust
- https://docs.purchasely.com/docs/brevo
- https://docs.purchasely.com/docs/faq-integration
- https://docs.purchasely.com/general/release-notes
- https://docs.purchasely.com/changelog/60-12-month-commitment-and-personalized-tags
- https://docs.purchasely.com/changelog/56
- https://docs.purchasely.com/changelog/55
- https://docs.purchasely.com/changelog/54
- https://docs.purchasely.com/changelog/53
- https://docs.purchasely.com/docs/migrating-from-sdk-5-to-6
- https://docs.purchasely.com/docs/migrating-from-v5-to-v6-android
- https://docs.purchasely.com/docs/migrating-from-v5-to-v6-flutter
- https://docs.purchasely.com/llms.txt
- https://purchasely.gitbook.io/purchasely/3.4/integrations
- https://pub.dev/documentation/purchasely_flutter/6.0.0/
- https://github.com/Purchasely/Purchasely-Cordova/releases
- https://github.com/Purchasely/Purchasely-AI-Plugin/pull/18
- https://adapty.io/compare/purchasely/
- https://www.airbridge.io/blog/top-3-paywall-builder-solutions-for-subscription-apps
- https://www.revenuecat.com/blog/growth/guide-to-mobile-paywalls-subscription-apps
- https://www.apptweak.com/en/aso-blog/10-tips-to-optimize-your-app-paywall
- https://unity.com/fr/resources/jean-francois-grang-purchasely-subscription-monetization
- https://docs.purchasely.com/v/2.8/advanced-features/paywall-guidelines
