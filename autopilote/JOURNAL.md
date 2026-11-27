22/11/2026 · SEO · App Store Secondary Localizations: How to Get More Keyword Space Without Translating Your App · slug app-store-secondary-localizations-extra-keywords-without-translating · publié, vérifié en base (0 apostrophe doublée)
21/11/2026 · SEO · App Store Connect API Key (.p8): How to Create One, Sign a Token and Avoid the 401 · slug app-store-connect-api-key-p8-how-to-create-and-use-it · publié, mais 12 apostrophes affichées en double ('') : le dollar-quoting n'échappe pas les apostrophes, UPDATE interdit. LEÇON : dans $body$, écrire des apostrophes simples. Appolyn.io non vérifié.
# Journal

20/11/2026 · SEO · App Store Screenshot Sizes: What App Store Connect Actually Requires · slug app-store-screenshot-sizes-2026-what-app-store-connect-requires · publié (appolyn.io injoignable depuis la session, domaine à autoriser)

# Journal du pilote automatique Appolyn

> Une entrée par passage, la plus récente en haut. Format : date · section · fait · vérifié · reste.

27/11/2026 · pilote produit · passage 10 · `reviews`
- Recherche : Appbot, AppFollow, Appfigures, App Radar, AppTweak, Zoho Apptics (fiches + WebSearch ; sites éditeurs non relus). Détail dans `sections/reviews.md`.
- Fait : carte « En bref » (avis critiques sans réponse, ancienneté, taux de réponse), filtres Sans réponse/Répondus, recherche, tri, export CSV, brouillons IA en lot pour les avis 1-3★ (aucune publication automatique), 200 avis au lieu de 50. Aucune migration.
- Vérifié : typecheck, lint, build OK (variables factices) ; fonctions de tri testées à la main (stats, filtre sans accents, CSV). Non testé dans un navigateur ni avec un vrai compte App Store Connect.
- Reste : redéployer la fonction `asc-proxy` (plafond 200) ; pagination ; modèles de réponse ; alertes. Prochain passage : `competitors`.

