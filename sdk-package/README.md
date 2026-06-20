# Appolyn iOS SDK

Suivi des installs, des revenus (StoreKit 2) et de la source d'acquisition pour ton app iOS, en **une ligne**. Tes utilisateurs et leurs données apparaissent dans ton dashboard Appolyn.

## Installation (Swift Package Manager, toujours à jour)

Dans Xcode : **File → Add Package Dependencies…**, colle l'URL de ce repo, puis ajoute le produit `Appolyn` à ta cible.

Ou dans ton `Package.swift` :

```swift
.package(url: "https://github.com/Benji7225/appolyn-ios", from: "1.0.0")
```

> Avantage du package : tu ne re-télécharges jamais le SDK. Une mise à jour = un simple « Update Package » dans Xcode.

## Utilisation

Une seule ligne au lancement de ton app :

```swift
import Appolyn

// SwiftUI App.init() ou AppDelegate didFinishLaunching :
Appolyn.start(key: "appolyn_live_xxxxxxxx")
```

C'est tout. Les installs, les achats StoreKit 2 et la source sont capturés automatiquement (identifiant vendeur IDFV, pas d'IDFA, pas de prompt ATT).

### Optionnel

```swift
Appolyn.setSource("TikTok")                 // d'où vient l'utilisateur (depuis ton onboarding)
Appolyn.track("trial_start")                // un jalon custom
Appolyn.setUserProperty("niveau", "Engagé") // un choix de l'utilisateur (apparaît dans sa fiche + la répartition)
```

---

> Ce dossier est le **package prêt à publier**. Pour le rendre installable, il doit vivre dans son propre repo GitHub public. À faire avec Benji (ne pas créer le repo automatiquement).
