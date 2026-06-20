// swift-tools-version:5.7
import PackageDescription

// Appolyn iOS SDK — distribué en Swift Package pour rester toujours à jour
// (le dev ajoute l'URL du package dans Xcode, et `Appolyn.start(key:)` ; les
// mises à jour se récupèrent automatiquement, sans re-télécharger de fichier).
// StoreKit 2 (revenu auto) nécessite iOS 15+.
let package = Package(
    name: "Appolyn",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "Appolyn", targets: ["Appolyn"]),
    ],
    targets: [
        .target(name: "Appolyn", path: "Sources/Appolyn"),
    ]
)
