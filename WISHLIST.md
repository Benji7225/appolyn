# Wishlist — Appolyn & Vision

Liste vivante de ce qui est fait et de ce qui reste. On reprend ici à chaque session, même après une longue pause. Mise à jour le 13 juin 2026.

---

## ✅ Fait & déployé (Appolyn, prod appolyn.vercel.app)

- **Login Google** réparé (Site URL Supabase corrigé).
- **Accueil** : FR, KPIs compacts, "Apps suivies" → "Score ASO", moteur d'actions priorisé + enrichi, bloc Analyses automatiques.
- **Landing** : FR + pricing corrigé (Mensuel 20€ essai 7j / Annuel 200€).
- **Analytics** : entonnoir de conversion (repères, rien d'inventé) ; KPIs façon Shopify ; **mode Modifier** = masquer/réordonner/ajouter 13 KPIs + masquer les graphiques ; sélecteurs descendus.
- **Keywords** : tri popularité / difficulté / rang / pays.
- **Avis** : filtre étoiles en haut à droite (au niveau du sous-titre).
- **Churn destructif** : capture baseline + restore (enlève les langues ajoutées) sauf abo pause 3€. Déployé, non testé end-to-end.
- **Clients** (ex-Acquisition) : liens trackés + clics réels (device/pays/source, anonyme). Tables `signal_links`/`signal_clicks` + route `/s/[slug]`.
- **Finance / Trésorerie** : page placeholder asset-light, pleine largeur, dans le menu.
- **Docs publiques** `/docs`.
- **Marketing** : filtre canaux dans l'en-tête (persistant cross-onglets), notif → icônes à connecter + croix, cartes de connexion déplacées dans **Réglages → Comptes connectés**.
- **Layout global** : tous les contrôles alignés au niveau du sous-titre (PageHeader `items-end`), App Store Page incluse.

## ✅ Fait (Vision — app iOS, `livrables/applications/Vision/`, BUILD SUCCEEDED)

- Onboarding 5 écrans, accueil (anneau objectif + **série 7 jours flamme animée**), pause guidée 20 s, exercices (2 gratuits / 2 Pro), réglages, notifications locales, paywall StoreKit 2.
- "Passer" ne valide plus ; exercices gratuits cliquables.
- Parti pris santé HONNÊTE (fatigue oculaire + 20-20-20, pas de "muscler les yeux"), disclaimer partout.

---

## 🔜 À faire — Appolyn

- **SDK d'attribution** (le gros morceau Clients) : petit module Swift à glisser dans les apps des clients (comme App Sprint). Au 1er lancement : device exact + IDFV → ping Appolyn → matche au clic récent → install + confidence score. Débloque le vrai tableau "User / Platform / Attributed / Confidence / Source / Location".
- **Thème / couleurs** dans Réglages (laisser les clients personnaliser l'accent).
- **Centre de notifications** in-app + croix pour fermer les notices ("app déjà en ligne", etc.).
- **Partie Mail / emailing**.
- **Onboarding avec collecte d'infos client** (CRM léger des devs abonnés).
- **App Analytics API d'Apple** = haut du funnel (impressions, vues produit) — bloqué tant que pas de trafic réel.

## 🔜 À faire — Vision

- **Family Controls / Screen Time** (AUTORISÉ par Benji) : mesurer le temps d'écran cumulé d'affilée, et **blocage automatique** toutes les X min qui force à revenir valider (comme 3MN). Nécessite l'entitlement Apple + extensions DeviceActivity/ManagedSettings.
- **Blocage par exercice** : au moment du blocage, proposer un exercice choisi (pas que 20-20-20) ; l'utilisateur sélectionne quels exercices apparaissent.
- Renforcer onboarding + réglages, clarifier la section "rappels/fréquence", icône d'app, visuels (Benji = moins fan des couleurs vives).

## 🔜 À faire — divers

- **Domaine** : `appolyn.so` pris, `appolyn.com` à 9000€ (non). Benji penche **appolyn.io**. À acheter par Benji, puis email pro.
- **App Store Page** : score + "Ajouter une langue" alignés sous-titre = FAIT.

---

## ⚙️ Sessions de nuit (local)

Le cloud est bloqué (GitHub non connecté). Si le Mac reste allumé, on tourne en LOCAL via `/loop 1h <prompt>` (j'ai les tokens, je peux commit + déployer). Cadre validé : avancer + commit ; les trucs risqués, les laisser de côté pour que Benji déploie au réveil.
