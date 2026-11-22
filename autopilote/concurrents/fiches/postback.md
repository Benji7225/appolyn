# Postback (postback.sh) — fiche du 2026-11-22

Méthode : WebSearch uniquement (7 requêtes, dont 4 limitées au domaine postback.sh). WebFetch tenté sur postback.sh et appsprint.app : les deux échouent en ENOTFOUND (domaines bloqués dans la session, à autoriser dans les paramètres réseau pour relire les pages). Tout vient donc d'extraits de résultats de recherche, déclaratifs et rédigés par l'éditeur lui-même. Aucun avis indépendant trouvé. La ligne du CSV (/home/user/appolyn/autopilote/concurrents/liste.csv, ligne Postback) a été réutilisée et recoupée.

## Positionnement
- MMP (mobile measurement partner) pour apps à abonnement : relie dépenses pub, installs, essais, abonnements et revenus (https://postback.sh/ ; https://postback.sh/gdpr).
- Exploité par la société Tap & Swipe, basée en France, qui se présente comme sous-traitant RGPD (processor), ni régie pub ni courtier de données (https://postback.sh/gdpr).
- Cible : équipes et fondateurs d'apps à abonnement qui veulent une installation rapide et un tarif public par événements ; page « Best Mobile Attribution Platforms for App Founders » (https://postback.sh/blog/mobile-attribution-platforms-for-app-founders).
- Se positionne contre AppsFlyer et Adjust, jugés « enterprise » ; admet que les grandes équipes ayant besoin de centaines de partenaires pub ou d'un deep linking mature préféreront une plateforme plus large (https://postback.sh/compare/adjust-alternative).
- Pas de copilote d'analytics IA : une page de comparaison le dit (https://postback.sh/docs, via WebSearch). Pas de SDK Unity (même source ; le CSV cite aussi son blog).
- Revenus : inconnu. Aucune fiche TrustMRR, Latka ou IndieHackers trouvée (CSV : « aucune fiche TrustMRR ou Latka »). Levée de fonds : non trouvé. Taille de l'équipe : non trouvé.

## Fonctionnalités page par page
Pages vues par titre et extrait uniquement.
- Attribution Apple Search Ads : le SDK lit le contexte d'attribution Apple (AdServices) ; la connexion du compte ajoute dépenses, taps, impressions et noms de campagnes lisibles (https://postback.sh/blog/apple-ads-api-vs-adservices ; https://postback.sh/docs).
- AdServices : le jeton ne demande ni invite ATT ni IDFA, expire après 24 h ; les détails retournés dépendent des règles d'éligibilité d'Apple (https://postback.sh/blog/apple-ads-api-vs-adservices).
- TikTok Ads : Signal Campaigns avec lien qui capte le contexte du clic puis redirige vers le store, et renvoi d'événements choisis via l'Events API (https://postback.sh/blog/standard-app-campaigns-vs-signal-campaigns ; https://postback.sh/compare/adjust-alternative).
- Meta Ads : « en cours de validation » (https://postback.sh/docs/meta-ads) ; une autre page dit « bientôt ». Divergence entre pages de l'éditeur.
- Revenus : événements d'abonnement via RevenueCat ou Superwall rattachés à l'install d'origine et à la campagne ; ROAS au niveau mot-clé Apple Ads + RevenueCat (https://postback.sh/blog/apple-ads-revenuecat-keyword-roas ; https://postback.sh/blog/apple-ads-superwall-subscription-attribution).
- Suivi de posts organiques TikTok, Instagram et Facebook (vues, likes, commentaires, partages), inclus dans le palier Growth, 30 posts au volume de base (page prix postback.sh, via WebSearch).
- MCP hébergé et Agent CLI pour agents IA, avec modifications Apple Ads ou TikTok Ads soumises à approbation (https://postback.sh/mcp ; https://postback.sh/docs).
- Google Ads, Snap, Android Play Install Referrer, deep linking, dashboard détaillé : non trouvé.
- Hors périmètre (non trouvé) : mots-clés ASO, localisation, screenshots, avis, paywalls.

## Onboarding
- Le tableau de bord génère un prompt de setup propre à l'app, à coller dans Cursor, Claude Code ou équivalent ; l'utilisateur relit le changement puis confirme un événement de test (https://postback.sh/docs, via WebSearch).
- Docs par plateforme : Android Kotlin (https://postback.sh/docs/android), RevenueCat (https://postback.sh/docs/revenuecat), Superwall (https://postback.sh/docs/superwall), Meta Ads.
- RevenueCat : ajouter un webhook pointant vers un endpoint Postback contenant l'ID d'app ; vérifié au premier webhook valide ; les webhooks SANDBOX vérifient la connexion mais ne créent ni événements attribués ni conversions pub sortantes (https://postback.sh/docs/revenuecat).
- Pièges d'intégration : sur React Native et Flutter, attendre l'ID d'install et synchroniser l'attribut postbackId avant tout paywall ou achat ; avec Superwall, utiliser postbackId comme user ID ; un seul webhook de cycle de vie par app pour éviter le double comptage (docs RevenueCat et Superwall ci-dessus).
- Essai : divergence, voir section Prix.
- Page de migration depuis un autre MMP, démo, ou checklist : non trouvé.

## Prix et paliers (divergences)
- Starter 9 $/mois, 1 app, 10 000 événements/mois ; Growth 19 $/mois, jusqu'à 10 apps, 10 000 événements/mois ; paliers publics jusqu'à 20 millions d'événements (https://postback.sh/ ; blog postback.sh, via WebSearch). Prix des paliers hauts : non trouvé.
- Un événement = chaque nouvelle install en production et chaque événement accepté du SDK, de RevenueCat ou de Superwall. Ne comptent pas : retries, tests, mises à jour d'identité, clics de signal links, webhooks ignorés, requêtes de données, envois sortants vers les régies.
- Divergence sur l'essai : la page prix dit pas d'essai gratuit, facturation au paiement ; la page MCP et plusieurs articles de blog disent 14 jours d'essai sur Starter (https://postback.sh/mcp ; https://postback.sh/blog/firebase-vs-mmp-app-attribution). La page prix doit être reconfirmée.
- Comparaison avec AppsFlyer et Adjust : page éditeur sans chiffres vérifiés ici (https://postback.sh/blog/appsflyer-alternative-for-subscription-apps).

## Intégrations et connecteurs
- Sources de revenus : RevenueCat (webhook), Superwall (webhook signé Svix, secret collé dans le tableau de bord) (docs revenuecat et superwall).
- Régies : Apple Search Ads, TikTok Ads (Events API), Meta Ads en cours (https://postback.sh/docs/meta-ads).
- Adobe, Amplitude, Mixpanel, Adapty, Qonversion, Stripe, exports data warehouse, postbacks vers tiers : non trouvé.
- MCP et CLI pour agents (https://postback.sh/mcp).

## SDK
- Quatre SDK : Expo/React Native, iOS Swift, Android Kotlin, Flutter (https://postback.sh/docs).
- Android publié sur Maven Central, paquet sh.postback:sdk, version 2.0.1 au moment de la recherche, endpoint par défaut api.postback.sh (https://socket.dev/maven/package/sh.postback/sdk).
- Appel configure() avec la clé d'API le plus tôt possible au démarrage (docs).
- Le SDK iOS ne déclenche jamais l'invite ATT ; l'IDFA n'est inclus que si l'app a déjà l'autorisation (https://postback.sh/gdpr).
- Données collectées : identifiants d'install, IP et user agent, caractéristiques d'écran et d'appareil, contexte réseau et graphique, langue et fuseau ; pas de GPS précis ni contacts (même source). Méthode de rapprochement (probabiliste ou non) : non trouvé.
- Unity : absent. Open source du SDK, licence : non trouvé.

## Ce que les utilisateurs louent (sources)
- Aucun avis indépendant trouvé : Product Hunt, Reddit, G2, Capterra, AlternativeTo, IndieHackers ne sont pas ressortis pour ce produit (recherches du 2026-11-22).
- Les seules louanges sont celles de l'éditeur (prix bas, setup rapide, tarif public par événements) : à considérer comme du marketing.

## Ce que les utilisateurs reprochent (sources)
- Aucun reproche d'utilisateur réel trouvé (même constat).
- Limites admises par l'éditeur : pas de Unity ; Meta Ads non finalisé ; pas de copilote d'analytics IA ; peu de partenaires pub face aux grands MMP (pages postback.sh citées plus haut).
- Réserve : la collecte de signaux IP, user agent et caractéristiques d'appareil ressemble à du fingerprinting, terme que la page RGPD n'emploie pas (https://postback.sh/gdpr) ; à vérifier vis-à-vis des règles Apple.
- Ambiguïté de nom : « postback » désigne aussi un terme générique d'attribution, ce qui brouille la recherche de marque (https://en.wikipedia.org/wiki/Postback).

## Stratégie SEO
- Types de pages : accueil, docs (/docs, /docs/{android,revenuecat,superwall,meta-ads}), /compare/{adjust-alternative}, /mcp, /gdpr, blog.
- Blog d'alternatives programmatique, format « 10 Best X Alternatives for Mobile Apps » : PostHog, Mixpanel, Countly, TelemetryDeck, UXCam, GameAnalytics, Firebase Analytics, App Store Connect Analytics (https://postback.sh/blog/posthog-mobile-app-analytics ; /blog/mixpanel-mobile-app-analytics ; /blog/countly-mobile-app-analytics ; /blog/telemetrydeck-mobile-app-analytics ; /blog/uxcam-mobile-app-analytics ; /blog/gameanalytics-mobile-games ; /blog/firebase-vs-mmp-app-attribution ; /blog/apple-app-store-connect-analytics).
- Anomalie : l'URL /blog/firebase-vs-mmp-app-attribution porte un titre « 10 Best Firebase Analytics Alternatives », alors qu'un article au titre « Firebase vs MMP: Is Firebase Enough for App Attribution? » existe sur appsprint.app avec le même slug (https://appsprint.app/blog/firebase-vs-mmp-app-attribution) : lien entre les deux (même éditeur, rebranding, copie) non établi.
- Pages comparatives : /compare/adjust-alternative, /blog/appsflyer-alternative-for-subscription-apps.
- Pages éducatives : What is an MMP, Apple Ads API vs AdServices, Standard App Campaigns vs Signal Campaigns, Apple Ads + RevenueCat ROAS, Apple Ads + Superwall.
- Ancienneté : articles indiqués « environ 112 jours » dans un extrait, donc blog lancé vers l'été 2026 (WebSearch, à confirmer).
- Mots-clés visibles : mobile attribution for subscription apps, AppsFlyer alternative, Adjust alternative, MMP for indie apps, Apple Ads RevenueCat ROAS, app store connect analytics alternatives.
- Outils gratuits : non trouvé. Pages programmatiques par ville, pays ou outil au-delà des « alternatives » : non trouvé. Sitemap, llms.txt : non trouvé (pages inaccessibles).

## Changelog récent
- Aucun changelog public trouvé (recherche explicite, non trouvé).
- État déclaré : Apple Search Ads et TikTok Signal Campaigns disponibles ; Meta Ads en validation ; SDK Android 2.0.1 sur Maven Central (socket.dev).
- Novembre 2026 : non trouvé.

## Ce qu'Appolyn peut copier / faire mieux / éviter
- Copier : prompt de setup généré pour assistant de code ; MCP et CLI pour agents ; prix public lisible au volume d'événements, dès 9 $ ; pages « X alternatives » et pages comparatives ; articles pratiques sur l'intégration RevenueCat et Superwall ; page RGPD claire avec liste des données collectées.
- Faire mieux : couvrir tout le cycle (ASO, avis, lancement) là où Postback se limite à l'attribution ; page prix et essai cohérents ; preuves sociales et avis indépendants (Postback n'en a pas) ; contenus hors du seul mode « alternatives » ; SDK Unity si pertinent.
- Éviter : contradiction entre pages sur l'essai gratuit et l'état de Meta Ads ; collecte de signaux de type fingerprinting sans le nommer ; duplication de titres et de slugs entre articles (cf. anomalie ci-dessus) ; claims comparatifs sans chiffres.
- Surveiller : produit petit mais orienté agents IA, proche des sections analytics et finance d'Appolyn ; possible connecteur ou partenariat (webhooks RevenueCat) plutôt qu'attribution propre.

## Sources
- https://postback.sh/ (via WebSearch)
- https://postback.sh/docs
- https://postback.sh/docs/android
- https://postback.sh/docs/revenuecat
- https://postback.sh/docs/superwall
- https://postback.sh/docs/meta-ads
- https://postback.sh/mcp
- https://postback.sh/gdpr
- https://postback.sh/compare/adjust-alternative
- https://postback.sh/blog/appsflyer-alternative-for-subscription-apps
- https://postback.sh/blog/standard-app-campaigns-vs-signal-campaigns
- https://postback.sh/blog/apple-ads-api-vs-adservices
- https://postback.sh/blog/apple-ads-revenuecat-keyword-roas
- https://postback.sh/blog/apple-ads-superwall-subscription-attribution
- https://postback.sh/blog/mobile-attribution-platforms-for-app-founders
- https://postback.sh/blog/what-is-a-mobile-measurement-partner
- https://postback.sh/blog/firebase-vs-mmp-app-attribution
- https://postback.sh/blog/apple-app-store-connect-analytics
- https://appsprint.app/blog/firebase-vs-mmp-app-attribution (bloqué en fetch, vu via recherche)
- https://socket.dev/maven/package/sh.postback/sdk
- https://en.wikipedia.org/wiki/Postback
- /home/user/appolyn/autopilote/concurrents/liste.csv (ligne Postback)
