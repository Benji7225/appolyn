# Section `competitors` (Concurrents)

> Passage 11 · 28/11/2026. Sources : fiches `concurrents/fiches/` (AppTweak, Appfigures, AppFollow, MobileAction, App Radar, Sensor Tower) ; aucun site éditeur relu directement (domaines bloqués dans la session), tout vient des extraits déjà notés dans les fiches.

## À quoi ça sert
Savoir en 30 secondes : « qu'est-ce que mes concurrents ont changé cette semaine, et est-ce que ça bouge chez eux ? » Données publiques de l'App Store (iTunes), un relevé toutes les 6 h au plus quand la page est ouverte.

## Ce que font les autres
- AppTweak « ASO Intelligence » : suivi des mises à jour de titre, sous-titre, description, icône, captures, vidéos des concurrents (fiche apptweak.md).
- App Radar : métadonnées et mots-clés des concurrents (appradar.com/blog, via fiche) ; 25 concurrents dès 69 €/mois.
- MobileAction : 10 concurrents par app à 69 $/mois, 15 à 239 $/mois (fiche, source tierce).
- AppFollow : 10 apps concurrentes dans l'entrée de gamme (G2, via fiche) ; avis des concurrents (T3 2026).
- Appfigures : Competitor Keywords, alertes e-mail/Slack ; Monitor : 0 concurrent premium sur l'offre d'entrée.
- Sensor Tower : suivi de concurrents, prix sur devis.
Nombre de concurrents suivis = limite payante chez tous ; Appolyn n'en limite pas.

## Ce qui manquait chez nous
La page ne montrait qu'un « N chgt » sans dire quoi, ni quand, et aucune vue d'ensemble. L'historique des relevés existait mais restait invisible.

## Fait (passage 11)
- `lib/competitor-changes.ts` : journal calculé depuis les relevés existants (titre, prix, version, nombre de captures, icône via son chemin d'image, note ±0,1), élan en nouveaux avis/jour (proxy public, clairement étiqueté).
- Page : bloc « Ce qui a changé chez tes concurrents » (7/30/90 jours, copier en texte, état vide honnête), et sous chaque carte le dernier changement + avis/jour. Aucune migration.
- Limites assumées : la date est celle où Appolyn a vu le changement ; pas de sous-titre, description ni notes de version (colonnes absentes des relevés).

## Reste
- Migration : stocker sous-titre, description, notes de version dans les relevés (diff mot à mot) : c'est ce que vend AppTweak.
- Relevé quotidien serveur (cron) pour que le journal avance sans ouvrir la page, puis alerte via notifications.
- Comparaison côte à côte avec sa propre app.
