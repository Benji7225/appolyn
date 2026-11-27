# Lokalise (lokalise.com) — fiche du 2026-11-27

Méthode : WebFetch sur lokalise.com/pricing : ENOTFOUND (domaine bloqué, un seul essai). Rien n'a été lu en page entière. Tout vient d'extraits de WebSearch, y compris pour les pages Lokalise (lokalise.com/changelog, /shipped-*, /vantage, docs.lokalise.com, developers.lokalise.com), donc déclaratifs et favorables. Sources tierces lues par extrait : G2, Capterra, Software Advice, GetApp, CB Insights, Wikipedia, PR Newswire, VentureBeat, comparatifs concurrents (Ringly, SimpleLocalize, Locize, Hackceleration, DevToolPicks). Reddit : aucun fil trouvé. Product Hunt : une page de lancements existe (producthunt.com/products/lokalise/launches), contenu non lu.

## Positionnement
- Plateforme de gestion de traduction (TMS) pour logiciels : textes d'interface, apps mobiles, web, avec IA de traduction, mémoire de traduction, glossaires et workflows (lokalise.com/solutions/software-localization/).
- Se présente comme « le leader des logiciels de traduction pour entreprises à croissance rapide » (lokalise.com/solutions/translation-software-platform/, auto-déclaratif).
- Septembre 2026 : lancement de Vantage, un espace no-code pour localiser contenus marketing, juridiques et supports (documents longs, sites, campagnes), annoncé le 15 sept. 2026 et ouvert aux clients fin septembre (financialcontent.com, communiqué Business Wire du 2026-09-15 ; lokalise.com/vantage/).
- Cible : équipes produit et dev, marketing et enterprise. Les comparatifs indés le jugent « calibré pour une équipe financée, pas pour un dev solo » (devtoolpicks.com/blog/best-i18n-localization-tools-indie-hackers-2026, source concurrente).
- Financement : Series B de 50 M USD menée par CRV, décembre 2021, avec Creandum et Dawn Capital (prnewswire.com ; venturebeat.com/2021/12/14). Valorisation : non divulguée (tech.eu).
- Total levé : divergent, 56 M USD (tech.eu, clay.com) ou 78,38 M USD sur 6 tours dont un B-II de 10,75 M en déc. 2022 (cbinsights.com/company/lokalise/financials).
- Revenu : le CEO a parlé d'un ARR « à deux chiffres en millions USD » en 2021 (venturebeat.com/2021/12/14). Aucun chiffre 2026 trouvé. revenu_estime : inconnu.
- Effectif : 180+ en 2021, 250+ selon Wikipedia (2022), 236 selon Dealroom : divergent, non recoupé.

