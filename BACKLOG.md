# Appolyn — Backlog

Liste vivante des chantiers à faire, y compris quand Benji n'est pas là.
Benji revérifie toujours derrière. Pas de donnée mockée, tout réel, tout sécurisé.

## 🎯 PRIORITÉ CODABLE — issue du brainstorm 17/06 (ordre de valeur)

> Rappel honnête (cf `BRAINSTORM-VISION-APPOLYN.md`) : Appolyn est déjà très mature. Le vrai goulot = les branchements externes de Benji (Stripe, OAuth Google) + un 1er dev qui s'onboarde, PAS du dev. Donc **on ne code QUE ce qui aide à faire entrer + retenir un premier dev.** Ne pas ajouter de features qui creusent le déséquilibre (0 payant aujourd'hui).

1. **🥇 Onboarding dev à l'inscription = LA priorité.** Aujourd'hui un dev qui s'inscrit tombe sur un dashboard vide, sans flow guidé pour connecter son App Store Connect. Friction n°1 : sans ça il ne voit aucune donnée et part. À coder : **flow guidé pas-à-pas** pour saisir .p8, issuer id, key id, vendor number, app id + **validation live de la clé** (test d'appel ASC) + **1re synchro** + état « connecté/à connecter » sur l'accueil (bloc Setup / checklist). Gros effet rétention, isolé, faible risque.
   - **ÉTAT RÉEL VÉRIFIÉ (17/06, ne pas reconstruire l'existant) :** ✅ page `settings/app-store-connect` complète (.p8 chiffré AES-256-GCM, Key ID, Issuer ID, Vendor Number) + bouton **« Tester la connexion » LIVE déjà fonctionnel** (action edge `validate-credentials` existe, asc-proxy:228). ✅ `SetupChecklist` sur l'accueil avec 3 étapes (Connecte ASC / Ajoute ton app / Renseigne l'asc_app_id). ❌ **MANQUE : l'étape « Branche le SDK » dans le checklist** (4e étape, avec détection `hasSdk` = clé SDK générée ou ≥1 `sdk_events` reçu) → c'est le 1er increment du loop. ❌ Manque aussi : un vrai **wizard guidé** (au lieu de liens dispersés vers settings), un **déclenchement de 1re synchro** après validation, et des micro-explications « où trouver ça » pour non-codeurs.
   - **CADRAGE BENJI (17/06), CRITIQUE :** la cible = des vibecoders / gens qui **ne savent PAS coder du tout**, des flemmards. Le parcours doit être : j'arrive → je colle mon **.p8** (+ les ids ASC) → je branche le **SDK** le plus simplement possible → **c'est tout, j'ai mes data.** Le MOINS de connexions/manips possible. Avec .p8 + SDK connectés, ils ont déjà l'essentiel (analytics + clients). La partie Finance (compte bancaire) = séparée, plus tard, hors de ce flow. Objectif : zéro friction, zéro jargon, validation instantanée à chaque étape.
2. **Centre de notifications in-app** : panneau (cloche topbar) qui agrège les notices/alertes (les notices unitaires existent déjà). Additif, isolé, faible risque.
3. **Publication 100% AUTO** (« vrai but » de Benji) : sur « Publier », **créer une nouvelle version d'app via l'API ASC** + attacher métadonnées + screenshots + soumettre (aujourd'hui on pousse seulement les métadonnées sur la version existante). Gros chantier ASC (faisable, fait à la main pour Vision), à cadrer. Fort effet « waouh ».
4. **Screenshots traduits par langue** (upload ASC `appScreenshotSets`) : brique de traduction de captions déjà là ; reste génération d'image localisée + upload multipart ASC. Gros chantier (cf aussi « Screenshots traduits » dans Bloqué).

**Règle de boucle (consigne Benji 17/06) :** dès qu'une idée émerge, la NOTER (section « Idées en vrac » en bas) + la planifier dans cet ordre, puis l'exécuter. Tourner en continu. Ne jamais déployer en prod sans le feu vert de Benji (commit oui, deploy non sur le risqué).

## 📊 Analytics — demandes Benji (17/06, à coder quand Appolyn reprend)

> Direction = enrichir la page Analytics avec 2 blocs très demandés. À placer dans le dashboard, visibles en scrollant.

- **(A) Bloc « revenus & abonnements » façon dashboard RevenueCat — AJOUTER LES TYPES DE MÉTRIQUES MANQUANTS, DANS LE STYLE APPOLYN EXISTANT (cadrage Benji : NE PAS restyler les blocs).** Objectif : couvrir tous les *types* de métriques que RevenueCat affiche et qu'on n'a pas encore, en réutilisant les composants visuels actuels (cartes KPI + grille drag-and-drop). Liste à couvrir : MRR, ARR, revenu (jour/mois), abonnés actifs, nouveaux abonnés, **essais en cours + conversion essai→payant**, churn (taux + count), **revenu par produit/prix** (gère nativement l'A/B test de prix : voir ci-dessous), ARPU/ARPPU, LTV, rétention par cohorte (J1/J7/J30/M1…), MRR movement (new/expansion/contraction/churned), refunds. **FAISABLE quasi tel quel** : le SDK capte déjà chaque transaction StoreKit avec le **vrai `product_id` + prix + devise** → les variations de prix (2,99 vs 4,99, changement d'annuel) **remontent automatiquement** et le dashboard s'adapte sans rien changer (c'est exactement le « ça s'adapte quand le dev change son pricing » voulu par Benji ✅). On dérive tout des events `subscribe`/`renewal`/`purchase` déjà ingérés (table `sdk_events`). **Honnête** : bloc vide explicite tant qu'aucune install réelle, jamais de chiffre inventé.
- **(B) Funnel d'onboarding façon PostHog — barre % + nombre par écran, AUTO-ADAPTATIF.** Cadrage Benji (FERME) : le dev **n'écrit AUCUNE ligne** ; il connecte juste le SDK ; le funnel doit s'auto-mettre à jour quand il ajoute/retire des écrans (ex. passe de 3 à 6 écrans → le funnel affiche 6 tout seul aux jours suivants).
  - **Vérité technique (à dire honnêtement, ne pas survendre) :** le SDK actuel ne capte pas les vues d'écran. Pour du **zéro-code réel** :
    - **UIKit** : FAISABLE proprement → autocapture par **swizzling de `UIViewController.viewDidAppear`** (comme PostHog/Firebase). Nom d'écran = nom de la classe de VC. Nouveaux écrans captés automatiquement, funnel auto-adaptatif. ✅
    - **SwiftUI** (le cas le plus fréquent chez les vibecoders) : le **vrai zéro-code n'est PAS fiable** (pas de cycle de vie par écran ; tout vit dans quelques hosting controllers). Options : (a) auto-capture des transitions de navigation = partiel, noms peu parlants ; (b) un **modifier quasi invisible** `.appolynScreen("welcome")` = 1 ligne par écran (pas zéro). 
    - **Idée « lien GitHub » de Benji** : connecter le repo du dev permettrait d'**énumérer/ordonner/nommer** les écrans en lisant le code (et de se MAJ quand il push) → résout le LABELLING + l'auto-MAJ de la structure. MAIS ça ne donne PAS les **comptes de drop-off** (combien de users atteignent chaque écran) : ça, il faut des events runtime. Donc GitHub = complément (structure/noms), pas substitut au tracking runtime.
  - **Design recommandé (à valider par Benji) :** (1) **autocapture screen_view dans le SDK** (swizzling UIKit = vrai zéro-code ; SwiftUI = best-effort + modifier optionnel 1 ligne pour la précision), event `screen_view` {name, order} ingéré ; (2) endpoint d'agrégation funnel (ordonne par 1re occurrence, calcule % de rétention écran→écran) ; (3) bloc UI liste verticale (barre horizontale + compteur), réutilise le style existant ; (4) option « connecter le repo GitHub » pour de jolis noms/ordre auto. **Le 100% zéro-code n'est garanti que UIKit ; pour SwiftUI, être transparent.** Décision Benji attendue sur le compromis SwiftUI avant de coder le funnel.

## 📡 SDK iOS — DIRECTIVE BENJI (17/06) : capter un MAXIMUM de data

> « La data c'est la clé. Le SDK doit prendre le plus d'infos possible. Certaines paraîtront inutiles mais serviront plus tard. » → On enrichit `Appolyn.swift` au maximum, tant que ça reste **privacy-safe**.

- **Déjà capté** : idfv, device_model, os, app_version/build, bundle_id, locale, language, region, timezone, install_date, screen w/h, device_class, low_power, is_simulator, ASA token, achats StoreKit (product_id + prix + devise), source (`setSource`).
- **À AJOUTER (privacy-safe, sans IDFA, sans prompt ATT, sans PII)** : `screen_view` (autocapture, cf funnel), session (id, durée, n° de session, temps depuis install), first_open vs update (détecter changement d'app_version), nb de lancements, langue préférée complète, dark/light mode, taille de police/accessibilité, type de connexion (wifi/cellulaire) si dispo sans permission, orientation, capacité disque/mémoire (statique), `is_jailbroken` best-effort, fuseau + offset, première/dernière activité, cohorte d'install (semaine), événements cycle de vie (foreground/background). Ajouter aussi un `track()` riche pour les milestones (trial_start, paywall_view, etc.).
- ⚠️ **GARDE HONNÊTE (non négociable) :** rester sur l'**IDFV** (jamais l'IDFA), **jamais de PII** (email/nom/localisation précise) sans consentement explicite, pas de prompt ATT. Tout ce que le SDK collecte doit être déclarable dans la **App Privacy** de l'app du dev → documenter la liste exacte dans la doc SDK pour qu'il remplisse sa nutrition label. « Max de data » = max de signaux **techniques anonymes**, pas de la donnée perso.

## ⛔ Bloqué (pas faisable maintenant, en attente d'une dépendance externe)

Benji veut qu'à la fin il ne reste QUE ça. Chaque item est bloqué par une vraie dépendance, pas par manque de temps. On ne fabrique pas de fausse donnée pour les débloquer.

- **Analytics / funnel / attribution** : nécessite l'API App Store Analytics Reports d'Apple (asynchrone) + des installs réelles. Bloqué tant que 3MN n'est pas en vente. À construire dès les premières vraies installs.
- **CRM clients + emailing/SMS** : nécessite une source de vérité (SDK paywall type RevenueCat/Superwall ou events du dev) + un provider email. Sans ça = fausse donnée, interdit.
- **Suivi des pubs (impressions/CPI/ROAS) + comptes pub connectés** : nécessite de connecter Apple Search Ads / Meta Ads / TikTok Ads / Google UAC (OAuth + comptes). Les écrans existent, vides honnêtement, en attente de connexion.
- **Stripe (abonnement Appolyn)** : nécessite les clés Stripe + un compte Stripe actif. À cadrer avec Benji.
- **Login Google (OAuth)** : nécessite des identifiants OAuth Google (client id/secret) à créer dans la console Google.
- **Cross-post du blog vers les réseaux** : le moteur de publication existe, mais nécessite les comptes sociaux connectés pour poster réellement. Se déclenchera quand ils seront connectés.
- **Revenu/téléchargements EXACTS** : nécessite une source payante (Sensor Tower / AppFigures / data.ai). On affiche aujourd'hui des estimations clairement libellées à partir des signaux iTunes gratuits.
- **A/B test (onboarding/paywalls/notifs)** : nécessite la main sur le code de l'app cliente ou un système de templates. Très technique, horizon lointain.
- **Screenshots traduits par langue** : nécessite l'API screenshots ASC + génération/upload d'images par appareil et par langue. Gros chantier, à cadrer.

## Déjà livré (12 juin)

- [x] **Score ASO** : audit structurel pondéré (instantané, sur les cartes) + **analyse IA sémantique à la demande par marché** (route `/api/aso-review`) qui juge pertinence + saturation des mots-clés dans la langue cible, propose mots-clés moins saturés et réécriture. Reste à faire : afficher la saturation directement sur les cartes (coûteux à faire en IA partout) → garder l'IA à la demande.
- [x] **Fiche concurrent** : cartes style App Store Page (cliquables, supprimer, élévation, cache instantané) + modale avec données réelles (captures, infos, nouveautés, avis RSS) + **sélecteur de pays** pour voir la fiche localisée. Reste : comptes pub/réseaux des concurrents (non exposés par Apple).
- [x] **Blog SEO** : pages publiques /blog + /blog/[slug], génération IA quotidienne (pg_cron 08:00 UTC), lien footer. Articles en anglais (SEO global).
- [x] Page Audit supprimée, score dans App Store Page. Langues passées à ~39.
- [x] **Score ASO automatique gratuit** (donnée iTunes réelle, pas d'IA, exigeant) : structure + compétitivité réelle des mots-clés par marché, cache par hash. Sur les cartes + détail mots-clés colorés dans la modale.

## App Store Page — éditeur ASO (LIVRÉ 12 juin)

- [x] **Plus de labels « difficile / jouable / accessible »** : l'analyse n'affiche plus que **les mots-clés à CHANGER** (saturés / très difficiles / peu recherchés) avec la raison + la difficulté.
- [x] **Bouton « Améliorer avec l'IA »** dans l'éditeur (route `/api/improve-metadata`, clé Anthropic) : réécrit titre/sous-titre/mots-clés/description/promo pour maximiser l'ASO, en évitant les mots-clés saturés que le score iTunes a signalés, et explique ses changements. L'IA OPTIMISE, le score reste calculé gratuitement sur iTunes réel + re-score automatique après.
- [x] **Score sur tous les champs** : `auditMetadata` pondère déjà titre/sous-titre/mots-clés/description/promo, combiné à la compétitivité réelle des mots-clés.
- [x] **Layout éditeur 2 colonnes** : champs à gauche, analyse ASO (score + bouton IA + mots-clés à changer + à corriger) à droite, collante.

## Keywords (page) — ✅ SECTION TERMINÉE (réconciliée avec le code le 17/06)
> Vérifié ligne par ligne dans `app/(dashboard)/dashboard/keywords/page.tsx` : les 5 items étaient déjà codés. Backlog recalé.

- [x] **Bouton cœur (like)** sur chaque app des résultats → ajoute aux concurrents (`Heart` l.513 + `addCompetitor` l.171).
- [x] **Menu déroulant pays avec drapeaux + noms** (`flagEmoji` l.20 + `countryNameOf` l.39 + `COUNTRIES`).
- [x] **Icône recharger** à droite de la recherche (`RefreshCw` l.339, anim spin pendant `refreshing`).
- [x] **Popularité & difficulté en cercles de progression** (`MetricRing` l.10, composant `components/dashboard/metric-ring.tsx`).
- [x] **Toggle « voir détail » en bleu** (`text-primary` + `hover:bg-primary/10` l.432, plus de vert).

## Concurrents — intelligence v2 (carte par app, visuel)

- [ ] Au clic sur un concurrent → **carte visuelle** (façon carte app des keywords), pas des murs de texte.
- [ ] **Mots-clés sur lesquels il rank** + son **rang** + popularité + difficulté, pour plein de mots-clés. (Reverse-ASO : nécessite de tester beaucoup de mots-clés via iTunes, lourd, ou une source payante.)
- [ ] **Apps similaires**.
- [ ] **Analyse de niche VISUELLE** (pas de texte).
- [x] **Carte du monde / heatmap par pays** (LIVRÉ 12 juin) : section « Où il est le plus téléchargé » dans la fiche concurrent, colorée gris → bleu selon le **volume d'avis par App Store national** (action `geo` qui interroge ~42 pays via lookup iTunes, signal réel gratuit, part en %, marché n°1). Pas le chiffre exact de téléchargements. Évolution possible : vraie carte SVG géographique (choroplèthe) si on veut le rendu carto.
- [ ] **Revenu estimé (€) + téléchargements estimés** : ⚠️ NON disponible via l'API publique Apple → nécessite une source de données payante (Sensor Tower / AppFigures / data.ai) ou un modèle d'estimation. À cadrer (coût).

## Blog → cross-post auto (réutilise le moteur de publication existant)

- [ ] Quand un **nouvel article de blog** est publié → publier automatiquement un post/story le jour même sur **X/Twitter, Instagram, TikTok, Facebook, YouTube Shorts, et Reddit** (Reddit = nouvelle intégration) avec le lien. Booste le SEO/référencement. Dépend des comptes sociaux connectés.
- [ ] **Images** : plutôt pour ces posts sociaux du blog que dans les articles eux-mêmes (générées via Higgsfield ou template).

## Prioritaire
> Réconcilié avec le code le 17/06 : **Google login et Stripe sont CODÉS** — il ne manque que TES identifiants externes (pas du dev).

- [ ] **Analytics — funnel + sources d'acquisition.** Nécessite l'API **App Store Analytics Reports** d'Apple (asynchrone) + de vraies installs. **Bloqué sur data réelle** (3MN/Vision pas encore en vente) → à construire dès les 1res installs.
- [x] **Auth — login Google (OAuth)** — **CODÉ** (`GoogleButton` + `supabase.auth.signInWithOAuth({provider:'google'})` dans login + signup). ⚠️ **Action Benji** : créer les identifiants OAuth Google (client id/secret) dans la console Google + Supabase, sinon le bouton renvoie une erreur.
- [x] **Stripe — abonnement Appolyn** — **CODÉ** (checkout `mode:subscription` + lookup prix + `getOrCreateCustomer` ; webhook qui sync `subscription.created/updated` + `checkout.session.completed` ; portail + retention ; page `settings/billing`). ⚠️ **Action Benji** : compte Stripe actif + clés (`STRIPE_*`) + créer les prix (lookup keys) côté Stripe.

## Onboarding & dashboard

- [ ] **Flow d'onboarding à l'inscription** : questions business + connexion ASC (.p8, issuer, key id, vendor number, App ID).
- [ ] **Bouton "Revoir l'onboarding"** dans Settings pour rejouer l'onboarding quand on veut.
- [ ] **Améliorer le dashboard** : meilleur état initial / premier lancement guidé.

## Settings — connexions

- [ ] **Voir et gérer les comptes connectés** : organique (Meta/Instagram, TikTok, YouTube) et publicité (Apple Search Ads, Meta Ads). Déconnecter / reconnecter.
- [ ] **Ajouter des accès** (multi-utilisateur) : inviter quelqu'un à accéder au compte.

## Performance (ressenti Shopify "instantané")

- [ ] **Pré-chargement + cache par session** pour que chaque page s'affiche instantanément en y arrivant (pas de spinner à chaque navigation). Déjà fait sur la page App Store (cache module + revalidation en fond) → généraliser au dashboard, analytics, reviews, competitors, keywords.
- [ ] **Supprimer les boutons "Rafraîchir / Reaudit / Rafraîchir tout"** partout (noms incohérents) : le rafraîchissement doit être automatique à l'arrivée sur la page.

## App Store Page (déjà refondue en cartes — améliorations possibles)

- [ ] **Vue "US Matrix" / matrice de mots-clés par pays** comme App Sprint (classements par territoire).
- [ ] Encore plus de langues si Apple en ajoute (liste actuelle = les ~39 localisations App Store).
- [ ] **Supprimer la page Audit/ASO séparée** une fois la note par carte validée (la note vit maintenant dans la page App Store).

## Clients / CRM (façon Shopify + App Sprint)

- [ ] **Page Clients** : un client = une ligne avec un max d'infos. Email, téléphone, pays, plateforme (iOS/Android), source d'acquisition, date d'installation, dernière activité, **combien il a dépensé**, historique des actions, indice de confiance / probabilité bot. Clic sur un client → fiche détaillée (depuis quand, installs, dépenses, historique).
- [ ] **Capture de ces données** : définir comment on les récupère (onboarding du dev qui connecte ses sources, SDK paywall type RevenueCat/Superwall, events). Sans source de vérité, pas de fausse donnée.

## Marketing — emailing & canaux

- [~] **Sélecteur de canaux en haut à droite** : FAIT pour la partie visible (composant `ChannelSwitcher` dans la topbar) : logos des plateformes Organique + Publicité, grisés si non connectés / colorés si connectés (lu depuis `social_accounts`), compteur connectés, clic = lien direct pour connecter. RESTE à faire : en faire un **filtre global** qui se propage aux pages (Analytics/Contenu filtrés par canal) — à brancher quand il y aura de la vraie data connectée.
- [ ] **Connecter Instagram séparément de Facebook** (pas forcément les deux d'un coup) : pour qui a deux comptes distincts. Garder l'option "Meta = FB + IG en une fois" mais permettre le découplage.
- [ ] **Emailing** : envoyer des emails (et SMS ?) directement aux utilisateurs dont on a l'adresse. Lié au CRM.
- [ ] **Suivi des pubs** : impressions, clics, dépense, installs, essais gratuits, CPA, revenu. Choix des métriques affichées par canal.

## Acquisition / SEO (site public)

- [ ] **Site vitrine public** (pages d'accueil visibles) + **documentation** (aide les humains ET les IA à comprendre Appolyn avant de s'inscrire).
- [x] **Blog SEO auto-publié** (FAIT) : article quotidien via cron + clé Anthropic, liens footer.
- [ ] **Vraies images dans les articles** (OPTIONNEL, Benji pas sûr que ce soit nécessaire) : pour l'instant bandeau dégradé + typo soignée. Brancher Higgsfield ou une banque d'images si on veut illustrer.

## Concurrents (fiche détaillée)

- [ ] **Fiche concurrent au clic** : ouvrir un concurrent suivi → page/pop-up avec un max d'infos réelles : screenshots App Store, avis, prix et abonnements in-app, et si possible ses comptes réseaux/pub. Vraies données, pas d'invention. Gros chantier mais énorme valeur.
- [ ] **Recherche multi-stores** : choisir App Store ou Google Play dans la recherche de concurrents, puis ajouter avec les infos du store choisi.

## Score ASO (profondeur)

- [ ] **Améliorer le calcul du score ASO.** Aujourd'hui c'est un audit STRUCTUREL réel (longueurs titre/sous-titre/mots-clés, doublons, chevauchement titre↔mots-clés, mots-clés génériques, description trop courte, texte promo absent) → il ne juge PAS la qualité sémantique de la description. À enrichir (analyse de densité de mots-clés pertinents, lisibilité, présence des termes cibles) pour que le score reflète vraiment la qualité, pas juste le remplissage.

## Screenshots App Store

- [ ] **Gestion des screenshots** par appareil + langue. Possible pré-requis Apple pour publier une version. **Traduction automatique des screenshots** par langue (ne pas montrer du français au Japon).

## A/B testing & notifications (lointain, demande l'accès au code)

- [ ] **A/B test depuis Appolyn** : onboarding, pages de paiement / paywalls, notifications. Nécessite d'avoir la main sur le code de l'app du client (ou un système de templates) → complexe, peut entrer en conflit avec leur code.
- [ ] **Centre de notifications** : gérer toutes les notifications push depuis Appolyn.

## App management

- [x] **Gestion des apps dans Réglages** (LIVRÉ 12 juin) : sous-page Réglages → « Mes apps » (FR), `/dashboard/apps` redirige, bouton topbar « Gérer mes apps » repointé, dialogue d'ajout traduit en français.

## Plus tard

- [ ] **Google Play** (équivalent ASO Android).
- [ ] Avance de trésorerie pour devs (asset-light, fournisseur tiers qui paie sous ~7 j vs 60 j Apple, on prend un %, on ne prête jamais en direct).
- [ ] **SDK / paywall / event mapping** (intégrations techniques type RevenueCat/Superwall pour campagnes pub et revenus). Très technique, horizon lointain.
