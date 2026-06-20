//
//  Appolyn.swift
//  Drop-in install / revenue / acquisition tracking for your iOS app.
//
//  ── SETUP (the whole thing) ───────────────────────────────────────────────
//  1. Add this file to your Xcode project (just drag it in).
//  2. Call this once at app launch — in `init()` of your SwiftUI `App`, or in
//     `application(_:didFinishLaunchingWithOptions:)` for UIKit:
//
//         Appolyn.start(key: "appolyn_live_xxxxxxxx")
//
//  That's all. StoreKit purchases and the acquisition source are captured
//  automatically. No other code to write, no dependencies.
//  ──────────────────────────────────────────────────────────────────────────
//

import Foundation
#if canImport(UIKit)
import UIKit
#endif
#if canImport(StoreKit)
import StoreKit
#endif
#if canImport(AdServices)
import AdServices
#endif
#if canImport(SwiftUI)
import SwiftUI
#endif

/// Appolyn iOS SDK — drop-in attribution & analytics.
///
/// **One line.** Call `Appolyn.start(key:)` once and you're done: every install,
/// launch and StoreKit purchase is sent to Appolyn, lighting up your **Clients**
/// dashboard (who installed, from where, on what device, what they paid). No App
/// Tracking Transparency prompt: we use the privacy-safe vendor identifier (IDFV),
/// never the IDFA.
///
/// ```swift
/// // In your App init / AppDelegate didFinishLaunching — that's the whole setup:
/// Appolyn.start(key: "appolyn_live_xxxxxxxx")
/// ```
///
/// Revenue is captured automatically from StoreKit 2 (iOS 15+): you don't have to
/// add a single line at your purchase code. If you want extra custom milestones,
/// `Appolyn.track("trial_start")` is there, but it's optional.
public final class Appolyn {

    public static let shared = Appolyn()
    private init() {}

    private static let sdkVersion = "1.3.0"

    private var apiKey = ""
    private var endpoint = URL(string: "https://appolyn.io/api/sdk/ingest")!
    private var started = false

    private let defaults = UserDefaults.standard
    private let work = DispatchQueue(label: "app.appolyn.sdk", qos: .utility)
    private let queueKey = "appolyn.event_queue.v1"
    private let installDateKey = "appolyn.install_date"
    private let firstLaunchKey = "appolyn.first_launch_done"
    private let seenTxKey = "appolyn.seen_tx.v1"
    private var storeKitObserving = false
    private var cachedAsaToken: String?
    // Signaux d'usage privacy-safe (directive « capter un max de data »). Tout est
    // anonyme et thread-safe (UserDefaults / Date / Bundle), aucun accès UIKit main-thread.
    private let sessionCountKey = "appolyn.session_count"
    private let lastVersionKey = "appolyn.last_app_version"
    private var previousAppVersion: String?
    private var isUpdate = false
    // TODO (capture-max, à faire avec un saut main-thread pour éviter tout risque) :
    // dark_mode (UITraitCollection), accessibilité (VoiceOver/Reduce Motion/Bold Text),
    // taille de texte (preferredContentSizeCategory), type de connexion (NWPathMonitor).

    // MARK: - Public API

    /// Start the SDK. Call once, as early as possible. Sends an `install` event on
    /// the very first launch, then `launch` on subsequent ones, and (on iOS 15+)
    /// starts watching StoreKit so every purchase/renewal is reported automatically.
    /// - Parameters:
    ///   - key: Your Appolyn SDK key (Settings → Connected apps).
    ///   - autoStoreKit: Auto-capture StoreKit 2 purchases. Leave `true` unless you
    ///     already report revenue yourself via `track(...)`.
    ///   - endpoint: Optional override for the ingest URL (self-host / testing).
    public static func start(key: String, autoStoreKit: Bool = true, endpoint: URL? = nil) {
        shared.start(key: key, autoStoreKit: autoStoreKit, endpoint: endpoint)
    }

