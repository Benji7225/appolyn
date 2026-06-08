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

    // ── get-sales ────────────────────────────────────────────────────────────
    // Real downloads + developer proceeds for the last 30 days, from Apple's
    // daily Sales Reports. One report per day (gzipped TSV); days with no sales
    // return 404 and are simply counted as zero. The vendor number is read from
    // the stored credentials, never trusted from the client.
    if (action === "get-sales") {
      const vendorNumber = (credRow.vendor_number ?? "").trim();
      if (!vendorNumber) {
        return respond({ error: "Add your Sales and Trends vendor number in Settings to load real sales." }, 400);
      }

      // Product type identifiers that represent an app's first-time download
      // (free + paid, across device families). Updates/IAP are excluded from the
      // download count, but their proceeds still count toward revenue.
      const DOWNLOAD_TYPES = new Set(["1", "1F", "1T", "F1", "1E", "1EP", "1EU"]);

      const today = new Date();
      const dates: string[] = [];
      for (let i = 1; i <= 30; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - i); // skip today: its report is not ready yet
        dates.push(d.toISOString().slice(0, 10));
      }

      const fetchDay = async (date: string) => {
        const r = await ascFetch(
          `/salesReports?filter[frequency]=DAILY&filter[reportDate]=${date}&filter[reportType]=SALES&filter[reportSubType]=SUMMARY&filter[vendorNumber]=${vendorNumber}`,
          token,
          { headers: { Accept: "application/a-gzip" } },
        );
        if (!r.ok) return { date, downloads: 0, revenue: 0, hasData: false };
        // Apple returns a gzipped TSV file; decompress it.
        const ds = new DecompressionStream("gzip");
        const text = await new Response(
          (r.body as ReadableStream<Uint8Array>).pipeThrough(ds),
        ).text();
        let downloads = 0;
        let revenue = 0;
        const lines = text.split("\n").slice(1);
        for (const line of lines) {
          if (!line.trim()) continue;
          const cols = line.split("\t");
          const productType = (cols[6] ?? "").trim();
          const units = parseInt(cols[7] ?? "0", 10) || 0;
          const proceeds = parseFloat(cols[8] ?? "0") || 0;
          if (DOWNLOAD_TYPES.has(productType)) downloads += units;
          revenue += proceeds * units;
        }
        return { date, downloads, revenue, hasData: true };
      };

      const results = await Promise.all(dates.map(fetchDay));
      const rows = results
        .filter((x) => x.hasData)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(({ date, downloads, revenue }) => ({
          date,
          downloads,
          revenue: Math.round(revenue * 100) / 100,
        }));
      const totalDownloads = rows.reduce((s, r) => s + r.downloads, 0);
      const totalRevenue = Math.round(rows.reduce((s, r) => s + r.revenue, 0) * 100) / 100;

      return respond({ rows, totalDownloads, totalRevenue });
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

    return respond({ error: "Unknown action" }, 400);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return respond({ error: message }, 500);
  }
});
