# Wishlist — Appolyn & Vision

Liste vivante de ce qui est fait et de ce qui reste. On reprend ici à chaque session, même après une longue pause. Mise à jour le 13 juin 2026.

---

## ✅ Fait & déployé (Appolyn, prod appolyn.vercel.app)

- **Login Google** réparé (Site URL Supabase corrigé).
- **Accueil** : FR, KPIs compacts, "Apps suivies" → "Score ASO", moteur d'actions priorisé + enrichi, bloc Analyses automatiques.
- **Landing** : FR + pricing corrigé (Mensuel 20€ essai 7j / Annuel 200€).
- **Analytics** : entonnoir de conversion (repères, rien d'inventé) ; KPIs façon Shopify ; **mode Modifier** = masquer/réordonner/ajouter 13 KPIs + masquer les graphiques ; sélecteurs descendus.
- **Keywords** : tri popularité / difficulté / rang / pays (V1 menu déroulant — à refondre, voir plus bas).
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

### Internationalisation & apparence
- **FR + EN** : i18n complète de l'app (toutes les pages traduites), FR par défaut, bascule propre.
- **Sélecteur de langue** dans Réglages.
- **Changement de style / thème** dans Réglages : couleur d'accent + clair/sombre (Benji = moins fan des couleurs trop vives).

### Navigation & accueil
- ✅ **"Clients" déplacé dans le menu** : maintenant entre Analytics et Store Optimization. (Nom encore à arbitrer : Clients / Acquisition / Attribution.)
- **Accueil = 2 blocs distincts** :
  1. **Actions recommandées** (déjà là, le moteur priorisé).
  2. **Setup / "C'est parti"** : checklist d'onboarding persistante qui se coche au fur et à mesure (connecter l'App Store Connect, brancher le SDK, première publication de métadonnées, inviter une app…). C'est ici que vit la mise en place.
