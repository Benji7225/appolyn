# Journal du pilote automatique Appolyn

> Une entrée par passage, la plus récente en haut. Format : date · section · fait · vérifié · reste.

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
