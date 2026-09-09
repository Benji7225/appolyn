# Analyse concurrentielle Appolyn, nuit du 08 au 09/09/2026

> Commandée par Benjamin : « analyse concurrentielle folle, mais vraiment folle », avec pour chaque
> point le pourquoi de l'inclusion ou du rejet. Document vivant, complété au fil de la nuit.

---

## 1. Postback (`postback.sh`) — Arthur Spalanzani

**Positionnement.** « Connectez acquisition, onboarding, conversion et revenus pour découvrir ce qui
crée des utilisateurs payants. » Ce n'est pas un outil ASO, c'est un outil d'**attribution**.
Il répond à une seule question : d'où viennent les gens qui paient.

**Prix.** Starter **9 $/mois** (10 000 événements, 30 posts suivis, 1 app) ·
Growth **19 $/mois** (mêmes volumes, jusqu'à 10 apps).

**Le dashboard d'accueil.** Quatre métriques seulement : installs, abonnements, proceeds, vues de contenu.
Exemple réel affiché sur leur page : 3 629 installs, 370 abonnements, 4 661 $ de revenus.
⇒ **Décision pour Appolyn : quatre chiffres, pas douze.** Un dashboard qui montre tout ne montre rien.

**L'entonnoir.** Chaque étape avec son effectif et le **pourcentage de perte** vers la suivante :
- Install 1 355
- Onboarding terminé 982 (-27,5 %)
- Paywall vu 528 (-46,2 %)
- Checkout démarré 214 (-59,5 %)
- Essai gratuit 132 (-38,3 %)
- Puis taux de conversion global **9,7 %** et **ARPU 3,44 $**

⇒ **Le point clé que Benjamin avait repéré sans le nommer : ce qui rend cet entonnoir utile, ce n'est
pas sa forme, c'est le pourcentage de PERTE affiché à chaque marche.** Un entonnoir qui n'affiche que
les effectifs ne dit pas où ça fuit. C'est la seule chose à copier absolument.
Note : Benjamin a lui-même corrigé sa description, ce n'est pas un zigzag.

**Segmentation.** Installs par pays, par modèle d'iPhone, par compte de contenu (TikTok, Facebook)
avec vues, likes, commentaires, partages, et par contenu individuel. Plus les campagnes Apple Ads
avec dépense, installs, revenus **par mot-clé**, et le ROAS.

⇒ **La segmentation par contenu individuel est leur vraie différence.** Ils relient une vidéo précise
à des installs et à du revenu. C'est exactement le trou que Benjamin vit sur Vision : il ne sait pas
quelle vidéo lui a amené quoi.

**Décor.** Globes interactifs d'activité en direct. Joli, sans valeur d'usage. À ne pas copier.

---

## 2. AppSprint ASO (`appsprint.app`) — même auteur

**Ce que c'est.** Une **application macOS**, pas un SaaS web. Recherche de mots-clés, suivi de
concurrents, localisation des prix, métadonnées, Apple Ads, agents IA branchés sur les données ASO.

**Le vide marché qu'il a visé, et c'est la leçon la plus importante de la nuit :**
entre **Astro à 100 $/an** (trop limité) et les **outils enterprise à plusieurs centaines par mois**
(inaccessibles aux indés), il n'y avait rien. Il s'est logé pile au milieu.

**Prix.** Solo 9 $ puis **19 $/mois**, Pro 19 $ puis **39 $/mois**. Il a **doublé ses prix** après le
lancement : légère baisse des conversions, hausse de la LTV. Sa formule : « le prix d'un logiciel n'a
rien à voir avec son coût d'exploitation ».

**Scoring de difficulté des mots-clés sur 7 facteurs pondérés** : volume d'avis, vélocité des avis,
acteurs dominants, qualité des notes, ancienneté du marché, diversité des éditeurs, pertinence du titre.
⇒ À comparer avec ce que fait Appolyn aujourd'hui. Un score de difficulté à un seul facteur est
un score décoratif.

**Infrastructure.** Backend auto-hébergé via Coolify sur un **VPS Oracle gratuit** (18 Go de RAM,
200 Go de disque), 50 000 requêtes par jour, ~150 000 apps du top chart synchronisées quotidiennement.
⇒ Utile pour Benjamin : ce niveau de service tourne sur une machine à 0 €.

### ⚠️ Le vrai enseignement, et il n'est pas technique

**0 à 5 000 $ de MRR en un mois, avec une seule vidéo YouTube.** Ni Product Hunt, ni publicité.
La cause tient en une ligne : **il avait déjà une audience de développeurs d'apps**, c'est-à-dire
exactement sa cible. Il a hébergé un podcast (Tap & Swipe) où il interviewe des fondateurs d'apps.

Benjamin n'a pas cette audience. Il construit une audience sur la **santé oculaire**, pas sur le
développement d'apps. Ces deux publics n'ont aucun recouvrement.

⇒ **Conséquence stratégique : un Appolyn magnifique ne se vendra pas mieux qu'un Appolyn moyen tant
que personne dans la niche des développeurs indé ne sait qu'il existe.** Le produit n'est pas le
goulot d'Appolyn, la distribution l'est. C'est exactement le même diagnostic que pour Vision.

---

---

## 3. Astro (`tryastro.app`) — le concurrent qu'Arthur a visé

Application **macOS** native. **9 $/mois, 108 $/an.** Apps et mots-clés illimités.
Données de popularité et de difficulté tirées d'Apple Search Ads, scores de difficulté sur le top 10
mis à jour quotidiennement, base de plusieurs millions de mots-clés, plus de 60 storefronts,
traduction DeepL au survol pour les mots-clés étrangers.

⇒ **C'est le plancher du marché : 9 $/mois pour du suivi de mots-clés illimité et bien fait.**
Toute fonction ASO d'Appolyn qui ne fait pas mieux que ça ne justifie pas un prix supérieur.

---

## 4. Cartographie du marché

| Outil | Nature | Prix | Ce qu'il fait | Ce qu'il ne fait pas |
|---|---|---|---|---|
| **Astro** | app macOS | 9 $/m | mots-clés, rankings, concurrents, 60 storefronts | pas de revenus, pas d'attribution |
| **AppSprint ASO** | app macOS | 19-39 $/m | + métadonnées, Apple Ads, prix localisés, IA | pas d'attribution contenu |
| **Postback** | web | 9-19 $/m | attribution, entonnoir, revenus par contenu et par mot-clé | pas d'ASO |
| **RevenueCat** | SDK + web | payant | abonnements, renouvellements, remboursements, paywalls | ni ASO ni acquisition |
| **Appfigures** | web | payant | plusieurs stores unifiés, avis | peu de métriques d'usage propres |
| **AppTweak / Sensor Tower** | web | entreprise | ASO et intelligence marché | hors budget indé |
| **Mixpanel / Amplitude / PostHog** | web | gratuit puis payant | entonnoirs, rétention, cohortes | aucune attribution acquisition |
| **Appolyn** | web | ~20 €/m | ASO + publication 22 langues + analytics + site public + contenu | — |

**Les limites d'App Store Connect que tout le marché exploite**, et qui sont donc la raison d'être
de ces produits : pas d'événements personnalisés, attribution seulement agrégée, seuils de
confidentialité qui créent des trous dans les segments, pas d'optimisation de campagne en temps réel.

---

## 5. Où se situe Appolyn, honnêtement

**Ce qu'Appolyn a et que personne d'autre n'a :**
la **génération et la publication des métadonnées en 22 langues en un clic, pilotée par IA**.
AppSprint a un éditeur de métadonnées, Astro a de la traduction au survol, mais aucun ne génère
ni ne publie. **C'est le seul vrai différenciateur, et il n'est mis en avant nulle part.**

**Ce qu'Appolyn fait moins bien que le marché :**
- suivi de mots-clés : Astro fait mieux pour 9 $
- attribution et entonnoir : Postback fait mieux pour 9 $
- abonnements : RevenueCat fait mieux

**Le risque du produit 360.** Appolyn couvre ASO, analytics, contenu, site public, Apple Ads.
Chaque case prise séparément est battue par un spécialiste moins cher. Le pari du 360 ne tient que
si l'**enchaînement** entre les cases crée une valeur qu'aucun spécialiste n'offre : voir un mot-clé,
générer la métadonnée dans 22 langues, la publier, et mesurer l'effet sur les installs. Personne
ne fait cette boucle complète. **C'est ça, le produit, et c'est ça qu'il faut rendre visible.**

---

## 6. Trouvaille dans le code, utile tout de suite

`app/(dashboard)/app/page.tsx` ligne 294 : Appolyn demande un **numéro de vendeur** pour lire les ventes.
C'est exactement le paramètre qui manquait ce soir pour lire l'historique complet des ventes de Vision
par l'API. S'il est déjà renseigné dans Appolyn, on peut récupérer tout l'historique, pas seulement
la fenêtre des rapports Analytics.

Le dashboard d'accueil actuel affiche déjà **quatre KPI** (téléchargements, revenu, note, santé),
ce qui est le bon nombre et correspond à ce que fait Postback. La structure n'est pas le problème.


---

## 7. Ce que les utilisateurs REPROCHENT aux concurrents

C'est la partie la plus utile de l'analyse : les plaintes disent où sont les places libres.

### Astro (9 $/mois, le plancher du marché)

| Reproche | Appolyn aujourd'hui |
|---|---|
| **Nécessite un Mac** (app macOS native) | ✅ **web, donc Windows, Linux, téléphone** |
| **Pas d'abonnement mensuel**, annuel obligatoire | ✅ mensuel |
| Pas de plan gratuit permanent, essai de 14 jours seulement | à décider |
| **Aucune suggestion IA** | ✅ génération IA des métadonnées |
| Pas d'accès API | non |
| iOS seulement, aucun Google Play | identique, iOS seulement |
| « données complètement non pertinentes » pour certains | — |

### AppSprint ASO (19 à 39 $/mois)

Même reproche structurel : **c'est une application macOS**. Un développeur sur Windows ne peut
pas l'utiliser, et personne ne peut consulter ses chiffres depuis son téléphone.

### Appfigures

- **Trop cher pour un petit développeur**
- **Tableau de bord complexe et écrasant**, « surcharge d'information »
- Données parfois retardées ou incomplètes
- Un utilisateur de longue date explique être parti parce qu'il payait très cher pour une seule
  chose qu'il voulait vraiment : suivre ses positions de mots-clés dans le temps

### Le reproche général de la niche

> « Fatigués des outils standards qui facturent 100 $ et plus par mois. »

---

## 8. Les trois ouvertures réelles pour Appolyn

### 1. Appolyn tourne dans un navigateur, ses deux concurrents directs sont des apps macOS

**C'est l'avantage le plus concret et il n'est revendiqué nulle part.** Astro et AppSprint exigent
un Mac. Appolyn s'ouvre sur un PC Windows, sur un Linux, et **depuis un téléphone**.

Conséquence directe sur l'envie d'application mobile : Appolyn est déjà consultable sur mobile,
il « suffit » que le dashboard soit utilisable sur petit écran. Un site bien responsive livre 80 %
de la valeur d'une app native, sans App Review et sans un projet Xcode de plus.

### 2. La boucle complète, que personne ne ferme

Voir un mot-clé → générer la métadonnée dans 22 langues → **la publier en un clic** → mesurer
l'effet sur les installs. Astro s'arrête au mot-clé, AppSprint édite mais ne génère pas,
Postback mesure sans toucher à l'ASO. **Appolyn est le seul à faire le tour complet.**

### 3. La densité, à condition d'en faire une force

Le reproche fait à Appfigures (« complexe, écrasant, surcharge d'information ») est exactement le
risque d'Appolyn avec ses onze sections. La différence entre « complet » et « écrasant » ne se joue
pas sur le nombre de fonctions, mais sur ce que montre la **porte d'entrée**. D'où la réduction
des tuiles de 11 à 6 cette nuit, et la suppression des pages qui ne faisaient que répéter le menu.

---

## Sources complémentaires
- https://postback.sh/blog/apple-app-store-connect-analytics
- https://postback.sh/blog/posthog-mobile-app-analytics
- https://tryastro.app/
- https://appdrift.co/blog/best-aso-tools-reddit
- https://aurora-aso.app/articles/best-aso-tools-2026

## Sources
- https://postback.sh/
- https://appsprint.app/ et https://appsprint.app/aso/features
- https://tap-and-swipe.com/case-studies/app-sprint-aso