- ✅ **Graphiques téléchargements/revenus retirés de l'accueil** (doublon avec Analytics + les cartes KPI du haut) — l'accueil reste focalisé sur les actions.
- ✅ **Bug score ASO faux ("100" sur l'accueil)** : l'accueil utilisait l'audit structurel seul ; il appelle désormais `/api/aso-score` (structure + compétition iTunes réelle) et moyenne sur les langues = MÊME nombre que la page App Store.

### Analytics — TOUT déplaçable (drag-and-drop) + refonte visuelle des graphiques
- ✅ **Gros blocs déplaçables en drag-and-drop** (V1) : graphiques/entonnoir/abonnements se réordonnent, mode "Modifier", ordre persisté (localStorage `analytics:blockOrder`, CSS `order`).
- 🔜 **Unification + découpage (spec PRÉCISE de Benji, 13 juin) :**
  1. **Découper les blocs composites en blocs INDIVIDUELS.** Aujourd'hui "Revenu journalier + Téléchargements" = 1 bloc, et "Abonnements + Revenu par pays" = 1 bloc → Benji veut **chaque truc séparé** : Revenu journalier, Téléchargements, Entonnoir, Abonnements, Revenu par pays = autant de blocs déplaçables seuls.
  2. **UN SEUL espace de drag** où les **indicateurs (KPIs) ET les blocs sont la MÊME chose** (des blocs de tailles différentes), mélangeables sur une même ligne. Ex voulu par Benji : "Revenu journalier" tout en haut + 4 petits KPIs à sa droite sur la même ligne. → layout type masonry / spans (chaque bloc déclare sa largeur) + un seul tableau d'ordre. Le hic à gérer = les tailles différentes.
- ✅ **Refonte visuelle des graphiques** (moins "scolaire") : dates lisibles (`22 juin` au lieu de `22/06`, tooltips en toutes lettres), **lignes de grille supprimées** + axes allégés, **graphes Revenu/Téléchargements alignés** (sous-titre ajouté pour égaliser les en-têtes).
- **Entonnoir de conversion** : Benji veut redonner la spec de la version "future" qu'il imagine → à intégrer quand il la donne.
- **App Analytics API d'Apple** (haut du funnel : impressions, vues produit) : Benji pense que c'est configurable → à brancher, mais reste bloqué tant qu'il n'y a pas de vraies installs (3MN pas en vente).

### SDK d'attribution (le gros morceau)
- Petit module Swift à glisser dans l'app du client (comme App Sprint). Au 1er lancement : device exact + IDFV → ping Appolyn → matche au clic récent → **install + confidence score**.
- **Où ça vit côté Appolyn** : c'est une étape de la **checklist Setup de l'accueil** (action one-time, PAS forcée à l'onboarding — les devs détestent la friction). Une fois branché, la table **Clients** se remplit en réel : User / Platform / Attributed / Confidence / Source / Location, et permet plus tard de rattacher le revenu.

### Keywords — refonte du tri (remplace le menu "trier par")
- Supprimer le menu déroulant "trier par" en haut à droite.
- **Flèches ↑↓ par colonne** directement dans l'en-tête du tableau : Mot-clé, Popularité, Difficulté, Rang (clic = trie asc/desc sur cette colonne).
- **Pays = menu déroulant de sélection** (on choisit QUEL pays afficher, ce n'est pas un critère de tri).
- Défaut = récent ; au retour sur la page, ça revient à récent ; l'utilisateur réordonne visuellement comme il veut.

### Autres
- **Trésorerie : c'est aujourd'hui une simulation/placeholder.** Benji veut le VRAI produit (avance de cash aux devs, intégration partenaires automatique). ⛔ BLOQUÉ sur un **partenaire financier réel** (contrat + licence + capital + KYC = démarche business/légale de Benji, pas codable seul). On peut bâtir l'UI/l'intégration, mais pas inventer le partenaire. À ne pas présenter comme "des chiffres réels" tant qu'il n'y a pas de partenaire.
- **Centre de notifications** in-app + croix pour fermer les notices ("app déjà en ligne", etc.).
- **Partie Mail / emailing**.
- **Onboarding avec collecte d'infos client** (CRM léger des devs abonnés).
- **App Analytics API d'Apple** = haut du funnel (impressions, vues produit) — bloqué tant que pas de trafic réel.

## 🔜 À faire — Vision

- **Notifications variées** : la banque actuelle est pauvre/plate ("Regarde au loin ~6 m…"). Écrire 25-30 notifications bien tournées, variées (rappel pause, encouragement, série, fatigue oculaire, humour léger) et les faire tourner aléatoirement sans répétition. (FAIT ce 13 juin, à enrichir encore.)
- **Flow de blocage complet (Family Controls / Screen Time, AUTORISÉ)** : l'utilisateur reçoit une notif de temps en temps, OU est **bloqué directement** selon le temps d'écran cumulé d'affilée. Sur l'écran de blocage, il a **son exercice à faire**, puis il doit **revenir valider** → reste bloqué tant qu'il n'a pas validé (ou annulé). Comme 3MN. Nécessite l'entitlement Apple + extensions DeviceActivity/ManagedSettings.
- **Blocage par exercice** : au moment du blocage, proposer un exercice choisi (pas que 20-20-20) ; l'utilisateur sélectionne quels exercices peuvent apparaître.
- **Logo / icône d'app** : créer un beau logo (Benji a branché Canva → générer un design propre, le décliner en icône iOS).
- Renforcer onboarding + réglages, clarifier la section "rappels/fréquence", visuels (Benji = moins fan des couleurs vives).

## 🔜 À faire — divers

- **Domaine** : `appolyn.so` pris, `appolyn.com` à 9000€ (non). Benji penche **appolyn.io**. À acheter par Benji, puis email pro.
- **App Store Page** : score + "Ajouter une langue" alignés sous-titre = FAIT.

## 📝 Zone à capturer (Benji : "il en reste encore ~15")

On continue d'y verser les idées au fil de l'eau pour ne rien perdre :
- (à compléter au fur et à mesure des sessions)

---

## ⚙️ Sessions de nuit (local)

Le cloud est bloqué (GitHub non connecté). On tourne en LOCAL tant que le Mac reste allumé. Benji lance **~23h** : `/loop 2h <prompt>` → se déclenche ~23h / 1h / 3h / 5h.

Cadre validé : avancer sur cette wishlist + **commit** à chaque item ; **déployer seulement les améliorations UI sûres** ; tout ce qui touche infra/sécu/destructif → commit SANS déployer, noté pour que Benji déploie au réveil. Mettre à jour ce fichier à chaque passage.
