# Section `paywalls` (étudiée le 26/11/2026, passage 9)

## À quoi ça sert
Dire quel écran d'abonnement de l'app convertit le mieux, et si l'écart est réel ou du hasard.

## Ce que veut le dev en 30 secondes
« Quel paywall gagne, de combien, et est-ce que je peux me fier au chiffre ? » Pas un tableau de bord d'abonnements.

## Concurrents (fiches `concurrents/` du 26/11/2026 ; tout vient d'extraits WebSearch, sites éditeurs en partie bloqués)
- Superwall : expériences A/B sans release, indie gratuit jusqu'à 10 k$ de MAR puis 1 % (assiette incohérente entre pages).
- RevenueCat : Experiments avec résultats en temps réel et LTV 12 mois prédite (oct. 2026), recommandation de gagnant. Gratuit jusqu'à 2 500 $ de MTR.
- Adapty : A/B sur prix, durées, offres ; résultats par paywall et produit ; gratuit jusqu'à 5 000 $ de MTR (annonce fév. 2026).
- Qonversion : experiments avec segmentation, répartition de trafic et significativité statistique ; gratuit jusqu'à 10 K$.
- Purchasely : A/B jusqu'à 26 variantes, significativité bayésienne, prix non public.
- Apphud : A/B par placement (Apphud 2.0, juillet 2026), ARPU et conversion ; gratuit sous 10 K$.
Constat : tous parlent de « significativité », aucun ne l'explique en une phrase à un indé.

## Déjà chez nous
Conversion vue → achat par identifiant de paywall (SDK), conseil IA avec prompt à copier.

## Décisions (passage 9)
- Sélecteur de période (7/30/90 jours, tout) ; comparaison avec la période précédente de même durée (flèche, seulement si 100 vues ou plus des deux côtés).
- Carte « En bref » : verdict en français via un test z à deux proportions (`lib/paywall-stats.ts`) : gagnant net à 95 %, « devant mais pas sûr » à 80 %, sinon « pas de gagnant net » ; rien n'est conclu sous 100 vues par paywall (seuil de prudence choisi par nous, pas une norme d'un concurrent).
- Revenu par personne ayant vu le paywall : le SDK accepte `paywallPurchase(id, value:, currency:)` (optionnel, compatible) ; l'ingestion garde le montant sur la ligne d'événement sans toucher au revenu agrégé du client. Affiché seulement si une seule devise.
- Export CSV, erreur de chargement explicite, état vide « aucun paywall sur cette période ».

## Reste
Test réel avec un SDK à jour (non fait) ; allocation de trafic / A/B réel côté app (Appolyn ne sert pas encore les paywalls, il mesure) ; import depuis RevenueCat ; pages « alternative à » ; LTV prédite ; segmentation par pays ou version.
