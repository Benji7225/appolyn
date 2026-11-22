# Section `screenshots` (étudiée le 22/11/2026, passage 5)

## À quoi ça sert
Les screenshots sont le premier levier de conversion d'une fiche App Store. Appolyn lit les captures réelles via App Store
Connect, traduit la grosse accroche de chacune (adaptée ASO, pas mot à mot), la redessine sur l'image et la publie.

## Ce que veut le dev en 30 secondes
« Mes captures dans 20 langues, publiées, sans ouvrir Figma. » Donc : voir le résultat, corriger un mot, tout publier d'un coup.

## Concurrents (sources : `concurrents/liste.csv`, lignes datées 19 à 22/11/2026 ; sites souvent bloqués, infos via WebSearch/annuaires)
- Shotlingo : screenshots localisés 40+ langues, mockups, traduction IA des titres, mise à jour de toutes les versions quand le design change (AlternativeTo, Product Hunt).
- AppScreenshotStudio : génération par chat, crédits, API + MCP, pages /compare et llms.txt.
- AppLaunchpad : éditeur de screenshots App Store/Google Play, gratuit + payant (prix divergents, à vérifier).
- AppScreens : gratuit limité à 5 screenshots / 1 projet, Pro 25 $/mois (Capterra).
- Screenshots.pro : API d'automatisation, gratuit avec lien d'attribution.
- Previewed : mockups 2D/3D et vidéos promo.
- AppLaunchFlow : génère textes + screenshots + localisation depuis les assets du projet.
Constat : tous créent des visuels ; presque aucun ne **publie** dans App Store Connect sur 20+ langues. C'est notre avantage.

## Ce qui manquait chez nous
1. Publication un screenshot × une langue à la fois (20 langues × 8 captures = 160 clics). → fait ce passage.
2. Aucune correction possible d'une traduction IA avant publication. → fait ce passage.
3. Pas de remplacement des captures existantes (l'envoi s'ajoute à la suite). Il faudrait une option « remplacer » dans l'edge function `asc-proxy` (suppression des captures du set avant envoi), à écrire avec prudence. Avertissement affiché en attendant.
4. Polices CJK/arabe/hébreu/thaï chargées depuis jsDelivr au premier rendu ; à embarquer dans le dépôt.
5. Pas de mockups / fonds / création de captures (Previewed, AppLaunchpad) ; pas de lien avec la fiche localisée.

## Décidé et fait (passage 5)
- Barre « Publier une langue en entier » : rend et envoie tous les screenshots traduits de la langue, dans l'ordre de la fiche, un par un, avec résultat ligne par ligne ; un échec n'arrête pas la suite ; une seule création de version.
- Champ « Corriger la légende » dans l'aperçu : la correction est conservée (table `screenshot_captions`) et le rendu est refait.
- Refactor : `renderImage`, `sendToAsc`, `persistResults` partagés. Aucune migration. Non testé contre App Store Connect réel (pas de clé).
