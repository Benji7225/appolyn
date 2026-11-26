# Vibecode (vibecodeapp.com) — fiche du 2026-11-26

Méthode : WebFetch sur www.vibecodeapp.com : ENOTFOUND (domaine à autoriser dans les paramètres réseau de la session, non réessayé). Quatre WebSearch (prix, avis, intégrations, changelog). Les pages officielles (docs, pricing, faqs) ne sont donc vues que par titre et extrait de recherche ; les avis viennent de tiers, parfois concurrents ou affiliés (signalés). La ligne du CSV (/home/user/appolyn/autopilote/concurrents/liste.csv, ligne Vibecode) a été reprise et recoupée. Comparaison : fiches/rork.md.

## Positionnement
- Générateur d'apps mobiles par IA, utilisable directement depuis un iPhone, prompt vers app puis publication (https://apps.apple.com/us/app/vibecode/id6742912146 ; https://www.vibecodeapp.com/docs/deploying/guide, via recherche).
- Techno : l'agent construit une app native Swift/SwiftUI (iPhone, iPad), une app React Native ou une app web, puis la publie sur l'App Store (extrait de recherche sur vibecodeapp.com/pricing et docs). Divergence : superappp.com parlait de React Native/web, pas de Swift natif (https://www.superappp.com/blog/vibecode-app-review-2026-pricing-real-reviews). Le CSV note un débat identique.
- Fondateurs : Riley Brown, créateur YouTube influent, est cofondateur (https://everydev.ai/developers/vibecode ; critique de divulgation : https://svgn.substack.com/p/the-transparency-problem-in-ai-creator).
- Levée : seed de 9 à 9,4 M$ en août 2025, menée par Seven Seven Six (https://benzatine.com/news-room/vibecode-secures-9-million-to-revolutionize-app-development-on-iphones). Ce n'est pas un revenu.
- Revenu : inconnu, aucun chiffre sourcé trouvé (TrustMRR, Latka, arr.club : non consultés dans cette session).
- Homonymes : plusieurs fiches App Store (id6742912146 « Vibecode - AI App Builder », id6754607882 « Vibecode apps IDE ») et d'autres produits « vibe code » (https://apps.apple.com/ca/app/vibecode/id6754607882). Ne pas confondre avec joinvibecode.lovable.app (SDK, sans lien établi).
- Concurrents directs : Rork (fiche rork.md), Bolt, Lovable, FlutterFlow, Replit (TechRepublic cite Vibecode et Replit ensemble).
- Différence avec Rork : Vibecode est mobile-first (on construit depuis le téléphone), Rork a un constructeur web plus app Max ; les deux visent Swift natif et la soumission App Store.

## Fonctionnalités page par page
Vu par titre et extrait uniquement.
- Constructeur par chat dans l'app iOS et sur le web : https://apps.apple.com/us/app/vibecode/id6742912146 ; https://www.vibecodeapp.com/docs/getting-started.
- Plans et crédits : https://www.vibecodeapp.com/docs/getting-started/plans-and-credits.md. Fonctions payantes citées : génération d'images et de sons, base de données et auth, soumission App Store, téléchargement du code, SSH, support prioritaire (absents du plan Free selon les docs).
- Déploiement : https://www.vibecodeapp.com/docs/deploying/guide. Le backend est déployé séparément ; l'app mobile est distribuée via TestFlight ou App Store.
- Monétisation : RevenueCat (apps natives) https://www.vibecodeapp.com/docs/monetization/revenuecat-setup ; Stripe, web uniquement https://www.vibecodeapp.com/docs/monetization/stripe-setup.md.
- Intégrations : https://www.vibecodeapp.com/docs/getting-started/integrations (contenu non lu). FAQ : https://www.vibecodeapp.com/docs/faqs.
- Index llms.txt des docs : https://www.vibecodeapp.com/docs/llms.txt (existence vue en résultat, contenu non lu).
- ASO approfondi, avis, analytics post-lancement, attribution, localisation : non trouvé.
- Ligne de fond : l'agent produit aussi des builds natifs iOS dans le cloud, facturés à la minute (voir Prix).

## Onboarding
- Installation de l'app iOS puis création d'un compte et premier prompt (fiche App Store). Étapes précises, carte requise, essai : non trouvé (je ne me suis pas inscrit).
- Plan Free avec crédits : montant divergent, un tiers liste 2,50 $ de crédits uniques (https://aitoolscoop.com/tool/vibecode/), non confirmé par l'éditeur.
- Docs avec llms.txt, pages .md par sujet, FAQ.
- Guide RevenueCat : prérequis plan payant, Apple Developer 99 $/an, compte RevenueCat, deux clés App Store Connect (API et In-App Purchase) ; on peut demander à l'IA de synchroniser les produits vers App Store Connect (https://www.vibecodeapp.com/docs/monetization/revenuecat-setup).
- Les contenus YouTube de Riley Brown servent de tutoriels d'entrée (critique Substack, voir plus bas).

## Du build à la publication App Store
Source : docs de déploiement, RevenueCat et pricing via recherche (https://www.vibecodeapp.com/docs/deploying/guide ; https://www.vibecodeapp.com/docs/getting-started/plans-and-credits.md).
1. Prérequis : compte Apple Developer 99 $/an et plan payant (la doc se contredit sur l'accès du plan Free à la soumission : divergence interne).
2. L'agent construit l'app (Swift/SwiftUI, React Native ou web).
3. Build natif iOS en release dans le cloud, facturé en crédits à la minute, y compris les builds en échec.
4. Distribution via TestFlight ou App Store ; le backend est déployé à part.
5. Pour vendre : Paid Apps Agreement, fiscalité et banque actifs dans App Store Connect avant que les achats fonctionnent (doc RevenueCat).
6. Rejets : un avis Trustpilot polonais cite des rejets répétés (https://pl.trustpilot.com/review/vibecodeapp.com) ; TechRepublic rapporte une pression d'Apple sur les apps de vibe coding dont les fonctions changent après la revue (https://www.techrepublic.com/article/news-apple-vibe-coding-app-store-rules/). Détail non lu.
7. Un audit automatisé de marlvel.ai évoque des restrictions « web uniquement » après une mise à jour (https://marlvel.ai/api/llm/apps/education/vibecode-ai-app-builder) : source auto-générée, peu fiable.
- Fiche App Store, captures, mots-clés, localisation générés par l'outil : non trouvé.

## Prix et paliers (divergences)
- Page prix officielle (octobre 2026 selon l'extrait) : Plus 20 $/mois, Pro 50 $/mois, Max 200 $/mois ; crédits inclus Plus 20 $, Pro 55 $ ; les crédits sont reportés chaque cycle et n'expirent pas ; « exactement le prix des fournisseurs d'IA, sans marge » (https://vibecodeapp.com/pricing ; https://www.vibecodeapp.com/docs/getting-started/plans-and-credits.md).
- Divergence : la fiche App Store affiche Plus 12,99 $/mois et Pro 39,99 $/mois dans une version, 19,99 $, 49,99 $ (Pro), 199,99 $ (Max) et un Pro hebdomadaire 9,99 $ dans une autre (https://apps.apple.com/us/app/vibecode/id6742912146 ; recherche Trustpilot). Prix web et prix in-app probablement différents, non confirmé.
- Divergence CSV : plan Pro annuel 479,99 $/an selon superappp.com (https://www.superappp.com/blog/vibecode-app-review-2026-pricing-real-reviews).
- Les docs disent que les paliers sont expérimentaux et peuvent changer.
- Coûts externes : Apple 99 $/an ; Google : non trouvé.
- Comparatifs de prix : https://vp0.com/blogs/vibecode-pricing-plans-2026 ; https://recurdash.com/subscription-pricing/vibecode.

## Intégrations et connecteurs
- RevenueCat pour les apps natives (guide officiel ci-dessus). Stripe : web seulement, pour les apps mobiles on demande à l'IA d'ajouter Stripe et on règle les clés dans l'onglet ENV (https://www.vibecodeapp.com/docs/faqs.md).
- App Store Connect, TestFlight : via le flux de déploiement.
- Supabase : aucun guide Vibecode trouvé (la FAQ le cite seulement dans une comparaison de prix). Base de données et auth : fonctions payantes intégrées.
- GitHub : non trouvé (téléchargement du code cité dans les plans).
- Adapty, Superwall, analytics, attribution, ASO : non trouvé.

## Ce que les utilisateurs louent (sources)
- App Store : environ 4,7/5 pour environ 3,2 k avis (CSV, https://apps.apple.com/us/app/vibecode/id6742912146), chiffres non relus dans cette session.
- Comparatif superappp.com : amusant pour bricoler ou faire une app simple depuis un téléphone, progression rapide (source avec intérêt commercial).
- Product Hunt : page reviews existe (https://www.producthunt.com/products/vibecode-app/reviews), contenu non lu.
- G2 et GetApp : fiches listées, peu d'avis (https://www.g2.com/products/vibecodeapp/reviews ; https://www.getapp.ca/software/2244272/vibecodeapp).
- Visibilité par un créateur influent (everydev.ai).

## Ce que les utilisateurs reprochent (sources)
- Consommation rapide de crédits quand on corrige les erreurs de l'IA, surtout builds natifs facturés même en échec (superappp.com ; docs plans).
- Trustpilot : support et remboursement jugés mauvais, outil qui échoue sur une vraie app, domaine personnalisé en erreur SSL, rejets App Store répétés (https://ca.trustpilot.com/review/vibecodeapp.com ; https://pl.trustpilot.com/review/vibecodeapp.com). Avis individuels non vérifiés.
- Transparence : un Substack reproche que les tutoriels du cofondateur se présentent comme neutres (https://svgn.substack.com/p/the-transparency-problem-in-ai-creator).
- Risque App Review : pression d'Apple sur les apps qui changent de fonction après revue (TechRepublic).
- Prix incohérents entre App Store et web (voir Prix).
- Reddit : aucun fil pertinent trouvé.

## Stratégie SEO
- Types de pages : accueil, /pricing, docs (/docs, /docs/getting-started, /deploying, /monetization, /faqs, /llms.txt) (URLs ci-dessus). Blog officiel : non trouvé.
- Outils gratuits : non trouvé. Pages programmatiques : non trouvé. Sitemap : non lu (domaine bloqué).
- Acquisition surtout par YouTube et créateurs (Riley Brown) plus App Store, non par un SEO éditorial visible.
- Écosystème tiers : comparatifs et reviews (superappp.com, vp0.com, recurdash.com, tinystartups.com, b12.io, aitoolscoop.com), fiches G2 et GetApp.
- Mots-clés visibles : vibecode app, vibecode pricing, vibecode review, vibe coding app builder, AI app builder iOS.
- Docs en .md et llms.txt, comme Rork et Superwall.

## Changelog récent
- Août 2025 : seed de 9 à 9,4 M$ (benzatine.com).
- Octobre 2026 : page prix Plus, Pro, Max (extrait de recherche).
- Page changelog officielle : non trouvée. Le résultat joinvibecode.lovable.app/developers/changelog n'est pas confirmé comme le même produit : écarté.
- Entrées 2026 sur les fonctions : non trouvé.

## Ce qu'Appolyn peut copier / faire mieux / éviter
Angle : intégrer un générateur d'apps (Vibecode, Rork) en amont d'Appolyn.
- Lien : Vibecode et Rork produisent l'app et la poussent vers TestFlight ; Appolyn commence après le build. Aucune offre ASO, avis, analytics ou attribution trouvée chez Vibecode : complémentarité.
- Copier : docs en .md et llms.txt ; guide RevenueCat pas à pas avec prérequis Apple clairs ; crédits qui n'expirent pas ; builds visibles et facturés de façon explicite.
- Faire mieux : un import « app générée par Vibecode ou Rork » (projet Xcode, GitHub, ou lien TestFlight/App Store Connect) qui enchaîne fiche App Store, mots-clés, captures, localisation, avis, paywall ; un contrôle avant soumission pour le risque 4.2/4.3 et le risque « fonction changée après revue » ; un prix unique et lisible.
- Éviter : prix différents entre l'App Store et le web ; builds ou erreurs d'IA facturés sans prévenir ; promesses de publication rapide sans parler de la revue Apple ; marketing d'influenceur sans divulgation.
- Surveiller : financé, fort sur YouTube, il peut ajouter listing et ASO ; pression d'Apple sur ce type d'apps. Option : connecteur ou partenariat (import depuis un projet généré) plutôt qu'une concurrence frontale.

## Domaines bloqués
- www.vibecodeapp.com (WebFetch ENOTFOUND). Toutes les pages Vibecode sont lues par extraits de recherche.

## Sources
- https://www.vibecodeapp.com/docs/getting-started/plans-and-credits.md
- https://vibecodeapp.com/pricing
- https://www.vibecodeapp.com/docs/deploying/guide
- https://www.vibecodeapp.com/docs/getting-started
- https://www.vibecodeapp.com/docs/getting-started/integrations
- https://www.vibecodeapp.com/docs/monetization/revenuecat-setup
- https://www.vibecodeapp.com/docs/monetization/stripe-setup.md
- https://www.vibecodeapp.com/docs/faqs.md
- https://www.vibecodeapp.com/docs/llms.txt
- https://apps.apple.com/us/app/vibecode/id6742912146
- https://apps.apple.com/ca/app/vibecode/id6754607882
- https://www.superappp.com/blog/vibecode-app-review-2026-pricing-real-reviews
- https://vp0.com/blogs/vibecode-pricing-plans-2026
- https://recurdash.com/subscription-pricing/vibecode
- https://aitoolscoop.com/tool/vibecode/
- https://ca.trustpilot.com/review/vibecodeapp.com
- https://pl.trustpilot.com/review/vibecodeapp.com
- https://www.producthunt.com/products/vibecode-app/reviews
- https://www.g2.com/products/vibecodeapp/reviews
- https://www.getapp.ca/software/2244272/vibecodeapp
- https://www.techrepublic.com/article/news-apple-vibe-coding-app-store-rules/
- https://svgn.substack.com/p/the-transparency-problem-in-ai-creator
- https://benzatine.com/news-room/vibecode-secures-9-million-to-revolutionize-app-development-on-iphones
- https://everydev.ai/developers/vibecode
- https://marlvel.ai/api/llm/apps/education/vibecode-ai-app-builder
- /home/user/appolyn/autopilote/concurrents/liste.csv (ligne Vibecode)
