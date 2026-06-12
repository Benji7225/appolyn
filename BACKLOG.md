# Appolyn — Backlog

Liste vivante des chantiers à faire, y compris quand Benji n'est pas là.
Benji revérifie toujours derrière. Pas de donnée mockée, tout réel, tout sécurisé.

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

- [ ] **Sélecteur de canaux en haut à droite** (Organique et Publicité) : logos des plateformes, grisés si non connectés, colorés si connectés. "Tout" ou un seul canal → agit comme **filtre global** qui se propage aux pages (Analytics/Contenu affichent le canal sélectionné). Cliquer un canal non connecté propose de le connecter.
- [ ] **Connecter Instagram séparément de Facebook** (pas forcément les deux d'un coup) : pour qui a deux comptes distincts. Garder l'option "Meta = FB + IG en une fois" mais permettre le découplage.
- [ ] **Emailing** : envoyer des emails (et SMS ?) directement aux utilisateurs dont on a l'adresse. Lié au CRM.
- [ ] **Suivi des pubs** : impressions, clics, dépense, installs, essais gratuits, CPA, revenu. Choix des métriques affichées par canal.

## Acquisition / SEO (site public)

- [ ] **Site vitrine public** (pages d'accueil visibles) + **documentation** (aide les humains ET les IA à comprendre Appolyn avant de s'inscrire).
- [ ] **Blog SEO auto-publié** : un bel article complet et VRAI (sur le vrai Appolyn, avec images, CTA, mise en forme soignée) publié automatiquement chaque jour à heure fixe. Branché sur **la clé API Anthropic de Benji** (pas les tokens Claude Code), à partir d'une base/ligne édito qu'il fournit. Liens en **footer** (pas dans le menu du haut). Objectif : référencement long terme.

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

- [ ] **Déplacer la gestion des apps dans Réglages** (sous-page "Mes apps") au lieu de la page `/dashboard/apps` isolée. Le bouton topbar "Gérer mes apps" pointerait vers Réglages.

## Plus tard

- [ ] **Google Play** (équivalent ASO Android).
- [ ] Avance de trésorerie pour devs (asset-light, fournisseur tiers qui paie sous ~7 j vs 60 j Apple, on prend un %, on ne prête jamais en direct).
- [ ] **SDK / paywall / event mapping** (intégrations techniques type RevenueCat/Superwall pour campagnes pub et revenus). Très technique, horizon lointain.
