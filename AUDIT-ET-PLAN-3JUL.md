# Appolyn — Audit terrain + plan (3 juillet 2026)

> Synthèse de 3 audits code (SDK, chaîne de données, inventaire/onboarding) + vrais chiffres Vision.
> Objectif de Benji: "on connecte une app → TOUTES les données justes et vérifiées, install SANS douleur, SDK au niveau RevenueCat ou mieux, pour n'importe quel dev à n'importe quel stade." Il ne veut PAS payer RevenueCat. Vision = cobaye.

## Ce qui est DÉJÀ bon (ne pas retoucher)
- **Chaîne de données saine et honnête**: zéro mock affiché comme réel (fabrication keywords supprimée ET nettoyée en base), états vides honnêtes partout, gardes anti-division, rien ne casse à 0.
- **Onboarding ASC fluide**: saisie clé/issuer/.p8/vendor auto-validée + redirection auto; sélection d'app en 1 clic depuis les vraies apps ASC; Team ID pas requis (normal).
- **Backend `asc-proxy`** (17 actions) = le vrai moteur, très complet.
- **~2/3 des zones finies sur vraies données**: analytics MRR/ARR/churn/LTV, ASO (localisation 22 langues + keywords + concurrents), avis + réponses IA, site public d'app premium éditable + domaine perso réel, blog SEO cron, facturation Stripe LIVE.
- **Le repo SDK `github.com/Benji7225/appolyn-ios` existe** (public, v1.5.0, poussé 21/06). Les vieilles notes "repo pas créé" sont périmées.

## Vrais chiffres Vision (API ASC, 21/06 → 02/07)
~12 téléchargements neufs, 0 €, 0 essai, 0 abonné. L'app marche, le manque = la distribution. `sdk_clients`/`sdk_events` = 0 → le SDK n'a jamais été branché sur une vraie app.

---

## P0 — Débloquer et fiabiliser l'install SDK (c'est ça, le "c'est chiant")
1. **Tagger le repo `appolyn-ios`** (`git tag 1.5.0` … 1.0.0→1.5.0, push --tags). Sans tag, `from:"1.0.0"` en SPM échoue → le dev se plante à l'étape 2. [S] — action GitHub, vérifier accès push.
2. **Aligner la doc SDK**: `sdk-package/README.md` `from:"1.0.0"` → `1.5.0`; supprimer la note obsolète "repo à créer". [S]
3. **Masquer l'onglet Android** dans `components/dashboard/sdk-modal.tsx` (repo `appolyn-android` = 404, dead-link qui plante le dev) tant que le repo n'existe pas. [S]
4. **Supprimer la copie périmée** `sdk/ios/Sources/Appolyn/Appolyn.swift` (1.2.0, endpoint vercel). Source unique = `sdk-package/`, régénérer `public/sdk/Appolyn.swift` depuis elle. [S]
5. **Parcours d'install unique = "colle ce prompt à ton IA"** (cible = non-codeurs qui utilisent Claude/Cursor): bouton qui copie un prompt complet, `sdk_key` déjà injectée, du type "ajoute le package SPM github.com/Benji7225/appolyn-ios et appelle `Appolyn.start(key:"appolyn_live_xxx")` au lancement". SPM tagué = option "avancé". Infra copier/snippet déjà là dans `sdk-modal.tsx`. [S/M]
6. **Feedback de succès ACTIF**: Supabase Realtime sur `sdk_events` pendant que le dev est sur la page + toast "1er signal reçu 🎉" qui coche l'étape du tunnel; bouton "envoyer un événement test"; faire répondre l'ingest 4xx sur clé inconnue (aujourd'hui 200 muet, `app/api/sdk/ingest/route.ts:70`). [M]

## P1 — Prouver par Vision + correctness
7. **Brancher le SDK sur Vision** (dogfood): ajoute le package + `Appolyn.start(key:)` → remplit `sdk_clients`/`sdk_events`, valide toute la chaîne end-to-end, débloque rétention/funnel/attribution dans le dashboard. ⚠️ = nouveau build Vision (1.0.2), touche l'app publiée → GO explicite de Benji requis. [S/M]
8. **Scoper les 5 requêtes SDK par `app_id`**: `app/(dashboard)/app/analytics/page.tsx` L~337/367/390/404/425 (`loadProducts`/`loadFunnel`/`loadClientStats`/`loadTrials`/`loadRetention`) manquent `.eq('app_id', selectedApp.id)`. Bug multi-apps (mélange les apps), sans impact pour Vision mono-app. [M]
9. **Durcir le fallback "compte entier"** du filtre par app dans `asc-proxy` (`keepRow`/`keepSubRow`): quand la colonne Apple Identifier manque, renvoyer un flag "filtrage indispo" plutôt que mélanger silencieusement. [S]

## P2 — SDK vers la parité RevenueCat (côté "accès premium" + revenu fiable)
10. **Environnement StoreKit**: lire `tx.environment` pour ne PAS compter Sandbox/TestFlight comme revenu prod. [S]
11. **Events remboursement/annulation**: émettre `refund`/`cancel`/`expired` (aujourd'hui le remboursement est juste ignoré, jamais décrémenté → revenu ne baisse jamais) + décrémenter côté ingest. Lire `Product.SubscriptionInfo`/`RenewalInfo` (auto-renew off, grace period). [M]
12. **App Store Server Notifications V2** (webhook Apple → serveur): capter renouvellements/annulations/remboursements même app fermée. C'est ce qui rend RevenueCat fiable. [L]
13. **API de statut premium dans l'app**: exposer `Appolyn.isSubscribed` / callback d'entitlement calculé depuis `currentEntitlements` (déjà lu en interne). 1er pas concret de parité, sans backend. [M]
14. **Objet type `CustomerInfo`** (entitlements actifs + expiration) + **`Appolyn.restore()`** (`AppStore.sync()`). [L]
15. **Migration versionnée** pour `sdk_clients`/`sdk_events` + RLS (aujourd'hui créées à la main hors migrations, non auditables). [S]

## P3 — Cohérence produit / DX
16. **Finance**: soit la retirer de la sidebar (`sidebar.tsx:47`), soit retirer le commentaire "masquée de la nav". Ne jamais faire passer le simulateur pour de la donnée. [S]
17. **Fraîcheur des données**: afficher "données au JJ/MM" + distinguer "Apple prépare tes rapports" de "pas de données" (App Analytics async). Le backend renvoie déjà `from`/`to`/`reason`. [S]
18. **Section SDK dans `/docs`** (aujourd'hui la doc publique ne parle que d'ASC). [S]
19. **Cap/pagination** des requêtes SDK (rétention lit 20k events) → agrégation SQL/RPC quand le volume grimpe. [M, plus tard]

## Ordre d'attaque proposé
P0 (1→6) d'abord (débloque l'install, safe, déployable) → P1.8/9 (correctness) → P1.7 (Vision, sur GO) → P2 (parité RC, gros) → P3 (polish).
