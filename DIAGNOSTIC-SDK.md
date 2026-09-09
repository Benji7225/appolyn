# Pourquoi l'analytics d'Appolyn est vide

> Cherché dans la nuit du 08 au 09/09/2026, après « la partie analytics elle est biaisée,
> elle est complètement fausse ». Ce n'est pas un bug de calcul.

## Le fait

```
sdk_events   : 0 ligne
sdk_clients  : 0 ligne
```

**Le SDK Appolyn n'a jamais reçu un seul événement.**

## Ce que ça vide

| Écran ou métrique | État |
|---|---|
| Entonnoir d'onboarding, Paywalls, Utilisateurs | vide |
| Essais, conversion d'essai, rétention D1/D7/D30 | vide |
| ARPU, ARPPU, LTV, revenu par produit | vide |

Soit **la moitié du produit**. Ce qui fonctionne (téléchargements, revenu, note, mots-clés,
localisation, concurrents) vient d'App Store Connect, pas du SDK.

L'interface est honnête sur ces vides, elle affiche « — » et « Dès tes 1res installs (SDK) ».
Mais quand la moitié des écrans dit « — », l'outil donne l'impression d'être cassé.
C'est très exactement ce que Benjamin décrit.

## La cause : deux lignes de code manquantes dans Vision

⚠️ **Ce document a d'abord conclu à une distribution cassée. C'était faux, sur deux points.**
Vérification faite auprès de GitHub, la distribution fonctionne parfaitement :

| Vérification | Résultat |
|---|---|
| Dépôt `Benji7225/appolyn-ios` | **existe, public** |
| `Package.swift` à la racine | **oui** (racine : `Package.swift`, `README.md`, `Sources`) |
| Tags de version | **1.5.0 et 1.6.0** |
| Package référencé dans Vision.xcodeproj | **oui**, `XCRemoteSwiftPackageReference "appolyn-ios"` |

Le SDK est donc distribuable, distribué, et **déjà ajouté au projet Xcode de Vision**.

**Ce qui manque, et c'est tout :**

```
import Appolyn      → absent du code de Vision
Appolyn.start(key:) → jamais appelé
```

Le package a été ajouté dans Xcode, puis jamais importé ni démarré. Un SDK présent mais
jamais initialisé ne fait rien, silencieusement. D'où zéro événement.

## Le correctif exact

Dans `livrables/Vision/app/Vision/VisionApp.swift` :

- ligne 1, à côté des autres imports : `import Appolyn`
- dans `init()` de `struct VisionApp: App` (ligne 61), en première instruction :

```swift
Appolyn.start(key: "appolyn_live_…")   // clé dans Appolyn > Réglages > Connexions
```

La clé de Vision existe déjà côté Appolyn, elle n'a pas à être créée.

⛔ **Non appliqué cette nuit.** Deux raisons : la consigne portait sur Appolyn, pas sur Vision,
et surtout **cette modification impose de resoumettre Vision à l'App Review**. Ce n'est pas une
décision à prendre à la place de Benjamin, encore moins pendant qu'il dort.

## Ce que ça débloquerait

Une fois la nouvelle version de Vision en ligne, les installs, les achats StoreKit 2 et la source
d'acquisition remontent tout seuls. La moitié vide d'Appolyn se remplit avec de vraies données,
et **Benjamin devient son propre premier utilisateur réel**, ce qu'il n'a jamais été.

Accessoirement, ça répondrait à la question qu'il se pose depuis des semaines sur Vision :
quelle vidéo amène quelle installation. Aujourd'hui, `App Store search` écrase tout dans les
rapports Apple, sans distinguer qui a d'abord vu une vidéo.

## Détail annexe

Le dossier `sdk/` à la racine du repo Appolyn est **vide**. Le vrai package vit dans
`sdk-package/`, et sa copie publiée dans le dépôt `appolyn-ios`. Ce dossier vide n'a aucun usage
et trompe la lecture du projet : à supprimer.
