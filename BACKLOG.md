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

## Plus tard

- [ ] **Google Play** (équivalent ASO Android).
- [ ] Avance de trésorerie pour devs (idée asset-light, long terme).
