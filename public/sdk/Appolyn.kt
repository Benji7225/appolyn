package io.appolyn

import android.app.Application
import android.content.Context
import android.os.Build
import android.provider.Settings
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.TimeZone
import java.util.concurrent.Executors

/**
 * Appolyn — SDK Android (Kotlin), équivalent du SDK iOS.
 *
 * Une seule ligne au démarrage de ton app et tu obtiens automatiquement tes
 * installations, tes utilisateurs et leur source dans Appolyn. Aucune donnée
 * personnelle, aucun IDFA, aucun prompt. Fire-and-forget, file d'attente hors-ligne.
 *
 * Démarrage (dans Application.onCreate) :
 *     Appolyn.start(this, "TA_CLE_SDK")
 *
 * Options (toutes facultatives) :
 *     Appolyn.setSource("TikTok")                 // d'où vient l'utilisateur
 *     Appolyn.setUserProperty("niveau", "Engagé") // pour la Répartition
 *     Appolyn.screen("Welcome")                    // entonnoir d'onboarding
 *     Appolyn.paywall("main")                      // vue de paywall
 *     Appolyn.purchase("pro_yearly", 39.99, "EUR") // achat (si pas via store auto)
 */
object Appolyn {
    const val SDK_VERSION = "1.5.0"
    private const val DEFAULT_ENDPOINT = "https://appolyn.io/api/sdk/ingest"
    private const val PREFS = "appolyn_sdk"

    private var apiKey: String = ""
    private var endpoint: String = DEFAULT_ENDPOINT
    private var appContext: Context? = null
    private val io = Executors.newSingleThreadExecutor()

    /** Démarre le SDK. À appeler une fois, au lancement de l'app. */
    @JvmStatic
    @JvmOverloads
    fun start(application: Application, key: String, endpoint: String? = null) {
        start(application.applicationContext, key, endpoint)
    }

    /** Variante avec un Context simple (ex. depuis une Activity). */
    @JvmStatic
    @JvmOverloads
    fun start(context: Context, key: String, endpoint: String? = null) {
        if (key.isBlank()) return
        apiKey = key
        appContext = context.applicationContext
        endpoint?.let { this.endpoint = it }
        bumpSessionCount()
        send("session_start", emptyMap())
        flushQueue()
    }

    /** Évènement personnalisé. */
    @JvmStatic
    @JvmOverloads
    fun event(name: String, properties: Map<String, Any?>? = null) {
        val extra = HashMap<String, Any?>()
        properties?.let { extra["properties"] = JSONObject(it) }
        send(name, extra)
    }

    /** Source d'acquisition (réponse à « Comment as-tu connu l'app ? »). */
    @JvmStatic
    fun setSource(source: String) = send("set_source", mapOf("source" to source))

    /** Propriété utilisateur (clé/valeur) pour la Répartition. */
    @JvmStatic
    fun setUserProperty(key: String, value: String) =
        send("set_user_property", mapOf("property_key" to key, "property_value" to value))

    /** Écran vu (entonnoir d'onboarding). */
    @JvmStatic
    fun screen(name: String) = send("screen", mapOf("screen" to name))

    /** Vue d'un paywall. */
    @JvmStatic
    fun paywall(id: String) = send("paywall_view", mapOf("paywall" to id))

    /** Achat (utile si tu ne passes pas par la facturation Play auto). */
    @JvmStatic
    @JvmOverloads
    fun purchase(productId: String, price: Double, currency: String = "EUR") =
        send("purchase", mapOf("product_id" to productId, "price" to price, "currency" to currency))

    /** Demande d'autorisation des notifications (opt-in / refus). */
    @JvmStatic
    fun notificationOptIn(granted: Boolean) =
        send("notification_opt_in", mapOf("granted" to granted))

    // ── Payload ──────────────────────────────────────────────────────────────

    private fun basePayload(): JSONObject {
        val ctx = appContext
        val p = JSONObject()
        p.put("sdk_key", apiKey)
        p.put("sdk_version", SDK_VERSION)
        p.put("platform", "android")
        p.put("idfv", deviceId())
        p.put("device_model", "${Build.MANUFACTURER} ${Build.MODEL}")
        p.put("os_name", "Android")
        p.put("os_version", Build.VERSION.RELEASE ?: "")
        p.put("locale", java.util.Locale.getDefault().toLanguageTag())
        p.put("language", java.util.Locale.getDefault().language)
        p.put("region", java.util.Locale.getDefault().country)
        p.put("timezone", TimeZone.getDefault().id)
        p.put("timezone_offset", TimeZone.getDefault().rawOffset / 1000)
        p.put("processor_count", Runtime.getRuntime().availableProcessors())
        p.put("ts", isoNow())
        if (ctx != null) {
            try {
                val pkg = ctx.packageManager.getPackageInfo(ctx.packageName, 0)
                p.put("bundle_id", ctx.packageName)
                p.put("app_version", pkg.versionName ?: "")
                p.put("app_build", longVersionCode(pkg).toString())
            } catch (_: Exception) { /* best effort */ }
            p.put("session_count", prefs(ctx).getInt("session_count", 0))
        }
        return p
    }

    private fun send(event: String, extra: Map<String, Any?>) {
        if (apiKey.isEmpty()) return
        val body = basePayload()
        body.put("event", event)
        for ((k, v) in extra) body.put(k, v)
        post(body)
    }

    // ── Réseau (fire-and-forget + file d'attente hors-ligne) ──────────────────

    private fun post(body: JSONObject) {
        io.execute {
            var ok = false
            try {
                val conn = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 15000
                    readTimeout = 15000
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                }
                conn.outputStream.use { it.write(body.toString().toByteArray()) }
                ok = conn.responseCode in 200..299
                conn.disconnect()
            } catch (_: Exception) { ok = false }
            if (!ok) enqueue(body)
        }
    }

    private fun enqueue(body: JSONObject) {
        val ctx = appContext ?: return
        val sp = prefs(ctx)
        val arr = try { JSONArray(sp.getString("queue", "[]")) } catch (_: Exception) { JSONArray() }
        arr.put(body)
        while (arr.length() > 50) arr.remove(0) // cap du buffer hors-ligne
        sp.edit().putString("queue", arr.toString()).apply()
    }

    private fun flushQueue() {
        val ctx = appContext ?: return
        val sp = prefs(ctx)
        val raw = sp.getString("queue", "[]") ?: "[]"
        val arr = try { JSONArray(raw) } catch (_: Exception) { JSONArray() }
        if (arr.length() == 0) return
        sp.edit().remove("queue").apply()
        for (i in 0 until arr.length()) post(arr.getJSONObject(i))
    }

    // ── Helpers (privacy-safe, aucun IDFA) ────────────────────────────────────

    private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun bumpSessionCount() {
        val ctx = appContext ?: return
        val sp = prefs(ctx)
        sp.edit().putInt("session_count", sp.getInt("session_count", 0) + 1).apply()
    }

    private fun deviceId(): String {
        val ctx = appContext ?: return "unknown"
        return try {
            Settings.Secure.getString(ctx.contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown"
        } catch (_: Exception) { "unknown" }
    }

    @Suppress("DEPRECATION")
    private fun longVersionCode(pkg: android.content.pm.PackageInfo): Long =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) pkg.longVersionCode else pkg.versionCode.toLong()

    private fun isoNow(): String {
        val f = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US)
        f.timeZone = TimeZone.getTimeZone("UTC")
        return f.format(java.util.Date())
    }
}
