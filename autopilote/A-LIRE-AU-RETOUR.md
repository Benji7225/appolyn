# À lire au retour (une page)

> Tenu à jour par l'agent à chaque passage.

## Ce qui est prêt
(rien encore)

## Clés à fournir
Voir `CONNECTEURS-A-FOURNIR.md`.

## Migrations à appliquer avant de déployer
(aucune)

## Passer en production
1. Fusionner `autopilote` dans `main`.
2. Appliquer les migrations listées ci-dessus sur Supabase.
3. Renseigner les nouvelles variables d'environnement sur Vercel.
4. Déployer (`vercel deploy --prod`), puis vérifier chaque section sur appolyn.io.
