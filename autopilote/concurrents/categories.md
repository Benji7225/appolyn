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

## Ajouts du passage 5 (22/11/2026) : 20 acteurs, total 153
| Catégorie | Nouveaux acteurs | Lecture |
|---|---|---|
| Lancement (annuaires) | Uneed (~10 k$/mois, Indie Hackers, déclaration du fondateur), Fazier, Peerlist Launchpad | alternatives à Product Hunt ; prix divergents selon sources |
| Beta-testing | TestFlight (Apple), BetaTesting, Firebase App Distribution | TestFlight gratuit et incontournable : s'y brancher, pas le concurrencer |
| Apple Ads | Apple Ads (Basic/Advanced), ASA Agent | peu d'outils indés ; ASA Agent mal documenté (URL à confirmer) |
| UGC | Collabstr, MakeUGC | marchés de créateurs, prix divergents |
| Crash / qualité | Shake, Raygun, Datadog RUM mobile | peu d'avis publics, faiblesses peu documentées |
| Générateurs d'apps IA | Rocket.new (4,5 M$ d'ARR annoncé à la levée seed 2025), Replit (~525 M$ d'ARR, valueaddvc, avril 2026) | Replit confirme que le build passe par les grandes plateformes |
| CI/CD | Xcode Cloud | natif Apple, gratuit en partie : référence pour les indés iOS |
| Paiements / abonnements web | Paddle, Lemon Squeezy | paiements hors store ; prix Lemon Squeezy non confirmés |
| Analytics / push | Heap (Contentsquare), Pusher Beams, Firebase Cloud Messaging | push gratuit côté Firebase : le push seul ne se vend pas |

Lignes approfondies au passage 5 : Braze (738,2 M$ de revenu FY2026, communiqué), Amplitude (ARR 366 M$, communiqué), PostHog (~58 M$ d'ARR, estimation Sacra), Buffer, Typefully (~1,4 M$, Starter Story, divergent), Postiz (145 à 160 k$ de MRR déclaré), Later, Metricool (8,5 M$ ou 11 M€ d'ARR selon source), Carrd, Framer (50 M$ d'ARR, Sacra), TrustMRR, Billo, AppLaunchFlow, NewAppLander, PressKitHero. Plus aucune ligne « à approfondir ». Fiches écrites : postback, sonar, appdrift.
Trous restants : Reddit introuvable, avis indépendants rares pour les outils ASO récents (Sonar, AppDrift, Postback), peu d'acteurs ≥10 k$/mois prouvés côté indés.

## Ajouts du passage 6 (23/11/2026) : 24 acteurs, total 177
| Catégorie | Nouveaux acteurs | Lecture |
| --- | --- | --- |
| Lancement | Product Hunt, Microlaunch | Product Hunt reste la référence de visibilité ; données de prix anciennes, à revérifier |
| Mockups / visuels | Mockuuups Studio, Rotato | outils de mockups génériques, prix divergents selon les agrégateurs ; aucun ne publie vers les stores |
| Privacy et conformité | iubenda, Termly | générateurs de politiques de confidentialité : demande réelle des indés (App Store exige une politique) ; trou : politique + privacy manifest liés à l'app |
| Crash et qualité | Bugfender | logs distants pour mobile, petit acteur |
| Feedback in-app | Alchemer Mobile (ex Apptentive) | orienté entreprise |
| Tests A/B de fiche | Geeklab | alternative aux tests natifs Apple (Product Page Optimization) ; domaine non confirmé |
| Prix localisés | Parity Deals | prix par pouvoir d'achat (web) : idée transposable aux prix d'abonnement par pays |
| UGC | JoinBrands | marché de créateurs |
| ASO | Asolytics, Apptica | acteurs secondaires, données peu documentées |
| Boilerplates et dev indé | ShipFast (TrustMRR : 1,27 M$ cumulés au 21/10/2026, ~2 k$ sur 30 jours, le fondateur déclare lui-même une baisse), Ignite (Infinite Red), Capawesome | le marché des kits de démarrage existe mais n'est pas stable |
| Paiements / abonnements web | Stripe (app-to-web), FastSpring, Polar, Nami ML | le contournement des frais store progresse (Stripe) ; frais exacts non confirmés |
| SEO / analytics / réseaux | Outrank (274 k$ de MRR cité par Starter Story, non vérifié), Plausible (1 M$ d'ARR selon son blog), Hootsuite | Plausible : preuve qu'un analytics simple se vend |
| Générateurs | Appy Pie | no-code historique, prix divergents |

Lignes approfondies au passage 6 (15) : Astro, Rork, Kochava, fastlane, Emergent (100 M$ d'ARR, estimation Sacra fév. 2026 ; série C de 130 M$ à 1,5 Md$ en juillet 2026), Replient, Aptabase, Appcircle (~2 M$, Latka), ASOMobile, Draftbit, Customer.io (plus de 100 M$ d'ARR, annonce du CEO sept. 2025), Airship, Gummicube (donnée Latka de 2018 seulement), UXCam, Countly (~5,1 M$ en 2025, Latka). Aucun des 24 nouveaux n'est prouvé à plus de 10 k$/mois côté indés, à part les revenus cités ci-dessus.
Trous restants : Reddit toujours introuvable ; avis indépendants rares ; acteurs ≥10 k$/mois prouvés peu nombreux côté indés ; un seul WebSearch par acteur sur les 24 nouveaux (à approfondir au prochain passage : Product Hunt, iubenda, Termly, Geeklab, Nami ML, Polar).

## Ajouts du passage 7 (24/11/2026) : 25 acteurs, total 202
| Catégorie | Nouveaux acteurs | Lecture |
| --- | --- | --- |
| Tests A/B de fiche et Apple Ads | Storemaven (~34,6 M$/an, estimation StartupHub, propriété de Zynga depuis 2022), Astra (Redbox Mobile) | Storemaven = référence entreprise sur devis ; aucun outil abordable pour indé : trou |
| Veille d'apps | Apptopia (~15,9 M$/an, estimation Latka oct. 2024, divergente selon sources) | cher et sur devis, comme Sensor Tower |
| ASO | ASOScan (de 15 à 299 $/mois selon TrustRadius), TheTool (dès ~34 € selon Capterra) | petits acteurs sans revenu ni avis significatifs |
| Lancement | Launching Next (soumission gratuite) | annuaire de lancement de plus |
| Confidentialité | TermsFeed | politique de confidentialité d'app : trou « politique liée à la fiche App Store » toujours ouvert |
| Feedback / changelog | Beamer, Frill, Sleekplan | adjacents ; reproches souvent tirés de pages de concurrents (biaisés) |
| Réseaux | Pallyy, SocialBee | SocialBee sans plan gratuit, dès 29 $/mois |
| UGC / visuels / démo | TopView AI, Shots.so, SwiftShip Previews (dès 29 $ en achat unique, Setapp) | mockups et vidéos app preview : peu d'acteurs, avis quasi inexistants |
| Expérimentation et flags | Statsig, LaunchDarkly, GrowthBook, ConfigCat, Smartlook | adjacents côté dev ; paliers gratuits généreux, pas un terrain pour Appolyn |
| Générateurs / CI-CD | Fastshot (génère de l'Expo), Capgo (mises à jour live Capacitor, dès 12 $/mois) | Fastshot confirme le chemin « IA → Expo → store » |
| Localisation | Transifex (dès ~135 $/mois), Weblate (open source), Lingo.dev (IA, usage) | Lingo.dev : localisation IA pour développeurs, aucun ne vise les métadonnées App Store |

Lignes approfondies au passage 7 (15, aucune n'était encore marquée « à approfondir », choix des plus maigres) : Siteify, Tenjin, Courier, Peerlist Launchpad, TestFlight, Landico, Publer, MakeUGC, AppSkale, AppReply, MoEngage, Hypefury, Novu, ASA Agent, Fider. Fiches écrites : app-radar, appbot, applaunchpad. Correction : le revenu TrustMRR cité pour AppLaunchpad concernait « applaunchpage », un autre produit, et a été retiré ; App Radar : le rachat par SplitMetrics (16/11/2023) est confirmé par la presse, la « faillite » de CB Insights ne l'est pas.
Trous restants : aucun nouvel acteur « landing pages d'apps » trouvé ; Reddit introuvable ; revenus presque tous inconnus ; 202 acteurs sur 300 à 500.
