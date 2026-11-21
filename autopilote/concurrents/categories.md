# Carte du marché (mise à jour 21/11/2026, passage 4 : 133 acteurs, voir liste.csv)

Cible à terme : 300 à 500 acteurs. Sources : WebSearch, G2, Capterra, comparatifs (les sites éditeurs sont presque tous bloqués, voir JOURNAL.md). Les prix et revenus tiers divergent souvent : voir la ligne de chaque acteur.

| Catégorie | Leaders / acteurs | Trou pour Appolyn |
|---|---|---|
| Abonnements et paywalls | RevenueCat, Superwall, Adapty (~6,9 M$/an, estimation Latka), Qonversion (~1,7 M$/an, Latka), Purchasely, Apphud ; Glassfy fermé fin 2024 | lire leurs données plutôt que les remplacer ; capter les clients orphelins de Glassfy |
| ASO et mots-clés | AppTweak, App Radar (signalement de faillite 2023 chez CB Insights, site actif en 2026), AppFollow, MobileAction, Gummicube (service géré), ASOMobile, Astro (9 $), AppSprint, Sonar, AppDrift, ASOdesk, FoxData, SplitMetrics Acquire | publication multilingue en un clic : personne |
| Veille d'apps | Sensor Tower, Similarweb, AppStoreSpy, AppMagic (racheté par Sensor Tower, mai 2026 selon PR Newswire) | version légère et abordable |
| Avis | AppFollow, Appbot, App Radar, Replient (réponses IA dès 39 €/mois), AppReviewBot (SEO programmatique) | réponses IA incluses dans le même outil |
| Analytics d'app | Appfigures, Mixpanel, Amplitude, PostHog, TelemetryDeck, Aptabase, Countly, UXCam, DataFast | revenus + ASO ensemble ; analytics sans données perso (TelemetryDeck, Aptabase) pour indés |
| Attribution et deep links | Postback, AppsFlyer, Branch, Adjust, Singular, Kochava, Tenjin, Linkrunner, Appstack, Dub (après l'arrêt de Firebase Dynamic Links le 25/08/2025) | attribution par contenu pour indés ; deep links simples |
| Localisation | Lokalise, Crowdin, Phrase, Tolgee, Localazy | spécifique métadonnées App Store |
| Screenshots | AppLaunchpad, AppScreens, Screenshots.pro, Previewed, AppScreenshotStudio (SEO /compare, API, MCP), Shotlingo (40+ langues) | |
| Générateurs d'apps IA et no-code | Rork, Emergent (100 M$ d'ARR déclaré, non audité), FlutterFlow, Lovable, Bolt, Natively, Vibecode, Bloxks, Draftbit, Adalo, Glide, Bubble, Anything (2 M$ d'ARR déclaré). Lovable : 400 M$ d'ARR déclaré (fév. 2026, TechCrunch) | passerelle build → lancement |
| CI/CD | Bitrise, Codemagic, Expo EAS, Appcircle, fastlane (open source), Runway (release mobile) | |
| Crash, push | Crashlytics, Sentry, Bugsnag, Embrace (racheté par Palo Alto Networks, juil. 2026), Luciq (ex Instabug), OneSignal, Braze, CleverTap, Pushwoosh, Customer.io, Airship | |
| Réseaux sociaux | Buffer, Typefully, Postiz, Later, Metricool, Publer, Hypefury, Taplio, Blotato | |
| Landing pages d'apps | Carrd, Framer, Unicorn Platform, AppLaunchFlow, NewAppLander | page d'app liée aux vraies données de la fiche |
| Kits presse et lancement | PressKitHero (générique), BetaList (lancement) | quasi vide : kit presse pensé pour apps |
| UGC et créateurs | Billo (dès 99 $/vidéo), Insense, Arcads (10 M$ d'ARR annoncé), Creatify (9 M$ d'ARR annoncé) | un seul acteur trouvé : à creuser |
| Outils d'indés généraux | TrustMRR (revenus vérifiés, créé par Marc Lou), ChartMogul | |

Passage 3 : 27 acteurs ajoutés, 15 lignes approfondies. Chiffres de revenu = déclarations ou estimations tierces citées dans le CSV, jamais audités.

Catégories encore maigres : kits presse et lancement (2 acteurs), landing pages d'apps (4), avis (5), CI/CD (6), finance d'abonnements (ChartMogul seul, Baremetrics à ajouter), beta-testing (TestFlight tools, aucun encore), Apple Ads (SplitMetrics seul). Aucun fil Reddit exploitable trouvé. Lignes encore « à approfondir » : 30 (voir liste.csv). Natively, Vibecode, Bloxks : existence à confirmer.

## Ajouts du passage 4 (21/11/2026) : 24 acteurs
| Catégorie | Nouveaux acteurs | Lecture |
|---|---|---|
| Finance d'abonnements | Baremetrics (dès 108 $/mois selon G2, ~1,5 M$/an estimation), ProfitWell Metrics by Paddle | seuls outils MRR/churn généralistes : aucun n'est pensé pour une app mobile ; trou pour Appolyn (revenus App Store + abonnements) |
| Beta-testing / distribution | TestApp.io, Diawi, TestFairy, Appalize | catégorie jusque-là vide ; prix contradictoires, peu d'avis indépendants |
| Apple Ads / ROAS | AppSkale (129 $/mois selon AlternativeTo), ASO.dev | niche, ciblée sur la dépense publicitaire |
| Landing pages d'apps | Landico, Siteify | jeunes, vus surtout sur Product Hunt / App Store ; aucun ne lit les vraies données de la fiche |
| Kit presse | presskit.gg (jeux, dès 39 €/an selon un comparatif) | orienté jeux, pas apps : le trou « kit presse d'app » reste ouvert |
| Avis | AppReply (Standard 79 à 99 $/mois selon sources) | cher pour un indé |
| No-code / wrappers mobiles | Thunkable, Median, Softr | Median et Natively (wrappers de site web) montrent une demande « site → app » ; Natively n'est PAS un générateur IA (corrigé) |
| CI/CD | Buddy, CircleCI | génériques, peu centrés mobile |
| Push / notifications | MoEngage, Knock, Courier, Novu (open source, 10 000 exécutions gratuites) | marché consolidé côté entreprise ; Novu = alternative auto-hébergée |
| Feedback produit | Canny (gratuit 25 utilisateurs suivis), Featurebase, Fider (open source) | adjacent : feedback/roadmap/changelog, pas de lien avec les stores |

Lignes approfondies au passage 4 : Natively, Vibecode, Bloxks, Adalo, Glide, Bubble, Apphud, Dub, Crashlytics, Sentry, OneSignal, Mixpanel, Bitrise, Codemagic, Expo EAS. Revenus sourcés (estimations tierces) : Sentry (128 M$ d'ARR 2023, Sacra), Mixpanel (~210 M$ en 2025, Latka), OneSignal (~21,6 M$ en 2024, Latka), Bitrise (8,23 M$ en 2022, CB Insights), Bubble (25,9 M$ en 2021, CB Insights), Dub (~1 M$ d'ARR, arr.club, contradictoire). Expo : Series B de 45 M$ (avril 2026). Vibecode : seed de 9 à 9,4 M$ (août 2025). Apphud : passage à 10 000 $ de MTR gratuit.

Catégories encore maigres : outils de lancement Product Hunt (rien de vérifié trouvé), UGC pour apps, crash et qualité (aucun ajout ce passage), Reddit toujours introuvable. 15 lignes encore « à approfondir ».
