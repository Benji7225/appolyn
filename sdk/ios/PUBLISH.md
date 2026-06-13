# Publier le SDK iOS Appolyn comme Swift Package

Ce dossier (`sdk/ios`) **est** un package Swift prêt à publier (Package.swift à la
racine + `Sources/Appolyn/Appolyn.swift`). Le publier permet aux devs de l'ajouter
via une URL GitHub qui se met à jour toute seule, en plus du simple téléchargement
du fichier proposé dans Appolyn.

## Étapes (à faire une fois, par Benji)

1. Crée un repo **public** nommé `appolyn-ios` sur GitHub (compte `Benji7225`).
2. Depuis ce dossier, pousse son contenu :

   ```bash
   cd sdk/ios
   git init
   git add .
   git commit -m "Appolyn iOS SDK 1.0.0"
   git branch -M main
   git remote add origin https://github.com/Benji7225/appolyn-ios.git
   git push -u origin main
   git tag 1.0.0
   git push origin 1.0.0
   ```

3. C'est tout. Dans Xcode, un dev fait *File → Add Package Dependencies…* avec l'URL
   `https://github.com/Benji7225/appolyn-ios`, version `1.0.0`, puis appelle
   `Appolyn.start(key: "...")` au lancement.

## Publier une mise à jour

1. Change `sdkVersion` dans `Sources/Appolyn/Appolyn.swift`.
2. Commit, puis pousse un nouveau tag :

   ```bash
   git commit -am "..."
   git tag 1.0.1 && git push && git push origin 1.0.1
   ```

Les apps qui pointent sur "1.0.0 ou plus" récupèrent la mise à jour automatiquement.

## Vérifier que le package compile

```bash
cd sdk/ios && swift build
```

> Note : le téléchargement du fichier `Appolyn.swift` dans Appolyn (page App Store /
> Clients) reste disponible et marche aujourd'hui ; le Swift Package est l'option
> « plus propre » (mises à jour automatiques) une fois ce repo publié.
