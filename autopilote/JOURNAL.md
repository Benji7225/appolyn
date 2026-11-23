22/11/2026 · SEO · App Store Secondary Localizations: How to Get More Keyword Space Without Translating Your App · slug app-store-secondary-localizations-extra-keywords-without-translating · publié, vérifié en base (0 apostrophe doublée)
21/11/2026 · SEO · App Store Connect API Key (.p8): How to Create One, Sign a Token and Avoid the 401 · slug app-store-connect-api-key-p8-how-to-create-and-use-it · publié, mais 12 apostrophes affichées en double ('') : le dollar-quoting n'échappe pas les apostrophes, UPDATE interdit. LEÇON : dans $body$, écrire des apostrophes simples. Appolyn.io non vérifié.
# Journal

20/11/2026 · SEO · App Store Screenshot Sizes: What App Store Connect Actually Requires · slug app-store-screenshot-sizes-2026-what-app-store-connect-requires · publié (appolyn.io injoignable depuis la session, domaine à autoriser)

# Journal du pilote automatique Appolyn

> Une entrée par passage, la plus récente en haut. Format : date · section · fait · vérifié · reste.

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