## Fonctionnalités page par page
Pages vues par extrait de recherche uniquement.
- Éditeur et projets : projets web et mobile, clés de traduction, tâches, workflows, rôles (lokalise.com/solutions/translation-software-platform/).
- Mobile : import, gestion et export de String Catalog Apple (.xcstrings), projets Web et mobile uniquement, clés séparées créées pour les variantes de substitution (docs.lokalise.com/en/articles/12710356-apple-xcstrings-xcstrings).
- SDK over-the-air (OTA) iOS (CocoaPods) et Android : mise à jour des traductions sans passage en revue App Store ; bundle généré depuis la page Download, configuration dans didFinishLaunchingWithOptions avec un ID de projet et un jeton SDK (developers.lokalise.com/docs/ios-sdk ; lokalise.com/solutions/mobile-apps/). Le SDK iOS ne lit pas .xcstrings directement d'après un extrait ; à vérifier dans la doc.
- Plugin Flutter OTA : pub.dev/documentation/lokalise_ota_sdk/latest.
- IA : traduction IA avec score de qualité, profils IA personnalisés, Glossary Guard (lokalise.com/ai/ ; lokalise.com/shipped-winter-2026/). IA « qui se souvient » (lokalise.com/shipped-autumn-2025/, titre).
- MCP : serveur MCP Lokalise pour piloter la localisation depuis des outils IA, jeton API requis, OAuth 2.0 recommandé ; annoncé bêta dans les notes du printemps 2026 (lokalise.com/product/mcp-server/ ; lokalise.com/shipped-spring-2026/). Paquet PyPI tiers « lokalise-mcp » (pypi.org/project/lokalise-mcp/).
- CLI v2 et API REST : création de projets, upload de clés, déclenchement de traductions, téléchargement de fichiers, tâches (lokalise.com/product/api-translation/ ; lokalise.com/product/for-developers/).
- Vantage : parsing et segmentation de documents entiers, mémoire de traduction, glossaires, score par traduction, relecture humaine seulement où nécessaire, aperçus en contexte ; formats DOCX, PPTX, HTML, Markdown, IDML, XLSX (martech360.com, communiqué). Été 2026 : tableau de tâches inter-projets, panneau d'assets, historique, intégrations Webflow et Braze, onboarding en libre-service (lokalise.com/shipped-summer-2026/).
- Analytics : tableaux Workflows et Automations dans l'onglet Usage (changelog du 3 nov. 2026).
- Audit Logs API couvrant Vantage (changelog du 13 nov. 2026).
- ASO, avis, screenshots de fiche, mots-clés : non trouvé, hors périmètre. Aucune fonction dédiée aux métadonnées App Store Connect trouvée dans les extraits.

## Onboarding
- Essai gratuit de 14 jours, sans carte, sur tous les plans selon un agrégateur (aiproductivity.ai/pricing/lokalise/) ; non recoupé sur la page officielle (non lue).
- Aide publique sur docs.lokalise.com et intercom.help/lokalise-help, docs développeur sur developers.lokalise.com, guide d'onboarding Vantage (intercom.help/lokalise-help/en/articles/14077402).
- Mobile : générer un bundle OTA, ajouter le SDK, configurer ID projet et jeton (developers.lokalise.com/docs/ios-sdk).
- Inscription réelle, étapes, carte : non trouvé (je ne me suis pas inscrit). llms.txt : non trouvé ; une page agrégée « agent-ready index » existe (xpay.sh/agent-ready-index/lokalise-co/), non lue.

## Prix et paliers (divergences)
- Refonte 2026 : plans renommés Start vers Explorer, Essential vers Growth, Pro vers Advanced ; fin de la tarification par siège, sièges standard illimités pour traducteurs et relecteurs, les rôles manager et développeur occupent des sièges avancés (docs.lokalise.com/en/articles/11694835-new-price-plans-everything-you-should-know ; agrégateur : pricingsaas.com/companies/lokalise).
- Explorer : 144 USD/mois dans la plupart des sources. Advanced : 999 USD/mois. Enterprise sur devis (agrégateurs : costbench.com/software/localization/lokalise/ ; aiproductivity.ai).
- Growth : divergent, 375 USD/mois selon une source, 499 USD/mois selon une autre (mêmes agrégateurs). Non tranché.
- Siège avancé supplémentaire : environ 100 USD/an selon une seule source, non recoupé.
- Plan gratuit : divergent. Une source dit qu'il a été retiré en 2026, une autre parle d'un plan gratuit jusqu'à 500 clés et 1 utilisateur (agrégateurs, ancienne grille probable). Page officielle lokalise.com/pricing : non lue.
- Autres listings : capterra.com/p/162858/Lokalise/pricing/ ; g2.com/products/lokalise-inc-lokalise/pricing ; vendr.com/marketplace/lokalise ; docs.lokalise.com/en/articles/5159153-available-plans-and-payment-methods.
- Coûts annexes de l'IA : lokalise.com/ai, page costbench « hidden costs » citée, non lue.

