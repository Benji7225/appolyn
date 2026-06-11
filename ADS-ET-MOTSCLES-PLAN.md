# Appolyn — Plan : Gestion des pubs + Popularité mots-clés réelle

> Écrit la nuit du 11→12 juin pendant que Benji dort, pour qu'au réveil on exécute
> vite. Les 2 gros chantiers demandés dépendent d'**identifiants/comptes que seul
> Benji peut créer**. Claude ne peut pas les provisionner. Tant que ces accès
> n'existent pas, coder l'UR serait un "chemin mort" (interdit par la règle produit
> "zéro chemin mort"). Voici exactement quoi fournir et dans quel ordre construire.

---

## ✅ Déjà fait cette nuit (branche `keywords-real-metrics`)

La page **Keywords** ne ment plus. Les scores popularité/difficulté/ranking étaient
fabriqués (`hash` du mot-clé + `Math.random()`). Remplacés par du **réel**, calculé
en direct depuis l'App Store (iTunes Search) :
- **Difficulté** = force des concurrents en tête (volume d'avis, log-scalé) + part
  d'entre eux qui ciblent le mot-clé dans leur titre.
- **Popularité** = estimation de la demande d'après la traction cumulée des apps
  positionnées sur le terme.
- **Ranking** = la **vraie** position de ton app, matchée par `asc_app_id == trackId`.
- Les anciens mots-clés (qui avaient des valeurs fausses) sont recalculés + corrigés
  en base au chargement. Aucun chiffre faux n'est plus affiché.

⚠️ Limite honnête affichée dans l'UI : la **popularité EXACTE des recherches** (le
chiffre officiel Apple) nécessite **Apple Search Ads** → c'est le chantier A ci-dessous.

À déployer : merger `keywords-real-metrics` → `main` (auto-deploy Vercel). Pas fait
cette nuit exprès (pas de déploiement prod sans ton OK).

---

## A. Popularité mots-clés RÉELLE — Apple Search Ads (rapide, le plus pertinent)

**Ce que ça apporte :** le vrai score de popularité de recherche Apple (échelle
officielle) + suggestions de mots-clés Apple. Remplace l'estimation actuelle par la
donnée source.

**Ce qu'il faut de toi (gratuit, même sans dépenser un euro en pub) :**
1. Créer un compte **Apple Search Ads** (searchads.apple.com) avec ton Apple ID dev.
2. Générer une **clé API Search Ads** : Account Settings → API → créer un certificat
   d'API → tu obtiens `clientId`, `clientSecret`, `orgId`. (C'est une clé SÉPARÉE de
   ta clé App Store Connect `.p8`.)
3. Me transmettre `clientId/clientSecret/orgId` via **Vercel env ou Supabase secrets**
   (jamais dans le repo, jamais à Bolt).

**Où ça se branche :** nouvelle action dans une edge function (même patron que
`asc-proxy` : secret côté serveur, OAuth2 client-credentials Search Ads). La page
Keywords affiche la popularité officielle quand le compte est connecté, sinon garde
l'estimation actuelle. Build estimé : court (½ journée).

---

## B. Gestion des comptes publicitaires (le gros morceau)

**Périmètre :** connecter les comptes pub, voir campagnes + perfs, et piloter
(créer/éditer/mettre en pause) des campagnes depuis Appolyn.

**Plateformes, par pertinence pour un dev d'app iOS :**

| # | Plateforme | API | Ce qu'il faut créer (toi) | Friction |
|---|-----------|-----|---------------------------|----------|
| 1 | **Apple Search Ads** | Campaign Management API | même compte/clé que A | faible (déjà à moitié là) |
| 2 | **Meta Ads** (FB/Insta) | Marketing API | App Meta avec permission `ads_management` + Business Manager + System User token. ⚠️ vérifier si l'app Meta du crosspost est réutilisable | moyenne (revue Meta pour `ads_management`) |
| 3 | **TikTok Ads** | Marketing API | App **TikTok for Business** (différente de l'app Content Posting déjà créée) + accès Marketing API | moyenne |
| 4 | **Google Ads** | Google Ads API | **developer token** (à faire approuver par Google, peut prendre des jours) + OAuth client + compte MCC | élevée (le plus long) |

**Ordre de build conseillé :** Apple Search Ads → Meta → TikTok → Google (Google en
dernier car le developer token est long à obtenir).

**Modèle de données proposé** (même patron sécurisé que `social_accounts`) :
- `ad_accounts` (user_id, platform, external_account_id, name, tokens **chiffrés au
  repos**, status) — RLS par user_id.
- `ad_campaigns` (cache lecture des campagnes + métriques, synchro pull).

**Réutilisable tel quel :** le patron OAuth start/callback + state signé + chiffrement
navigateur→DB (déjà en place pour YouTube/Meta/TikTok côté contenu) et le chiffrement
de tokens (`lib/server/social.ts`).

---

## Sécurité (rappel, non négociable)

- Tous les `client_secret` / tokens → **Vercel env ou Supabase secrets/Vault**.
  JAMAIS dans le repo, JAMAIS donnés à Bolt.
- Tokens d'accès chiffrés au repos en base (AES-256-GCM, comme l'existant).
- Déploiements prod, push de secrets sur Vercel, écriture de secrets en fichier :
  toujours avec ton accord explicite.

---

## Prochaine action concrète (toi, au réveil)

1. **Le plus rentable d'abord :** crée le compte **Apple Search Ads** + la clé API,
   donne-moi `clientId/clientSecret/orgId` (via Vercel/Supabase) → je branche la
   **vraie popularité mots-clés** (rapide) ET ça pose la base d'Apple Search Ads pour
   la gestion des pubs.
2. Dis-moi **quels comptes pub** tu veux gérer en premier (Apple Search Ads + Meta,
   probablement) → je monte le modèle de données + les flux OAuth + le dashboard,
   plateforme par plateforme, en commençant par ce qui est testable.
3. Valide le merge de `keywords-real-metrics` → `main` pour déployer le fix mots-clés.
