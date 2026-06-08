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
      };
      const keyId = (body.key_id ?? "").trim();
      const issuerId = (body.issuer_id ?? "").trim();
      const newKey = (body.private_key ?? "").trim();

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
    if (action === "get-localizations") {
      const body = await req.json() as { appId: string };
      const versionRes = await ascFetch(
        `/apps/${body.appId}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION,DEVELOPER_REJECTED,REJECTED,METADATA_REJECTED&limit=1`,
        token,
      );
      const versionData = await json<{ data?: { id: string }[] }>(versionRes);
      const versionId = versionData.data?.[0]?.id;
      if (!versionId) {
        return respond({ error: "No editable version found. Make sure you have a version in 'Prepare for Submission' state." }, 404);
      }
      const locRes = await ascFetch(
        `/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=50`,
        token,
      );
      const locData = await json<{ data?: { id: string; attributes: Record<string, unknown> }[] }>(locRes);
      const localizations = (locData.data ?? []).map((l) => ({
        id: l.id,
        locale: l.attributes.locale,
        title: l.attributes.name,
        subtitle: l.attributes.subtitle,
        keywords: l.attributes.keywords,
        description: l.attributes.description,
        promotionalText: l.attributes.promotionalText,
      }));
      return respond({ versionId, localizations });
    }

    // ── update-localization ─────────────────────────────────────────────────
    if (action === "update-localization") {
      const body = await req.json() as {
        localizationId: string;
        title?: string;
        subtitle?: string;
        keywords?: string;
        description?: string;
        promotionalText?: string;
      };
      const { localizationId, ...attrs } = body;
      const r = await ascFetch(`/appStoreVersionLocalizations/${localizationId}`, token, {
        method: "PATCH",
        body: JSON.stringify({
          data: {
            type: "appStoreVersionLocalizations",
            id: localizationId,
            attributes: {
              name: attrs.title,
              subtitle: attrs.subtitle,
              keywords: attrs.keywords,
              description: attrs.description,
              promotionalText: attrs.promotionalText,
            },
          },
        }),
      });
      const data = await json<{ errors?: { detail: string }[] }>(r);
      if (!r.ok) return respond({ error: data.errors?.[0]?.detail ?? "ASC update error" }, r.status);
      return respond({ success: true });
    }

    // ── get-sales ────────────────────────────────────────────────────────────
    if (action === "get-sales") {
      const body = await req.json() as { vendorNumber: string };
      const today = new Date();
      const rows: { date: string; downloads: number; revenue: number }[] = [];

      const reportDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;
      const r = await ascFetch(
        `/salesReports?filter[frequency]=MONTHLY&filter[reportDate]=${reportDate}&filter[reportType]=SALES&filter[vendorNumber]=${body.vendorNumber}&filter[reportSubType]=SUMMARY`,
        token,
      );
      if (!r.ok) {
        return respond({ error: "Sales reports unavailable. Make sure your API key has Sales and Trends access." }, 400);
      }
      const text = await r.text();
      const lines = text.split("\n").slice(1);
      for (const line of lines) {
        if (!line.trim()) continue;
        const cols = line.split("\t");
        const units = parseInt(cols[7] ?? "0", 10) || 0;
        const proceeds = parseFloat(cols[8] ?? "0") || 0;
        const dateStr = cols[9] ?? "";
        if (dateStr) rows.push({ date: dateStr, downloads: units, revenue: proceeds });
      }
      return respond({ rows });
    }

    // ── get-ratings ──────────────────────────────────────────────────────────
    if (action === "get-ratings") {
      const body = await req.json() as { appId: string };
      const r = await ascFetch(`/apps/${body.appId}/customerReviews?sort=-createdDate&limit=10`, token);
      const data = await json<{ data?: { attributes: Record<string, unknown> }[] }>(r);
      if (!r.ok) return respond({ error: "Cannot fetch reviews" }, r.status);

      const ratingRes = await ascFetch(`/apps/${body.appId}?fields[apps]=averageUserRating,userRatingCount`, token);
      const ratingData = await json<{ data?: { attributes: Record<string, unknown> } }>(ratingRes);
      const attrs = ratingData.data?.attributes ?? {};

      return respond({
        averageRating: attrs.averageUserRating ?? null,
        ratingCount: attrs.userRatingCount ?? null,
        reviews: (data.data ?? []).map((rev) => ({
          rating: rev.attributes.rating,
          title: rev.attributes.title,
          body: rev.attributes.body,
          territory: rev.attributes.territory,
          createdDate: rev.attributes.createdDate,
          reviewerNickname: rev.attributes.reviewerNickname,
        })),
      });
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
