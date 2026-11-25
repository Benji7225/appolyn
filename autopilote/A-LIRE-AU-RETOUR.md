# À lire au retour (une page)

> Tenu à jour par l'agent à chaque passage.

## Ce qui est prêt
- `keywords` : colonne Opportunité (popularité × (100 − difficulté)), triable.
- `localization` : publication groupée des langues (barre « Publier N langues »), contrôles de limites, brouillons conservés.
- `apps` (éditeur ASO) : bouton « Nettoyer le champ » sur les mots-clés (doublons, mots déjà indexés, pluriels, génériques).
- `screenshots` : « Publier une langue en entier » et correction manuelle des légendes traduites (non testé contre un vrai compte ASC).
- `analytics` : carte « En bref » (lecture en clair des chiffres) et export CSV.
- `finance` (Trésorerie) : prochain versement Apple (date, jours restants), mois fiscaux et revenu réel en attente ; calendrier à revérifier dans App Store Connect (estimation hors oct./nov. 2026). Nécessite les clés ASC et le numéro de fournisseur déjà listés.
- SEO : outils gratuits publics `/tools/app-store-metadata-checker` et `/tools/app-store-screenshot-sizes` (tailles officielles Apple + vérificateur de fichiers) + index `/tools` (aucune clé requise, dans le sitemap).

## Clés à fournir
Voir `CONNECTEURS-A-FOURNIR.md`.

## Migrations à appliquer avant de déployer
(aucune)

## Passer en production
1. Fusionner `autopilote` dans `main`.
2. Appliquer les migrations listées ci-dessus sur Supabase.
3. Renseigner les nouvelles variables d'environnement sur Vercel.
4. Déployer (`vercel deploy --prod`), puis vérifier chaque section sur appolyn.io.
