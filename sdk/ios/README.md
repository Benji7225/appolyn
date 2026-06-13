# Appolyn iOS SDK

Drop-in attribution & analytics for iOS apps. **One line to start.** Every install,
launch and event flows into your Appolyn **Clients** dashboard: who installed your
app, from where, on what device, and what they bought.

No App Tracking Transparency prompt required: the SDK uses the privacy-safe vendor
identifier (IDFV), never the advertising identifier (IDFA).

## Install

**Swift Package Manager (recommended)** — in Xcode: *File → Add Packages…* and paste
the package URL (the `sdk/ios` folder of the Appolyn repo). Or in `Package.swift`:

```swift
.package(url: "https://github.com/Benji7225/appolyn-sdk-ios.git", from: "1.0.0")
```

**Or just copy the file** — drag `Sources/Appolyn/Appolyn.swift` into your project.
That single file *is* the whole SDK, zero dependencies.

## Use

```swift
import Appolyn

// As early as possible (App init or AppDelegate didFinishLaunchingWithOptions):
Appolyn.start(key: "appolyn_live_xxxxxxxx")   // your key from Appolyn → Settings

// Then track the moments that matter to attribution and revenue:
Appolyn.track("trial_start")
Appolyn.track("purchase", value: 4.99, currency: "EUR")
Appolyn.track("subscribe", value: 49.99, currency: "EUR", properties: ["plan": "yearly"])
```

That's it. The first launch sends an `install` event; later launches send `launch`.

## What it collects (and what it does not)

On install/launch it sends, per device:

- **IDFV** (vendor identifier — privacy-safe, resets if all your apps are removed)
- device model (`iPhone15,2`), device class, screen size
- OS name & version, app version & build, bundle id
- locale, language, **region/country**, timezone
- install date, first-launch flag, simulator/low-power flags
- timestamp

On `track(...)` it adds the event name, optional `value` + `currency`, and free-form
`properties`. **It never collects the IDFA, contacts, location, or any PII you don't
explicitly pass.** Calls are fire-and-forget with a small offline queue (events sent
while offline are retried on the next launch).

## How attribution works

Appolyn matches the SDK's first ping (device + region + timestamp) to the most recent
click on one of your tracked campaign links, and produces an **attributed install**
with a confidence score. So a click on `appolyn.io/s/tiktok-bio` followed by an install
shows up in Clients as "came from TikTok bio".

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

The ingest endpoint validates `sdk_key`, resolves the owning app/account, and upserts
the device into `Clients` + appends the event. **(Endpoint + DB + Clients wiring is the
next build; this SDK already speaks the final contract.)**

## Privacy stance

The SDK is built to be App Store safe with **no ATT prompt**: it relies only on the
IDFV and standard device facts. If you later add IDFA-based attribution, that becomes
your choice and requires the ATT prompt — Appolyn does not need it.
