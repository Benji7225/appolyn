import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const term = url.searchParams.get("term") ?? "";
    const country = url.searchParams.get("country") ?? "us";
    const limit = url.searchParams.get("limit") ?? "5";

    if (!term) {
      return new Response(JSON.stringify({ error: "term is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=software&limit=${limit}&media=software`;
    const r = await fetch(itunesUrl, {
      headers: { "User-Agent": "Appolyn/1.0" },
    });

    if (!r.ok) {
      return new Response(JSON.stringify({ error: "iTunes API error" }), {
        status: r.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await r.json() as { results: Record<string, unknown>[] };
    const results = (json.results ?? []).map((app) => ({
      trackId: app.trackId,
      trackName: app.trackName,
      artistName: app.artistName,
      artworkUrl100: app.artworkUrl100,
      averageUserRating: app.averageUserRating,
      userRatingCount: app.userRatingCount,
    }));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
