# Ce qui a changé dans Appolyn, nuit du 08 au 09/09/2026

## 1. Base de données : la vraie cause de la lenteur, réglée

L'audit Supabase signalait deux problèmes bien plus larges que ce que prévoyait le fichier
`PENDING-DB-perf.sql` préparé le 14/06 et jamais appliqué (il visait 6 policies et 2 index) :

| Problème | Ampleur réelle | État |
|---|---|---|
| Policies qui ré-évaluent `auth.uid()` **à chaque ligne** | **68 policies** | ✅ corrigé |
| Clés étrangères sans index de couverture | **10 tables** | ✅ corrigé |

**Ce que ça veut dire concrètement.** Chaque fois qu'Appolyn lisait 10 000 événements SDK, la base
recalculait « qui est l'utilisateur connecté » 10 000 fois au lieu d'une seule. C'était le cas sur
la quasi-totalité des tables, donc sur toutes les pages, pas seulement l'analytics.

**Comment ça a été fait.** La réécriture n'a pas été tapée à la main : un bloc SQL a lu les
définitions réelles des policies, les a normalisées puis ré-encapsulées. La logique est strictement
identique, seule l'évaluation change. Vérifié après coup : **0 policy restante en défaut, et l'audit
de sécurité ne remonte aucun trou RLS.**

Les deux avertissements de sécurité restants sont préexistants et sans rapport : l'extension `pg_net`
dans le schéma `public`, et la protection contre les mots de passe compromis, désactivée
(elle s'active en un clic dans Supabase, c'est gratuit et ça vaut le coup).

## 2. Navigation : les pages qui ne servaient à rien

Benjamin : « la page Marketing ne sert à rien, la page Application ne sert à rien ».
C'était exact, ces pages ne faisaient que réafficher le menu sous forme de cartes.

- **Supprimées** : `/app/store`, `/app/application`, `/app/marketing`
- **Sidebar refaite** : un groupe **déplie** désormais ses sous-pages au lieu de naviguer.
  Un chevron indique l'état, et le choix d'ouverture est mémorisé.
- **Anciennes URL redirigées** vers la première sous-page de chaque section, pour ne casser aucun
  marque-page : `/app/store` → Localisation, `/app/application` → Onboarding,
  `/app/marketing` → Organique.
- Les trois entrées correspondantes ont été retirées de la palette de commandes.

## 3. Analytics : le doublon confirmé

Benjamin : « les trucs qui sont en double ». Vérifié, il avait raison :
**abonnés actifs, MRR et taux de renouvellement étaient affichés deux fois**, en tuiles KPI en haut
et dans la carte « Abonnements » plus bas.

Les tuiles par défaut passent de **11 à 6**. La carte Abonnements gagne, parce qu'elle met les
chiffres en contexte (nouveaux, perdus, ARR) là où la tuile ne donnait qu'un nombre nu.
`arppu` et `ltv` restent ajoutables à la demande, ce sont des métriques avancées.

Référence : Postback affiche **quatre** chiffres sur son accueil. Onze tuiles ne hiérarchisent rien.

## Reste à faire

- Vérifier en conditions réelles le gain de vitesse sur la page Analytics.
- L'entonnoir : afficher le **pourcentage de perte à chaque marche** (c'est ce qui rend celui de
  Postback utile, pas sa forme).
- Le travail visuel proprement dit, sur la base des décisions du document d'analyse.

## 4. L'entonnoir de conversion : la trame de points supprimée

Benjamin : « l'entonnoir de conversion, c'est pointillé, c'est pas esthétique ».
Localisé à la ligne près dans `ConversionFunnel` :

```js
backgroundImage: `radial-gradient(${r.stage.color} 1.4px, transparent 1.6px)`
backgroundSize: '13px 13px'
```

Une trame de points répétée tous les 13 px sur le remplissage du cône. Elle ajoutait du bruit à une
forme qui doit se lire d'un coup d'œil, et rendait les petites étapes illisibles.
Remplacée par un dégradé vertical **dans la couleur officielle de l'étape** : même code couleur,
surface franche.

⚠️ La bordure en pointillés du panneau « Réafficher une tuile » est **conservée** : sur une zone
d'édition temporaire, le pointillé est une convention qui signale un emplacement à remplir.

## 5. Une erreur que j'ai commise et corrigée dans la nuit

En refaisant les entonnoirs, j'ai inventé un dégradé bleu → violet. Or `lib/funnel.ts` définit
depuis longtemps le **code couleur officiel du tunnel** (bleu → magenta → rose → orange → vert,
le vert signifiant les payants), déjà utilisé par Utilisateurs et Paywalls.

C'est précisément le reproche que Benjamin fait au produit : les parties belles sont celles qui
suivent une référence, les moches sont celles inventées dans leur coin. Corrigé avec une fonction
`funnelStepColor()` qui interpole sur la gamme officielle.

## 6. Les écrans vides deviennent actionnables

Nouveau composant `components/dashboard/sdk-empty.tsx`. Un écran vide qui dit seulement « pas de
données » laisse croire que l'outil est cassé. Le même écran, qui nomme ce qui s'afficherait ici et
donne le bouton pour brancher le SDK, transforme un défaut en prochaine action.

Appliqué à l'entonnoir d'onboarding (Analytics) et aux Paywalls. La page Utilisateurs avait déjà
un bon état vide avec bouton, elle n'a pas été touchée.

## 7. Appolyn devient utilisable sur téléphone

**Le constat.** La barre latérale fait 240 px et n'était **jamais** masquée. Sur un iPhone d'environ
390 px de large, il restait 150 px pour le contenu : le dashboard était inutilisable au téléphone.

**Pourquoi ça compte plus qu'il n'y paraît.** Benjamin veut « Appolyn sur son téléphone, avec les
notifications ». Or l'analyse concurrentielle a montré qu'Astro et AppSprint, ses deux concurrents
directs, sont des **applications macOS** : leurs utilisateurs ne peuvent rien consulter en mobilité.
Appolyn est une application web, donc ce terrain lui est ouvert, et il ne l'occupait pas.

**Ce qui a été fait.** La barre latérale devient un tiroir sous 768 px : fermée par défaut, ouverte
par un bouton dans la barre du haut, refermée automatiquement à chaque navigation, avec un voile
pour revenir en arrière. Au-dessus de 768 px, rien ne change.

Le mécanisme réutilise l'événement personnalisé déjà employé par la palette de commandes, plutôt
que d'introduire un état global de plus.

**Ce que ça ne fait pas.** Ça rend Appolyn consultable au téléphone, ça ne remplace pas une
notification poussée à chaque vente. Pour ça, `NewSub` est déjà installé et suffit
(voir `DIAGNOSTIC-SDK.md` et les décisions).
