// swift-tools-version:5.7
import PackageDescription

let package = Package(
    name: "Appolyn",
    platforms: [
        .iOS(.v13),
    ],
    products: [
        .library(name: "Appolyn", targets: ["Appolyn"]),
    ],
    targets: [
        .target(name: "Appolyn", path: "Sources/Appolyn"),
    ]
)
