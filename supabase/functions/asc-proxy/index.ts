import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "npm:jose@5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ASC_BASE = "https://api.appstoreconnect.apple.com/v1";

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

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const { data: creds, error: credsError } = await supabase
      .from("asc_credentials")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (credsError || !creds) {
      return new Response(JSON.stringify({ error: "No App Store Connect credentials configured." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await generateToken(
      (creds as Record<string, string>).key_id,
      (creds as Record<string, string>).issuer_id,
      (creds as Record<string, string>).private_key
    );

    const json = <T>(r: Response): Promise<T> => r.json() as Promise<T>;

    // ── validate-credentials ────────────────────────────────────────────────
    if (action === "validate-credentials") {
      const r = await ascFetch("/apps?limit=1", token);
      return new Response(JSON.stringify({ valid: r.ok, status: r.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── list-apps ───────────────────────────────────────────────────────────
    if (action === "list-apps") {
      const r = await ascFetch("/apps?limit=50", token);
      const data = await json<{ data?: Record<string, unknown>[] }>(r);
      if (!r.ok) {
        const err = (data as { errors?: { detail: string }[] }).errors;
        return new Response(JSON.stringify({ error: err?.[0]?.detail ?? "ASC error" }), {
          status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const apps = (data.data ?? []).map((a) => {
        const attrs = a.attributes as Record<string, unknown>;
        return { id: a.id, name: attrs.name, bundleId: attrs.bundleId, primaryLocale: attrs.primaryLocale };
      });
      return new Response(JSON.stringify({ apps }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── get-app-info ─────────────────────────────────────────────────────────
    // Returns: app name, bundle ID, primary locale, rating, review count
    if (action === "get-app-info") {
      const body = await req.json() as { appId: string };
      const r = await ascFetch(`/apps/${body.appId}?fields[apps]=name,bundleId,primaryLocale`, token);
      const data = await json<{ data?: { id: string; attributes: Record<string, unknown> } }>(r);
      if (!r.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch app info" }), {
          status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ app: data.data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── get-localizations ───────────────────────────────────────────────────
    if (action === "get-localizations") {
      const body = await req.json() as { appId: string };
      // Get the most recent editable version
      const versionRes = await ascFetch(
        `/apps/${body.appId}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION,DEVELOPER_REJECTED,REJECTED,METADATA_REJECTED&limit=1`,
        token
      );
      const versionData = await json<{ data?: { id: string }[] }>(versionRes);
      const versionId = versionData.data?.[0]?.id;
      if (!versionId) {
        return new Response(JSON.stringify({ error: "No editable version found. Make sure you have a version in 'Prepare for Submission' state." }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const locRes = await ascFetch(
        `/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=50`,
        token
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
      return new Response(JSON.stringify({ versionId, localizations }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      if (!r.ok) {
        return new Response(JSON.stringify({ error: data.errors?.[0]?.detail ?? "ASC update error" }), {
          status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── get-sales ────────────────────────────────────────────────────────────
    // Returns daily download + proceeds for the last 30 days via Sales Reports
    if (action === "get-sales") {
      const body = await req.json() as { vendorNumber: string };
      // Fetch last 30 days daily summary
      const today = new Date();
      const rows: { date: string; downloads: number; revenue: number }[] = [];

      // ASC Sales Reports: one request per day is expensive; use monthly summary instead
      const reportDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;
      const r = await ascFetch(
        `/salesReports?filter[frequency]=MONTHLY&filter[reportDate]=${reportDate}&filter[reportType]=SALES&filter[vendorNumber]=${body.vendorNumber}&filter[reportSubType]=SUMMARY`,
        token
      );
      if (!r.ok) {
        return new Response(JSON.stringify({ error: "Sales reports unavailable. Make sure your API key has Sales and Trends access." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await r.text();
      // TSV format: parse lines
      const lines = text.split("\n").slice(1); // skip header
      for (const line of lines) {
        if (!line.trim()) continue;
        const cols = line.split("\t");
        // Columns: Provider, Provider Country, SKU, Developer, Title, Version, Product Type Identifier,
        //          Units, Developer Proceeds, Begin Date, End Date, Customer Currency, Country Code,
        //          Currency of Proceeds, Apple Identifier, Customer Price, Promo Code, Parent Identifier,
        //          Subscription, Period, Category, CMB, Device, Supported Platforms, Proceeds Reason,
        //          Preserved Pricing, Client, Order Type
        const units = parseInt(cols[7] ?? "0", 10) || 0;
        const proceeds = parseFloat(cols[8] ?? "0") || 0;
        const dateStr = cols[9] ?? "";
        if (dateStr) rows.push({ date: dateStr, downloads: units, revenue: proceeds });
      }
      return new Response(JSON.stringify({ rows }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── get-ratings ──────────────────────────────────────────────────────────
    if (action === "get-ratings") {
      const body = await req.json() as { appId: string };
      const r = await ascFetch(`/apps/${body.appId}/customerReviews?sort=-createdDate&limit=10`, token);
      const data = await json<{ data?: { attributes: Record<string, unknown> }[] }>(r);
      if (!r.ok) {
        return new Response(JSON.stringify({ error: "Cannot fetch reviews" }), {
          status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Also get rating summary
      const ratingRes = await ascFetch(`/apps/${body.appId}?fields[apps]=averageUserRating,userRatingCount`, token);
      const ratingData = await json<{ data?: { attributes: Record<string, unknown> } }>(ratingRes);
      const attrs = ratingData.data?.attributes ?? {};

      return new Response(JSON.stringify({
        averageRating: attrs.averageUserRating ?? null,
        ratingCount: attrs.userRatingCount ?? null,
        reviews: (data.data ?? []).map((r) => ({
          rating: r.attributes.rating,
          title: r.attributes.title,
          body: r.attributes.body,
          territory: r.attributes.territory,
          createdDate: r.attributes.createdDate,
          reviewerNickname: r.attributes.reviewerNickname,
        })),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── get-subscription-summary ─────────────────────────────────────────────
    if (action === "get-subscription-summary") {
      const body = await req.json() as { appId: string };
      const r = await ascFetch(
        `/apps/${body.appId}/subscriptions?limit=50`,
        token
      );
      const data = await json<{ data?: { id: string; attributes: Record<string, unknown> }[] }>(r);
      if (!r.ok) {
        return new Response(JSON.stringify({ subscriptions: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ subscriptions: data.data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
