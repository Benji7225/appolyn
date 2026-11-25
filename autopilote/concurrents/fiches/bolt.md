# Bolt (bolt.new, StackBlitz) — fiche du 2026-11-25

Méthode : WebSearch uniquement (12 requêtes standard : fonctionnalités et Bolt Cloud, prix, changelog, intégrations, avis G2/Capterra, Reddit, Trustpilot, Product Hunt, templates/blog/SEO, Expo mobile, financement/ARR, comparatifs). WebFetch tenté une fois sur bolt.new/pricing : échec ENOTFOUND (bolt.new bloqué dans la session ; non testés : support.bolt.new, expo.dev, qui apparaissent pourtant dans les résultats). Tout vient de titres et d'extraits de résultats : aucune page lue en entier. Les résumés renvoyés par la recherche sont parfois incomplets ; ce qui n'y figure pas est noté « non trouvé ». Beaucoup de sources sont des blogs tiers, des comparatifs de concurrents ou des agrégateurs, donc partiaux. La ligne du CSV (/home/user/appolyn/autopilote/concurrents/liste.csv, ligne Bolt) a été recoupée ; ses corrections sont signalées plus bas.

## Positionnement
- Générateur d'apps web full-stack par prompt, exécuté dans le navigateur ; la fiche Product Hunt le résume « prompt, run, edit & deploy full-stack web apps » (https://www.producthunt.com/products/bolt-new/launches).
- La documentation officielle présente Bolt Cloud comme la couche infrastructure : bases de données, hébergement et domaines dans un même projet, sans compte externe à créer (https://support.bolt.new/cloud/bolt-cloud ; https://bolt.new/blog/scale-with-bolt-cloud).
- Sacra décrit un virage « du générateur vers la plateforme » (https://sacra.com/chat/h/af746789-9ee6-462c-af46-ae95ef5daa75/ ; https://sacra.com/chat/h/2425c99b-5f49-47ca-85e6-4e54c540b29a/). Source tierce.
- Cible : développeurs et non-développeurs qui veulent un prototype ou un MVP vite. Les comparatifs tiers disent que Bolt est le plus rapide pour démarrer mais que la sortie demande du travail avant la production (https://dev.to/jangwook_kim_e31e7291ad98/vibe-coding-tools-compared-2026-boltnew-vs-lovable-vs-replit-vs-v0-which-ai-app-builder-wins-3k0j).
- Éditeur : StackBlitz. Eric Simons (CEO) et Albert Pai (CTO) selon Tooljunction (https://www.tooljunction.io/ai-tools/bolt-new/company ; via la recherche, non revérifié).
- Revenus et financement (sources citées, estimations) : Sacra estime environ 40 M$ d'ARR en mars 2025, après 4 M$ en quatre semaines et 20 M$ en deux mois (https://sacra.com/c/bolt-new/ ; https://sacra.com/research/bolt-new). Série B de 105,5 M$ en janvier 2025 selon CB Insights (https://www.cbinsights.com/company/stackblitz/financials) ; Bloomberg parle de discussions à 700 M$ de valorisation (https://www.bloomberg.com/news/articles/2025-01-21/ai-speech-to-code-startup-stackblitz-is-in-talks-for-a-700-million-valuation). Sacra avance 135 M$ levés au total en décembre 2025.
- Divergence 2026 : Enterprise DNA cite environ 492 M$ d'ARR (Tech Insider) et un titre KuCoin cite 900 M$, mais précise qu'aucun chiffre 2026 n'est confirmé (https://enterprisedna.co/resources/ai-map/company/stackblitz). À ne pas retenir. Le CSV classe les 100 M$ d'ARR comme projection : cohérent.
- Cible mobile : Bolt dispose d'une intégration Expo (voir plus bas), mais le produit reste d'abord web ; pas de ciblage App Store natif.

## Fonctionnalités page par page
Pages vues par titre et extrait uniquement.
- Accueil / prompt : on décrit l'app, Bolt génère le projet. Pour du mobile, il faut écrire « mobile app » dès le premier prompt afin d'obtenir un projet Expo (https://support.bolt.new/building/intro-bolt ; https://support.bolt.new/get-started/intro-bolt.md).
- Bolt Cloud : bases de données sans limite de nombre, tables, authentification, stockage de fichiers, fonctions serveur et secrets ; Supabase et Netlify restent des alternatives (https://support.bolt.new/cloud/bolt-cloud ; https://support.bolt.new/integrations/supabase).
- Hébergement : publication sur une adresse bolt.host gratuite ; le plan gratuit met le site hors ligne si le quota mensuel de bande passante est atteint ; en Pro, un plafond de dépense à l'usage permet de rester en ligne (résumé de recherche sur les docs support.bolt.new).
- Éditeur : vue Code, édition visuelle (« visual edits ») ; ces deux fonctions et la base de données ne sont pas disponibles sur les projets mobiles (https://support.bolt.new/building/intro-bolt).
- Import Figma : un cadre Figma devient un projet fonctionnel (https://support.bolt.new/llms.txt ; lancement Product Hunt « Bolt x Figma », 13 mars 2025 : https://ship.producthunt.com/products/bolt-new).
- Templates : galerie de modèles, dont « Urban Journal », « Design Magazine » et « Architect Portfolio » ; SEO de base annoncé dans les modèles (https://bolt.new/resources/templates/urban-journal ; https://bolt.new/resources/templates/design-magazine ; https://bolt.new/resources/templates/architect-portfolio). Templates d'équipe (https://bolt.new/blog/team-templates-on-bolt).
- Galerie communautaire : vitrine de projets et soumission pour être mis en avant (https://bolt.new/gallery).
- Agents : v1 Agent (legacy) retiré à la création de projet depuis le 13 avril 2026 ; projets v1 migrés vers Claude Agent le 3 août 2026 (https://support.bolt.new/release-notes). Bolt Forge : agent sur modèles open source, cité avec GLM 5.3 Flash, Kimi, DeepSeek (https://aitoolly.com/ai-news/article/2026-09-20-bolt-forge-launches-on-product-hunt-boltnew-unveils-open-source-ai-agent-with-50x-usage-expansion, agrégateur mince).
- Aide : glossaire, FAQ, facturation, technologies supportées (https://support.bolt.new/concepts/glossary ; https://support.bolt.new/concepts/faq ; https://support.bolt.new/building/supported-technologies ; https://support.bolt.new/account-and-subscription/billing).
- Hors périmètre Appolyn, non trouvé : ASO, avis App Store, analytics d'app, paywalls natifs, kit presse.

## Onboarding
- Démarrage par un champ de prompt sur la page d'accueil, sans installation (https://bolt.new/get-started ; titre « Prototype to Production »).
- Choix de la base à la création : Bolt Database ou Supabase (https://support.bolt.new/integrations/supabase).
- Pour le mobile : starter Expo ou prompt « mobile app », puis test sur appareil réel avec Expo Go (https://www.oreilly.com/library/view/building-web-apps/9798341639751/ch11.html).
- Cas d'usage guidés par le blog : guide de prompts, MVP, tutoriels d'intégration Twilio, Notion, Gmail (https://bolt.new/blog?page=2 ; https://bolt.new/blog/tag/prompting?page=2).
- Carte bancaire demandée au départ, essai, étapes exactes : non trouvé.

## Prix et paliers (divergences)
Page officielle non lue (bolt.new/pricing bloqué) ; les chiffres viennent d'agrégateurs.
- Free : 1 M de tokens par mois, plafond de 300 000 par jour (https://dupple.com/learn/bolt-new-pricing ; https://www.withorb.com/pricing-atlas/bolt).
- Pro : 25 $/mois pour 10 M de tokens selon la plupart des sources ; joinsecret indique 20 $ (https://www.joinsecret.com/bolt-new/pricing). Dupple précise pas de plafond journalier et report sur deux mois.
- Teams : 30 $ par siège et par mois, 10 M de tokens par membre selon Dupple. Lovable affirme que son plan à 25 $ est partagé entre membres illimités (https://lovable.dev/en/guides/bolt-vs-replit-vs-lovable), source concurrente.
- Enterprise : sur devis, facturation à la consommation.
- Un palier « Lite » à 9 $/mois sur Bolt Forge est cité par une source : non confirmé.
- Remise annuelle : 10 % selon Jet Admin, jusqu'à 28 % selon Flexprice (https://www.jetadmin.io/blog/bolt-new-pricing-plans-tokens-and-real-costs-in-2026/amp/ ; https://flexprice.io/pricing-index/bolt-new). Divergence non résolue.
- Capterra : à partir de 25 $ par utilisateur et par mois, version gratuite (https://www.capterra.com/p/10123371/Bolt-new/).
- Bande passante d'hébergement limitée par plan (voir Fonctionnalités).

## Intégrations et connecteurs
- Docs officielles : Supabase (base, edge functions), Netlify (hébergement), Stripe (mode test, authentification d'abord, clé API), GitHub (sauvegarde et synchronisation), Figma, Expo (https://support.bolt.new/integrations/overview ; https://support.bolt.new/integrations/stripe ; https://support.bolt.new/integrations/supabase).
- Supabase liste Bolt dans son catalogue de partenaires (https://supabase.com/partners/catalog/bolt).
- Pica : billet « everything is connected » du 26 nov. 2025 (https://bolt.new/blog/pica-bolt-new-everything-is-connected) ; contenu non lu.
- SourceForge compte 18 intégrations (https://www.sourceforge.net/software/product/Bolt.new/integrations), liste non lue.
- App Store Connect, RevenueCat, StoreKit : non trouvé.

## SDK
- Pas de SDK d'app à proprement parler. Côté mobile : projets Expo / React Native générés (https://expo.dev/blog/bolt-expo-integration-announcement).
- Limite : l'exécution dans WebContainers ne permet pas Xcode ni la chaîne EAS ; il faut exporter le code puis passer par Expo Application Services pour construire, signer et soumettre (résumé de recherche issu de https://vp0.com/blogs/bolt-new-mobile-app et d'autres guides tiers).
- Lancement Product Hunt « bolt expo, from idea to app store » (https://www.producthunt.com/products/bolt-new/launches/bolt-expo ; https://producthunt.com/posts/bolt-expo-from-idea-to-app-store), daté du 13 février 2025 par la recherche.
- Expo publie « real app store apps using AI and Expo » (https://expo.dev/blog/real-app-store-apps-using-ai-and-expo).

## Ce que les utilisateurs louent (sources)
- Facilité de prise en main (avis G2 résumés : https://www.g2.com/products/bolt-new/reviews).
- Vitesse de prototypage (https://dev.to/jangwook_kim_e31e7291ad98/vibe-coding-tools-compared-2026-boltnew-vs-lovable-vs-replit-vs-v0-which-ai-app-builder-wins-3k0j).
- Product Hunt : 4,4 sur 44 avis (https://producthunt.com/products/bolt-new/reviews).
- Lancement Product Hunt d'octobre 2024, Launch of the Day et de la semaine selon la recherche (https://www.producthunt.com/products/bolt-new/awards). Une page communautaire dit « runner up » : divergence.
- Reddit : aucun fil direct retrouvé.

## Ce qu'ils reprochent (sources)
- Trustpilot : 1,5 sur 5 pour 183 avis sur la page US (https://www.trustpilot.com/review/Bolt.new) ; un blog cite 1,4 pour 197 avis, non vérifié. Divergence de comptage selon pages et dates (https://uk.trustpilot.com/review/bolt.new).
- Tokens consommés à réparer ses propres erreurs ; support jugé insuffisant sur la facturation ; sites hors ligne pendant des tickets sans réponse (https://www.trustpilot.com/review/Bolt.new ; https://ie.trustpilot.com/review/bolt.new?page=5). Trustpilot note que l'entreprise n'invite pas ses clients à laisser un avis, donc l'échantillon est biaisé.
- Product Hunt : un avis estime environ 50 % des tokens perdus en corrections d'erreurs ; un autre cite plus de 5 M de tokens pour un calendrier simple (https://www.producthunt.com/@justin_aimhigh/reviews ; https://www.producthunt.com/@jamie_ismaeil/reviews).
- Tokens : synchronisation de tout le système de fichiers à chaque prompt, 500 000 à 1 M de tokens par prompt selon des utilisateurs de r/boltnewbuilders cités par un blog, estimation non vérifiée (https://preuve.ai/blog/bolt-new-review).
- G2 : dépendances qui consomment des crédits, tarification coûteuse pour affiner, code à ajuster à la main sur les projets complexes (https://www.g2.com/survey_responses/11209025). Notes divergentes : 4,2 sur 43, 3,1 sur 6, 4,3 sur 86 selon la page (https://www.g2.com/products/bolt-new ; https://www.g2.com/compare/bolt-new-vs-lovable).
- Hacker News : 10 M de tokens perdus sur changements non autorisés, cas isolé et contesté (déjà noté dans le CSV).
- Fiabilité qui baisse quand l'app grandit (résumé Product Hunt, https://producthunt.com/products/bolt-new/reviews).

## Stratégie SEO
- Types de pages : blog avec catégories Product, Tutorials & Tips et tags (https://bolt.new/blog/category/product ; https://bolt.new/blog?page=2), pages de templates (« About this template »), galerie, aide en markdown avec llms.txt (https://support.bolt.new/llms.txt), pages de release notes.
- Pages programmatiques : une page par template sous /resources/templates/<slug> (exemples ci-dessus). Volume total : non trouvé.
- Outils gratuits : aucun outil type calculateur trouvé ; le produit lui-même, avec offre gratuite, sert d'aimant.
- Sujets de blog : meilleurs templates (24 juil. 2025, https://bolt.new/blog/top-5-bolt-new-templates-to-jumpstart-your-next-project), prompting, intégrations, comparaison Bolt vs WordPress avec coût des plugins SEO, guide MVP.
- Mots-clés visibles : bolt.new templates, bolt.new pricing, bolt.new alternatives, bolt vs lovable, bolt new mobile app. Forte couverture tierce : vp0.com, softr.io, zite.com, activepieces.com, nocode.mba, lovable.dev (guides « bolt vs replit vs lovable » déclinés en 10 langues).
- La marque domine les requêtes de prix : au moins une quinzaine de pages tierces sur « Bolt pricing » dans la recherche de prix.
- Position face à nos mots-clés : « app store » et ASO : non trouvé.

## Changelog récent
- 13 avril 2026 : v1 Agent retiré à la création ; 3 août 2026 : migration vers Claude Agent (https://support.bolt.new/release-notes).
- Blog produit : file d'attente de prompts, dictée, Bolt Forge avec usage supplémentaire jusqu'au 14 octobre 2026 (https://bolt.new/blog/category/product).
- Bolt Forge : Product Hunt le 19 sept. 2026, 238 votes, n°1 du jour selon un agrégateur (https://aitoolly.com/...), à confirmer.
- 12 oct. 2026 : fonctions mobiles dont une carte d'aperçu dans le chat selon un tracker tiers (https://www.havoptic.com/r/bolt-2026-10-12).
- Novembre 2026 : non trouvé. Attention : BoltAI et bolt.diy sont d'autres produits.

## Ce qu'Appolyn peut copier / faire mieux / éviter
- Copier : page de templates par cas d'usage avec une URL par modèle ; galerie communautaire ; llms.txt et docs en .md lisibles par les IA ; guides de prompts.
- Copier : plafond de dépense à l'usage plutôt qu'une coupure sèche.
- Faire mieux : Bolt s'arrête au code ; Appolyn commence après le build (fiche, avis, analytics, lancement). Un parcours « tu as généré ton app avec Bolt/Expo, voici la suite » est un angle de contenu.
- Faire mieux : afficher clairement ce que coûte chaque action (tokens opaques = première plainte).
- Faire mieux : support humain joignable sur les questions de facturation.
- Éviter : facturation en tokens opaque ; prix divergents entre pages ; promesse « idea to App Store » sans expliquer qu'il faut EAS pour construire et soumettre.
- Surveiller : Bolt Cloud et Expo font monter la concurrence indirecte sur les apps indés ; ses utilisateurs sont des clients potentiels d'Appolyn.

## Sources
- https://support.bolt.new/cloud/bolt-cloud
- https://support.bolt.new/building/intro-bolt
- https://support.bolt.new/get-started/intro-bolt.md
- https://support.bolt.new/integrations/overview
- https://support.bolt.new/integrations/stripe
- https://support.bolt.new/integrations/supabase
- https://support.bolt.new/release-notes
- https://support.bolt.new/llms.txt
- https://support.bolt.new/concepts/faq
- https://support.bolt.new/concepts/glossary
- https://support.bolt.new/building/supported-technologies
- https://support.bolt.new/account-and-subscription/billing
- https://bolt.new/blog/scale-with-bolt-cloud
- https://bolt.new/blog/category/product
- https://bolt.new/blog/team-templates-on-bolt
- https://bolt.new/blog/top-5-bolt-new-templates-to-jumpstart-your-next-project
- https://bolt.new/blog/pica-bolt-new-everything-is-connected
- https://bolt.new/gallery
- https://bolt.new/get-started
- https://bolt.new/resources/templates/urban-journal
- https://www.trustpilot.com/review/Bolt.new
- https://uk.trustpilot.com/review/bolt.new
- https://ie.trustpilot.com/review/bolt.new?page=5
- https://www.g2.com/products/bolt-new
- https://www.g2.com/survey_responses/11209025
- https://www.g2.com/compare/bolt-new-vs-lovable
- https://www.capterra.com/p/10123371/Bolt-new/
- https://producthunt.com/products/bolt-new/reviews
- https://www.producthunt.com/products/bolt-new/launches
- https://www.producthunt.com/products/bolt-new/awards
- https://www.producthunt.com/products/bolt-new/launches/bolt-expo
- https://ship.producthunt.com/products/bolt-new
- https://expo.dev/blog/bolt-expo-integration-announcement
- https://expo.dev/blog/real-app-store-apps-using-ai-and-expo
- https://vp0.com/blogs/bolt-new-mobile-app
- https://www.oreilly.com/library/view/building-web-apps/9798341639751/ch11.html
- https://sacra.com/c/bolt-new/
- https://sacra.com/research/bolt-new
- https://www.cbinsights.com/company/stackblitz/financials
- https://www.bloomberg.com/news/articles/2025-01-21/ai-speech-to-code-startup-stackblitz-is-in-talks-for-a-700-million-valuation
- https://enterprisedna.co/resources/ai-map/company/stackblitz
- https://www.tooljunction.io/ai-tools/bolt-new/company
- https://dupple.com/learn/bolt-new-pricing
- https://www.withorb.com/pricing-atlas/bolt
- https://www.joinsecret.com/bolt-new/pricing
- https://www.jetadmin.io/blog/bolt-new-pricing-plans-tokens-and-real-costs-in-2026/amp/
- https://flexprice.io/pricing-index/bolt-new
- https://preuve.ai/blog/bolt-new-review
- https://www.havoptic.com/r/bolt-2026-10-12
- https://lovable.dev/en/guides/bolt-vs-replit-vs-lovable
- https://dev.to/jangwook_kim_e31e7291ad98/vibe-coding-tools-compared-2026-boltnew-vs-lovable-vs-replit-vs-v0-which-ai-app-builder-wins-3k0j
- https://aitoolly.com/ai-news/article/2026-09-20-bolt-forge-launches-on-product-hunt-boltnew-unveils-open-source-ai-agent-with-50x-usage-expansion
- /home/user/appolyn/autopilote/concurrents/liste.csv (ligne Bolt)