27/11/2026 · veille · passage 10 · 15 lignes approfondies (AppTweak, Superwall, RevenueCat, NewAppLander, ProfitWell, IndieBuddy, Outrank, Baremetrics, BetaTesting, SearchMan, Geeklab, Apps Finboard, AppConsent, Postback, Bugfender ; aucune n'était marquée « à approfondir », les plus maigres prises) ; 27 acteurs ajoutés (total 278, CSV 13 colonnes validé, sans doublon nom/domaine) ; 3 fiches écrites (lokalise 126 lignes, buffer 124, branch 125 ; aucune fiche de plus de 60 jours) ; categories.md et idees.md mis à jour. Domaines bloqués (ENOTFOUND) : theswiftk.it.com, betatesting.com, geeklab.app, sfbx.io, bugfender.com, dev.to, producthunt.com, trustmrr.com ; les autres éditeurs n'ont pas été fetchés, tout vient d'extraits WebSearch. Points douteux : Bugfender racheté par Guardsquare (10/11/2026) d'après un agrégateur et DevOps Digest seulement ; revenus Outrank, Baremetrics, Gumroad (titre Sacra, date inconnue), iOS Dev Weekly (estimation tierce) divergents ou non vérifiés ; seul Sleek (TrustMRR 20 109 $ MRR, divergent) a un revenu ≥10 k$/mois sourcé parmi les nouveaux ; domaines Helpshift, Mobbin, Beta Family, Launchmatic non confirmés ; Statusphere, PreviewKit, StoreCut, StoreView pointent vers Capterra/App Store faute de domaine ; ASO World vend avis et installs (à éviter) ; sous-agents utilisés, faits non relus un par un. Reste : 278 sur 300 à 500 ; tests A/B de fiche store et kit presse d'app sans nouveauté trouvée.

26/11/2026 · SEO · App Store Rejection Guideline 4.3 (Spam): What Triggers It and How to Respond · slug app-store-guideline-4-3-spam-rejection-what-it-means-and-how-to-respond · publié, vérifié en base (0 apostrophe doublée) ; appolyn.io injoignable (proxy 403)

26/11/2026 · pilote produit · passage 9 · `paywalls`
- Recherche : Superwall, RevenueCat, Adapty, Qonversion, Purchasely, Apphud (fiches `concurrents/`, extraits WebSearch ; pas de relecture directe des sites éditeurs). Détail dans `sections/paywalls.md`.
- Fait : période 7/30/90 j/tout, comparaison avec la période précédente, carte « En bref » avec verdict statistique (test z, seuil 100 vues), revenu par vue (SDK `paywallPurchase(id, value:, currency:)` en option + ingestion qui garde le montant), export CSV, états vides et erreur. Aucune migration.
- Vérifié : typecheck, lint, build OK (variables factices) ; logique statistique testée à la main (8 % vs 5 % sur 1000 vues = 99 %). Non testé dans un navigateur ni avec un vrai SDK.
- Reste : voir `sections/paywalls.md`. Prochain passage : `reviews`.

26/11/2026 · veille · passage 9 · 15 lignes approfondies (Diawi, TelemetryDeck, Apple Ads, TestApp.io, TestFairy, Xcode Cloud, ASO.dev, Replit, Datadog RUM, presskit.gg, Hootsuite, Capawesome, Thunkable, Appalize, Appy Pie ; aucune n'était marquée « à approfondir », les plus maigres prises) ; 25 acteurs ajoutés (total 251, CSV 13 colonnes validé, sans doublon de nom) ; 3 fiches écrites (apphud 135 lignes, purchasely 126, vibecode 125 ; aucune fiche de plus de 60 jours) ; categories.md et idees.md mis à jour. Domaines bloqués (ENOTFOUND) : www.vibecodeapp.com, www.purchasely.com, apphud.com, telemetrydeck.com, diawi.com, aso.dev, testapp.io, presskit.gg, capawesome.io, ayrshare.com, alternativeto.net, starterstory.com, appgoblin.info, consentmanager.net, producthunt.com, tuist.dev, churnkey.co, maestro.dev, simplelocalize.io, segment.com. Tout vient d'extraits WebSearch. Points douteux : domaines searchman.com, rewo.app, adcider.com, dreamflow.com, buildfire.com, tweethunter.io déduits non confirmés ; prix divergents (Capawesome, Hootsuite, Xcode Cloud, Diawi, Churnkey) notés dans le CSV ; aucun revenu sourcé pour les nouveaux ; pas d'acteur « Stack » trouvé. Les sous-agents de recherche ont été utilisés ; leurs faits n'ont pas été relus un par un.
- Reste : 251 acteurs sur 300 à 500 ; UGC, tests A/B de fiche store, kit presse d'app et Reddit toujours maigres.

25/11/2026 · SEO · App Store Rejection Guideline 2.1 (App Completeness): What It Means and How to Fix It · slug app-store-guideline-2-1-app-completeness-rejection-how-to-fix-it · publié, vérifié en base (0 apostrophe doublée) ; appolyn.io injoignable (proxy 403)

25/11/2026 · pilote produit · passage 8 · SEO technique et outils gratuits
- Recherche : 7 guides concurrents de tailles (ScreenKit, Wishkit, ButterKit…) en désaccord ; tranché par la page officielle Apple (WebFetch). Détail dans `sections/seo-outils.md`.
- Fait : outil gratuit `/tools/app-store-screenshot-sizes` (tableau officiel iPhone/iPad + vérificateur de fichiers : taille, format, alpha PNG, max 10 par set, taille la plus proche), FAQ + JSON-LD, sitemap, index des outils. Aucune migration.
- Vérifié : typecheck, lint, build OK (variables factices) ; logique testée à la main (PNG RGBA/RGB, tailles portrait/paysage). Non testé dans un navigateur avec de vraies images.
- Reste : set « iPhone Duo » (avril 2027) à confirmer sur la page Apple ; vérificateur de fiche par URL App Store ; pages « vs » et llms.txt. Prochain passage : `paywalls`.

25/11/2026 · veille · passage 8 · 15 lignes approfondies (Lemon Squeezy, Buddy, Knock, Softr, CircleCI, Paddle, Heap, Pusher Beams, Apptica, Ignite, Fazier, Collabstr, Median, Canny, Featurebase ; aucune n'était marquée « à approfondir ») ; 24 acteurs ajoutés (total 226, CSV validé 13 colonnes, sans doublon nom/domaine) ; 4 fiches écrites (qonversion 158 lignes, bolt 153, flutterflow 142, mobileaction 136 ; aucune fiche de plus de 60 jours) ; categories.md et idees.md mis à jour. Domaines bloqués : bolt.new, documentation.qonversion.io, docs.flutterflow.io, www.mobileaction.co (ENOTFOUND) ; les autres éditeurs n'ont pas été fetchés, tout vient d'extraits WebSearch. Points douteux : Lemon Squeezy annoncé en arrêt (paiements stoppés le 31/03/2027) selon des sources secondaires dont des concurrents, annonce officielle non lue ; domaines replyargus.com et applyra.io non confirmés ; Smartmockups peut-être fermé ; prix divergents partout (notés dans le CSV) ; revenus quasi tous inconnus ; Reddit introuvable. À noter : MobileAction racheté par InMobi, annoncé le 7 mai 2026 (BusinessWire, selon la fiche) ; la ligne CSV le disait encore « non vérifié ». Reste : 226 sur 300 à 500.

24/11/2026 · SEO · How to Ask for App Store Ratings Without Annoying Users: A Practical Guide to requestReview · slug how-to-ask-for-app-store-ratings-without-getting-ignored-or-rejected · publié, vérifié en base (0 apostrophe doublée) ; appolyn.io non vérifié si code ci-dessus ≠ 200

## 24/11/2026 · pilote produit · passage 7 · `finance` (Trésorerie)
- Recherche : Appfigures, RevenueCat, Adapty, ChartMogul, Baremetrics, ProfitWell (fiches/CSV + WebSearch ; help.appfigures.com et adapty.io bloqués ENOTFOUND). Détail dans `sections/finance.md`.
- Fait : la page Trésorerie montre le prochain versement d'Apple (date, jours restants), les mois fiscaux à venir avec le revenu réel des rapports de ventes et le total en attente (`lib/apple-payouts.ts`, ancre confirmée oct./nov. 2026 + règle des 33 jours, le reste marqué « estimé »). Simulateur d'avance conservé en bas, marqué « en préparation ». Aucune migration.
- Vérifié : npm ci, typecheck, lint, build OK (variables factices) ; calendrier recoupé avec les dates Appfigures (03/12 et 31/12/2026). Non testé avec un vrai compte ASC.
- Reste : montant exact via Finance Reports, alerte avant versement, export CSV. Prochain passage : SEO technique et outils gratuits (passage 8), puis `paywalls`.

## 24/11/2026 · veille · passage 7
- 15 lignes approfondies (aucune n'était marquée « à approfondir », les plus maigres prises : Siteify, Tenjin, Courier, Peerlist Launchpad, TestFlight, Landico, Publer, MakeUGC, AppSkale, AppReply, MoEngage, Hypefury, Novu, ASA Agent, Fider) ; 25 acteurs ajoutés (total 202, CSV validé 13 colonnes) ; 3 fiches écrites (app-radar 119 lignes, appbot 106, applaunchpad 114). categories.md et idees.md mis à jour. Aucune fiche de plus de 60 jours.
- Domaines bloqués (ENOTFOUND) : appradar.com, appbot.co, theapplaunchpad.com, landico.app, help.peerlist.io, courier.com, asa-agent.com, g2.com, capterra.com, producthunt.com, alternativeto.net, trustpilot.com, apps.apple.com, featurebase.app. Tout vient de WebSearch (extraits).
- Points douteux : URL d'ASA Agent, AppReply, Storemaven, Apptopia, ASOScan, Astra non confirmées par visite ; revenus Storemaven et Apptopia = estimations tierces ; prix divergents partout (notés dans le CSV) ; aucun revenu pour les autres nouveaux ; correction du revenu AppLaunchpad (TrustMRR concernait un autre produit).
- Reste : 202 acteurs sur 300 à 500 ; landing pages d'apps et Reddit sans résultat ; revenus presque tous inconnus.

23/11/2026 · SEO · Why Your App Doesn't Show Up in App Store Search: A Diagnostic Checklist for Indie Developers · slug why-your-app-doesnt-show-up-in-app-store-search-a-diagnostic-checklist · publié, vérifié en base (0 apostrophe doublée) ; appolyn.io injoignable depuis la session

## 23/11/2026 · pilote produit · passage 6 · `analytics`
- Recherche : Appfigures, Adapty, RevenueCat, Postback, Aptabase/TelemetryDeck/DataFast (fiches et idees.md de la base concurrents ; pas de page web lue). Détail dans `sections/analytics.md`.
- Fait : carte « En bref » (phrases calculées sur les vrais chiffres : tendance, croisement revenu/téléchargements, meilleur jour, concentration pays, churn, conversion d'essai) et bouton d'export CSV (Excel FR). Aucune migration.
- Vérifié : npm ci, typecheck, lint (warnings préexistants), build OK (variables factices) ; fonctions testées à la main sur un exemple. Non testé dans le navigateur avec un vrai compte ASC.
- Reste : export produits/abonnements, net vs brut, alertes de chute. Prochain passage : `finance`.

## 23/11/2026 · veille · passage 6
- 15 lignes approfondies (Astro, Rork, Kochava, fastlane, Emergent, Replient, Aptabase, Appcircle, ASOMobile, Draftbit, Customer.io, Airship, Gummicube, UXCam, Countly) ; 24 acteurs ajoutés (total 177, CSV validé 13 colonnes) ; 3 fiches écrites (rork réécrite 158 lignes, lovable 146, appsflyer 127) ; categories.md et idees.md mis à jour. Aucune fiche de plus de 60 jours.
- Domaines bloqués (ENOTFOUND) : rork.com, lovable.dev, www.appsflyer.com ; les autres éditeurs n'ont pas été fetchés, tout vient de WebSearch (extraits, agrégateurs, blogs de concurrents signalés comme partiaux).
- Points douteux : un seul WebSearch par acteur pour les 24 nouveaux (à approfondir) ; prix divergents (Rork 3 grilles, Astro, Aptabase, Appcircle) ; Outrank 274 k$ de MRR non vérifié ; Gummicube rachat par Airship non confirmé ; domaines geeklab.app, asolytics.com non confirmés ; Rork : Paperline et « Rork Max Publishing » à reconfirmer ; revenus Emergent et Kochava = estimations tierces.
- Reste : Reddit toujours introuvable ; peu d'acteurs ≥10 k$/mois prouvés côté indés ; 177 acteurs sur 300 à 500 visés.

## 22/11/2026 · pilote produit · passage 5 · `screenshots`
- Recherche : Shotlingo, AppScreenshotStudio, AppLaunchpad, AppScreens, Screenshots.pro, Previewed, AppLaunchFlow (fiches/CSV de la base concurrents, pas de page lue directement). Détail dans `sections/screenshots.md`.
- Fait : « Publier une langue en entier » (tous les screenshots d'une langue en séquence, résultat par capture, version créée une fois) et correction manuelle de la légende traduite avec nouveau rendu, persistée. Aucune migration.
- Vérifié : npm ci, typecheck, lint (warnings préexistants), build OK (variables factices). Non testé contre App Store Connect réel.
- Reste : option « remplacer les captures existantes » (edge function), polices CJK embarquées, mockups/fonds. Prochain passage : `analytics`.

## 22/11/2026 · veille · passage 5
- 15 lignes approfondies (Braze, Amplitude, PostHog, Buffer, Typefully, Postiz, Later, Metricool, Carrd, Framer, TrustMRR, Billo, AppLaunchFlow, NewAppLander, PressKitHero) ; 20 acteurs ajoutés (total 153) ; 3 fiches écrites (postback, sonar, appdrift, 106 à 123 lignes) ; categories.md et idees.md mis à jour. Aucune fiche de plus de 60 jours (rork.md reste un stub de 8 lignes, à réécrire).
- Domaines bloqués (ENOTFOUND) : trysonar.app, postback.sh, appsprint.app, appdrift.co, trustmrr.com, g2.com, unpkg.com. Le reste vient de WebSearch, sites éditeurs non lus directement.
- Points douteux : revenus Postiz, Metricool, Typefully divergents entre sources ; ASA Agent (URL devinée) ; prix Lemon Squeezy et Rocket.new non confirmés ; Sonar sur TrustMRR affiche 7,1 M$ de MRR, jugé incohérent et rejeté.
- Reste : plus aucune ligne « à approfondir » ; 153 acteurs sur 300 à 500 visés ; Reddit toujours introuvable ; peu d'acteurs ≥10 k$/mois prouvés côté indés.

## 21/11/2026 · pilote produit · passage 4 · SEO technique et outils gratuits
- Recherche : AppLaunchFlow, AppScreenshotStudio, AppDrift, MobileAction, ASOMobile (WebSearch). Détail dans `sections/seo-outils.md`.
- Fait : premier outil gratuit public `/tools/app-store-metadata-checker` (limites Apple, mots-clés gaspillés, champ nettoyé copiable, 100 % navigateur, anglais), page index `/tools`, JSON-LD, sitemap, liens header/footer/landing. Aucune migration.
- Vérifié : typecheck, lint (warnings préexistants), build OK (variables factices) ; logique testée sur un exemple.
- Reste : tailles de screenshots, aperçu de fiche, pages « vs », llms.txt. Prochain passage : `screenshots`.

## 21/11/2026 · veille · passage 4
- 15 lignes approfondies (Natively, Vibecode, Bloxks, Adalo, Glide, Bubble, Apphud, Dub, Crashlytics, Sentry, OneSignal, Mixpanel, Bitrise, Codemagic, Expo EAS) ; 24 acteurs ajoutés (total 133) ; 3 fiches réécrites à plus de 100 lignes (revenuecat, superwall, apptweak). Aucune fiche de plus de 60 jours. categories.md et idees.md mis à jour.
- Domaines bloqués (ENOTFOUND) : natively.dev, vibecodeapp.com, bloxks.com, expo.dev, onesignal.com, bitrise.io, docs.codemagic.io, revenuecat.com, superwall.com, apptweak.com, appalize.com, blog.testapp.io, alternativeto.net, g2.com (selon les agents). Tout vient de WebSearch ; prix divergents signalés dans le CSV.
- Corrections : Natively est un convertisseur site → app, pas un générateur IA. Bloxks n'existe que dans des annuaires tiers. Revenus = estimations tierces citées.
- Reste : 15 lignes « à approfondir », rien de trouvé pour les outils de lancement Product Hunt, crash et UGC non enrichis, Reddit introuvable.

## 20/11/2026 · pilote produit · passage 3 · `apps`
- Recherche : fiches AppTweak, Astro, AppSprint, Appfigures (base concurrents) ; pas de recherche web neuve ce passage. Détail dans `sections/apps.md`.
- Fait : bouton « Nettoyer le champ » sur les mots-clés de l'éditeur (`cleanKeywords`, lib/aso.ts) : retire doublons, mots déjà dans titre/sous-titre, singulier/pluriel, génériques, avec raison et caractères récupérés. Aucune migration.
- Vérifié : typecheck, lint (warning préexistant), build OK (variables factices). Test unitaire à la main sur un exemple.
- Reste : suggestions pour remplir l'espace libéré, aperçu de fiche en recherche. Prochain passage : SEO technique et outils gratuits (4e passage), puis `screenshots`.

## 20/11/2026 · veille · passage 3
- 15 lignes approfondies (Similarweb App Intelligence, AppStoreSpy, AppDrift, AppsFlyer, Branch, Adjust, Singular, Crowdin, Phrase, Previewed, AppScreenshotStudio, Shotlingo, FlutterFlow, Lovable, Bolt) ; 27 acteurs ajoutés (total 109) ; 3 fiches écrites (adapty, appfollow, sensor-tower) ; categories.md et idees.md mis à jour. Aucune fiche de plus de 60 jours.
- Domaines bloqués (ENOTFOUND) : appdrift.co, crowdin.com, branch.io, docs.flutterflow.io, appscreenshotstudio.com, shotlingo.com, previewed.app, theapplaunchpad.com, foxdata.com, trysonar.app, appscreens.com, screenshots.pro, asodesk.com, linkrunner.io, appstack.tech, tolgee.io, localazy.com, chartmogul.com, datafa.st. Tout vient de WebSearch : prix divergents signalés dans le CSV.
- Revenus sourcés ajoutés : AppsFlyer, Lovable, Bolt, FlutterFlow (estimation Latka contredite par la levée), Arcads, Creatify, Unicorn Platform, BetaList, Taplio, CleverTap, Anything, Localazy, ChartMogul, DataFast, AppMagic. Écart à surveiller : AppMagic racheté en mai 2026 selon PR Newswire/Dealroom, 2025 dans une ancienne ligne.
- Reste : 30 lignes « à approfondir », Reddit toujours introuvable, fiches Qonversion, Purchasely, AppDrift, Shotlingo, AppScreenshotStudio ensuite.

## 19/11/2026 · SEO · App Store Custom Product Pages: A Practical Guide for Indie Developers
- slug `app-store-custom-product-pages-guide-for-indie-developers`, publié en base (35 blocs, 8 min). Source : page Apple developer.apple.com/app-store/custom-product-pages (limite 70, mots-clés, analytics, deep links iOS 18). Chiffres tiers (ex. 70 depuis oct. 2025) non repris sauf ceux d'Apple. appolyn.io injoignable depuis la session (ENOTFOUND), relu en base seulement.

## 19/11/2026 · pilote produit · passage 2 · `localization`
- Recherche : Dragoman, MetaSync, ASO.dev, StoreLocalizer, Auto Localize/MetaMate/CLI asc (WebSearch, déclaratif) ; AppSprint et Lokalise via fiches/CSV. Détail dans `sections/localization.md`.
- Fait : publication groupée (barre « Publier N langues », paquets de 6, résultat par langue, nouvelle version auto si besoin), contrôle des limites avant envoi, badge « modifiée », alerte de sortie de page, brouillons conservés au rechargement. Aucune migration.
- Vérifié : typecheck, lint, build OK (variables factices en ligne de commande). Non testé contre App Store Connect réel (pas de clé) ; l'edge function `publish-localizations` accepte déjà un tableau.
- Reste : aperçu avant/après, brouillons en base, export CSV. Prochain passage : `apps`.

## 19/11/2026 · veille · passage 2
- 15 lignes approfondies (Adapty, Qonversion, Purchasely, Glassfy, App Radar, AppFollow, Appbot, Appfigures, Sensor Tower, MobileAction, AppSprint, Postback, Lokalise, AppLaunchpad, Sonar) ; 24 acteurs ajoutés (total 82) ; 3 fiches écrites (appfigures, astro, appsprint) ; categories.md et idees.md mis à jour.
- Domaines bloqués (ENOTFOUND) : adapty.io, qonversion.io, trysonar.app, appsprint.app, postback.sh, theapplaunchpad.com, appbot.co, docs.lokalise.com, trustmrr.com, getlatka.com, g2.com, capterra.com, producthunt.com, billo.app, applaunchflow.com, trustpilot. Tout vient d'extraits WebSearch : prix divergents signalés dans le CSV, à reconfirmer.
- Revenus sourcés seulement : Adapty et Qonversion (Latka, estimations), Emergent (déclaré, non audité), AppLaunchpad (extrait TrustMRR non lu). Aucun fil Reddit trouvé.
- Prochain : fiches Adapty, Sensor Tower ; lignes « à approfondir » restantes ; plus d'UGC, kits presse.

## 18/11/2026 · SEO · App Store A/B Testing for Indie Developers (PPO)
- slug `app-store-product-page-optimization-ab-testing-guide-for-indie-developers`, publié en base (30 blocs, 9 min). Sources : pages Apple App Store Connect Help. Site injoignable depuis la session, relu en base seulement.
## 18/11/2026 · veille · passage 1
- 58 acteurs ajoutés (total 58), 4 fiches (revenuecat, superwall, apptweak, rork), categories.md et idees.md remplis.
- Domaines bloqués (ENOTFOUND) : www.revenuecat.com, superwall.com (WebFetch) ; tout le reste via WebSearch. Prix et revenus tiers, divergents, signalés comme tels.
- Limites : seules 4 lignes ont des faits détaillés ; les autres sont « à approfondir » (pas de source de revenu, donc `inconnu`). Natively, Vibecode, Bloxks à vérifier (existence non confirmée par recherche).
- Prochain : fiches Astro, AppSprint, Appfigures ; remplir catégories vides ; chercher TrustMRR pour les revenus.

## 18/11/2026 · passage 1 · `keywords`
- Recherche : Astro, AppTweak (sources dans `sections/keywords.md` ; site Astro injoignable depuis la session, noté).
- Fait : colonne **Opportunité** triable (`keywordOpportunity` / `opportunityLabel` dans `lib/aso.ts`, page keywords), dérivée
  des deux métriques réelles, formule affichée en infobulle. Aucune migration.
- Vérifié : typecheck, lint (warnings préexistants), build OK.
- Reste : voir `BACKLOG-AUTO.md`. Prochain passage : `localization`.

## 18/11/2026 · mise en place (session locale, pas un passage)
- Branche `autopilote` créée depuis `main` (b6486da, 09/09/2026). README de mission écrit.
- État constaté : production en panne depuis le 12/11 (Supabase en 402, stockage dépassé par le bucket `vision-content`,
  ménage automatique prévu fin novembre côté Benjamin). Le blog n'a plus publié depuis le 20/06/2026 (11 articles en ligne).
- Prochain passage : section `keywords` (début de la rotation).