## Intégrations et connecteurs
- Plus de 60 intégrations déclarées (lokalise.com/blog/enterprise-localization-integrations/).
- Git : GitHub, GitLab, Bitbucket, Azure Repos ; GitHub Actions open source Push (v5.7.0) et Pull (v6.0.0, changements cassants) (changelog 23 oct. 2026 ; blog changelog).
- Design : plugin Figma et agent IA via MCP (lokalise.com/blog/figma-ai-agent-lokalise-mcp/).
- CMS et marketing : Contentful, Webflow, Braze, Strapi, Google Docs, SendGrid pour Vantage (martech360.com).
- Plus de 30 formats de fichiers (lokalise.com/solutions/software-localization/).
- SDK API : Ruby SDK Next et Node.js v17 prennent en charge l'API Vantage (changelog 30 oct. et 6 nov. 2026). Python : python-lokalise-api sur readthedocs.
- Connecteurs tiers : tray.ai (tray.ai/connectors/lokalise-integrations).
- Apple App Store Connect (métadonnées de fiche) : non trouvé.

## Ce que les utilisateurs louent (sources)
- G2 : 4,7/5 sur 760 avis ; forces dominantes : facilité d'usage (79 avis) et support (69 avis) (g2.com/products/Lokalise/reviews ; comparatifs G2).
- Capterra : 97 avis, facilité d'usage 4,8 et service client 4,9 (capterra.com/p/162858/Lokalise/reviews/).
- Support réactif cité par plusieurs relecteurs Capterra (même source).
- Chiffres de G2 et Capterra issus de résumés machine, comptes de périodes différentes : à pondérer.

## Ce que les utilisateurs reprochent (sources)
- Problèmes d'utilisabilité : 82 avis G2 ; problèmes d'intégration : 27 avis (comparatifs G2, par exemple g2.com/compare/lokalise-vs-transifex-vs-phrase-localization-platform).
- Intégration GitHub jugée un peu compliquée par un avis Capterra ; manque de souplesse sur les langues personnalisées, un avis G2 (capterra.com/p/162858/Lokalise/reviews/ ; g2.com/products/Lokalise/reviews).
- Prix : « vraiment cher » dans un avis Capterra ; comparatifs concurrents parlant de sièges et limites de mots prohibitifs pour startups et open source (programminginsider.com ; devtoolpicks.com). Sources partisanes.
- Changement de grille tarifaire en 2026 avec prix contradictoires selon les agrégateurs : manque de lisibilité (voir Prix).
- Reddit, Trustpilot : non trouvé.

## Stratégie SEO
- Types de pages : pages produit et solutions (/solutions/software-localization/, /solutions/mobile-apps/, /product/for-developers/, /product/mcp-server/, /ai/), pages « alternatives » (/solutions/alternatives/, /product/alternatives/transifex-alternative), pages pricing, changelog, docs séparées.
- Pages « Shipped by Lokalise » trimestrielles (saisons) : lokalise.com/shipped-spring-2026/, /shipped-summer-2026/, /shipped-winter-2026/, /shipped-autumn-2025/.
- Blog : guides techniques (getting-started-with-ios-localization), MCP, Figma, annonces (lokalise.com/blog/mcp-for-localization/ ; blog/category/product-updates).
- Outils gratuits : non trouvé dans les extraits.
- Pages programmatiques : non trouvé de motif clair (pas de pages par paire de langues vues).
- Mots-clés visibles : software localization, translation management system, mobile app localization, iOS localization, Lokalise alternatives, Lokalise MCP.
- Annuaires : G2, Capterra, Software Advice, GetApp, AlternativeTo, Product Hunt.

## Changelog récent (https://lokalise.com/changelog/)
- 13 nov. 2026 : Audit Logs API pour Vantage ; limites de caractères Ditto synchronisées.
- 6 nov. 2026 : SDK Node.js v17 avec API Vantage (copie sur le blog).
- 3 nov. 2026 : tableaux Workflows et Automations ; filtres personnalisés supprimables sans casser les workflows.
- 30 oct. 2026 : Ruby SDK Next pour l'API Vantage.
- 23 oct. 2026 : GitHub Actions Push v5.7.0 et Pull v6.0.0.
- Fin sept. 2026 : Vantage disponible. Été, printemps, hiver 2026 : pages « Shipped ».
- Les deux pages de changelog (officielle et blog) divergent légèrement (extrait de recherche).

