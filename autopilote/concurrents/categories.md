# Carte du marché (mise à jour 27/11/2026, passage 10 : 278 acteurs, voir liste.csv)

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

## Ajouts du passage 8 (25/11/2026) : 24 acteurs, total 226
| Catégorie | Nouveaux acteurs | Lecture |
| --- | --- | --- |
| Landing pages / pré-lancement | Launchrock (20,75 à 29 $/mois selon sources), Landingsite.ai (4 à 12 $/mois, divergent) | génériques ; aucun ne lit les vraies données de la fiche App Store : trou toujours ouvert |
| Kit presse | Pressdeck (49 $ à vie sur AppSumo, 6,66 à 10 $/mois ailleurs) | produit récent, sans avis ; kit presse « d'app » reste quasi vide |
| Mockups / vidéos | Placeit (14,95 $/mois selon la plupart des listings), Smartmockups (existence du site à reconfirmer, une entrée Trustpilot le dit fermé) | génériques, reproches Trustpilot/BBB pour Placeit |
| UGC / créateurs | Trend.io (dès 100 $ G2 ou 550 $ FindClout), Cohley (sur devis) | marchés de créateurs pour marques, pas pour apps indés |
| Avis d'apps | ReplyArgus (lancé juillet 2026, dès 9,99 $/mois, une seule source) | concurrent direct des réponses IA ; domaine à confirmer |
| Générateurs d'apps IA / no-code | RapidNative, a0.dev, Bravo Studio | petits acteurs, peu d'avis indépendants ; le chemin « IA → Expo → store » se confirme |
| Crash / qualité | Bugsee (~18 avis G2), Shipbook | peu de reproches documentés |
| Push | Batch (prix opaques, 149 $/mois à 1 000 EUR/mois selon sources), WonderPush | marché entreprise, prix non publics |
| Beta-testing | Testers Community (testeurs payants, règle des 12 testeurs de Google Play) | demande réelle côté Android ; hors périmètre iOS d'Appolyn |
| ASO / Apple Ads | Applyra (domaine non confirmé), Asapty (sans prix public) | outils d'ASO pour indés : segment encombré |
| Analytics / abonnements web | AppMetrica (Yandex, gratuit ; données stockées en Russie, sujet de réputation), FunnelFox (web-to-app, pas de prix public) | FunnelFox confirme la vague web-to-app |
| Localisation | Applanga (devenu GlobalLink Strings, TransPerfect), Localizely | orientés fichiers de chaînes, pas métadonnées App Store |
| Outils d'indés | Loops (~731 k$/an selon Latka, lecture divergente), Crisp (« eight-figure ARR » cité par un podcast, non vérifié) | e-mail produit et support : adjacents |

