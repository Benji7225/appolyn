# Appolyn — Backlog

Liste vivante des chantiers à faire, y compris quand Benji n'est pas là.
Benji revérifie toujours derrière. Pas de donnée mockée, tout réel, tout sécurisé.

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

## Keywords (page) — à faire

- [ ] **Bouton cœur (like)** sur chaque app des résultats déroulés → l'ajoute direct aux concurrents.
- [ ] **Menu déroulant pays avec drapeaux + noms** (pas juste « US »). Idem partout où on choisit un pays.
- [ ] **Icône recharger** à droite de la recherche (re-lancer / rafraîchir la recherche).
- [ ] **Popularité & difficulté en cercles de progression** (pas des barres). Popularité **colorée aussi** (logique inversée vs difficulté), plus grisée.
- [ ] **Toggle « voir détail » en bleu** (le bleu de marque, comme la recherche), pas vert clair.

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

- [ ] **Analytics — funnel + sources d'acquisition.** Impressions → vues de page → téléchargements + d'où viennent les installs (recherche, navigation, référents, pub). Nécessite l'API **App Store Analytics Reports** d'Apple (asynchrone : on demande un rapport, Apple le génère, on télécharge). Bloqué tant qu'il n'y a pas de vraie data (3MN pas encore en vente) → à construire dès les premières installs pour pouvoir vérifier.
- [ ] **Auth — login Google (OAuth)** en plus de l'email/mot de passe.
- [ ] **Stripe — paiement / abonnement Appolyn.** Pour que les devs s'abonnent (~20€/mois). Checkout + webhooks + gestion d'abo dans Settings.

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
