# Appolyn iOS SDK

Drop-in attribution & analytics for iOS apps. **One line. That's the whole setup.**
Every install, launch and **StoreKit purchase** flows into your Appolyn **Clients**
dashboard: who installed your app, from where, on what device, and what they paid.

No App Tracking Transparency prompt required: the SDK uses the privacy-safe vendor
identifier (IDFV), never the advertising identifier (IDFA).

## Install

**Swift Package Manager (recommended)** — in Xcode: *File → Add Package Dependencies…*
and paste:

```
https://github.com/Benji7225/appolyn-ios
```

Or in `Package.swift`:

```swift
.package(url: "https://github.com/Benji7225/appolyn-ios.git", from: "1.0.0")
```

**Or just copy the file** — drag `Sources/Appolyn/Appolyn.swift` into your project.
That single file *is* the whole SDK, zero dependencies.

## Use

```swift
import Appolyn

// As early as possible (App init or AppDelegate didFinishLaunchingWithOptions).
// This is the entire integration:
Appolyn.start(key: "appolyn_live_xxxxxxxx")   // your key from Appolyn → Settings
```

That's it. The first launch sends `install`, later launches send `launch`, and **every
StoreKit 2 purchase / subscription / renewal is captured automatically** (price +
currency + product id) — you don't add a single line at your paywall.

Want extra custom milestones? They're optional:

```swift
Appolyn.track("trial_start")
Appolyn.track("onboarding_done", properties: ["variant": "B"])
```

Already report revenue yourself and don't want the auto-capture? Disable it:
`Appolyn.start(key: "…", autoStoreKit: false)`.

## What it collects (and what it does not)

On install/launch it sends, per device:

- **IDFV** (vendor identifier — privacy-safe, resets if all your apps are removed)
- device model (`iPhone15,2`), device class, screen size
- OS name & version, app version & build, bundle id
- locale, language, **region/country**, timezone
- install date, first-launch flag, simulator/low-power flags
- timestamp

On a **StoreKit purchase** (auto) or a manual `track(...)`, it adds the event name,
`value` + `currency`, and free-form `properties` (for purchases: `product_id` +
`transaction_id`, deduped so a transaction is never counted twice). **It never collects
the IDFA, contacts, location, or any PII you don't explicitly pass.** Calls are
fire-and-forget with a small offline queue (events sent while offline are retried on the
next launch). The SDK observes transactions read-only and **never calls `finish()`** —
delivering entitlements stays your app's job.

## How attribution works

Every client gets a **source automatically**, no setup:

1. **Apple Search Ads** — the SDK fetches the AdServices attribution token; the server
   asks Apple and, if the install came from an ASA campaign, the source is exact.
2. **Tracked link** (optional) — for paid social Apple never reveals (TikTok, Meta…),
   you can create campaign links; the install is matched to a recent click with a tiered
   confidence score: same country + city < 6h = 0.8, same country < 2h = 0.65, < 24h = 0.5.
3. **Organic** — anything else. That's the honest default.

So you "stop flying blind" out of the box, and only touch tracked links if you run paid
social ads.

## Server contract (for the Appolyn backend)

The SDK `POST`s JSON to `https://appolyn.vercel.app/api/sdk/ingest` (override via
`Appolyn.start(key:endpoint:)`). Example body:

```json
{
  "sdk_key": "appolyn_live_xxxxxxxx",
  "sdk_version": "1.0.0",
  "platform": "ios",
  "event": "install",
  "idfv": "5C2…",
  "device_model": "iPhone15,2",
  "os_version": "18.2",
  "app_version": "1.0",
  "bundle_id": "com.you.app",
  "region": "FR",
  "language": "fr-FR",
  "timezone": "Europe/Paris",
  "install_date": "2026-06-13T15:00:00Z",
  "value": 4.99,
  "currency": "EUR",
  "ts": "2026-06-13T15:00:01Z"
}
```

The ingest endpoint validates `sdk_key`, resolves the owning app/account, upserts the
device into `Clients`, aggregates revenue, runs tiered attribution, and appends the
event. It's **live** at the URL above — drop the SDK in and the dashboard lights up.

## Privacy stance

The SDK is built to be App Store safe with **no ATT prompt**: it relies only on the
IDFV and standard device facts. If you later add IDFA-based attribution, that becomes
your choice and requires the ATT prompt — Appolyn does not need it.
