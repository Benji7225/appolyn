# Section `keywords`

## À quoi ça sert
Le dev tape un terme, voit en 30 s s'il est gagnable (demande, concurrence, sa position) et le suit dans le temps.

## État chez nous (18/11/2026)
Popularité et difficulté calculées en direct depuis les apps qui rankent (iTunes Search), rang réel, historique de rang
quotidien, suggestions « reverse-ASO », tri par colonne, filtre pays. Pas de volume Apple officiel (Apple Search Ads non branché).
Ajouté ce passage : colonne **Opportunité** (= popularité × (100 − difficulté) / 100), triable, avec libellé À viser / Correct / Difficile.

## Concurrents (recherche du 18/11/2026)
- **Astro** : app Mac, ~9 $/mois facturé annuellement selon un comparatif tiers ; popularité tirée d'Apple Ads (dit sa doc),
  difficulté = estimation propriétaire (source concurrente, à relativiser). Sources : appsprint.app/aso/compare/astro-vs-app-sprint,
  trysonar.app/blog/astro-aso-alternatives, appdrift.co/blog/appdrift-vs-astro. Doc officielle (tryastro.app) non joignable
  depuis la session (domaine non autorisé) : fonctionnalités exactes non vérifiées.
- **AppTweak** : volume App Store = Search Popularity officielle d'Apple (échelle 1-100) ; difficulté, pertinence, installs
  organiques par mot-clé, reach max. Sources : apptweak.com/en/aso-blog/best-aso-keyword-research-tools,
  help.apptweak.com/en/articles/13407384 (volumes, fév. 2026).
- Les deux croisent demande et concurrence pour pousser à choisir des mots-clés « gagnables » : d'où notre colonne Opportunité.

## Manque encore (voir BACKLOG-AUTO)
Volume Apple officiel (connecteur Search Ads), export CSV, mise en page mobile du tableau (grille à colonnes fixes),
actualisation automatique quotidienne côté serveur, mots-clés par langue de la fiche.
