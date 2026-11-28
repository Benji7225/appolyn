# Backlog du pilote automatique

> Tenu par l'agent. Une ligne par idée : section · amélioration · pourquoi (concurrent ou besoin) · priorité.
> Les anciens fichiers `BACKLOG.md`, `WISHLIST.md` et `ROADMAP.md` à la racine contiennent les demandes de Benjamin de
> juin à septembre 2026 : les reprendre ici au fil des passages, en priorité.

- keywords · export CSV des mots-clés suivis · standard chez les outils ASO · moyenne
- keywords · tableau lisible sur mobile (grille à colonnes fixes) · usage téléphone · haute
- keywords · actualisation quotidienne serveur (cron) du rang · sinon l'historique n'avance que si la page est ouverte · haute
- keywords · volume Apple officiel via Search Ads (connecteur) · AppTweak/Astro l'ont · haute (clé requise)
- localization · aperçu avant/après par langue avant publication · Dragoman, MetaSync · haute
- localization · brouillons sauvegardés en base (migration à écrire) · aujourd'hui perdus si on ferme l'onglet · haute
- localization · export/import CSV des textes · Dragoman · moyenne
- localization · détection de mots-clés dupliqués titre/sous-titre/mots-clés · bonne pratique ASO · moyenne
- apps · suggérer des mots-clés pour remplir l'espace libéré par « Nettoyer le champ » (depuis keywords) · AppTweak/Astro · haute
- apps · liste de mots génériques par langue (aujourd'hui anglais seulement) · moyenne
- apps · aperçu de la fiche comme dans les résultats de recherche · moyenne
- SEO · (fait 25/11) outil tailles de screenshots · confirmer le set iPhone Duo (avril 2027) sur la page Apple puis l'ajouter · moyenne
- SEO · vérificateur de fiche par URL App Store (iTunes API) · AppDrift ASO audit · haute
- SEO · pages « Appolyn vs X » + llms.txt · Sonar, Superwall · moyenne
- screenshots · option « remplacer » dans l'edge function upload-screenshot (supprimer les captures du set avant envoi) · l'envoi s'ajoute aujourd'hui, limite Apple 10 par taille · haute
- screenshots · embarquer les polices CJK/arabe/hébreu/thaï dans le dépôt (aujourd'hui jsDelivr) · haute
- screenshots · mockups d'appareils et fonds (Previewed, AppLaunchpad) · moyenne
- screenshots · export ZIP des images traduites par langue · moyenne
- analytics · export CSV des produits et abonnements · moyenne
- analytics · revenu net vs brut et remboursements · Appfigures · moyenne
- analytics · alerte quand le revenu chute (via notifications) · haute
- analytics · phrases « En bref » pour la rétention et l'onboarding · moyenne
- finance · montant exact versé via Finance Reports API ASC (rapports financiers) · remplace l'estimation · haute
- finance · alerte « versement dans 3 jours » via notifications · moyenne
- finance · export CSV des mois fiscaux · moyenne
- finance · mettre à jour l'ancre du calendrier fiscal quand Apple/Appfigures publient 2027-2028 · moyenne
- paywalls · (fait 26/11) période, verdict, revenu par vue, CSV · import depuis RevenueCat · Superwall (guide de migration) · moyenne
- paywalls · segmentation par pays / version d'app · Qonversion, Adapty · moyenne
- paywalls · pages « Appolyn vs RevenueCat/Adapty/Superwall » honnêtes · Qonversion · moyenne
- paywalls · documenter `paywallPurchase(value:currency:)` dans la doc SDK et le dépôt appolyn-ios (copie à pousser) · haute
- reviews · (fait 27/11) tri, recherche, CSV, brouillons en lot · pagination au-delà de 200, modèles de réponse enregistrés, règles automatiques, alerte nouvel avis 1-2★ via notifications · Appbot/AppFollow/Appfigures · haute
- reviews · avis Google Play, MCP lecture des avis · AppFollow/Appbot · moyenne
- competitors · (fait 28/11) journal des changements + avis/jour · migration pour stocker sous-titre, description, notes de version dans `competitor_snapshots` · AppTweak ASO Intelligence · haute
- competitors · relevé serveur quotidien (cron) + alerte via notifications sur changement de prix/titre · AppFollow, Appfigures · haute
- competitors · comparaison côte à côte avec sa propre app · moyenne
