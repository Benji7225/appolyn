# Section `localization`

## À quoi ça sert
Le dev veut, en 30 secondes : voir quelles langues de sa fiche App Store existent, en créer les manquantes (traduites par IA), relire, et tout publier sans copier-coller langue par langue.

## État chez nous (19/11/2026)
Cartes par langue avec note ASO réelle, éditeur (titre, sous-titre, mots-clés, description, texte promo, screenshots), « Améliorer avec l'IA » (garde-fou : jamais pire), génération IA des langues manquantes triées par taille de marché, création automatique d'une nouvelle version si l'app est en ligne.
Ajouté ce passage : **publication groupée**. Barre collée en haut « N langues pas encore publiées » avec bouton « Publier N langues » (paquets de 6, résultat langue par langue, rien n'est perdu en cas d'échec), contrôle des limites de caractères avant envoi (titre vide, dépassements), badge « modifiée » sur les cartes, avertissement si on quitte la page avec des changements non publiés, et les brouillons survivent au rechargement après une publication partielle (avant : publier une langue faisait disparaître les autres brouillons).

## Concurrents (recherche du 19/11/2026, pages éditeurs via WebSearch, donc déclaratif)
- **Dragoman** (app Mac) : traduit dans toutes les langues App Store d'un coup, aperçu avant publication, crée la version, export CSV. https://apps.apple.com/app/6758622904
- **MetaSync** : import des métadonnées par clé API, traduction par champ, envoi sélectif et retour arrière, 40+ langues. https://apps.apple.com/us/app/metasync-aso-translation/id6752488830?mt=12
- **ASO.dev** : éditeur groupé web, bouton Traduire par champ depuis la langue principale. https://www.aso.dev/metadata/bulk-editor
- **StoreLocalizer** (gratuit, open source) : traduit puis pousse vers App Store Connect. https://storelocalizer.pages.dev/app-store-localization.html
- **Auto Localize**, **MetaMate** (DeepL), CLI `asc localize metadata` : même schéma traduire en masse puis envoyer en masse.
- **AppSprint** : « localisation » chez eux = prix, pas la traduction (fiche appsprint.md). **Lokalise** : plateforme de traduction d'app, 144 $/mois et plus (liste.csv), hors sujet pour un indé.
- Constat d'un article tiers : l'IA doit rester une couche de brouillon, relue avant publication (appsops.store, opinion d'un auteur). Notre « brouillon puis relis puis publie » va dans ce sens.
- Non trouvé : AppTweak, App Radar, Postback sur ce sujet précis (pas de page lisible).

## Manque encore (voir BACKLOG-AUTO)
Aperçu des différences (avant/après) par langue, retour arrière, export/import CSV des textes, brouillons sauvegardés en base (pas seulement en mémoire), traduction par champ, détection de mots-clés dupliqués entre titre/sous-titre/champ mots-clés, cohérence entre langues.
