# Section `finance` (« Trésorerie », étudiée le 24/11/2026, passage 7)

## À quoi ça sert
Répondre à « quand Apple me paie-t-il, et combien ? ». Apple verse par compte développeur, environ 33 jours après la fin de chaque mois fiscal.

## Ce que veut le dev en 30 secondes
Une date et un montant : « le 3 décembre, environ X € ». Pas un tableau de MRR.

## Concurrents (fiches `concurrents/` + WebSearch du 24/11/2026)
- Appfigures : article d'aide « Apple's fiscal payout calendar » (règle des 33 jours, trimestre = un mois de 35 jours et deux de 28, mois d'octobre 2026 = 27/09 → 31/10 versé le 03/12/2026, novembre 2026 = 01/11 → 28/11 versé le 31/12/2026).
- RevenueCat : article de blog annuel « App Store fiscal calendar and payment dates » ; précise que les dates sont des estimations, Apple ne publiant pas de calendrier officiel et pouvant faire des exceptions. Conditions de versement : accord Paid Applications, coordonnées bancaires, seuil minimum par pays/région (montant non trouvé).
- Adapty : page « Apple fiscal calendar and payment dates 2026 », renvoie au calendrier officiel d'App Store Connect.
- ChartMogul, Baremetrics, ProfitWell (fiches/CSV) : MRR/churn pour SaaS en abonnement, pas de calendrier de versement Apple ; Baremetrics jugé cher (G2).
- Forum Apple (thread 813470) : l'API Finance Reports suit le cycle de règlement, pas le mois civil.
- Domaines bloqués (ENOTFOUND) : help.appfigures.com, adapty.io. Tout vient d'extraits WebSearch.

## Déjà chez nous avant ce passage
Une page « module en préparation » : simulateur d'avance de trésorerie avec chiffres hypothétiques (85 %, 2 %), bouton « Me prévenir » sans action. Rien de réel.

## Décisions (passage 7)
- La page devient utile avec des données réelles : prochain versement (date, jours restants), mois fiscaux à venir avec le revenu (proceeds) tiré des rapports de ventes ASC sur la fenêtre de chaque mois fiscal, total en attente. Compte entier, sans filtre par app.
- `lib/apple-payouts.ts` : calendrier = ancre confirmée (oct. et nov. 2026, Appfigures) prolongée par le motif 5-4-4 semaines, versement = fin + 33 jours. Tout mois non confirmé est affiché « estimé » avec renvoi vers App Store Connect (année à semaine supplémentaire possible).
- Pas de montant de seuil de versement (non trouvé) ; textes disent « environ » et listent les causes d'écart (change, retenues, remboursements, seuil).
- Le simulateur d'avance est conservé, replié sous « En préparation », amorcé avec le montant réel en attente ; bouton mort retiré.

## Reste
Vérifier en vrai avec un compte ASC ; télécharger les rapports financiers Apple (Finance Reports API) pour le montant exact versé ; devise du compte ; alerte « versement dans 3 jours » via `notifications` ; export CSV ; mise à jour de l'ancre quand les dates 2027-2028 seront publiées.
