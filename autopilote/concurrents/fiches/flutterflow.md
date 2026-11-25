# FlutterFlow (flutterflow.io) — fiche du 2026-11-25

Méthode : WebSearch uniquement (14 requêtes : prix, changelog, AI Gen, intégrations, déploiement, onboarding, avis G2/Capterra/Trustpilot/Product Hunt, forum communauté, financement, alternatives, marketplace). WebFetch tenté une fois sur docs.flutterflow.io (page .md des prix) : échec ENOTFOUND, donc docs.flutterflow.io et très probablement flutterflow.io sont bloqués dans la session (à autoriser dans les paramètres réseau pour relire prix, docs et changelog). Tout vient donc de titres et d'extraits de résultats de recherche (résumés générés), parfois de blogs concurrents (Adalo, Lovable) ou d'agences partiales. La ligne du CSV (/home/user/appolyn/autopilote/concurrents/liste.csv, ligne FlutterFlow) a été réutilisée et recoupée ; les points corrigés ou nuancés sont signalés.

## Positionnement
- Builder visuel low-code pour apps mobiles, web et desktop basé sur Flutter, avec export de code et déploiement vers les stores ; désormais présenté aussi comme « AI app builder » (https://flutterflow.io/ai-gen ; https://www.g2.com/products/flutterflow/reviews).
- Cible : devs, freelances, agences, startups et non-développeurs qui veulent un MVP vite (https://www.producthunt.com/products/flutterflow/reviews ; CSV).
- Deux produits cohabitent dans la doc : l'ancien « Studio » (builder visuel) et un nouveau mode « describe your app » avec un agent IA (https://docs.flutterflow.io/ffx/coming-from-studio.md ; https://docs.flutterflow.io/ffx/first-app.md). Les relations exactes entre les deux (migration, parité) : non établies.
- Financement : Series A de 25,5 M$ en janvier 2024, menée par GV avec Gradient Ventures, Xoogler Ventures et Y Combinator (https://appmaster.io/news/flutterflow-secures-funding-for-its-low-code-mobile-app-dev-platform ; https://yespress.io/flutterflow). Valorisation de 170 M$ : citée par des résumés de TechCrunch mais Clay indique « non divulguée » et CB Insights n'en affiche pas (https://www.clay.com/dossier/flutterflow-funding ; https://www.cbinsights.com/company/flutterflow). Total levé : 27,13 M$ selon CB Insights, 28,63 M$ selon Caplight (https://www.cbinsights.com/company/flutterflow/financials ; https://www.caplight.com/company/flutterflow).
- Utilisateurs : chiffres divergents, 1,3 M, 2 M+ ou 2,7 M mensuels selon les sources (même recherche ; CSV cite 830 000 à 2,8 M). Aucun chiffre officiel vu.
- Revenu : 25,2 M$ en 2024 selon un site de profil (Latka d'après le CSV, https://getlatka.com/companies/flutterflow.io), aucune confirmation par la société. Le CSV note que Latka dit aussi « bootstrap », ce qui contredit la Series A : estimation à prendre avec prudence.

## Fonctionnalités page par page
Vu par extraits de docs et de blogs, pas par visite directe.
- Éditeur visuel (Studio) : glisser-déposer de widgets, styles, actions, état de page, lancement en test (https://docs.flutterflow.io/getting-started/build-your-first-app ; https://docs.flutterflow.io/page-elements).
- AI Gen : génération de pages et de composants à partir d'un prompt, plus un « AI Agent Builder » pour des fonctions IA dans l'app (https://flutterflow.io/ai-gen ; https://topai.tools/t/flutterflow-ai-gen). Des comparatifs soulignent que l'IA ne génère pas le backend (base, auth, logique serveur à configurer à part) (https://www.lowcode.agency/blog/appmaster-vs-fluterflow ; https://hostadvice.com/ai-app-builders/flutterflow-review/).
- Mode agent « describe your app » : prompt sur l'écran d'accueil, pièces jointes possibles (logo, capture, police), première version poussée automatiquement, test sur téléphone par QR code ; le plan gratuit n'autorise qu'une nouvelle app (https://docs.flutterflow.io/ffx/first-app.md ; https://docs.flutterflow.io/ffx/first-version.md).
- Limite d'export pour l'agent : la doc indique qu'on peut télécharger les builds compilés mais pas exporter le code source ni l'envoyer sur GitHub (résumé de recherche sur https://docs.flutterflow.io/concepts/ai-agent.md ; à vérifier).
- Agent Panel et déploiement d'agents IA, Supabase Edge Functions, test mode amélioré, « home » pour le code personnalisé : entrées de la version 7.0 (https://flutterflow.io/changelog/flutterflow-7-0).
- Claude Code et Codex utilisables dans l'app desktop FlutterFlow ou via plugins, avec CLI et MCP (https://flutterflow.io/changelog/native-ai-agent-claude-code-codex-plugins ; https://flutterflow.io/changelog/flutterflow-mcp ; https://docs.flutterflow.io/flutterflow-cli/claude-code).
- Marketplace : templates, composants et plugins vendus par des créateurs, avec règles de remboursement et de litiges (https://docs.flutterflow.io/marketplace.md).
- Releases : section dédiée avec test sur téléphone, envoi aux testeurs (TestFlight, test fermé Google Play), bouton « Deploy To App Store » (https://docs.flutterflow.io/ffx/iphone-test-build.md ; https://docs.flutterflow.io/ffx/send-to-testers ; https://docs.flutterflow.io/settings-and-integrations/app-settings/mobile-deployment/app-store-deployment).
- Hors périmètre ou non trouvé : analytics post-lancement, ASO, avis, kit presse, paywall natif (hors RevenueCat/Stripe).

## Onboarding
- Création de compte puis prompt libre ; première app générée sans configuration préalable, test par QR code (https://docs.flutterflow.io/ffx/first-app.md ; https://docs.flutterflow.io/ffx/first-version.md).
- Page de dépannage du démarrage (e-mail de vérification, premier build qui échoue) (https://docs.flutterflow.io/ffx/troubleshoot-getting-started.md) et guide « Start here » pour ceux qui viennent de Studio (https://docs.flutterflow.io/ffx/coming-from-studio.md).
- Tutoriel Studio « Build your first app » et Quickstart (https://docs.flutterflow.io/getting-started/build-your-first-app ; https://docs.flutterflow.io/quickstart.md).
- Plan gratuit utilisable sans carte : non confirmé par les sources vues.

## Prix et paliers (divergences)
- Plans actuels Free, Basic, Growth, Business, Enterprise ; les anciens Standard, Pro et Teams sont retirés (docs, via recherche : https://docs.flutterflow.io/accounts-billing/plan-pricing.md ; https://docs.flutterflow.io/accounts-billing/plan-comparison).
- Selon le tableau de comparaison officiel cité par la recherche : Free 0 $, Basic 39 $/mois, Growth 80 $/mois pour le premier siège puis 55 $, Business 150 $ le premier siège puis 85 $ pour les sièges 2 à 5, Enterprise sur devis (https://docs.flutterflow.io/accounts-billing/plan-comparison ; https://dupple.com/learn/flutterflow-pricing).
- Quotas d'IA : Free 5 requêtes à vie, Basic 50/mois, Growth 200/mois, Business 500/mois ; agents IA illimités à partir de Growth (même recherche).
- Export du code : téléchargement réservé au plan Basic, intégration GitHub au plan Growth selon un guide 2026 (https://www.devmatrix.us.com/flutterflow/migrate/flutterflow-code-export-limitations, tiers).
- Divergences : PricingSaaS prend les tarifs par siège pour le prix du plan (Growth 55 $, Business 85 $) (https://pricingsaas.com/companies/flutterflow) ; Basic à 29 $ ou 29,25 $ en annuel selon d'autres tiers (https://www.activepieces.com/blog/flutterflow-pricing-2026-what-every-plan-costs.md) ; remise annuelle d'environ 25 % selon certains, Costbench dit qu'aucune option annuelle n'est publiée (https://costbench.com/software/no-code/flutterflow/) ; Capterra affiche « à partir de 30 $ » (https://www.capterra.com/p/249489/FlutterFlow/pricing/). Remises régionales annoncées par la doc.
- Renommage Growth vers Pro et Business vers Max début novembre 2026 : source unique (tracker pricingsaas, CSV), non confirmé.

## Intégrations et connecteurs
- Backends : Firebase (prérequis pour Stripe et l'authentification), Supabase, API REST personnalisée (https://flutterflow.io/ai-gen ; https://docs.flutterflow.io/integrations.md).
- Paiements : Stripe (via Firebase Cloud Functions, projet Firebase en plan Blaze), RevenueCat (https://docs.flutterflow.io/integrations/payments/stripe.md ; https://docs.flutterflow.io/integrations/payments/revenuecat.md ; https://www.revenuecat.com/partners/technology/partner/flutterflow).
- GitHub et Codemagic : GitHub dans les réglages d'intégrations ; Codemagic seulement mentionné dans une PR de la doc comme fonction payante, source faible (https://docs.flutterflow.io/settings-and-integrations/integrations ; https://github.com/FlutterFlow/flutterflow-documentation/pull/456/files).
- Apple Developer / App Store Connect par clé API pour TestFlight et déploiement (https://docs.flutterflow.io/ffx/connect-app-store).
- Branch : pas de page dédiée trouvée, mais des fils communautaires sur son prix dans FlutterFlow (voir ligne Branch du CSV).
- Agents IA : MCP, CLI, plugins Claude Code et Codex (voir Fonctionnalités).

## SDK
- Pas de SDK d'analytics ou d'attribution propre trouvé. Le produit génère une app Flutter ; extensions via code personnalisé et packages pub.dev (https://docs.flutterflow.io/ffx/not-available, non lu ; CLI : https://pub.dev/documentation/flutterflow_cli/0.0.43/).
- Les paquets ajoutés peuvent demander une configuration manuelle de pubspec.yaml après export (https://www.devmatrix.us.com/flutterflow/migrate/flutterflow-code-export-limitations).

## Ce que les utilisateurs louent (sources)
- Rapidité de création de MVP et facilité d'usage, bon support selon G2 (https://www.g2.com/products/flutterflow/reviews, 4,5/5 sur 29 avis) ; Capterra 4,4/5 sur 84 avis (https://www.capterra.com/p/249489/FlutterFlow/reviews/).
- Product Hunt : « amazing tool for fast prototyping and for production ready code alike » ; adapté aux non-développeurs qui testent une idée (https://www.producthunt.com/products/flutterflow/reviews). Divergence sur la note : 4,4 sur 43 avis, 4,61 sur 215 ou 4,6 sur 86 selon la page.
- Export de code Flutter comme argument fort (CSV, https://www.g2.com/products/flutterflow/reviews).

## Ce qu'ils reprochent (sources)
- Lenteur sur les gros projets et temps de build : 3 avis G2 ; courbe d'apprentissage et besoin de savoir coder ; support (https://www.g2.com/products/flutterflow/reviews).
- Capterra : lag du navigateur au-delà de 12 écrans, « paywall de concurrence » jugé frustrant (https://www.capterra.com/p/249489/FlutterFlow/reviews/?page=2).
- Trustpilot : 3,5/5 sur 6 avis (page UK, domaine flutterflow.com) ; 18 avis sur la page canadienne, note non vue (CSV : 2,5/5). Une plainte : une semaine sans réponse du support (https://uk.trustpilot.com/review/www.flutterflow.com ; https://ca.trustpilot.com/review/flutterflow.io ; https://emergent.sh/learn/flutterflow-review).
- Product Hunt : support lent, bugs, « paywall creep », maintenabilité sur grosses apps (https://www.producthunt.com/products/flutterflow/reviews).
- Code exporté : désordonné quand le projet grossit, un widget de près de 1 900 lignes cité ; édition hors builder non resynchronisée (https://www.devmatrix.us.com/flutterflow/migrate/flutterflow-code-export-limitations ; https://axonbuild.com/blog/flutterflow-production-ready/).
- Fils du forum officiel : « FlutterFlow Needs Serious Improvement », « We Need to Talk About FlutterFlow », « Purported Limitations of FlutterFlow » (https://community.flutterflow.io/discussions/post/flutterflow-needs-serious-improvement-EVKPqGw6Z93rvbk ; https://community.flutterflow.io/discussions/post/we-need-to-talk-about-flutterflow-cilWG4qqzDmlGkb ; https://community.flutterflow.io/discussions/post/purported-limitations-of-flutterflow-zsOnaCo6bdHiEvy). Contenu non lu en détail.
- Coût par siège (Adalo, concurrent, https://www.adalo.com/posts/best-flutterflow-alternatives-2026/) ; l'IA ne fait pas le backend (hostadvice, lowcode.agency).
- Reddit : aucun fil direct remonté par la recherche.

## Stratégie SEO
- Documentation très indexée (docs.flutterflow.io, versions .md pour agents IA) et forum communautaire avec posts « What's new » datés (https://docs.flutterflow.io/ffx/whats-new.md ; https://community.flutterflow.io/c/whats-new-in-flutterflow/post/what-s-new-in-flutterflow---v6-6-56-april-21-2026-5bBnOnD0rlx9HPb).
- Changelog public lancé fin mars 2026, pages par entrée (/changelog/...) (https://flutterflow.io/flutterflow-changelog ; https://community.flutterflow.io/announcements/post/introducing-the-flutterflow-changelog-hNAlpdvPLdrb8hy), plus page « you ask we build » (https://flutterflow.io/you-ask-we-build).
- Pages produit : /ai-gen, marketplace dans la doc. Blog officiel, pages de comparaison propres, outils gratuits, pages programmatiques : non trouvés (la recherche ne remonte aucune page flutterflow.io de type /vs ou /blog).
- Le gros du contenu SEO est tiers : agences et blogs sur les prix et avis (lowcode.agency, nocode.mba, vp0.com, costbench.com, activepieces.com, emergent.sh, dupple.com), et des pages « FlutterFlow alternatives » de concurrents (Lovable, Adalo) (https://lovable.dev/guides/flutterflow-alternatives).
- Mots-clés visibles : flutterflow pricing (2026), flutterflow review, flutterflow alternatives, flutterflow templates, flutterflow export code, flutterflow production ready.

## Changelog récent
- 7.0 : Supabase Edge Functions, test mode et agents IA améliorés, accueil du code personnalisé (https://flutterflow.io/changelog/flutterflow-7-0). Date : non trouvée.
- Claude Code et Codex dans FlutterFlow desktop et plugins ; MCP FlutterFlow (https://flutterflow.io/changelog/native-ai-agent-claude-code-codex-plugins ; https://community.flutterflow.io/announcements/post/flutterflow-mcp-is-here-HfHP7rz3OQOhrR8). Dates : non trouvées.
- Docs « What's new » : 2 oct. 2026 onglet Backend, 4 oct. fils groupés par statut, 6 oct. aperçu par écran, 14 oct. icônes par app (https://docs.flutterflow.io/ffx/whats-new, via résumé de recherche).
- Avril 2026 : v6.6.56 du 21 avril, « Child Slots » pour composants composables ; mars 2026 : v6.5.43 du 5 mars, shaders et run local plus rapide (forum communauté). Autres entrées : passage à Flutter 3.47.1, remplacement de Firebase Dynamic Links, OAuth Supabase, widget AspectRatio, dates non confirmées (https://flutterflow.io/flutterflow-changelog).
- Divergence : schéma de versions 6.x sur le forum et 7.x dans le changelog officiel, correspondance non établie.
- Novembre 2026 : non trouvé.

## Ce qu'Appolyn peut copier / faire mieux / éviter
- Copier : changelog public avec une page par entrée ; versions .md de la documentation lisibles par agents ; flux « test sur téléphone » en un clic ; MCP et CLI pour les agents IA ; marketplace de templates comme levier de communauté.
- Faire mieux : FlutterFlow s'arrête au build et au déploiement, il n'a ni ASO, ni avis, ni analytics de revenus, ni kit presse. Appolyn peut être l'étape d'après (fiche store, localisation, avis, vrais chiffres) pour les apps sorties de FlutterFlow. Page de prix lisible avec un prix total à l'équipe (le tarif par siège brouille les comparatifs). Support réactif.
- Éviter : paywalls à plusieurs niveaux (export, GitHub, concurrence) ressentis comme « paywall creep » ; renommages de plans sans communication claire ; promesses d'IA qui ne couvrent pas le backend.
- Surveiller : intégration RevenueCat et Stripe (concurrence côté abonnements), et tout mouvement de FlutterFlow vers la publication et l'ASO. Les utilisateurs FlutterFlow sont une cible naturelle (CSV : section apps et site).

## Sources
- https://flutterflow.io/ai-gen
- https://flutterflow.io/flutterflow-changelog
- https://flutterflow.io/changelog/flutterflow-7-0
- https://flutterflow.io/changelog/native-ai-agent-claude-code-codex-plugins
- https://flutterflow.io/changelog/flutterflow-mcp
- https://flutterflow.io/you-ask-we-build
- https://docs.flutterflow.io/accounts-billing/plan-pricing.md
- https://docs.flutterflow.io/accounts-billing/plan-comparison
- https://docs.flutterflow.io/ffx/first-app.md
- https://docs.flutterflow.io/ffx/first-version.md
- https://docs.flutterflow.io/ffx/troubleshoot-getting-started.md
- https://docs.flutterflow.io/ffx/coming-from-studio.md
- https://docs.flutterflow.io/ffx/whats-new
- https://docs.flutterflow.io/ffx/iphone-test-build.md
- https://docs.flutterflow.io/ffx/send-to-testers
- https://docs.flutterflow.io/ffx/connect-app-store
- https://docs.flutterflow.io/settings-and-integrations/app-settings/mobile-deployment/app-store-deployment
- https://docs.flutterflow.io/integrations.md
- https://docs.flutterflow.io/integrations/payments/stripe.md
- https://docs.flutterflow.io/integrations/payments/revenuecat.md
- https://docs.flutterflow.io/settings-and-integrations/integrations
- https://docs.flutterflow.io/marketplace.md
- https://docs.flutterflow.io/concepts/ai-agent.md
- https://docs.flutterflow.io/flutterflow-cli/claude-code
- https://pub.dev/documentation/flutterflow_cli/0.0.43/
- https://community.flutterflow.io/c/whats-new-in-flutterflow/post/what-s-new-in-flutterflow---v6-6-56-april-21-2026-5bBnOnD0rlx9HPb
- https://community.flutterflow.io/announcements/post/flutterflow-mcp-is-here-HfHP7rz3OQOhrR8
- https://community.flutterflow.io/discussions/post/flutterflow-needs-serious-improvement-EVKPqGw6Z93rvbk
- https://community.flutterflow.io/discussions/post/we-need-to-talk-about-flutterflow-cilWG4qqzDmlGkb
- https://community.flutterflow.io/discussions/post/purported-limitations-of-flutterflow-zsOnaCo6bdHiEvy
- https://www.g2.com/products/flutterflow/reviews
- https://www.capterra.com/p/249489/FlutterFlow/reviews/
- https://www.capterra.com/p/249489/FlutterFlow/pricing/
- https://www.producthunt.com/products/flutterflow/reviews
- https://uk.trustpilot.com/review/www.flutterflow.com
- https://ca.trustpilot.com/review/flutterflow.io
- https://www.revenuecat.com/partners/technology/partner/flutterflow
- https://dupple.com/learn/flutterflow-pricing
- https://pricingsaas.com/companies/flutterflow
- https://www.activepieces.com/blog/flutterflow-pricing-2026-what-every-plan-costs.md
- https://costbench.com/software/no-code/flutterflow/
- https://www.devmatrix.us.com/flutterflow/migrate/flutterflow-code-export-limitations
- https://axonbuild.com/blog/flutterflow-production-ready/
- https://hostadvice.com/ai-app-builders/flutterflow-review/
- https://emergent.sh/learn/flutterflow-review
- https://www.lowcode.agency/blog/appmaster-vs-fluterflow
- https://www.adalo.com/posts/best-flutterflow-alternatives-2026/
- https://lovable.dev/guides/flutterflow-alternatives
- https://appmaster.io/news/flutterflow-secures-funding-for-its-low-code-mobile-app-dev-platform
- https://yespress.io/flutterflow
- https://www.cbinsights.com/company/flutterflow/financials
- https://www.clay.com/dossier/flutterflow-funding
- https://www.caplight.com/company/flutterflow
- https://getlatka.com/companies/flutterflow.io
- /home/user/appolyn/autopilote/concurrents/liste.csv (ligne FlutterFlow)
