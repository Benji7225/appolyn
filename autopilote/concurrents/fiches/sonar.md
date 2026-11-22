# Sonar (trysonar.app) — fiche du 2026-11-22

Méthode : WebSearch (6 requêtes) et un WebFetch réussi (README du serveur MCP sur raw.githubusercontent.com/trysonar/mcp). Domaines bloqués (ENOTFOUND) : trysonar.app (site, /pricing), unpkg.com. G2, Capterra, Product Hunt, Reddit, IndieHackers : aucun avis ou fil sur le Sonar d'ASO trouvé (les résultats G2/Capterra concernent des produits homonymes : SonarQube, AssetSonar, etc., à ignorer). Les pages Sonar citées via WebSearch sont donc déclaratives et promotionnelles. La ligne Sonar de /home/user/appolyn/autopilote/concurrents/liste.csv a été relue et recoupée.

## Positionnement
- Plateforme d'App Store Optimization pour App Store et Google Play, accessible par trois portes : serveur MCP, CLI et API REST (npm @sonarapp/mcp ; README https://raw.githubusercontent.com/trysonar/mcp/HEAD/README.md ; WebSearch sur trysonar.app).
- Se décrit comme « focused ASO tool at $19/month flat », avec 10 apps, 2 500 mots-clés, tous pays, et API, CLI et « AI-agent skill » intégrés plutôt que des paliers à l'usage (https://trysonar.app/alternatives, extrait WebSearch, auto-déclaratif).
- Cible : indés et petites équipes (CSV, liste.csv) ; non confirmé par une page lue directement.
- Éditeur : le README MCP est sous licence MIT, © Peter Sutarik (raw.githubusercontent.com/trysonar/mcp). Contact hello@trysonar.app (même source). Société, siège, effectif : non trouvé.
- Concurrents nommés par ses pages : App Radar, AppTweak, Astro (app macOS à licence à vie), AppFigures, AppFollow, FoxData, MobileAction, ASOMobile, Sensor Tower, Asodesk (https://trysonar.app/alternatives/apptweak ; /vs/appfollow ; /vs/asomobile ; /vs/asodesk).
- Angle : alternative bon marché et « agent-ready » aux outils ASO à 69 €/mois et plus.
- Revenus : inconnu (voir ci-dessous TrustMRR).

## Fonctionnalités page par page
Le site n'a pas pu être lu. Ce qui suit vient du README MCP (55 outils), qui reflète l'API.
- Lectures sans état (10 outils) : recherche et fiche d'app, score ASO, extraction de mots-clés, avis, revenu estimé d'app, recherche de mots-clés, métriques de mots-clés, suggestions, top charts (README MCP).
- Espace de travail (14 lectures, plan Indie ou plus) : produits, apps suivies, vue d'ensemble, mots-clés suivis, classements, changements d'app, mots-clés découverts, mots-clés des concurrents, paysage concurrentiel, analyses d'avis, alertes et événements d'alerte (README MCP).
- Écritures (16 outils) : créer produits, suivre apps et concurrents, scanner et analyser les concurrents, suivre mots-clés (notes, étoiles), générer des insights d'avis (IA), définir des alertes (README MCP). Les deux outils IA (analyse concurrents, insights d'avis) exigent un plan payant, indisponibles pendant l'essai.
- Screenshot Studio (12 outils, Indie ou plus) : jeux de screenshots, ajout et édition, traductions, guide de mise en page, liste d'appareils, export ZIP local (stdio uniquement) (README MCP). Existence d'un éditeur visuel côté web : non trouvé.
- Outils Agency (3) : portefeuille, ventes d'app et engagement, ces deux derniers iOS seulement et nécessitant une connexion App Store Connect (README MCP).
- Outil gratuit « ASO score » : /tools/aso-score cité par le CSV ; non revérifié ici.
- Extension Chrome « Sonar ASO » : insights ASO affichés en naviguant sur les stores, version 0.1.0, mise à jour du 5 avril 2026 (https://chromewebstore.google.com/detail/sonar-aso/bhhmfcgliekblecbohnbmenfjnmcejpb).
- Localisation : seulement via les traductions de screenshots (README MCP). Paywalls, finance, lancement : non trouvé.

## Onboarding
- Mode gratuit sans clé ni inscription via MCP : 6 outils se partagent 30 requêtes/jour par IP, et les métriques de mots-clés sont limitées à 5 mots-clés/jour. À la limite, l'erreur explique comment s'inscrire (README MCP).
- Pas de clé pour Claude Code et claude.ai : `claude mcp add --transport http sonar https://trysonar.app/mcp`, connexion OAuth dans le navigateur (README MCP).
- Clé API `aso_...` créée sur trysonar.app/developers ; elle exige un abonnement (WebSearch sur le README du CLI). Crédits API prépayés : paquets dès 10 $ pour 1 000 crédits, 50 crédits offerts à l'inscription, sans abonnement (README MCP ; TechBloat indique aussi 50 crédits gratuits, https://www.techbloat.com/software/sonar/).
- CLI : `npm install -g @sonarapp/cli`, Node.js 20+, puis `sonar auth login` ; sortie JSON par défaut, exemple `sonar export rankings <app-id> --format csv` (extraits WebSearch, socket.dev/npm/package/@sonarapp/cli).
- Clients MCP documentés : Claude Desktop, Claude Code, Cursor, Cline, et tout client MCP ; plugins Grok Build et Cursor marketplace (README MCP). ChatGPT : endpoint /mcp/chatgpt, listing natif en attente de revue OpenAI (README MCP).
- Dépannage intégré au README (erreurs d'authentification, 403 selon le plan).
- Parcours d'inscription web et tunnel d'activation : non trouvé (site bloqué).

## Prix et paliers (divergences)
- Annoncé : 19 $/mois ou 149 $/an, sans compteur, API, CLI et MCP inclus sur tous les plans (https://trysonar.app/blog/asomobile-pricing.md, blog de Sonar, auto-promotionnel).
- Divergence prix annuel : Itechguides indique des offres payantes dès 290 $/an et un essai 7 jours (https://www.itechguides.com/products/sonar/). Probable confusion avec AppDrift (290 $/an dans le CSV), à vérifier.
- Divergence essai : le blog ASOMobile de Sonar dit 3 jours (« le plus court ») ; le blog AppTweak de Sonar dit 7 jours ; le README MCP dit qu'un essai existe sans durée (trysonar.app/blog/asomobile-pricing.md ; /blog/apptweak-pricing.md).
- Plans nommés dans le README : API Credits, Indie, Agency (Agency donne le portefeuille et les données App Store Connect). Prix des plans Indie et Agency : non trouvé (le $19 correspond vraisemblablement à Indie, non confirmé).
- Un ancien listing npm évoquait un « Agent Plan » à 9 $/mois, probablement obsolète (WebSearch, socket.dev).
- Offre lancement 15,75 $/mois sur un domaine miroir (fortune-insight.onrender.com), ignorée comme non fiable.
- Aucun plan gratuit d'abonnement ; outils gratuits dans le navigateur et crédits offerts (TechBloat).
- Comparaison : App Radar 69 €/mois, AppDrift Indie 29 $ (CSV), FoxData Starter 9,90 $ (CSV).

## Intégrations et connecteurs
- App Store Connect (réglages /settings/connections) pour ventes et engagement iOS, clé de rôle Admin requise pour l'engagement (README MCP).
- Smithery, npm, mcpservers.org (annuaires) (README MCP ; https://mcpservers.org/servers/trysonar/mcp).
- Google Play Console, Apple Search Ads, Slack, webhooks, Zapier : non trouvé.
- Alertes : ajout et lecture via API/MCP ; canaux de notification (e-mail, push) : non trouvé.

## SDK/API/MCP
- MCP : paquet npm @sonarapp/mcp, 55 outils couvrant toute l'API REST, stdio et endpoint hébergé https://trysonar.app/mcp (OAuth), clé Bearer `aso_...` pour les clients sans OAuth (README MCP). Anciennes versions npm : 8 outils ou moins (WebSearch, socket.dev, versions 0.3 à 0.8.1 visibles) : la gamme a grandi vite.
- CLI : @sonarapp/cli, binaire `sonar`, config ~/.config/sonar/config.json (SONAR_CONFIG_PATH), versions 0.2 à 0.7.1 visibles (socket.dev/npm/package/@sonarapp/cli).
- API REST : base https://api.trysonar.app (README MCP) ; le CLI cite https://trysonar.app par défaut : divergence interne. Documentation OpenAPI et limites de débit : non trouvé.
- Confidentialité : rien stocké sur disque par le paquet, journaux serveur gardés 90 jours, données d'espace de travail conservées jusqu'à suppression, pas de revente de données (README MCP).
- SDK pour apps (SDK mobile) : non applicable.

## Ce que les utilisateurs louent (sources)
- Aucun avis indépendant trouvé (G2, Capterra, Product Hunt, Reddit, IndieHackers : non trouvé pour le Sonar d'ASO).
- Seuls éloges : textes du fabricant (prix plat, API/CLI/MCP inclus, couverture iOS et Android) (https://trysonar.app/alternatives).
- Signal d'usage : 31 abonnements actifs et rang n°2272 sur TrustMRR, via extrait WebSearch (https://trustmrr.com/startup/sonar-aso-tool), donnée non vérifiée.

## Ce que les utilisateurs reprochent (sources)
- Aucun reproche d'utilisateur réel trouvé.
- Un concurrent (AppDrift) publie un comparatif qui lui est défavorable, partisan (https://appdrift.co/blog/appdrift-vs-sonar, cité par le CSV, non relu ici).
- Limites objectives, déduites du README : fonctions clés (espace de travail, écritures, Screenshot Studio) réservées à Indie ou plus ; outils IA indisponibles pendant l'essai ; export de screenshots impossible via l'endpoint hébergé ; ventes et engagement uniquement iOS.
- Faiblesse de preuve sociale : aucune fiche G2 ou Capterra dédiée, extension Chrome en 0.1.0.

## Stratégie SEO
- SEO programmatique massif de comparaisons : /vs/{asomobile, appfollow, asodesk, app-radar, sensor-tower, astro...} et /alternatives/{app-radar, apptweak...}, chaque page marquée « Updated 2026-07-29 » (https://trysonar.app/vs/asomobile ; /alternatives/apptweak ; /alternatives).
- Blog de prix des concurrents : /blog/{asomobile, app-radar, apptweak, mobileaction, sensor-tower}-pricing, /blog/{app-radar, asomobile, foxdata}-alternatives, /blog/aso-cost, avec versions .md publiques (https://trysonar.app/blog/asomobile-pricing.md ; /blog/app-radar-pricing.md ; /blog/apptweak-pricing.md ; /blog/mobileaction-pricing.md ; /blog/aso-cost.md).
- llms.txt : cité par le CSV, non revérifié. Les versions .md des pages le rendent lisible par les IA.
- Outils gratuits : /tools/aso-score (CSV), extension Chrome, mode gratuit MCP.
- Mots-clés visés : « {concurrent} pricing », « {concurrent} alternatives », « aso cost ».
- Distribution par annuaires MCP (Smithery, mcpservers.org, npm) (README MCP).
- Pages localisées : non trouvé ; mcpservers.org a des versions en id, tr, hi, de, es, fr de sa fiche (annuaire, pas Sonar).
- Backlinks, trafic : non trouvé.

## Changelog récent
- Page changelog publique : citée par le CSV, contenu non lu (site bloqué) ; la recherche n'a trouvé que des changelogs homonymes sans lien (sonar.software, sonar-clarity.canny.io : à ignorer).
- Indices datés : extension Chrome 0.1.0 le 5 avril 2026 ; pages comparatives actualisées le 29 juillet 2026 ; plusieurs versions npm de MCP (0.3 à 0.8.1) et CLI (0.2 à 0.7.1) ; ajout du Screenshot Studio (12 outils) et des alertes dans le MCP, dates non trouvées.
- Offre de lancement au 31 août (domaine miroir non fiable). Novembre 2026 : non trouvé.

## Ce qu'Appolyn peut copier / faire mieux / éviter
- Copier : MCP hébergé avec OAuth en une ligne (`claude mcp add --transport http`) ; mode gratuit sans clé (30 req/jour) comme porte d'entrée ; versions .md de toutes les pages et blog ; pages /vs/ et /alternatives/ programmatiques ; guide de mise en page de screenshots exposé aux agents ; prix plat affiché.
- Faire mieux : Sonar est centré ASO ; Appolyn couvre le cycle complet de l'indé (avis, lancement, finance, paywalls, site, press-kit) ; ajouter de la preuve sociale vérifiable ; une seule grille de prix (Sonar a 3 versions : 149 $/an, 290 $/an, 9 $) ; durée d'essai cohérente (3 ou 7 jours selon pages) ; export de screenshots possible aussi en hébergé.
- Éviter : comparatifs de prix concurrents rédigés comme du contenu neutre alors qu'ils sont promotionnels (crédibilité) ; fournir des chiffres jamais revalidés (dates « Updated » figées à juillet) ; deux URL de base d'API différentes.
- Surveiller : Sonar devient un tiers outillé pour agents (55 outils MCP, Screenshot Studio) : recoupe les sections keywords, screenshots, competitors, reviews, localization d'Appolyn ; envisager l'interopérabilité (MCP d'Appolyn) plutôt qu'une concurrence sur le prix.

## Sources
- https://raw.githubusercontent.com/trysonar/mcp/HEAD/README.md
- https://unpkg.com/@sonarapp/mcp@latest/README.md (cité par WebSearch, non lu : unpkg bloqué)
- https://socket.dev/npm/package/@sonarapp/mcp
- https://socket.dev/npm/package/@sonarapp/cli
- https://mcpservers.org/servers/trysonar/mcp
- https://trysonar.app/alternatives
- https://trysonar.app/alternatives/apptweak
- https://trysonar.app/alternatives/app-radar
- https://trysonar.app/vs/asomobile
- https://trysonar.app/vs/appfollow
- https://trysonar.app/vs/asodesk
- https://trysonar.app/blog/asomobile-pricing.md
- https://trysonar.app/blog/apptweak-pricing.md
- https://trysonar.app/blog/app-radar-pricing.md
- https://trysonar.app/blog/mobileaction-pricing.md
- https://trysonar.app/blog/aso-cost.md
- https://www.itechguides.com/products/sonar/
- https://www.techbloat.com/software/sonar/
- https://chromewebstore.google.com/detail/sonar-aso/bhhmfcgliekblecbohnbmenfjnmcejpb
- https://trustmrr.com/startup/sonar-aso-tool
- https://appdrift.co/blog/appdrift-vs-sonar (via CSV)
- /home/user/appolyn/autopilote/concurrents/liste.csv

## Revenu (note)
- TrustMRR (extrait WebSearch) affiche 7,1 M$ de MRR avec 31 abonnements actifs : incohérent pour un outil à 19 $/mois (31 × 19 $ serait environ 600 $), donnée rejetée. revenu_estime = inconnu.