    public func start(key: String, autoStoreKit: Bool = true, endpoint: URL? = nil) {
        work.async {
            guard !self.started else { return }
            self.started = true
            self.apiKey = key
            if let endpoint = endpoint { self.endpoint = endpoint }

            let isNewInstall = self.markFirstLaunchIfNeeded()
            self.trackSessionAndVersion()
            self.send(event: isNewInstall ? "install" : "launch", extra: [:])
            self.flushQueue()
            if autoStoreKit { self.startStoreKitIfAvailable() }
        }
    }

    /// Track a custom event. Use it for the moments that matter to attribution and
    /// revenue: `trial_start`, `purchase`, `subscribe`, `cancel`, etc.
    public static func track(_ name: String,
                             value: Double? = nil,
                             currency: String? = nil,
                             properties: [String: String]? = nil) {
        shared.track(name, value: value, currency: currency, properties: properties)
    }

    /// Tell Appolyn where this user said they came from — e.g. the answer to a
    /// "How did you hear about us?" question in your onboarding (TikTok, Instagram,
    /// a friend…). This is the most reliable acquisition source: the user tells you
    /// directly, with no tracked link and no Apple dependency (Apple never reveals
    /// where an install came from). Call it once, when you have the answer.
    public static func setSource(_ channel: String) {
        shared.track("source", properties: ["channel": channel])
    }

    /// Enregistre un choix / attribut de l'utilisateur — ce que TON app collecte :
    /// genre, objectif, niveau choisi, lunettes/lentilles, difficulté… Il apparaît
    /// dans la fiche de l'utilisateur ET dans la « Répartition » de ton dashboard
    /// Appolyn (combien ont choisi quoi). Appelle-le quand l'utilisateur fait son choix.
    ///
    /// ```swift
    /// Appolyn.setUserProperty("objectif", "préserver mes yeux")
    /// Appolyn.setUserProperty("niveau", "Engagé")
    /// ```
    public static func setUserProperty(_ key: String, _ value: String) {
        let k = key.trimmingCharacters(in: .whitespacesAndNewlines)
        let v = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !k.isEmpty, !v.isEmpty else { return }
        shared.track("user_property", properties: [k: v])
    }

    /// Enregistre l'affichage d'un écran, pour l'entonnoir d'onboarding côté Appolyn
    /// (où décrochent tes utilisateurs). Appolyn ordonne les écrans tout seul et calcule
    /// les pourcentages : tu ajoutes/retires des écrans, l'entonnoir s'adapte.
    /// - SwiftUI : utilise plutôt le modifier `.appolynScreen("welcome")` (1 ligne).
    /// - UIKit : appelle `Appolyn.screen("Welcome")` dans `viewDidAppear`.
    public static func screen(_ name: String) {
        let n = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !n.isEmpty else { return }
        shared.track("screen_view", properties: ["name": n])
    }

    public func track(_ name: String,
                      value: Double? = nil,
                      currency: String? = nil,
                      properties: [String: String]? = nil) {
        work.async {
            var extra: [String: Any] = [:]
            if let value = value { extra["value"] = value }
            if let currency = currency { extra["currency"] = currency }
            if let properties = properties { extra["properties"] = properties }
            self.send(event: name, extra: extra)
        }
    }

    // MARK: - Payload

