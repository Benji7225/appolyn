# Section `reviews` (étudiée le 27/11/2026, passage 10)

## À quoi ça sert
Répondre vite aux avis App Store, en commençant par ceux qui font mal (1 à 3 étoiles).

## Ce que veut le dev en 30 secondes
« Qu'est-ce qui attend ma réponse, et puis-je le traiter en 5 minutes ? » Pas un outil d'analyse d'entreprise.

## Concurrents (fiches `concurrents/` + WebSearch du 27/11/2026 ; sites éditeurs en partie bloqués, extraits seulement)
- Appbot : brouillons IA avec validation humaine, règles par note/sujet/langue, export CSV, MCP ; dès 49 $/mois, IA réservée à Large (159 $).
- AppFollow : réponses IA, tags, agents, MCP, avis des concurrents (T3 2026) ; plan gratuit, Essential 179 $/mois.
- Appfigures : modèles de réponse partageables ; réponse dès le plan Connect ; 30 réponses par heure ; délai de 24 h imposé par Apple et Google sur les nouvelles réponses (https://help.appfigures.com/en/article/managing-app-reviews-with-appfigures-tm47zf/).
- App Radar : filtre « sans réponse » et export CSV documentés (https://intercom.help/app-radar/en/articles/3557767-reviews).
- AppTweak : modèles de réponse (https://help.apptweak.com/en/articles/6963798-templates-in-app-reviews-manager).
- Zoho Apptics : réponses automatiques et modèles.
Apple : la liste d'avis de l'API accepte jusqu'à 200 par page selon des messages du forum développeurs (second-hand, https://developer.apple.com/forums/thread/735804) ; version d'app et date de modification absentes de la réponse.

## Avant ce passage
50 avis, filtre par étoiles, réponse IA un par un, graphique de la note, analyse IA.

## Décisions
- Carte « En bref » : avis critiques sans réponse + ancienneté du plus vieux, taux de réponse (`lib/review-triage.ts`).
- Filtres Sans réponse / Répondus, recherche (sans accents), tri, export CSV (protégé contre l'injection de formule).
- Bouton « Rédiger les brouillons des avis critiques » : 10 brouillons max, rien n'est publié sans clic.
- 200 avis chargés au lieu de 50 (edge function `asc-proxy` : plafond relevé ; **à redéployer**, sans quoi l'ancien plafond de 50 reste).

## Reste
Pagination au-delà de 200 ; modèles de réponse enregistrés ; réponses automatiques par règle ; avis Google Play ; alerte « nouvel avis 1-2★ » via notifications ; MCP ; pages « alternative à Appbot/AppFollow ».