## Ce qu'Appolyn peut copier, faire mieux, éviter
- Copier : pages « Shipped » saisonnières ; serveur MCP et API publique ; score de qualité par traduction avec relecture humaine ciblée ; prise en charge .xcstrings ; pages « alternatives ».
- Faire mieux : Appolyn publie directement la fiche App Store en 22+ langues via l'API App Store Connect en un clic (README Appolyn), là où Lokalise traduit des chaînes d'interface sans publier la fiche (aucune fonction ASC trouvée). Prix lisible à ~20 EUR/mois contre 144 USD/mois d'entrée (agrégateurs).
- Éviter : changer de grille et de noms de plans avec prix contradictoires ; tarification par sièges pour des solos ; intégrations Git perçues comme complexes.
- Surveiller : SDK OTA (mises à jour sans revue App Store) qui rapprochent Lokalise des développeurs mobiles ; Vantage vise le marketing, pas l'indé.
- Concurrents cités par les comparatifs : Crowdin, Phrase, Transifex, Smartling, Localazy, SimpleLocalize, Tolgee, Weblate (g2.com/compare/crowdin-localazy-vs-lokalise ; alternativeto.net/software/lokalise).

## Sources
- https://lokalise.com/pricing/
- https://lokalise.com/changelog/
- https://lokalise.com/vantage/
- https://lokalise.com/ai/
- https://lokalise.com/product/mcp-server/
- https://lokalise.com/product/api-translation/
- https://lokalise.com/product/for-developers/
- https://lokalise.com/solutions/software-localization/
- https://lokalise.com/solutions/mobile-apps/
- https://lokalise.com/solutions/translation-software-platform/
- https://lokalise.com/shipped-spring-2026/
- https://lokalise.com/shipped-summer-2026/
- https://lokalise.com/shipped-winter-2026/
- https://lokalise.com/shipped-autumn-2025/
- https://lokalise.com/blog/enterprise-localization-integrations/
- https://docs.lokalise.com/en/articles/11694835-new-price-plans-everything-you-should-know
- https://docs.lokalise.com/en/articles/5159153-available-plans-and-payment-methods
- https://docs.lokalise.com/en/articles/12710356-apple-xcstrings-xcstrings
- https://developers.lokalise.com/docs/ios-sdk
- https://intercom.help/lokalise-help/en/articles/14077402-lokalise-vantage-onboarding-guide
- https://www.g2.com/products/Lokalise/reviews
- https://capterra.com/p/162858/Lokalise/reviews/
- https://www.capterra.com/p/162858/Lokalise/pricing/
- https://www.softwareadvice.com/translation-management/lokalise-profile/
- https://pricingsaas.com/companies/lokalise
- https://www.costbench.com/software/localization/lokalise/
- https://aiproductivity.ai/pricing/lokalise/
- https://www.cbinsights.com/company/lokalise/financials
- https://venturebeat.com/2021/12/14/continuous-localization-platform-lokalise-raises-50m/
- https://prnewswire.com/news-releases/lokalise-secures-50m-series-b-led-by-crv-to-help-companies-accelerate-growth-through-localization-process-automation-301442442.html
- https://www.financialcontent.com/article/bizwire-2026-9-15-lokalise-introduces-vantage-a-next-generation-no-code-workspace-for-localizing-marketing-and-long-form-content
- https://devtoolpicks.com/blog/best-i18n-localization-tools-indie-hackers-2026
- https://programminginsider.com/best-lokalise-alternatives-in-2026-8-localisation-platforms-compared-on-pricing-self-hosting-and-developer-experience/
- https://alternativeto.net/software/lokalise