    private func basePayload() -> [String: Any] {
        var p: [String: Any] = [
            "sdk_key": apiKey,
            "sdk_version": Appolyn.sdkVersion,
            "platform": "ios",
            "idfv": deviceId(),
            "device_model": modelIdentifier(),
            "os_name": systemName(),
            "os_version": systemVersion(),
            "app_version": bundleString("CFBundleShortVersionString"),
            "app_build": bundleString("CFBundleVersion"),
            "bundle_id": Bundle.main.bundleIdentifier ?? "",
            "locale": Locale.current.identifier,
            "language": Locale.preferredLanguages.first ?? "",
            "region": regionCode(),
            "timezone": TimeZone.current.identifier,
            "install_date": installDate(),
            "is_simulator": isSimulator(),
            "low_power": lowPowerMode(),
            "ts": ISO8601DateFormatter().string(from: Date()),
        ]
        // Signaux d'usage anonymes (engagement + détection de mise à jour).
        p["session_count"] = defaults.integer(forKey: sessionCountKey)
        p["seconds_since_install"] = secondsSinceInstall()
        p["is_update"] = isUpdate
        if let prev = previousAppVersion { p["previous_app_version"] = prev }
        // Signaux techniques STATIQUES, anonymes (Foundation only, thread-safe, privacy-safe :
        // ni IDFA, ni PII). « Capter un max de data » sans rien de personnel.
        p["timezone_offset"] = TimeZone.current.secondsFromGMT()
        p["preferred_languages"] = Array(Locale.preferredLanguages.prefix(5))
        p["physical_memory_mb"] = Int(ProcessInfo.processInfo.physicalMemory / (1024 * 1024))
        p["processor_count"] = ProcessInfo.processInfo.processorCount
        if let disk = diskCapacity() {
            p["disk_total_mb"] = Int(disk.total / (1024 * 1024))
            p["disk_free_mb"] = Int(disk.free / (1024 * 1024))
        }
        p["is_jailbroken"] = isJailbrokenBestEffort()
        if let asa = appleSearchAdsToken() { p["asa_token"] = asa }
        #if canImport(UIKit)
        let screen = UIScreen.main
        p["screen_w"] = Int(screen.bounds.width * screen.scale)
        p["screen_h"] = Int(screen.bounds.height * screen.scale)
        p["device_class"] = UIDevice.current.userInterfaceIdiom == .pad ? "ipad" : "iphone"
        #endif
        return p
    }

    private func send(event: String, extra: [String: Any]) {
        guard !apiKey.isEmpty else { return }
        var body = basePayload()
        body["event"] = event
        for (k, v) in extra { body[k] = v }
        post(body)
    }

    // MARK: - Networking (fire-and-forget, offline queue)

    private func post(_ body: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return }
        var req = URLRequest(url: endpoint)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = data
        req.timeoutInterval = 15

