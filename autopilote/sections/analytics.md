# Section `analytics` (étudiée le 23/11/2026, passage 6)

## À quoi ça sert
Répondre à « mon app gagne-t-elle de l'argent, et qu'est-ce qui change ? » : revenus, téléchargements, abonnements,
rétention, entonnoirs, pays et produits, en données réelles (rapports App Store Connect + SDK).

## Ce que veut le dev en 30 secondes
« Est-ce que ça monte ou ça baisse, et pourquoi ? » puis « puis-je sortir mes chiffres ? ». Il ne veut pas décoder 17 tuiles.

## Concurrents (sources : fiches `concurrents/fiches/`, pas de page lue directement ce passage)
- Appfigures : revenu net/brut, remboursements, impressions, classements, multi-stores ; contexte : Apple a refondu App Store Connect le 25/03/2026 (100+ métriques, rapports d'abonnement) et rogne la valeur des analytics de base (TechCrunch, cité dans la fiche).
- Adapty : tableau de bord, cohortes, LTV, prédictions de revenu, événements envoyés vers des outils tiers (G2).
- RevenueCat : charts d'abonnements, MTR (calcul brut selon frontdeskreview, non confirmé).
- Postback : entonnoir avec % de perte à chaque étape ; admet ne pas avoir de copilote d'analytics IA.
- Aptabase / TelemetryDeck / DataFast : analytics minimalistes, prix lisible (liste.csv, idees.md).

## Déjà chez nous
Tuiles déplaçables, comparaison période/année, graphes revenu et téléchargements, abonnements (MRR, ARR, churn), rétention D1/D7/D30,
entonnoirs de conversion et d'onboarding, revenu par pays et par produit.

## Ce qui manquait
1. Aucune lecture « en clair » : il faut interpréter soi-même les tuiles (Postback revendique l'absence d'IA ; l'angle libre est une lecture calculée, sans IA ni invention).
2. Aucun export : standard chez les outils d'analytics.

## Décisions (passage 6)
- Carte « En bref » (`lib/analytics-summary.ts`) : phrases déterministes tirées des chiffres chargés (revenu et téléchargements vs comparaison, croisement des deux, meilleur jour, concentration par pays ≥ 60 %, churn > 5 %, conversion d'essai < 5 % avec ≥ 10 essais). Seuils = ceux déjà affichés dans l'app. Rien n'apparaît si la donnée manque.
- Export CSV (séparateur « ; », virgule décimale, BOM UTF-8, protection contre l'injection de formules) des lignes et pays affichés.

## Reste
Export des produits/abonnements, revenu net vs brut et remboursements (Appfigures), cohortes de rétention en tableau, alertes (chute de revenu) via `notifications`.