Lignes approfondies au passage 8 (15, aucune n'était marquée « à approfondir », choix des plus maigres) : Lemon Squeezy, Buddy, Knock, Softr, CircleCI, Paddle, Heap, Pusher Beams, Apptica, Ignite, Fazier, Collabstr, Median, Canny, Featurebase.
**Alerte : Lemon Squeezy** serait annoncé en arrêt (inscriptions fermées ; paiements stoppés le 31/03/2027 avec migration vers Stripe Managed Payments) d'après des sources secondaires dont des concurrents (checkoutpage.com, dodopayments.com, techstartups.com, mjtsai.com du 19/11/2026) : annonce officielle non lue, à reconfirmer. Si vrai : même scénario que Glassfy, des clients orphelins à capter.
Fiches écrites : flutterflow, mobileaction, bolt, qonversion. Aucune fiche de plus de 60 jours (les plus anciennes datent du 18/11/2026).
Trous restants : Reddit introuvable ; revenus presque tous inconnus ; aucun WebFetch concluant (tout par extraits WebSearch) ; 226 acteurs sur 300 à 500.

## Ajouts du passage 9 (26/11/2026) : 25 acteurs, total 251
| Catégorie | Nouveaux acteurs | Lecture |
|---|---|---|
| Veille d'apps / tableaux de bord indés | AppGoblin (open source Apache-2.0, 0 à 299 $/mois), Apps Finboard (revenus + coûts Google Ads / Apple Ads, profit net par app), IndieBuddy (tableau de bord solo dev : avis, ASO, revenus, vu sur Product Hunt) | trois jeunes concurrents directs de la vision « un seul endroit » ; aucun avis solide, aucun revenu prouvé |
| ASO / Apple Ads | SearchMan (dès 25 $ par app, AppGrooves), AdCider (enchères Apple Ads automatisées, essai 14 jours) | peu d'avis (0 sur G2 pour AdCider) |
| Avis et réponses IA | Rewo, RevBell (app macOS barre de menus, Trousseau) | prix plancher très bas (Rewo dès 9 $/mois selon Capterra), aucun avis client |
| Privacy / consentement | consentmanager (SDK mobile dès 49 €/mois, avis Trustpilot 1 étoile sur le SDK), AppConsent (SFBX, dès 15 €/mois) | catégorie neuve pour la base ; lien avec les exigences Apple (ATT, privacy labels) |
| Rétention d'abonnements / web-to-app | Churnkey (cancel flows, prix opaque 199 à 399 $/mois selon sources), Appcharge (jeux, levées de 26 M$ puis 58 M$) | web-to-app visé surtout par les jeux ; l'indé abonnement reste peu servi |
| Qualité et outillage Xcode | Emerge Tools (taille d'app, racheté par Sentry en 2025 selon CB Insights), Tuist (open core, cache de build), Maestro (tests UI, 0,10 $/flow run) | outils de dev natifs : se brancher plutôt que concurrencer |
| Localisation | SimpleLocalize (dès 12 $/mois) | prix d'entrée bas face à Crowdin et Lokalise |
| Beta / distribution | Applivery (G2 4,8 environ 40 avis, dès 2 €/user/mois) | orienté entreprise / MDM |
| Analytics / CDP | Segment (Twilio) | facturation par MTU critiquée |
| Générateurs d'apps no-code / IA | Dreamflow (Flutter, avis 2,5/5 chez Nubia Magazine), AppMySite (WordPress, dès 69 $/mois), BuildFire (dès 165 $/mois, Capterra 4,4/5 sur 129 avis) | modèles à crédits ou à prix agence : l'indé reste mal servi |
| Réseaux / lancement / vidéo | Tweet Hunter (X), Ayrshare (API sociale), DevHunt (lancement outils dev), Screen Studio (démos, licence à vie retirée), Captions (Trustpilot 1,5/5 sur 96 avis) | Ayrshare = brique API possible pour la programmation de posts |

Lignes approfondies au passage 9 (15, les plus maigres) : Diawi, TelemetryDeck (grille de juillet 2026 : gratuit 50 000 événements/mois, Indie 9 €), Apple Ads (plafond Basic 10 000 $/app/mois selon Apple), TestApp.io, TestFairy, Xcode Cloud, ASO.dev, Replit, Datadog RUM, presskit.gg, Hootsuite (Advanced 399 $/utilisateur/mois), Capawesome, Thunkable, Appalize, Appy Pie.
Trous restants : UGC pour apps (un seul ajout), tests A/B de fiche store (rien de nouveau), kit presse d'app, Reddit, revenus : aucun des 25 nouveaux n'a de revenu sourcé (ceux ≥10 k$/mois prouvés restent rares côté indés).

## Ajouts du passage 10 (27/11/2026) : 27 acteurs, total 278
| Catégorie | Nouveaux acteurs | Lecture |
|---|---|---|
| UGC et créateurs pour apps | Influee (abonnement + 10 % de frais, 229 à 999 $/mois selon source ; App Store 3,88/5 sur 196 avis), The Social Cat (99 à 299 $/mois), Minisocial (2 500 $ pour 25 influenceurs), HourlyUGC, NanoSocial, Statusphere | catégorie la moins remplie jusqu'ici : 6 acteurs, tous orientés marques e-commerce, très peu spécifiques aux apps ; aucun revenu sourcé |
| Vidéos d'App Preview et screenshots | PreviewKit, StoreCut, StoreView (apps Mac/iOS, URL = fiche App Store), Launchmatic | outils d'indé à achats intégrés ; trou : aucun ne lie la vidéo à la fiche multilingue |
| Découverte et communautés d'indés | iOS Dev Weekly (newsletter, ~10 k$/mois estimation tierce non vérifiée), Hacking with Swift, Indie Hackers, Beta Family (testeurs), Mobbin (bibliothèque de captures d'apps) | canaux de distribution plus que concurrents : où publier le lancement d'Appolyn |
| Revenu d'indés | Gumroad (~21 M$ de revenu selon un titre Sacra, date non vérifiée), Buy Me a Coffee (5 % de frais, plan gratuit) | |
| Attribution / support / qualité | Airbridge (MMP), Helpshift (support in-app), Rollbar (gratuit 5 000 occurrences), Bitdrift (observabilité mobile) | |
| Localisation | POEditor, Smartling (entreprise, Capterra 3,4/5 sur 18 avis) | |
| Réseaux, ASO, générateurs IA | Mixpost (open source auto-hébergé), ASO World (vend avis et installs : à éviter côté règles des stores), Sleek (design d'écrans mobiles par IA, 20 109 $ de MRR selon TrustMRR, divergent : 15 091 $ selon ShipByData), Magically (mince, non vérifié) | Sleek est le seul ajout avec un revenu ≥10 k$/mois sourcé |

Lignes approfondies au passage 10 (15) : AppTweak, Superwall, RevenueCat, NewAppLander, ProfitWell, IndieBuddy, Outrank (~1 M$ d'ARR selon Indie Hackers, trackers tiers 1,4 à 3 M$), Baremetrics (~1,5 M$ Latka, contredit par d'autres sources), BetaTesting, SearchMan, Geeklab (~720 k$/an en 2023, Latka), Apps Finboard, AppConsent, Postback, Bugfender (~500 k$ d'ARR selon HackerNoon, ancien ; rachat par Guardsquare signalé le 10/11/2026, source unique à recouper).
Trous restants : tests A/B de fiche store et kit presse d'app (aucune nouveauté trouvée), Reddit, revenus ≥10 k$/mois prouvés.
