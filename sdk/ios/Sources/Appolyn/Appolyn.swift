import Foundation
#if canImport(UIKit)
import UIKit
#endif

/// Appolyn iOS SDK — drop-in attribution & analytics.
///
/// One line to start, then every install, launch and event is sent to Appolyn,
/// where it lights up your **Clients** dashboard (who installed, from where, on
/// what device, what they bought). No App Tracking Transparency prompt is needed:
/// we use the privacy-safe vendor identifier (IDFV), never the IDFA.
///
/// ```swift
/// // In your App init / AppDelegate didFinishLaunching:
/// Appolyn.start(key: "appolyn_live_xxxxxxxx")
///
/// // Later, when something happens:
/// Appolyn.track("trial_start")
/// Appolyn.track("purchase", value: 4.99, currency: "EUR")
/// ```
public final class Appolyn {

    public static let shared = Appolyn()
    private init() {}

    private static let sdkVersion = "1.0.0"

    private var apiKey = ""
    private var endpoint = URL(string: "https://appolyn.vercel.app/api/sdk/ingest")!
    private var started = false

    private let defaults = UserDefaults.standard
    private let work = DispatchQueue(label: "app.appolyn.sdk", qos: .utility)
    private let queueKey = "appolyn.event_queue.v1"
    private let installDateKey = "appolyn.install_date"
    private let firstLaunchKey = "appolyn.first_launch_done"

    // MARK: - Public API

    /// Start the SDK. Call once, as early as possible. Sends an `install` event on
    /// the very first launch, then `launch` on subsequent ones.
    /// - Parameters:
    ///   - key: Your Appolyn SDK key (Settings → Connected apps).
    ///   - endpoint: Optional override for the ingest URL (self-host / testing).
    public static func start(key: String, endpoint: URL? = nil) {
        shared.start(key: key, endpoint: endpoint)
    }

    public func start(key: String, endpoint: URL? = nil) {
        work.async {
            guard !self.started else { return }
            self.started = true
            self.apiKey = key
            if let endpoint = endpoint { self.endpoint = endpoint }

            let isNewInstall = self.markFirstLaunchIfNeeded()
            self.send(event: isNewInstall ? "install" : "launch", extra: [:])
            self.flushQueue()
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
}
