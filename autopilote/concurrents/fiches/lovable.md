# Lovable (lovable.dev) — fiche du 2026-11-23

Méthode : WebSearch uniquement (une quinzaine de requêtes, dont plusieurs limitées à lovable.dev et docs.lovable.dev). WebFetch tenté sur lovable.dev : ENOTFOUND (domaine bloqué dans la session, à autoriser dans les paramètres réseau). Les pages de docs et du site ne sont vues que par titre et extrait de recherche. Les avis viennent de G2 et Trustpilot (extraits), les chiffres financiers de la presse. La ligne du CSV (/home/user/appolyn/autopilote/concurrents/liste.csv, ligne Lovable) a été réutilisée et recoupée.

## Positionnement
- Constructeur d'apps et de sites web full-stack par prompt, avec backend intégré (Cloud : base de données, authentification, stockage, fonctions edge, IA) (https://docs.lovable.dev/llms.txt, via recherche).
- Ce n'est pas un générateur d'apps mobiles : Lovable construit des apps web, ne génère pas de projets React Native et n'a pas de flux intégré de soumission aux stores (https://docs.lovable.dev/features/publish ; https://lovable.dev/faq/capabilities/mobile/publish-app-store-google-play).
- Cible (CSV, reformulé) : non-développeurs, fondateurs et équipes qui créent des MVP et prototypes ; la page guides se positionne « founder-focused » (https://lovable.dev/guides/best-ai-app-builders).
- Levée : Series C de 400 M$ à 13,3 Md$ de valorisation, annoncée le 12 août 2026, menée par Menlo Ventures avec le Scaleup Europe Fund (EQT) en co-lead ; Series B de 330 M$ à 6,6 Md$ en décembre 2025 (CapitalG, Menlo) (https://siliconangle.com/2026/08/12/vibe-coding-startup-lovable-doubles-valuation-13-3b-400m-raise/ ; https://tech.eu/2026/08/12/lovables-valuation-doubles-to-13bn-as-raises-400m/).
- ARR : 500 M$ en juin 2026 selon une déclaration à TechCrunch relayée par la presse ; 600 M$ est une projection ou estimation (https://aimagazine.com/news/lovable-europes-vibe-coding-platform-crosses-us600m-arr ; https://www.sacra.com/c/lovable). Le CSV cite 400 M$ en février 2026 (confirmé à TechCrunch le 11 mars 2026 selon un média) : cohérent avec la trajectoire, source primaire non relue. Le PDG Anton Osika dit avoir quadruplé l'ARR en douze mois (même source Sifted/presse).
- Valorisation « 14,5 Md$ au 29 octobre 2026 » : estimation d'un agrégateur, pas un tour (https://defillama.com/pre-ipo/lovable).
- Lien avec Appolyn : Lovable est un concurrent indirect côté « build » pour des apps web ; il n'a ni ASO, ni avis, ni publication native. Un indé qui veut une app mobile via Lovable doit passer par PWA ou Capacitor.

## Fonctionnalités page par page
Pages vues par titre et extrait.
- Modes Build et Plan ; Agent mode pour implémenter et vérifier directement dans le projet, par défaut pour les nouveaux utilisateurs depuis le 23 juillet 2025 (https://docs.lovable.dev/changelog ; https://lovable.dev/blog/agent).
- Éditeur et projets (https://docs.lovable.dev/features/projects/editor ; https://docs.lovable.dev/features/projects/overview).
- Remix de templates : copie du code et de la structure de base, pas des enregistrements, domaines ni état de publication (https://docs.lovable.dev/introduction/getting-started, via recherche).
- Galerie de templates : de 55 à 204 templates selon le snapshot et la langue (https://lovable.dev/en/templates).
- Cloud : base de données, auth, stockage, fonctions edge, IA intégrée (https://docs.lovable.dev/llms.txt). Lovable AI : connecteur IA sans clé d'API.
- Paiements intégrés : Paddle (marchand officiel, 5,0 % + 0,50 $ par transaction, sans abonnement) et Stripe (tarifs standard Stripe) ; paiements intégrés réservés aux plans payants ; sur Free, connecter son propre Stripe ; pas de Paddle et Stripe ensemble dans un projet (https://docs.lovable.dev/features/payments ; https://docs.lovable.dev/integrations/stripe).
- Domaines : achat dans l'éditeur via Stripe, avec DNS et SSL gérés automatiquement (https://docs.lovable.dev/changelog).
- Publication web sur un sous-domaine lovable.app gratuit sur tous les plans ; domaine personnalisé sur plan payant (https://docs.lovable.dev/features/publish).
- Intégrations catalogue : Shopify, Supabase, Contentful, Storyblok, Wix, Workday, scanners Aikido et Wiz (https://docs.lovable.dev/llms.txt, via recherche ; https://docs.lovable.dev/integrations/shopify).
- Serveur MCP Lovable en aperçu de recherche, connexion de chat à Telegram (18 mai 2026), WebMCP pour agents navigateur (https://docs.lovable.dev/integrations/lovable-mcp-server ; changelog).
- App Lovable iOS et Android : construire depuis un téléphone (iOS 15+, Android 9+), prompt vocal ou image, notification de build prêt ; pas de dossiers, besoin de connexion ; elle ne produit pas une app native pour utilisateurs finaux (https://docs.lovable.dev/integrations/lovable-mobile-app ; https://lovable.dev/blog/mobile-app).
- Pages « builder » : /build/mobile-app-builder, /build/app-builder (https://lovable.dev/build/mobile-app-builder).
- Scanner de sécurité intégré (voir Reproches).
- ASO, push, attribution, analytics produit : non trouvé.

## Onboarding
- Quick start : démarrer en mode Build ; conseil de la doc : première version sans login ni base, ajouter ensuite par prompt (https://docs.lovable.dev/introduction/getting-started).
- Guide « comment construire un vrai produit » (https://docs.lovable.dev/tips-tricks/from-idea-to-app).
- Vue d'ensemble du tableau de bord (https://docs.lovable.dev/introduction/dashboard-overview).
- Remix d'un template : compte Lovable requis, copie indépendante.
- Plan Free : crédits quotidiens, plafonnés à 30 par mois civil (https://lovable.dev/en/pricing, via recherche).
- Docs aussi servies en llms.txt et llms-full.txt (https://docs.lovable.dev/llms.txt).
- Essai d'un plan payant, démo commerciale : non trouvé.

## Prix et paliers (divergences)
- Pages officielles (extraits) : Free ; Pro 25 $/mois partagé entre utilisateurs illimités, 100 crédits mensuels et 5 crédits quotidiens ; Business plus cher pour les fonctions d'équipe ; Enterprise sur devis ; paliers de crédits de 100 à 10 000 par mois ; facturation annuelle avec deux mois offerts (https://lovable.dev/en/pricing ; https://docs.lovable.dev/introduction/subscription-plans).
- Business : environ 50 $/mois pour 100 crédits d'après des guides ; 42 $/mois d'après pricingsaas (CSV, https://pricingsaas.com/companies/lovable). Divergence non résolue.
- Pro : un guide dit 50 $ et un autre 200 crédits, jugés obsolètes ou faux par rapport à la page officielle.
- Un seul solde de crédits couvre construction, chat, hébergement, backend Cloud et IA des apps déployées (https://docs.lovable.dev/introduction/credits-and-usage).
- Paiements intégrés : Paddle 5,0 % + 0,50 $ (docs paiements).
- Tarification par siège supprimée sur les plans self-serve selon un blog tiers (CSV : https://metronome.com/blog/what-lovables-pricing-strategy-reveals-about-monetizing-ai-products).
- Pages prix en plusieurs langues et variantes avec paramètres : doublons à surveiller (/es/pricing, ?no_head=1).

## Intégrations et connecteurs
- Supabase : Lovable peut créer un projet Supabase pour une app sans backend, choix de l'organisation et de la région (changelog).
- Stripe et Paddle (voir Fonctionnalités) ; Shopify (https://docs.lovable.dev/integrations/shopify) ; Contentful, Storyblok, Wix, Workday ; connecteurs administrables par espace de travail (https://docs.lovable.dev/integrations/admin-controls).
- Connecteurs réservés à l'activation par espace : IA, Paddle, Shopify, Stripe, Supabase (même source).
- GitHub : mentionné dans les guides de sortie du code ; détail non lu ici.
- MCP : serveur Lovable (aperçu de recherche) ; Telegram.
- Apple, Google Play, RevenueCat, Adapty, Superwall : non trouvé comme intégration native.

## Export / déploiement mobile
- Deux voies officielles pour un app installable : PWA ajoutée à l'écran d'accueil, ou enveloppe Capacitor (ou Median.co) construite hors Lovable puis soumise aux stores (https://docs.lovable.dev/features/publish ; https://lovable.dev/faq/deployment/getting-started/publish-app-store).
- Google Play : un guide tiers évoque un Trusted Web Activity pour une PWA qualifiante (https://lovable.dev/guides/build-android-app-without-coding).
- Services tiers de conversion « Lovable vers App Store » (RapidNative, gigs Fiverr) : marketing, non vérifié (https://www.rapidnative.com/lovable-to-app-store).
- Le risque App Review (guideline 4.2, apps « wrapper ») pour ces enveloppes web est un point à tester ; source Apple non lue ici.

## Ce que les utilisateurs louent (sources)
- G2 : 4,6 sur 5 ; nombre d'avis divergent selon la page : 241, 282 ou 320 (https://www.g2.com/products/Lovable/reviews ; https://www.g2.com/sellers/lovable).
- Trustpilot : critiques mixtes, certains louent le prototypage rapide et les crédits quotidiens gratuits généreux (https://uk.trustpilot.com/review/lovable.dev?page=3).
- Presse et CSV : croissance record, rendu UI soigné, intégration Supabase, forte notoriété ; 2,3 M d'utilisateurs cités par un substack (CSV : catalaize.substack.com, non relu).
- Avis AWS Marketplace : des avis clients existent (https://aws.amazon.com/marketplace/reviews/reviews-list/prodview-wfslyrimbqsk2), contenu non lu.
- Product Hunt : non trouvé.

## Ce que les utilisateurs reprochent (sources)
- Crédits : crédits payés jamais ajoutés pendant un mois et support muet ; crédits perdus ; 30 crédits pour une retouche UI simple dans une boucle ; support qui répond « nous n'accordons pas de crédits pour les itérations multiples » (https://www.trustpilot.com/review/lovable.dev?page=1 ; https://uk.trustpilot.com/review/lovable.ai). Avis auto-déclarés, non vérifiés.
- Qualité : l'IA casse du code qui marchait et consomme des crédits à se corriger (Trustpilot) ; CSV : « fixer un bug en introduit trois ».
- Verrouillage : migration difficile signalée par certains avis (Trustpilot).
- Sécurité : CVE-2025-48757 (CVSS 9,3), politiques RLS insuffisantes dans des bases Supabase générées jusqu'au 15 avril 2025 ; 170+ apps exposées selon une source, « des centaines » selon une autre ; divulgation attribuée à Matt Palmer ; Lovable a répondu par un scanner, qui vérifierait que RLS est activé mais pas sa justesse selon un tiers (https://nvd.nist.gov/vuln/detail/CVE-2025-48757 ; https://www.superblocks.com/blog/lovable-rls-breach). Dates divergentes entre sources (29 ou 30 mai 2025). Le chiffre « 181 apps sur 183 » du CSV n'a pas été retrouvé : non vérifié.
- Trustpilot : sur une page, la note affiche « indisponible pour violation des directives » (extrait de recherche) ; état actuel à vérifier.
- Hors périmètre : pas de cycle de vie mobile (stores, ASO).

## Stratégie SEO
- Hub /guides : comparatifs et alternatives publiés par Lovable lui-même : « Best AI App Builders in 2026 » (daté mars 2026), « Lovable vs Replit vs Bubble », « Bolt vs Replit vs Lovable », « Lovable vs Bolt vs v0 », « Cursor vs Bolt vs Lovable », « 8 Best Glide Alternatives », « Best Vibe Coding Tools », « Best AI Website Builders » (https://lovable.dev/guides ; https://lovable.dev/guides/best-ai-app-builders ; https://lovable.dev/guides/bolt-vs-replit-vs-lovable).
- Pages « how to build X » : employee onboarding app, Android app sans code (https://lovable.dev/guides/how-to-build-employee-onboarding-app ; https://lovable.dev/guides/build-android-app-without-coding).
- Galerie de templates multilingue (en, es, id, ja, ko, hi, pt-br) avec URLs filtrées par audience du type /templates&forMarketers&forProduct-managers, probables quasi-doublons (inférence) (https://lovable.dev/en/templates).
- Pages /build/* (app-builder, mobile-app-builder) ; sitemaps de blog par langue (https://lovable.dev/en/sitemap/blog) ; blog avec « Product updates » (https://lovable.dev/blog/product-updates).
- Docs, changelog, FAQ séparés (docs.lovable.dev, lovable.dev/faq/*).
- Mots-clés visibles : AI app builder, vibe coding tools, Lovable alternatives, Lovable pricing, Lovable vs Bolt, mobile app builder, Glide alternatives.
- SEO des apps générées : rendu client React par défaut, onglet SEO et rendu serveur annoncés pour nouvelles apps (CSV : https://superblog.ai/blog/lovable-seo, sources vendeurs).
- Écosystème tiers de comparatifs : butternut.ai, kleap.co, lindo.ai (CSV). Template « SEO Writer » (https://lovable.dev/templates/apps/internal-tools/seo-writer).
- Outils gratuits SEO dédiés (hors templates) : non trouvé.

## Changelog récent
- 23 juillet 2025 : Agent mode par défaut (blog agent).
- 18 mai 2026 : serveur MCP en aperçu et connexion Telegram (changelog).
- 12 août 2026 : Series C 400 M$ à 13,3 Md$.
- 30 septembre 2026 : rotation du mot de passe de la base Cloud depuis le chat ; 13 octobre 2026 : sortie « agents navigateur » (tracker tiers, https://www.havoptic.com/tools/lovable ; à vérifier sur https://docs.lovable.dev/changelog).
- Novembre 2026 : non trouvé.
- Une revue (baeseokjae.github.io) datant Lovable 2.0 de février 2026 et citant 91 % d'erreurs en moins : contredit les posts officiels (2025) ; ignoré.

## Ce qu'Appolyn peut copier / faire mieux / éviter
- Copier : hub de comparatifs « X vs Y » rédigés par l'éditeur ; galerie de templates remixables (modèles d'apps, fiches de lancement) ; docs en llms.txt ; changelog public ; paiements intégrés en marchand officiel (Paddle) pour les apps ; connecteur MCP.
- Faire mieux : Lovable s'arrête à la PWA ou à l'enveloppe Capacitor ; Appolyn peut prendre le relais pour toute app mobile (import, listing App Store, ASO, avis, attribution) et ouvrir un parcours « j'ai généré mon app avec Lovable ou Rork » ; prix lisible sans crédits qui s'évaporent.
- Éviter : crédits consommés par les erreurs de l'IA ; support absent sur les paiements ; pages localisées ou filtrées en quasi-doublons ; claims de sécurité sans vérification de fond (RLS).
- Surveiller : un possible mode mobile natif de Lovable (aucune trace trouvée) ; Lovable est un vecteur d'acquisition pour Appolyn (apps web à passer sur mobile).

## Domaines bloqués
- lovable.dev (WebFetch ENOTFOUND). Docs et pages lues uniquement par extraits de recherche.

## Sources
- https://docs.lovable.dev/llms.txt
- https://docs.lovable.dev/introduction/subscription-plans
- https://docs.lovable.dev/introduction/credits-and-usage
- https://docs.lovable.dev/introduction/getting-started
- https://docs.lovable.dev/introduction/dashboard-overview
- https://docs.lovable.dev/features/publish
- https://docs.lovable.dev/features/payments
- https://docs.lovable.dev/features/projects/editor
- https://docs.lovable.dev/features/projects/overview
- https://docs.lovable.dev/integrations/stripe
- https://docs.lovable.dev/integrations/shopify
- https://docs.lovable.dev/integrations/admin-controls
- https://docs.lovable.dev/integrations/lovable-mcp-server
- https://docs.lovable.dev/integrations/lovable-mobile-app
- https://docs.lovable.dev/changelog
- https://docs.lovable.dev/tips-tricks/from-idea-to-app
- https://lovable.dev/en/pricing
- https://lovable.dev/faq/capabilities/mobile/publish-app-store-google-play
- https://lovable.dev/faq/deployment/getting-started/publish-app-store
- https://lovable.dev/blog/agent
- https://lovable.dev/blog/mobile-app
- https://lovable.dev/blog/product-updates
- https://lovable.dev/build/mobile-app-builder
- https://lovable.dev/guides
- https://lovable.dev/guides/best-ai-app-builders
- https://lovable.dev/guides/bolt-vs-replit-vs-lovable
- https://lovable.dev/guides/build-android-app-without-coding
- https://lovable.dev/en/templates
- https://www.g2.com/products/Lovable/reviews
- https://www.trustpilot.com/review/lovable.dev?page=1
- https://uk.trustpilot.com/review/lovable.dev?page=3
- https://siliconangle.com/2026/08/12/vibe-coding-startup-lovable-doubles-valuation-13-3b-400m-raise/
- https://tech.eu/2026/08/12/lovables-valuation-doubles-to-13bn-as-raises-400m/
- https://aimagazine.com/news/lovable-europes-vibe-coding-platform-crosses-us600m-arr
- https://www.sacra.com/c/lovable
- https://nvd.nist.gov/vuln/detail/CVE-2025-48757
- https://www.superblocks.com/blog/lovable-rls-breach
- https://www.havoptic.com/tools/lovable
- https://www.rapidnative.com/lovable-to-app-store
- /home/user/appolyn/autopilote/concurrents/liste.csv (ligne Lovable)
