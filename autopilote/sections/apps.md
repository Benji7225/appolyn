# Section `apps` (fiche App Store, éditeur ASO)

> `/app/apps` redirige vers Réglages → Mes apps. L'éditeur de fiche vit dans `localization` (éditeur par langue). Cette fiche couvre le champ « ce que le dev écrit dans sa fiche ».

## À quoi ça sert
Le dev veut, en 30 secondes : savoir si sa fiche est bien construite pour la recherche, corriger, publier.

## État chez nous (20/11/2026)
Audit déterministe (`auditMetadata`, lib/aso.ts), score 0-100 mêlant structure et difficulté réelle des mots-clés (iTunes), panneau « À corriger », « Améliorer avec l'IA » avec garde-fou.
Ajouté ce passage : **« Nettoyer le champ »** sous les mots-clés (`cleanKeywords`, lib/aso.ts). Sans IA, instantané : retire doublons, mots déjà indexés via titre/sous-titre, singulier/pluriel redondants, mots génériques, espaces inutiles ; liste chaque retrait avec sa raison et affiche les caractères récupérés (sur 100). Le dev clique, relit, remplit l'espace libéré.

## Concurrents
Fiches `concurrents/fiches/apptweak.md`, `astro.md`, `appsprint.md`, `appfigures.md` (lues) : l'optimisation du champ mots-clés (gestion du budget de 100 caractères, mots déjà couverts) est un cœur d'offre ASO ; AppTweak est reproché de surcharge (G2), d'où le choix d'une action simple en un clic. Recherche web complémentaire non faite ce passage (temps) : à compléter.
Règle Apple utilisée (déjà dans l'audit, non revérifiée ce passage) : chaque mot n'est indexé qu'une fois entre titre, sous-titre et mots-clés.

## Limites connues
Liste de mots génériques en anglais seulement (comme l'audit) ; pas de gestion multi-mots fine (une expression partiellement couverte est conservée).

## Reste (voir BACKLOG-AUTO)
Suggestions de mots pour remplir l'espace libéré (depuis la page keywords) ; aperçu de la fiche telle qu'affichée dans la recherche ; liste de mots génériques par langue.
