import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "npm:jose@5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ASC_BASE = "https://api.appstoreconnect.apple.com/v1";

// ── Encryption at rest ──────────────────────────────────────────────────────
// The App Store Connect .p8 private key is encrypted with AES-256-GCM before it
// ever reaches the database. The encryption key is derived (HKDF-SHA256) from a
// secret that lives only in the edge runtime env (a dedicated ASC_ENCRYPTION_KEY
// if set, otherwise the service-role key). It is never stored in the DB nor sent
// to the browser, so a database dump alone cannot reveal the .p8.
const textEncoder = new TextEncoder();

async function getAesKey(): Promise<CryptoKey> {
  const secret =
    Deno.env.get("ASC_ENCRYPTION_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const baseKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    "HKDF",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: textEncoder.encode("appolyn-asc-credentials-v1"),
      info: textEncoder.encode("asc-private-key-encryption"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64ToBytes(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      textEncoder.encode(plaintext),
    ),
  );
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return "v1:" + bytesToB64(combined);
}

async function decryptSecret(stored: string): Promise<string> {
  if (!stored) return "";
  // Backward compatibility: rows written before encryption are plaintext.
  if (!stored.startsWith("v1:")) return stored;
  const key = await getAesKey();
  const raw = b64ToBytes(stored.slice(3));
  const iv = raw.slice(0, 12);
  const data = raw.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(pt);
}

async function generateToken(keyId: string, issuerId: string, privateKeyPem: string): Promise<string> {
  const privateKey = await importPKCS8(privateKeyPem, "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuer(issuerId)
    .setIssuedAt()
    .setExpirationTime("20m")
    .setAudience("appstoreconnect-v1")
    .sign(privateKey);
}

async function ascFetch(path: string, token: string, options?: RequestInit) {
  const r = await fetch(`${ASC_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  return r;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond({ error: "Unauthorized" }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) return respond({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ── save-credentials ─────────────────────────────────────────────────────
    // Encrypts the .p8 private key before storing. The only write path for ASC
    // credentials; the browser never writes the key directly. If no new key is
    // provided but one already exists, the stored key is preserved.
    if (action === "save-credentials") {
      const body = await req.json() as {
        key_id?: string;
        issuer_id?: string;
        private_key?: string;
        vendor_number?: string;
      };
      const keyId = (body.key_id ?? "").trim();
      const issuerId = (body.issuer_id ?? "").trim();
      const newKey = (body.private_key ?? "").trim();
      const vendorNumber = (body.vendor_number ?? "").trim();

      if (!keyId || !issuerId) {
        return respond({ error: "Key ID and Issuer ID are required." }, 400);
      }

      const { data: existing } = await supabase
        .from("asc_credentials")
        .select("private_key")
        .eq("user_id", user.id)
        .maybeSingle();

      let encryptedKey: string;
      if (newKey) {
        if (!newKey.includes("-----BEGIN")) {
          return respond({ error: "That does not look like a valid .p8 private key." }, 400);
        }
        encryptedKey = await encryptSecret(newKey);
      } else if (existing && (existing as { private_key?: string }).private_key) {
        encryptedKey = (existing as { private_key: string }).private_key;
      } else {
        return respond({ error: "A private key (.p8) is required." }, 400);
      }

      const { error: upsertError } = await supabase
        .from("asc_credentials")
        .upsert({
          user_id: user.id,
          key_id: keyId,
          issuer_id: issuerId,
          private_key: encryptedKey,
          vendor_number: vendorNumber,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) return respond({ error: upsertError.message }, 500);
      return respond({ success: true });
    }

    // Every other action needs decrypted credentials to call Apple.
    const { data: creds, error: credsError } = await supabase
      .from("asc_credentials")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (credsError || !creds) {
      return respond({ error: "No App Store Connect credentials configured." }, 400);
    }

    const credRow = creds as Record<string, string>;
    const privateKeyPem = await decryptSecret(credRow.private_key);
    const token = await generateToken(credRow.key_id, credRow.issuer_id, privateKeyPem);

    const json = <T>(r: Response): Promise<T> => r.json() as Promise<T>;

    // ── validate-credentials ────────────────────────────────────────────────
    if (action === "validate-credentials") {
      const r = await ascFetch("/apps?limit=1", token);
      return respond({ valid: r.ok, status: r.status });
    }

    // ── list-apps ───────────────────────────────────────────────────────────
    if (action === "list-apps") {
      const r = await ascFetch("/apps?limit=50", token);
      const data = await json<{ data?: Record<string, unknown>[] }>(r);
      if (!r.ok) {
        const err = (data as { errors?: { detail: string }[] }).errors;
        return respond({ error: err?.[0]?.detail ?? "ASC error" }, r.status);
      }
      const apps = (data.data ?? []).map((a) => {
        const attrs = a.attributes as Record<string, unknown>;
        return { id: a.id, name: attrs.name, bundleId: attrs.bundleId, primaryLocale: attrs.primaryLocale };
      });
      return respond({ apps });
    }

    // ── get-app-info ─────────────────────────────────────────────────────────
    if (action === "get-app-info") {
      const body = await req.json() as { appId: string };
      const r = await ascFetch(`/apps/${body.appId}?fields[apps]=name,bundleId,primaryLocale`, token);
      const data = await json<{ data?: { id: string; attributes: Record<string, unknown> } }>(r);
      if (!r.ok) return respond({ error: "Failed to fetch app info" }, r.status);
      return respond({ app: data.data });
    }

    // ── get-localizations ───────────────────────────────────────────────────
    // Apple splits an app's localized metadata across TWO resources:
    //   - appStoreVersionLocalizations: keywords, description, promotionalText
    //   - appInfoLocalizations:         name (title), subtitle
    // We fetch both and merge them by locale, so title/subtitle are correct.
    // Reading works in any state; only publishing needs an editable version.
    const EDITABLE_STATES = [
      "PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED",
    ];
    if (action === "get-localizations") {
      const body = await req.json() as { appId: string };

      const versionRes = await ascFetch(`/apps/${body.appId}/appStoreVersions?limit=10`, token);
      const versionData = await json<{ data?: { id: string; attributes: Record<string, unknown> }[] }>(versionRes);
      const versions = versionData.data ?? [];
      const chosenVersion = versions.find((v) => EDITABLE_STATES.includes(v.attributes.appStoreState as string)) ?? versions[0];
      if (!chosenVersion) {
        return respond({ error: "No App Store version found for this app." }, 404);
      }
      const versionId = chosenVersion.id;
      const versionState = chosenVersion.attributes.appStoreState as string;
      const editable = EDITABLE_STATES.includes(versionState);

      // keywords / description / promotionalText, per locale
      const locRes = await ascFetch(`/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=50`, token);
      const locData = await json<{ data?: { id: string; attributes: Record<string, unknown> }[] }>(locRes);
      const versionByLocale: Record<string, { id: string; keywords: string; description: string; promotionalText: string }> = {};
      for (const l of (locData.data ?? [])) {
        const a = l.attributes;
        versionByLocale[a.locale as string] = {
          id: l.id,
          keywords: (a.keywords as string) ?? "",
          description: (a.description as string) ?? "",
          promotionalText: (a.promotionalText as string) ?? "",
        };
      }

      // name (title) / subtitle, per locale, from the app's appInfo
      const infoByLocale: Record<string, { id: string; name: string; subtitle: string }> = {};
      const infoRes = await ascFetch(`/apps/${body.appId}/appInfos?limit=10`, token);
      const infoData = await json<{ data?: { id: string; attributes: Record<string, unknown> }[] }>(infoRes);
      const infos = infoData.data ?? [];
      const chosenInfo = infos.find((i) => EDITABLE_STATES.includes(i.attributes.appStoreState as string)) ?? infos[0];
      if (chosenInfo) {
        const ailRes = await ascFetch(`/appInfos/${chosenInfo.id}/appInfoLocalizations?limit=50`, token);
        const ailData = await json<{ data?: { id: string; attributes: Record<string, unknown> }[] }>(ailRes);
        for (const l of (ailData.data ?? [])) {
          const a = l.attributes;
          infoByLocale[a.locale as string] = {
            id: l.id,
            name: (a.name as string) ?? "",
            subtitle: (a.subtitle as string) ?? "",
          };
        }
      }

      const locales = Array.from(new Set([...Object.keys(versionByLocale), ...Object.keys(infoByLocale)]));
      const localizations = locales.map((locale) => {
        const v = versionByLocale[locale];
        const info = infoByLocale[locale];
        return {
          locale,
          id: v?.id ?? null,                   // appStoreVersionLocalization id
          infoLocalizationId: info?.id ?? null, // appInfoLocalization id
          title: info?.name ?? "",
          subtitle: info?.subtitle ?? "",
          keywords: v?.keywords ?? "",
          description: v?.description ?? "",
          promotionalText: v?.promotionalText ?? "",
        };
      });

      return respond({ versionId, versionState, editable, localizations });
    }

    // ── update-localization ─────────────────────────────────────────────────
    // Publishes to BOTH Apple resources: keywords/description/promotionalText go
    // to the appStoreVersionLocalization, name/subtitle go to the
    // appInfoLocalization. Each has its own id.
    if (action === "update-localization") {
      const body = await req.json() as {
        localizationId?: string;       // appStoreVersionLocalization id
        infoLocalizationId?: string;   // appInfoLocalization id
        title?: string;
        subtitle?: string;
        keywords?: string;
        description?: string;
        promotionalText?: string;
      };
      const errors: string[] = [];

      if (body.localizationId && (body.keywords !== undefined || body.description !== undefined || body.promotionalText !== undefined)) {
        const r = await ascFetch(`/appStoreVersionLocalizations/${body.localizationId}`, token, {
          method: "PATCH",
          body: JSON.stringify({
            data: {
              type: "appStoreVersionLocalizations",
              id: body.localizationId,
              attributes: {
                keywords: body.keywords,
                description: body.description,
                promotionalText: body.promotionalText,
              },
            },
          }),
        });
        if (!r.ok) {
          const d = await json<{ errors?: { detail: string }[] }>(r);
          errors.push(d.errors?.[0]?.detail ?? "Keywords/description update failed");
        }
      }

      if (body.infoLocalizationId && (body.title !== undefined || body.subtitle !== undefined)) {
        const r = await ascFetch(`/appInfoLocalizations/${body.infoLocalizationId}`, token, {
          method: "PATCH",
          body: JSON.stringify({
            data: {
              type: "appInfoLocalizations",
              id: body.infoLocalizationId,
              attributes: {
                name: body.title,
                subtitle: body.subtitle,
              },
            },
          }),
        });
        if (!r.ok) {
          const d = await json<{ errors?: { detail: string }[] }>(r);
          errors.push(d.errors?.[0]?.detail ?? "Title/subtitle update failed");
        }
      }

      if (!body.localizationId && !body.infoLocalizationId) {
        return respond({ error: "Nothing to publish: no localization IDs. Fetch from App Store Connect first." }, 400);
      }
      if (errors.length) return respond({ error: errors.join("; ") }, 400);
      return respond({ success: true });
    }

    // ── publish-localizations ─────────────────────────────────────────────────
    // One-click publish of many locales to App Store Connect. For each locale it
    // create-or-updates BOTH Apple resources:
    //   - appStoreVersionLocalizations (keywords/description/promotionalText)
    //   - appInfoLocalizations          (name/subtitle)
    // Locales that don't exist yet are POSTed (created) and linked to the editable
    // version/appInfo; existing ones are PATCHed. Each locale reports its own
    // result, so a partial failure never blocks the rest. Publishing requires an
    // editable version (e.g. "Prepare for Submission").
    if (action === "publish-localizations") {
      const body = await req.json() as {
        appId: string;
        localizations: {
          locale: string;
          title?: string;
          subtitle?: string;
          keywords?: string;
          description?: string;
          promotionalText?: string;
        }[];
      };
      if (!body.appId || !Array.isArray(body.localizations) || body.localizations.length === 0) {
        return respond({ error: "appId and at least one localization are required." }, 400);
      }

      // Resolve the editable App Store version (target for keywords/description).
      const versionRes = await ascFetch(`/apps/${body.appId}/appStoreVersions?limit=10`, token);
      const versionData = await json<{ data?: { id: string; attributes: Record<string, unknown> }[] }>(versionRes);
      const versions = versionData.data ?? [];
      const version = versions.find((v) => EDITABLE_STATES.includes(v.attributes.appStoreState as string));
      if (!version) {
        const state = (versions[0]?.attributes.appStoreState as string) ?? "unknown";
        return respond({
          error: `No editable App Store version (current state: ${state}). Metadata can only be published while a version is editable, e.g. "Prepare for Submission".`,
          editable: false,
        }, 409);
      }

      // Resolve the appInfo (target for name/subtitle).
      const infoRes = await ascFetch(`/apps/${body.appId}/appInfos?limit=10`, token);
      const infoData = await json<{ data?: { id: string; attributes: Record<string, unknown> }[] }>(infoRes);
      const infos = infoData.data ?? [];
      const appInfo = infos.find((i) => EDITABLE_STATES.includes(i.attributes.appStoreState as string)) ?? infos[0];

      // Map existing localizations to their ids so we know create vs update.
      const vLocRes = await ascFetch(`/appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=100`, token);
      const vLocData = await json<{ data?: { id: string; attributes: Record<string, unknown> }[] }>(vLocRes);
      const vIdByLocale: Record<string, string> = {};
      for (const l of (vLocData.data ?? [])) vIdByLocale[l.attributes.locale as string] = l.id;

      const iIdByLocale: Record<string, string> = {};
      if (appInfo) {
        const iLocRes = await ascFetch(`/appInfos/${appInfo.id}/appInfoLocalizations?limit=100`, token);
        const iLocData = await json<{ data?: { id: string; attributes: Record<string, unknown> }[] }>(iLocRes);
        for (const l of (iLocData.data ?? [])) iIdByLocale[l.attributes.locale as string] = l.id;
      }

      type PubLoc = (typeof body.localizations)[number];
      const publishOne = async (loc: PubLoc): Promise<{ locale: string; ok: boolean; error?: string }> => {
        const errs: string[] = [];

        // appStoreVersionLocalization: keywords / description / promotionalText
        const vAttrs: Record<string, unknown> = {};
        if (loc.keywords !== undefined) vAttrs.keywords = loc.keywords;
        if (loc.description !== undefined) vAttrs.description = loc.description;
        if (loc.promotionalText !== undefined) vAttrs.promotionalText = loc.promotionalText;
        const existingVId = vIdByLocale[loc.locale];
        if (existingVId) {
          if (Object.keys(vAttrs).length) {
            const r = await ascFetch(`/appStoreVersionLocalizations/${existingVId}`, token, {
              method: "PATCH",
              body: JSON.stringify({ data: { type: "appStoreVersionLocalizations", id: existingVId, attributes: vAttrs } }),
            });
            if (!r.ok) {
              const d = await json<{ errors?: { detail: string }[] }>(r);
              errs.push(d.errors?.[0]?.detail ?? "keywords/description update failed");
            }
          }
        } else {
          const r = await ascFetch(`/appStoreVersionLocalizations`, token, {
            method: "POST",
            body: JSON.stringify({
              data: {
                type: "appStoreVersionLocalizations",
                attributes: { locale: loc.locale, ...vAttrs },
                relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: version.id } } },
              },
            }),
          });
          if (!r.ok) {
            const d = await json<{ errors?: { detail: string }[] }>(r);
            errs.push(d.errors?.[0]?.detail ?? "could not add this locale to the version");
          }
        }

        // appInfoLocalization: name (title) / subtitle
        const iAttrs: Record<string, unknown> = {};
        if (loc.title !== undefined) iAttrs.name = loc.title;
        if (loc.subtitle !== undefined) iAttrs.subtitle = loc.subtitle;
        if (appInfo && Object.keys(iAttrs).length) {
          const existingIId = iIdByLocale[loc.locale];
          if (existingIId) {
            const r = await ascFetch(`/appInfoLocalizations/${existingIId}`, token, {
              method: "PATCH",
              body: JSON.stringify({ data: { type: "appInfoLocalizations", id: existingIId, attributes: iAttrs } }),
            });
            if (!r.ok) {
              const d = await json<{ errors?: { detail: string }[] }>(r);
              errs.push(d.errors?.[0]?.detail ?? "title/subtitle update failed");
            }
          } else {
            const r = await ascFetch(`/appInfoLocalizations`, token, {
              method: "POST",
              body: JSON.stringify({
                data: {
                  type: "appInfoLocalizations",
                  attributes: { locale: loc.locale, ...iAttrs },
                  relationships: { appInfo: { data: { type: "appInfos", id: appInfo.id } } },
                },
              }),
            });
            if (!r.ok) {
              const d = await json<{ errors?: { detail: string }[] }>(r);
              errs.push(d.errors?.[0]?.detail ?? "title/subtitle create failed");
            }
          }
        }

        return { locale: loc.locale, ok: errs.length === 0, error: errs.length ? errs.join("; ") : undefined };
      };

      // Bounded concurrency to stay within Apple's rate limits.
      const queue = [...body.localizations];
      const results: { locale: string; ok: boolean; error?: string }[] = [];
      const workers = Array.from({ length: Math.min(4, queue.length) }, async () => {
        for (let loc = queue.shift(); loc; loc = queue.shift()) {
          results.push(await publishOne(loc));
        }
      });
      await Promise.all(workers);

      const published = results.filter((r) => r.ok).length;
      return respond({ editable: true, published, total: results.length, results });
    }

    // ── get-sales ────────────────────────────────────────────────────────────
    // Real downloads + developer proceeds from Apple's Sales Reports, for an
    // arbitrary window (today / 7j / 30j / 90j / 365j / all-time / custom). To
    // stay fast and within Apple's limits, the report frequency adapts to the
    // span: DAILY for <= ~3 months, WEEKLY up to a year, MONTHLY beyond. Reports
    // are parsed BY COLUMN NAME so the layout stays correct across Apple's
    // report-version reshuffles. Days/weeks/months with no sales return 404 and
    // count as zero. The vendor number comes from stored credentials, never the
    // client. When a comparison is requested, the matching window (previous
    // period, or same window a year earlier) is summed for deltas. Apple's
    // freshest report is yesterday (J-1); "today" never has data yet.
    if (action === "get-sales") {
      const vendorNumber = (credRow.vendor_number ?? "").trim();
      if (!vendorNumber) {
        return respond({ error: "Add your Sales and Trends vendor number in Settings to load real sales." }, 400);
      }

      const body = await req.json().catch(() => ({})) as {
        range?: string; from?: string; to?: string; compare?: "prev" | "year" | "none";
      };

      // Product type identifiers that represent an app's first-time download
      // (free + paid, across device families). Updates/IAP are excluded from the
      // download count, but their proceeds still count toward revenue.
      const DOWNLOAD_TYPES = new Set(["1", "1F", "1T", "F1", "1E", "1EP", "1EU"]);

      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const midnightUtcMinus = (offsetDays: number) => {
        const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() - offsetDays);
        return d;
      };
      const yesterday = midnightUtcMinus(1);
      const dayDiff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);
      const parseDay = (s?: string) => {
        if (!s) return null;
        const d = new Date(`${s}T00:00:00Z`);
        return Number.isNaN(d.getTime()) ? null : d;
      };

      // ── resolve the window [start, end] (end never past yesterday) ──────────
      const range = body.range ?? "30d";
      let end = yesterday;
      let start: Date;
      if (range === "custom") {
        const f = parseDay(body.from), t = parseDay(body.to);
        end = t && t < yesterday ? t : yesterday;
        start = f ?? midnightUtcMinus(30);
        if (start > end) start = end;
      } else {
        const span =
          range === "today" ? 1 :
          range === "7d" ? 7 :
          range === "30d" ? 30 :
          range === "90d" ? 90 :
          range === "365d" ? 365 :
          range === "all" ? 1825 : 30;
        start = new Date(end); start.setUTCDate(start.getUTCDate() - (span - 1));
      }
      let spanDays = dayDiff(end, start) + 1;
      if (spanDays < 1) spanDays = 1;

      // ── chart granularity (also drives the Apple report frequency) ──────────
      const granularity: "day" | "week" | "month" =
        spanDays <= 92 ? "day" : spanDays <= 372 ? "week" : "month";

      // Build the list of Apple report requests covering [winStart, winEnd].
      type Desc = { frequency: "DAILY" | "WEEKLY" | "MONTHLY"; reportDate: string; bucket: string };
      const descriptorsFor = (winStart: Date, winEnd: Date): Desc[] => {
        const out: Desc[] = [];
        if (granularity === "day") {
          for (const d = new Date(winEnd); d >= winStart; d.setUTCDate(d.getUTCDate() - 1)) {
            const s = iso(d);
            out.push({ frequency: "DAILY", reportDate: s, bucket: s });
          }
        } else if (granularity === "week") {
          // Apple weekly reports are keyed by the Sunday that ends the week.
          const d = new Date(winEnd);
          d.setUTCDate(d.getUTCDate() - d.getUTCDay()); // step back to Sunday <= winEnd
          for (; d >= winStart; d.setUTCDate(d.getUTCDate() - 7)) {
            const s = iso(d);
            out.push({ frequency: "WEEKLY", reportDate: s, bucket: s });
          }
        } else {
          const d = new Date(Date.UTC(winEnd.getUTCFullYear(), winEnd.getUTCMonth(), 1));
          const min = new Date(Date.UTC(winStart.getUTCFullYear(), winStart.getUTCMonth(), 1));
          for (; d >= min; d.setUTCMonth(d.getUTCMonth() - 1)) {
            const s = iso(d).slice(0, 7); // Apple expects YYYY-MM for MONTHLY
            out.push({ frequency: "MONTHLY", reportDate: s, bucket: s });
          }
        }
        return out;
      };

      // SALES SUMMARY reports share one schema across DAILY/WEEKLY/MONTHLY.
      type SaleRow = { type: string; units: number; proceeds: number; country: string };
      const parseSales = (text: string): SaleRow[] => {
        const lines = text.split("\n").filter((l) => l.trim().length > 0);
        if (lines.length < 2) return [];
        const headers = lines[0].split("\t").map((h) => h.trim());
        const iType = headers.indexOf("Product Type Identifier");
        const iUnits = headers.indexOf("Units");
        const iProc = headers.indexOf("Developer Proceeds");
        const iCountry = headers.indexOf("Country Code");
        const out: SaleRow[] = [];
        for (const line of lines.slice(1)) {
          const c = line.split("\t");
          out.push({
            type: (c[iType] ?? "").trim(),
            units: parseInt(c[iUnits] ?? "0", 10) || 0,
            proceeds: parseFloat((c[iProc] ?? "0").replace(",", ".")) || 0,
            country: (c[iCountry] ?? "").trim().toUpperCase(),
          });
        }
        return out;
      };

      const fetchReport = async (d: Desc): Promise<{ bucket: string; rows: SaleRow[] }> => {
        const r = await ascFetch(
          `/salesReports?filter[frequency]=${d.frequency}&filter[reportDate]=${d.reportDate}&filter[reportType]=SALES&filter[reportSubType]=SUMMARY&filter[vendorNumber]=${vendorNumber}`,
          token, { headers: { Accept: "application/a-gzip" } },
        );
        if (!r.ok) return { bucket: d.bucket, rows: [] };
        try {
          const ds = new DecompressionStream("gzip");
          const text = await new Response((r.body as ReadableStream<Uint8Array>).pipeThrough(ds)).text();
          return { bucket: d.bucket, rows: parseSales(text) };
        } catch { return { bucket: d.bucket, rows: [] }; }
      };

      // Bounded concurrency so a year of reports doesn't hammer Apple at once.
      const mapPool = async <T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> => {
        const out: R[] = new Array(items.length);
        let i = 0;
        const worker = async () => { while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); } };
        await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
        return out;
      };

      type CountryAgg = { downloads: number; revenue: number };

      // ── current window: bucketed rows + totals + per-country breakdown ──────
      const curReports = await mapPool(descriptorsFor(start, end), 20, fetchReport);
      const bucketMap = new Map<string, { downloads: number; revenue: number }>();
      const countryMap: Record<string, CountryAgg> = {};
      let totalDownloads = 0, totalRevenue = 0;
      for (const rep of curReports) {
        let bd = bucketMap.get(rep.bucket);
        if (!bd) bucketMap.set(rep.bucket, bd = { downloads: 0, revenue: 0 });
        for (const row of rep.rows) {
          const isDownload = DOWNLOAD_TYPES.has(row.type);
          const lineRevenue = row.proceeds * row.units;
          if (isDownload) { bd.downloads += row.units; totalDownloads += row.units; }
          bd.revenue += lineRevenue; totalRevenue += lineRevenue;
          if (row.country) {
            const c = countryMap[row.country] ?? (countryMap[row.country] = { downloads: 0, revenue: 0 });
            if (isDownload) c.downloads += row.units;
            c.revenue += lineRevenue;
          }
        }
      }
      totalRevenue = Math.round(totalRevenue * 100) / 100;

      const rows = Array.from(bucketMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, v]) => ({ date, downloads: v.downloads, revenue: Math.round(v.revenue * 100) / 100 }));

      const byCountry = Object.entries(countryMap)
        .map(([code, a]) => ({ code, downloads: a.downloads, revenue: Math.round(a.revenue * 100) / 100 }))
        .filter((c) => c.revenue !== 0 || c.downloads !== 0)
        .sort((a, b) => b.revenue - a.revenue);

      // ── comparison window (previous period, or same window one year back) ───
      const compare = body.compare ?? "prev";
      let previous: { downloads: number; revenue: number } | null = null;
      if (compare !== "none") {
        let cmpStart: Date, cmpEnd: Date;
        if (compare === "year") {
          cmpStart = new Date(start); cmpStart.setUTCDate(cmpStart.getUTCDate() - 365);
          cmpEnd = new Date(end); cmpEnd.setUTCDate(cmpEnd.getUTCDate() - 365);
        } else {
          cmpEnd = new Date(start); cmpEnd.setUTCDate(cmpEnd.getUTCDate() - 1);
          cmpStart = new Date(cmpEnd); cmpStart.setUTCDate(cmpStart.getUTCDate() - (spanDays - 1));
        }
        const cmpReports = await mapPool(descriptorsFor(cmpStart, cmpEnd), 20, fetchReport);
        let d = 0, rev = 0;
        for (const rep of cmpReports) {
          for (const row of rep.rows) {
            if (DOWNLOAD_TYPES.has(row.type)) d += row.units;
            rev += row.proceeds * row.units;
          }
        }
        previous = { downloads: d, revenue: Math.round(rev * 100) / 100 };
      }

      return respond({
        granularity, rangeDays: spanDays, range, compare,
        from: iso(start), to: iso(end),
        rows, totalDownloads, totalRevenue, previous,
        windowDays: spanDays, byCountry,
      });
    }

    // ── get-ratings ──────────────────────────────────────────────────────────
    if (action === "get-ratings") {
      const body = await req.json() as { appId: string; limit?: number };
      const limit = Math.min(body.limit ?? 10, 50);
      const r = await ascFetch(`/apps/${body.appId}/customerReviews?sort=-createdDate&limit=${limit}&include=response`, token);
      const data = await json<{ data?: { id: string; attributes: Record<string, unknown>; relationships?: Record<string, { data?: { id: string } | null }> }[]; included?: { id: string; attributes: Record<string, unknown> }[] }>(r);
      if (!r.ok) return respond({ error: "Cannot fetch reviews" }, r.status);

      // Map included developer responses by their id.
      const responseById: Record<string, { body: string; state: string }> = {};
      for (const inc of (data.included ?? [])) {
        responseById[inc.id] = {
          body: (inc.attributes.responseBody as string) ?? "",
          state: (inc.attributes.state as string) ?? "",
        };
      }

      const ratingRes = await ascFetch(`/apps/${body.appId}?fields[apps]=averageUserRating,userRatingCount`, token);
      const ratingData = await json<{ data?: { attributes: Record<string, unknown> } }>(ratingRes);
      const attrs = ratingData.data?.attributes ?? {};

      return respond({
        averageRating: attrs.averageUserRating ?? null,
        ratingCount: attrs.userRatingCount ?? null,
        reviews: (data.data ?? []).map((rev) => {
          const respId = rev.relationships?.response?.data?.id;
          const existing = respId ? responseById[respId] : undefined;
          return {
            id: rev.id,
            rating: rev.attributes.rating,
            title: rev.attributes.title,
            body: rev.attributes.body,
            territory: rev.attributes.territory,
            createdDate: rev.attributes.createdDate,
            reviewerNickname: rev.attributes.reviewerNickname,
            responseBody: existing?.body ?? null,
          };
        }),
      });
    }

    // ── respond-review ────────────────────────────────────────────────────────
    // Publishes (or updates) the developer response to a customer review.
    if (action === "respond-review") {
      const body = await req.json() as { reviewId: string; responseBody: string };
      if (!body.reviewId || !body.responseBody?.trim()) {
        return respond({ error: "Review and response text are required." }, 400);
      }
      // Is there already a response to update?
      const exRes = await ascFetch(`/customerReviews/${body.reviewId}/response`, token);
      let existingId: string | null = null;
      if (exRes.ok) {
        const d = await json<{ data?: { id: string } | null }>(exRes);
        existingId = d.data?.id ?? null;
      }
      let r: Response;
      if (existingId) {
        r = await ascFetch(`/customerReviewResponses/${existingId}`, token, {
          method: "PATCH",
          body: JSON.stringify({
            data: { type: "customerReviewResponses", id: existingId, attributes: { responseBody: body.responseBody } },
          }),
        });
      } else {
        r = await ascFetch(`/customerReviewResponses`, token, {
          method: "POST",
          body: JSON.stringify({
            data: {
              type: "customerReviewResponses",
              attributes: { responseBody: body.responseBody },
              relationships: { review: { data: { type: "customerReviews", id: body.reviewId } } },
            },
          }),
        });
      }
      if (!r.ok) {
        const d = await json<{ errors?: { detail: string }[] }>(r);
        return respond({ error: d.errors?.[0]?.detail ?? "Failed to publish response" }, r.status);
      }
      return respond({ success: true });
    }

    // ── get-subscription-summary ─────────────────────────────────────────────
    if (action === "get-subscription-summary") {
      const body = await req.json() as { appId: string };
      const r = await ascFetch(`/apps/${body.appId}/subscriptions?limit=50`, token);
      const data = await json<{ data?: { id: string; attributes: Record<string, unknown> }[] }>(r);
      if (!r.ok) return respond({ subscriptions: [] });
      return respond({ subscriptions: data.data ?? [] });
    }

    // ── get-subscriptions ────────────────────────────────────────────────────
    // Real subscription metrics from Apple's daily SUBSCRIPTION (snapshot of
    // active subs + proceeds) and SUBSCRIPTION_EVENT (subscribe / renew / cancel)
    // reports. Parsed by COLUMN NAME from the TSV header, so it stays correct
    // across Apple's report-version column shuffles. Returns the current window
    // and the previous one (for deltas). Empty until the app has subscribers; no
    // value is ever fabricated.
    if (action === "get-subscriptions") {
      const vendorNumber = (credRow.vendor_number ?? "").trim();
      if (!vendorNumber) {
        return respond({ error: "Ajoute ton numéro de vendeur dans les réglages pour charger les abonnements." }, 400);
      }
      const body = await req.json().catch(() => ({})) as { rangeDays?: number };
      const rangeDays = Math.min(Math.max(body.rangeDays ?? 30, 1), 90);
      const SUB_VERSION = "1_4", EVT_VERSION = "1_4";

      const dayStr = (offset: number) => {
        const d = new Date(); d.setUTCDate(d.getUTCDate() - offset);
        return d.toISOString().slice(0, 10);
      };
      const curDates: string[] = []; for (let i = 1; i <= rangeDays; i++) curDates.push(dayStr(i));
      const prevDates: string[] = []; for (let i = rangeDays + 1; i <= 2 * rangeDays; i++) prevDates.push(dayStr(i));

      const parseTsv = (text: string): Record<string, string>[] => {
        const lines = text.split("\n").filter((l) => l.trim().length > 0);
        if (lines.length < 2) return [];
        const headers = lines[0].split("\t").map((h) => h.trim());
        return lines.slice(1).map((line) => {
          const cols = line.split("\t");
          const row: Record<string, string> = {};
          headers.forEach((h, i) => (row[h] = (cols[i] ?? "").trim()));
          return row;
        });
      };
      const fetchReport = async (date: string, reportType: string, version: string): Promise<Record<string, string>[]> => {
        const r = await ascFetch(
          `/salesReports?filter[frequency]=DAILY&filter[reportDate]=${date}&filter[reportType]=${reportType}&filter[reportSubType]=SUMMARY&filter[vendorNumber]=${vendorNumber}&filter[version]=${version}`,
          token, { headers: { Accept: "application/a-gzip" } },
        );
        if (!r.ok) return [];
        try {
          const ds = new DecompressionStream("gzip");
          const text = await new Response((r.body as ReadableStream<Uint8Array>).pipeThrough(ds)).text();
          return parseTsv(text);
        } catch { return []; }
      };

      const num = (s: string | undefined) => { const n = parseFloat((s ?? "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };
      const monthlyFactor = (duration: string): number => {
        const d = (duration || "").toLowerCase();
        if (d.includes("year")) return 1 / 12;
        if (d.includes("6 month")) return 1 / 6;
        if (d.includes("3 month")) return 1 / 3;
        if (d.includes("2 month")) return 1 / 2;
        if (d.includes("month")) return 1;
        if (d.includes("week")) return 4.345;
        if (d.includes("day")) return 30;
        return 1;
      };
      const ACTIVE_COLS = [
        "Active Standard Price Subscriptions",
        "Active Free Trial Introductory Offer Subscriptions",
        "Active Pay Up Front Introductory Offer Subscriptions",
        "Active Pay As You Go Introductory Offer Subscriptions",
      ];
      // Most recent day in the list that actually has rows = current active picture.
      const snapshotFor = async (dates: string[]): Promise<{ active: number; mrr: number }> => {
        for (const date of dates) {
          const rows = await fetchReport(date, "SUBSCRIPTION", SUB_VERSION);
          if (rows.length === 0) continue;
          let active = 0, mrr = 0;
          for (const row of rows) {
            const count = ACTIVE_COLS.reduce((s, c) => s + num(row[c]), 0);
            if (count <= 0) continue;
            active += count;
            const proceeds = num(row["Developer Proceeds"]) || num(row["Customer Price"]);
            mrr += proceeds * monthlyFactor(row["Standard Subscription Duration"] ?? "") * count;
          }
          return { active, mrr: Math.round(mrr * 100) / 100 };
        }
        return { active: 0, mrr: 0 };
      };
      const eventsFor = async (dates: string[]): Promise<{ subscribe: number; renew: number; cancel: number }> => {
        const totals = { subscribe: 0, renew: 0, cancel: 0 };
        const reports = await Promise.all(dates.map((d) => fetchReport(d, "SUBSCRIPTION_EVENT", EVT_VERSION)));
        for (const rows of reports) {
          for (const row of rows) {
            const event = (row["Event"] ?? "").toLowerCase();
            const qty = num(row["Quantity"]) || 1;
            if (event === "subscribe") totals.subscribe += qty;
            else if (event === "renew") totals.renew += qty;
            else if (event === "cancel") totals.cancel += qty;
          }
        }
        return totals;
      };

      const [snap, prevSnap, ev, prevEv] = await Promise.all([
        snapshotFor(curDates), snapshotFor(prevDates), eventsFor(curDates), eventsFor(prevDates),
      ]);

      const renewalRate = (ev.renew + ev.cancel) > 0 ? Math.round((ev.renew / (ev.renew + ev.cancel)) * 100) : null;
      const prevRenewalRate = (prevEv.renew + prevEv.cancel) > 0 ? Math.round((prevEv.renew / (prevEv.renew + prevEv.cancel)) * 100) : null;
      const churnRate = snap.active > 0 ? Math.round((ev.cancel / snap.active) * 100) : null;
      const prevChurnRate = prevSnap.active > 0 ? Math.round((prevEv.cancel / prevSnap.active) * 100) : null;

      const pack = (s: { active: number; mrr: number }, e: { subscribe: number; renew: number; cancel: number }, rr: number | null, ch: number | null) => ({
        activeSubscribers: s.active,
        mrr: s.mrr,
        arr: Math.round(s.mrr * 12 * 100) / 100,
        newSubscribers: e.subscribe,
        cancellations: e.cancel,
        renewals: e.renew,
        renewalRate: rr,
        churnRate: ch,
      });

      return respond({
        rangeDays,
        current: pack(snap, ev, renewalRate, churnRate),
        previous: pack(prevSnap, prevEv, prevRenewalRate, prevChurnRate),
      });
    }

    return respond({ error: "Unknown action" }, 400);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return respond({ error: message }, 500);
  }
});
