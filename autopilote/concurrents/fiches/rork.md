# Rork (rork.com) — fiche du 2026-11-23

Méthode : WebSearch uniquement (une vingtaine de requêtes, dont plusieurs limitées aux domaines docs.rork.com et rork.com). WebFetch tenté sur rork.com : ENOTFOUND (domaine bloqué dans la session, à autoriser dans les paramètres réseau pour relire les pages). Les pages de docs et du site ne sont donc vues que par titre et extrait de recherche ; les avis et chiffres viennent de tiers, souvent des blogs concurrents ou des agrégateurs (signalés). Cette fiche remplace entièrement l'ancien stub du 18/11/2026. La ligne du CSV (/home/user/appolyn/autopilote/concurrents/liste.csv, ligne Rork) a été réutilisée et recoupée.

## Positionnement
- Générateur d'apps mobiles par IA, en langage naturel, pour créer et lancer des apps iOS et Android sans coder (https://pulse2.com/rork-15-million-raised-for-ai-mobile-app-creation-platform).
- Fondateurs : Daniel Dhawan et Levan Kvirkvelia (https://techcrunch.com/2025/05/05/rorks-founders-were-almost-broke-when-a-viral-tweet-led-to-2-8m-and-a16z/). Le titre de cet article de mai 2025 évoque 2,8 M$ et a16z ; détails non relus.
- Levée : seed de 15 M$, menée par Left Lane Capital selon Axios Pro ; autres investisseurs cités par un résumé : Peak XV, True Ventures, Goodwater, a16z Speedrun ; annonce vers le 9 au 14 avril 2026 (https://www.axios.com/pro/enterprise-software-deals/2026/04/09/rork-seed-mobile-apps-enterprise ; https://pulse2.com/rork-15-million-raised-for-ai-mobile-app-creation-platform ; https://www.vcaonline.com/news/2026040906/rork-raises-15m-to-power-the-next-generation-of-app-store-entrepreneurs/). Aucun article TechCrunch sur ce tour trouvé (le CSV n'en cite pas non plus).
- Rachat : après la levée, première acquisition, Paperline, app macOS qui construit des apps Swift natives par IA (résultat de recherche sur la levée ; source précise non isolée, à reconfirmer).
- Produit en deux étages : un constructeur « classique » (React Native / Expo à l'origine) et Rork Max, lancé vers le 21 février 2026, qui génère du SwiftUI natif compilé sur des Mac cloud (https://www.producthunt.com/products/rork-app-for-ios/launches ; https://rork.com/faq). Une page rork.com/android parle aussi d'un Android natif Kotlin + Jetpack Compose avec signature et mise en ligne Google Play gérées par Rork (https://rork.com/android) ; date de sortie non trouvée.
- Divergence sur la techno : les avis tiers anciens disent React Native/Expo pour Android (https://dynalord.com/blog/rork-review), la doc récente dit Swift pour iPhone et Kotlin/Compose pour Android (https://docs.rork.com/introduction/build-your-first-app, via recherche).
- Revenu : très contradictoire, d'après le CSV : 440 k$ ARR (Everydev, 2025), 886 k$ (estimation modélisée StartupHub, fourchette 612 k$ à 1,7 M$), 2,1 M$ (arr.club, juin 2026, non vérifié). Chiffre officiel : non trouvé.
- Cible visée par les guides : propriétaires de petites entreprises non techniques (https://rork.com/guides), plus les « App Store entrepreneurs » (https://www.martechcube.com/rork-raises-15m-to-power-the-next-generation-of-app-store-entrepreneurs/).

## Fonctionnalités page par page
Vu par titre et extrait uniquement.
- Constructeur (chat) : créer une app, choisir la plateforme, prompter ; la doc conseille une fonction principale d'abord (https://docs.rork.com/introduction/build-your-first-app). Mode plan pour les parties délicates (sync hors ligne, notifications push) selon les guides (https://rork.com/guides).
- Rork Max : SwiftUI compilé avec Xcode sur Mac cloud ; iPhone, iPad, Apple Watch, Vision Pro ; widgets, Live Activities, Dynamic Island, Siri intents, apps iMessage (https://rork.com/faq). Annoncé comme propulsé par Claude Code et Opus 4.6 sur Product Hunt (https://www.producthunt.com/posts/1076562). Page produit : https://rork.com/max.
- App iPhone Rork Max : app mobile pour construire depuis un téléphone (https://docs.rork.com/rork-max/rork-max-app).
- Rork Android : natif Kotlin/Compose (https://rork.com/android). Un message de l'équipe sur Product Hunt disait un constructeur Android natif en développement, sans date (https://www.producthunt.com/p/rork-app-for-ios/rork-max?page=3) : divergence de calendrier avec la page Android, à relire.
- Rork Games : « native games sans moteur de jeu » (https://rork.com/games), détails non lus.
- Lecture du code et des logs dans l'éditeur (https://docs.rork.com/features/code-and-logs).
- Import : depuis GitHub (https://docs.rork.com/import/import-from-github) et depuis un site web vers app mobile (https://docs.rork.com/import/website-to-mobile-app).
- AI App Reviewer : cinq relecteurs, un par groupe de règles Apple (sécurité, performance, business, design, légal), lisent le code, listent règle, constat et correctif, bouton « Fix warnings » ; Apple décide in fine (https://rork.com/ai-reviewer). Page éditeur, donc marketing.
- Outil « Rork Max Publishing » : icône, captures iPhone/iPad, description, mots-clés et champs App Store Connect générés puis soumis ; un seul article secondaire, aucune annonce officielle retrouvée (https://toolquestor.com/news/rork-launches-tool-that-writes-designs-and-submits-your-app-store-listing-using-ai).
- Web : les apps web du projet ne partent pas sur l'App Store, elles se publient sur un lien rork.app (docs publication, voir plus bas).
- Playbook croissance : « Scale your mobile app to $50k+/month » (https://docs.rork.com/rork-playbook/scale-to-50k-month).
- Prévisualisation : lien .rork.app partageable sans App Store ni TestFlight (https://docs.rork.com/faq/publishing, via recherche).
- ASO approfondi (mots-clés, localisation, suivi des avis), analytics post-lancement, attribution : non trouvé.

## Onboarding
- Création de compte, choix de l'idée, choix de plateforme, premier prompt (https://docs.rork.com/introduction/build-your-first-app).
- Plan gratuit : 5 crédits de design par jour, plafond 35 par mois dans les « grands marchés » et 5 hors de ceux-ci ; design uniquement, impossible de builder, tester ou publier (https://docs.rork.com/introduction/subscriptions, via recherche).
- Guides sectoriels avec plan semaine par semaine (BTP, salle de sport, nettoyage, dentiste, plomberie) : https://rork.com/guides/construction-company-mobile-app, https://rork.com/guides/gym-fitness-studio-app, https://rork.com/guides/cleaning-company-app, https://rork.com/guides/dental-practice-app.
- Délais annoncés dans ces guides (marketing) : v1 en 30 à 60 jours de soirées (BTP), 4 à 6 semaines pour une app de terrain prête pour la production.
- Docs avec fichier llms.txt (https://docs.rork.com/llms.txt) et page changelog listée.
- Démo guidée, checklist de lancement hors AI Reviewer : non trouvé.

## Du build à la publication App Store (flux détaillé)
Source principale : docs.rork.com via recherche (https://docs.rork.com/store-guides/publish-app-store ; https://docs.rork.com/introduction/deploy-your-app ; https://docs.rork.com/faq/publishing ; https://docs.rork.com/rork-max/rork-max-app).
1. Prérequis : compte Apple Developer payant (99 $/an) ; le compte et la fiche App Store doivent être à l'Apple ID de l'utilisateur. Google Play : 25 $ une fois (https://www.vp0.com/blogs/can-rork-publish-to-app-store-and-google-play, tiers).
2. Ouvrir Publish puis la section App Store (libellé variable selon les pages : « More puis Publish App » dans l'app Max).
3. Saisir App Info : icône, nom (30 caractères max), version, bundle identifier ; chaque plateforme Apple se soumet séparément.
4. Connexion Apple : e-mail et mot de passe du compte développeur, avec code de vérification éventuel.
5. Start Submission : build et upload sur les machines cloud de Rork, sans Mac ni Xcode ; il faut rester sur la page.
6. Le build apparaît dans App Store Connect et TestFlight ; lien d'invitation bêta partageable.
7. L'utilisateur termine la fiche (page produit, captures, prix) dans App Store Connect puis soumet à App Review ; la FAQ dit que Rork soumet à App Review une fois confirmé.
8. Google Play : publication manuelle selon les docs (export GitHub puis EAS), alors que https://rork.com/android dit que Rork gère signature et Google Play. Divergence entre pages de l'éditeur.
9. Option Xcode : export GitHub puis archive sur Mac (https://docs.rork.com/how-to-set-up-xcode/how-to-set-up-xcoe).
- Divergences tiers : un guide dit que Rork automatise build, certificats et soumission via EAS ; un autre dit que l'utilisateur garde la main sur toute la soumission. La doc officielle (Max, Swift) ne mentionne pas EAS. Page d'erreurs de soumission : https://docs.rork.com/submitting-to-app-store/apple/submission-errors ; un fil Apple Developer rapporte une erreur de publication via Rork (https://developer.apple.com/forums/thread/807166).
- Un fil du forum Apple Developer demande ce qu'Apple compte faire de Rork Max (apps créées sans matériel Apple, afflux d'apps générées) ; extrait limité au message initial, aucune réponse d'Apple (https://developer.apple.com/forums/thread/816419).
- Rejets App Review : données spécifiques à Rork minces ; un blog tiers cite les guidelines 4.2, 4.3 et 4.0 (https://vp0.com/blogs/how-to-fix-rork-app-store-rejection-2026), générique aux apps rapides.

## Prix et paliers (divergences)
- Page prix officielle (mise à jour 11 novembre 2026 selon l'extrait) : plan Free et un plan payant Rork Max à partir de 20 $/mois pour 100 crédits, puis 200 $/mois pour 1 000 crédits jusqu'à 1 800 $/mois pour 10 000 crédits ; comptes créés à partir du 4 août 2026 voient Max dès 20 $, les plus anciens peuvent voir Rork Pro à 20 $ (https://docs.rork.com/introduction/subscriptions, via recherche).
- Divergence : la FAQ facturation et des guides listent encore Pro 20 $/mois (100 crédits) et Max dès 200 $/mois (1 000 crédits) (https://docs.rork.com/faq/billing ; https://rork.com/guides/gym-fitness-studio-app). Tiers concordants avec cette seconde version (https://vp0.com/blogs/rork-pricing-plans-2026/).
- Anciens noms de plans : Junior, Middle, Senior (100 $/mois, 500 messages selon certaines sources), Scale ; obsolètes (tiers).
- Crédits de build et crédits Cloud séparés ; les crédits Cloud paient l'IA et le cloud utilisés par l'app, y compris pour ses utilisateurs finaux une fois publiée (https://docs.rork.com/billing/build-credits-vs-cloud-credits).
- Remise à zéro : plans payants à la date anniversaire du premier achat, plan gratuit au début du mois civil ; crédits non reportés (https://docs.rork.com/introduction/subscriptions).
- Frais externes : Apple 99 $/an, Google 25 $ une fois.
- Prix de l'essai, remise annuelle, plan équipe : non trouvé.

## Intégrations et connecteurs
- RevenueCat : la FAQ dit intégration intégrée dans Pro et Max ; le partenaire RevenueCat dit que Rork configure produits, offerings, entitlements et clés après autorisation (https://rork.com/faq ; https://www.revenuecat.com/partners/technology/partner/rork). Une doc plus ancienne dit paiements natifs pas encore intégrés (https://docs.rork.com/faq/integrations) : divergence, date non confirmée. Guide RevenueCat : https://docs.rork.com/payment-guides/revenuecat ; RevenueCat ne marche pas dans Expo Go, il faut un development build.
- Supabase : à demander à Rork, mais « nécessite une configuration manuelle et des conseils » (https://docs.rork.com/backend/supabase). Expo propose une commande qui relie Supabase (https://expo.dev/changelog/supabase-integration-with-expo).
- GitHub : export du code et sync bidirectionnelle, plans payants (https://docs.rork.com/faq/integrations ; https://docs.rork.com/import/import-from-github).
- Hébergement web : Rork n'héberge pas les apps web, export vers Vercel, Netlify (FAQ intégrations).
- App Store Connect : via le flux Publish ci-dessus.
- Adapty, Superwall, analytics, attribution (AppsFlyer, Postback, Adjust), ASO : non trouvé.

## Export / déploiement mobile
- Plans payants : propriété du code ; Expo : export d'un projet React Native/Expo ; Max : projet Xcode SwiftUI natif (https://rork.com/faq).
- Build cloud : machines Mac chez Rork pour Max (FAQ) ; sans Mac pour l'utilisateur dans le flux Publish.
- Apps Android : Kotlin/Compose natif d'après https://rork.com/android ; EAS pour Play d'après la doc de publication.
- SDK à embarquer par Rork : non trouvé (l'app générée utilise le SDK que l'utilisateur ajoute).

## Ce que les utilisateurs louent (sources)
- Product Hunt : 4,4 sur 25 avis pour la fiche principale ; louanges : rapidité pour passer du prompt à une app mobile, MVP, outils internes, projets personnels (https://www.producthunt.com/products/rork-app-for-ios/reviews). Une seconde fiche « rork-2 » : 5,0 sur 1 avis (https://www.producthunt.com/products/rork-2/reviews?page=2).
- Trustpilot : un avis note une amélioration après une récente version (https://pl.trustpilot.com/review/rork.com ; autres pages nationales : https://ca.trustpilot.com/review/rork.com, 13 avis annoncés dans le titre).
- Reddit : aucun fil Rork pertinent retrouvé par la recherche.
- Presse : TechCrunch (2025) sur la croissance et 100 000 $ de revenu en cinq jours (titre de l'extrait ; https://techcrunch.com/2025/05/05/rorks-founders-were-almost-broke-when-a-viral-tweet-led-to-2-8m-and-a16z/).

## Ce que les utilisateurs reprochent (sources)
- Crédits : le « fix with AI for free » consomme quand même des crédits quand le build casse ; 60 crédits non utilisés perdus à la fin de l'abonnement sans prévenir (Trustpilot, relayé par la recherche : https://pl.trustpilot.com/review/rork.com ; https://ca.trustpilot.com/review/rork.com). Un blog dit que les règles de crédit génèrent plus de plaintes que les prix (https://www.superappp.com/blog/rork-review-2026-pricing-real-reviews-and-is-it-worth-it).
- Stabilité : plantages, écrans noirs, erreurs persistantes, fonctions manquantes, friction à la publication, support irrégulier (Product Hunt : https://www.producthunt.com/products/rork-app-for-ios/reviews?page=2). Support : réponses en quelques jours ouvrés (https://iconpolls.com/blogs/rork-max-review-2026-ai-app-pricing-app-builder-reddit-user-experience-and-faqs).
- Un avis Trustpilot cite un rétrogradage inattendu vers le plan gratuit et un support surtout assuré par un bot (https://pl.trustpilot.com/review/rork.com).
- Qualité et conformité : risque de rejet 4.2/4.3 pour apps rapides (tiers, générique).
- Confusion sur les prix et les plans : trois grilles coexistent dans les sources (voir Prix).
- Limites : publication Google Play manuelle selon les docs ; les apps web ne passent pas par l'App Store.
- Réserve : la plupart des « reviews » sont des blogs de concurrents ou d'affiliation ; échantillons Product Hunt et Trustpilot petits.

## Stratégie SEO
- Types de pages : accueil, /max, /android, /games, /faq, /ai-reviewer, /changelog, /reactions (« What people are saying »), /guides (hub et articles) (URLs ci-dessus), docs séparées sur docs.rork.com avec llms.txt.
- Guides programmatiques par métier : « How to build a mobile app for your X in 2026 » (BTP, gym, nettoyage, dentiste, HVAC/plomberie/électricien, service terrain), articles de comparaison « Base44 alternative for native mobile apps » (https://rork.com/guides/base44-alternative) et « Best AI App Builders for 2027 » (https://rork.com/guides/best-ai-app-builders) ; titres avec année dans l'URL ou le titre.
- Écosystème tiers : listes « Rork alternatives » (Jotform, AlternativeTo, Sticklight, topai.tools, ToolQuestor, etc.) (https://www.jotform.com/blog/rork-alternatives/ ; https://alternativeto.net/software/rork/), blogs prix et reviews (vp0.com, bilt.me, dynalord.com, nocode.mba), offres Fiverr « Rork + Supabase + publication App Store ».
- Mots-clés visibles : Rork pricing, Rork review, Rork alternatives, Rork to App Store, build mobile app for [métier], AI app builder.
- Outils gratuits (calculateur, générateur) : non trouvé. Sitemap : non trouvé (pages bloquées).

## Changelog récent
- Page https://rork.com/changelog : l'extrait ne montre que la sélection de modèle et la disponibilité de modèles par plan ; entrées datées non lues.
- 21 février 2026 : lancement de Rork Max (Product Hunt, https://www.producthunt.com/products/rork-app-for-ios/launches).
- Avril 2026 : seed de 15 M$ et acquisition de Paperline (voir Positionnement).
- 4 août 2026 : nouvelle présentation de Rork Max dès 20 $ pour les nouveaux comptes (https://docs.rork.com/introduction/subscriptions).
- 11 novembre 2026 : date de mise à jour de cette page de prix.
- Novembre 2026 : autre entrée datée : non trouvé.

## Ce qu'Appolyn peut copier / faire mieux / éviter
- Lien avec Appolyn : Rork couvre le « build » et la mise en ligne technique ; Appolyn (cycle de vie : ASO, avis, lancement, analytics, finance) arrive après. Rork ne montre aucune offre ASO, avis, analytics ou attribution dans les sources lues (non trouvé), d'où une complémentarité plutôt qu'un duel.
- Copier : guides par métier avec plan semaine par semaine ; relecteur « avant soumission » (cinq règles Apple) ; flux Publish en étapes courtes avec TestFlight ; lien de prévisualisation partageable ; docs avec llms.txt ; page de réactions.
- Faire mieux : après Publish, enchaîner sur la fiche App Store (mots-clés, captures, localisations), le suivi des avis, RevenueCat et l'attribution ; import d'une app générée par Rork (export GitHub ou projet Xcode) pour la publier et l'optimiser dans Appolyn ; grille de prix unique et lisible ; pas de crédits perdus.
- Éviter : trois grilles de prix concurrentes et noms de plans changeants ; crédits consommés par les erreurs de l'IA ; promesses « publié en minutes » sans parler de la review Apple ; contradictions entre pages sur Google Play.
- Surveiller : acteur financé, très actif, qui avance vers l'App Store (Publishing, AI Reviewer) : risque qu'il ajoute lui-même listing et ASO ; fil du forum Apple sur l'afflux d'apps générées (risque 4.3 pour les apps issues de Rork, et donc pour les utilisateurs d'Appolyn).

## Domaines bloqués
- rork.com (WebFetch ENOTFOUND). Les pages docs.rork.com et rork.com ne sont lues que par extraits de recherche.

## Sources
- https://docs.rork.com/introduction/subscriptions
- https://docs.rork.com/faq/billing
- https://docs.rork.com/faq/publishing
- https://docs.rork.com/faq/integrations
- https://docs.rork.com/introduction/deploy-your-app
- https://docs.rork.com/store-guides/publish-app-store
- https://docs.rork.com/submitting-to-app-store/apple/submission-errors
- https://docs.rork.com/billing/build-credits-vs-cloud-credits
- https://docs.rork.com/introduction/build-your-first-app
- https://docs.rork.com/rork-max/rork-max-app
- https://docs.rork.com/import/import-from-github
- https://docs.rork.com/import/website-to-mobile-app
- https://docs.rork.com/how-to-set-up-xcode/how-to-set-up-xcoe
- https://docs.rork.com/payment-guides/revenuecat
- https://docs.rork.com/backend/supabase
- https://docs.rork.com/features/code-and-logs
- https://docs.rork.com/rork-playbook/scale-to-50k-month
- https://docs.rork.com/llms.txt
- https://rork.com/faq
- https://rork.com/max
- https://rork.com/android
- https://rork.com/games
- https://rork.com/ai-reviewer
- https://rork.com/changelog
- https://rork.com/guides
- https://rork.com/guides/base44-alternative
- https://rork.com/guides/best-ai-app-builders
- https://rork.com/guides/gym-fitness-studio-app
- https://www.producthunt.com/products/rork-app-for-ios/reviews
- https://www.producthunt.com/products/rork-app-for-ios/launches
- https://pl.trustpilot.com/review/rork.com
- https://techcrunch.com/2025/05/05/rorks-founders-were-almost-broke-when-a-viral-tweet-led-to-2-8m-and-a16z/
- https://www.axios.com/pro/enterprise-software-deals/2026/04/09/rork-seed-mobile-apps-enterprise
- https://pulse2.com/rork-15-million-raised-for-ai-mobile-app-creation-platform
- https://www.revenuecat.com/partners/technology/partner/rork
- https://developer.apple.com/forums/thread/816419
- https://toolquestor.com/news/rork-launches-tool-that-writes-designs-and-submits-your-app-store-listing-using-ai
- https://vp0.com/blogs/rork-pricing-plans-2026/
- https://www.superappp.com/blog/rork-review-2026-pricing-real-reviews-and-is-it-worth-it
- https://alternativeto.net/software/rork/
- /home/user/appolyn/autopilote/concurrents/liste.csv (ligne Rork)