        URLSession.shared.dataTask(with: req) { [weak self] _, response, error in
            let ok = (response as? HTTPURLResponse).map { (200..<300).contains($0.statusCode) } ?? false
            if !ok || error != nil { self?.enqueue(body) }
        }.resume()
    }

    private func enqueue(_ body: [String: Any]) {
        work.async {
            var arr = self.defaults.array(forKey: self.queueKey) as? [[String: Any]] ?? []
            arr.append(body)
            if arr.count > 50 { arr.removeFirst(arr.count - 50) } // cap the offline buffer
            self.defaults.set(arr, forKey: self.queueKey)
        }
    }

    private func flushQueue() {
        let arr = defaults.array(forKey: queueKey) as? [[String: Any]] ?? []
        guard !arr.isEmpty else { return }
        defaults.removeObject(forKey: queueKey)
        for body in arr { post(body) }
    }

    // MARK: - Device helpers (all privacy-safe, no IDFA / no ATT prompt)

    private func deviceId() -> String {
        #if canImport(UIKit)
        return UIDevice.current.identifierForVendor?.uuidString ?? "unknown"
        #else
        return "unknown"
        #endif
    }

    private func modelIdentifier() -> String {
        #if targetEnvironment(simulator)
        if let id = ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"] { return id }
        #endif
        var sysinfo = utsname()
        uname(&sysinfo)
        let mirror = Mirror(reflecting: sysinfo.machine)
        let id = mirror.children.reduce(into: "") { acc, el in
            if let v = el.value as? Int8, v != 0 { acc.append(Character(UnicodeScalar(UInt8(v)))) }
        }
        return id.isEmpty ? "unknown" : id
    }

    private func systemName() -> String {
        #if canImport(UIKit)
        return UIDevice.current.systemName
        #else
        return "iOS"
        #endif
    }

    private func systemVersion() -> String {
        #if canImport(UIKit)
        return UIDevice.current.systemVersion
        #else
        let v = ProcessInfo.processInfo.operatingSystemVersion
        return "\(v.majorVersion).\(v.minorVersion).\(v.patchVersion)"
        #endif
    }

    private func regionCode() -> String {
        if #available(iOS 16, macOS 13, *) { return Locale.current.region?.identifier ?? "" }
        return (Locale.current as NSLocale).object(forKey: .countryCode) as? String ?? ""
    }

    private func bundleString(_ key: String) -> String {
        Bundle.main.infoDictionary?[key] as? String ?? ""
    }

    private func isSimulator() -> Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }

    private func lowPowerMode() -> Bool {
        #if os(iOS)
        return ProcessInfo.processInfo.isLowPowerModeEnabled
        #else
        return false
        #endif
    }

    /// Apple Search Ads attribution token (AdServices, iOS 14.3+). Fetched once and
    /// cached; the server resolves it with Apple to know if the install came from an
    /// ASA campaign. Returns nil when unavailable — no campaign, no consent, older OS.
    private func appleSearchAdsToken() -> String? {
        if let t = cachedAsaToken { return t }
        #if canImport(AdServices)
        if #available(iOS 14.3, macOS 11.1, tvOS 14.3, *) {
            cachedAsaToken = try? AAAttribution.attributionToken()
            return cachedAsaToken
        }
        #endif
        return nil
    }

    // MARK: - StoreKit 2 auto-capture (zero extra code for the developer)

    /// Starts observing Apple's purchase system so the developer never has to call
    /// `track("purchase")` themselves. We read the verified transactions, dedupe by
    /// transaction id (persisted), and emit `subscribe` / `renewal` / `purchase`
    /// with the real price + currency. We never call `finish()` — that stays the
    /// app's job, so we can't break entitlement delivery.
    private func startStoreKitIfAvailable() {
        #if canImport(StoreKit)
        guard !storeKitObserving else { return }
        storeKitObserving = true
        if #available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *) {
            // Backlog: subscriptions / purchases already owned (caught up across launches).
            Task.detached { [weak self] in
                for await result in StoreKit.Transaction.currentEntitlements {
                    await self?.reportTransaction(result, backlog: true)
                }
            }
            // Live: anything that happens from now on (new purchases, renewals).
            Task.detached { [weak self] in
                for await result in StoreKit.Transaction.updates {
                    await self?.reportTransaction(result, backlog: false)
                }
            }
        }
        #endif
    }

    #if canImport(StoreKit)
    @available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *)
    private func reportTransaction(_ result: VerificationResult<StoreKit.Transaction>, backlog: Bool) async {
        guard case .verified(let tx) = result else { return }
        if tx.revocationDate != nil { return } // refunded / revoked: don't count as revenue
        let txId = String(tx.id)
        guard markTransactionIfNew(txId) else { return }

        let (value, currency) = priceInfo(of: tx)
        // Essai gratuit d'intro : on émet `trial_start` (PAS de revenu). La conversion se voit
        // ensuite quand le même appareil génère un `renewal`/`subscribe` payant. Permet à Appolyn
        // d'afficher les essais en cours + le taux de conversion d'essai.
        let trial = isIntroFreeTrial(tx)
        let event: String
        if trial {
            event = "trial_start"
        } else {
            switch tx.productType {
            case .autoRenewable:
                event = (tx.originalID == tx.id) ? "subscribe" : "renewal"
            default:
                event = "purchase"
            }
        }
        var props: [String: String] = ["product_id": tx.productID, "transaction_id": txId]
        if backlog { props["backlog"] = "1" }
        if trial { props["trial"] = "1" }
        track(event, value: trial ? nil : value, currency: trial ? nil : currency, properties: props)
    }

    /// Vrai si la transaction est un ESSAI GRATUIT d'offre d'introduction (pas du revenu).
    @available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *)
    private func isIntroFreeTrial(_ tx: StoreKit.Transaction) -> Bool {
        if #available(iOS 17.2, macOS 14.2, tvOS 17.2, watchOS 10.2, *) {
            return tx.offer?.type == .introductory && tx.offer?.paymentMode == .freeTrial
        } else {
            // `offerType` déprécié en 17.2 mais valable avant ; un essai = offre d'intro à prix 0.
            return tx.offerType == .introductory && ((tx.price ?? 0) == 0)
        }
    }

    @available(iOS 15.0, macOS 12.0, tvOS 15.0, watchOS 8.0, *)
    private func priceInfo(of tx: StoreKit.Transaction) -> (Double?, String?) {
        var value: Double?
        if let p = tx.price { value = NSDecimalNumber(decimal: p).doubleValue }
        var currency: String?
        if #available(iOS 16.0, macOS 13.0, tvOS 16.0, watchOS 9.0, *) {
            currency = tx.currency?.identifier
        } else {
            currency = tx.currencyCode
        }
        return (value, currency)
    }
    #endif

    /// Returns true the first time a transaction id is seen, false afterwards.
    private func markTransactionIfNew(_ id: String) -> Bool {
        var seen = defaults.array(forKey: seenTxKey) as? [String] ?? []
        if seen.contains(id) { return false }
        seen.append(id)
        if seen.count > 500 { seen.removeFirst(seen.count - 500) }
        defaults.set(seen, forKey: seenTxKey)
        return true
    }

    /// Records the install date on the first ever launch and returns whether this
    /// launch is that first one.
    private func markFirstLaunchIfNeeded() -> Bool {
        if defaults.bool(forKey: firstLaunchKey) { return false }
        defaults.set(true, forKey: firstLaunchKey)
        defaults.set(ISO8601DateFormatter().string(from: Date()), forKey: installDateKey)
        return true
    }

    private func installDate() -> String {
        defaults.string(forKey: installDateKey) ?? ISO8601DateFormatter().string(from: Date())
    }

    /// Incrémente le compteur de sessions et détecte une mise à jour de l'app
    /// (changement de version depuis le dernier lancement). Appelé une fois au start.
    private func trackSessionAndVersion() {
        defaults.set(defaults.integer(forKey: sessionCountKey) + 1, forKey: sessionCountKey)
        let current = bundleString("CFBundleShortVersionString")
        let prev = defaults.string(forKey: lastVersionKey)
        previousAppVersion = prev
        isUpdate = (prev != nil && prev != current)
        defaults.set(current, forKey: lastVersionKey)
    }

    /// Secondes écoulées depuis la première installation (0 si indisponible).
    private func secondsSinceInstall() -> Int {
        guard let d = ISO8601DateFormatter().date(from: installDate()) else { return 0 }
        return max(0, Int(Date().timeIntervalSince(d)))
    }

    /// Capacité disque (octets) du volume de l'app. Statique, anonyme.
    private func diskCapacity() -> (total: Int64, free: Int64)? {
        let url = URL(fileURLWithPath: NSHomeDirectory())
        guard let v = try? url.resourceValues(forKeys: [
            .volumeTotalCapacityKey, .volumeAvailableCapacityForImportantUsageKey,
        ]) else { return nil }
        let total = Int64(v.volumeTotalCapacity ?? 0)
        let free = v.volumeAvailableCapacityForImportantUsage ?? 0
        return (total, free)
    }

    /// Détection de jailbreak best-effort, anonyme et PASSIVE (simple existence de fichiers
    /// connus ; aucune écriture hors sandbox pour ne rien déclencher en App Review). Boolean.
    private func isJailbrokenBestEffort() -> Bool {
        #if targetEnvironment(simulator)
        return false
        #else
        let suspects = [
            "/Applications/Cydia.app", "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/bin/bash", "/usr/sbin/sshd", "/etc/apt", "/private/var/lib/apt/", "/usr/bin/ssh",
        ]
        return suspects.contains { FileManager.default.fileExists(atPath: $0) }
        #endif
    }
}

#if canImport(SwiftUI)
@available(iOS 13.0, macOS 10.15, tvOS 13.0, watchOS 6.0, *)
public extension View {
    /// Marque cette vue comme un écran nommé pour l'entonnoir d'onboarding Appolyn.
    /// Une seule ligne : `.appolynScreen("welcome")`. Émis à chaque apparition de l'écran.
    func appolynScreen(_ name: String) -> some View {
        self.onAppear { Appolyn.screen(name) }
    }
}
#endif
