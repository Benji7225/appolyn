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
- ✅ **Unification + découpage FAIT (13 juin, déployé)** : KPIs et gros blocs sont désormais des **tuiles dans UN SEUL espace de drag** (grille 12 colonnes, un seul `analytics:layout` + un set `analytics:hidden`). Blocs composites **découpés** en blocs individuels (Revenu graphe, Téléchargements graphe, Entonnoir, Abonnements, Revenu par pays), chacun déplaçable seul ; chaque tuile a sa largeur (col-span), petites et grosses cohabitent sur une ligne.
  - ✅ **Grille à cases standard FAITE (13 juin, déployé)** : chaque tuile occupe N colonnes ET M rangées de hauteur fixe (KPI = 1 rangée, Abonnements/Pays = 2, graphes/entonnoir = 3) ; `auto-rows-[7rem]` + `grid-flow-row-dense` → les petites tuiles bouchent les trous à côté des grandes, plus d'espace vide. KPIs uniformisés (même hauteur). À ajuster au pixel par Benji après usage (hauteurs des rangées, spans).
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

### App Store Page & multilingue
- ✅ **Langues manquantes en cartes grisées** (en bas, cliquables) + bouton "Générer les N manquantes (IA)" (13 juin, déployé).
- ✅ **Score ASO justifié + aligné (13 juin, déployé)** : `computeGlobalAso` = qualité moyenne (publiées poids 1, brouillons 0.5) × couverture (langues/38). Missing/brouillons baissent légèrement (pas 1 pour 1). Tooltip d'explication au survol. Accueil lit le même chiffre via localStorage `aso:global:<appId>`.
- 🔜 **Publication 100% AUTO (le vrai but de Benji)** : sur "Publier", si les champs verrouillés ont changé (titre/sous-titre/mots-clés/description/screenshots), **créer automatiquement une nouvelle version d'app via l'API ASC**, y attacher toutes les métadonnées + screenshots, et soumettre. L'utilisateur clique Publier, le reste se fait seul, plus de bannière à lire. Gros chantier ASC (appStoreVersions create + state).
- 🔜 **Brouillons persistants** : un brouillon de langue (carte grisée cliquée + édité) doit se **sauvegarder** (DB), pas se perdre au refresh. Compte en demi-poids dans le score tant que non publié (déjà géré côté calcul via `isNew`).
- 🔜 **Aligner le score ASO accueil ↔ App Store Page.** (remplacé par le ✅ ci-dessus, garder pour historique) Aujourd'hui ils diffèrent : l'App Store Page moyenne le score sur les langues **live ASC** (et compte les langues vides comme 0, ce qui tire la moyenne vers le bas) ; l'accueil moyenne sur la copie **DB `app_localizations`** en **ignorant les vides**, et sans filtrer par app. → Unifier : même source + même règle (idée propre : la page App Store écrit son `globalScore` et l'accueil le lit ; ⚠️ attention aux règles des hooks, le `useEffect` doit être avant le return conditionnel). Question produit ouverte : est-ce qu'une langue manquante doit faire BAISSER le score global (Benji hésite) ? Défaut proposé : score = qualité des langues existantes, et un indicateur séparé "couverture langues".
- 🔜 **Traduction automatique des screenshots par langue** (LE truc attendu par Benji). Aujourd'hui la publication 1 clic envoie le **texte** (titre/sous-titre/mots-clés/description/promo) via l'API ASC, mais PAS les captures. Apple gère les screenshots par appareil ET par langue ; il faut générer/traduire les visuels et les uploader via l'API ASC (appScreenshotSets). Gros chantier (génération d'images localisées + upload multipart ASC). À cadrer.

### Clients / attribution (clarté)
- 🔜 **SDK d'attribution PAS encore fait** (Benji croyait que oui). Aujourd'hui Clients = liens trackés + clics réels (device/pays/source) ; le **matching install réel** nécessite le SDK (module Swift dans l'app cliente). Tant qu'il n'est pas branché, la table reste vide → améliorer l'**état vide** : expliquer ce qu'est un lien de campagne, ce que le SDK ajoutera, et un CTA "créer mon 1er lien".
- 🔜 **Renommer / expliquer "Créer un lien de campagne"** (Benji ne comprend pas) : c'est générer un lien tracké (bio, pub) pour savoir d'où viennent les installs. Ajouter une mini-explication inline.
- 🔜 **Fiche client au clic = TOUT** : ouvrir un client doit montrer toutes les infos récoltées (device, plateforme, pays, source, date, confiance, historique). À étoffer quand il y aura de la data.

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
