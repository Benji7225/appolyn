# Décisions de design pour Appolyn

> Benjamin : « le but c'est que tu saches vraiment pour chaque point pourquoi tu l'as mis
> ou pourquoi tu l'as pas mis ». Ce document répond à ça. Chaque décision porte sa raison,
> y compris les refus.

---

## La tension de fond, à trancher avant tout le reste

Le blog de Postback contient une phrase qui vise Appolyn en plein cœur, sans le savoir :

> « Un outil n'est pas moins cher parce que ses modules inutilisés ont des allocations gratuites. »

Et sa recommandation aux fondateurs solo : **une réponse claire avant le déjeuner, plutôt qu'une
multitude d'options.** Le reproche fait à PostHog n'est pas son prix, c'est le **nombre de décisions
que l'outil impose à son utilisateur**.

Or Appolyn couvre ASO, analytics, contenu, publicité, site public, avis, trésorerie, onboarding,
paywalls, notifications. **Onze sections dans la barre latérale.** La stratégie du « produit 360 »
actée le 12 juin est exactement ce que le marché reproche aux gros outils.

Ce n'est pas un argument pour tout casser. C'est un argument pour que **l'accueil réponde à une
seule question**, et que le reste attende d'être cherché. Un produit peut être large et paraître
simple, à condition que sa porte d'entrée soit étroite.

**Décision retenue : ne pas réduire le périmètre, mais hiérarchiser brutalement l'accueil.**
Le périmètre est un pari déjà pris et il a une justification réelle (voir la boucle ci-dessous).
La densité de l'accueil, elle, n'a aucune justification.

---

## Ce qui a été fait cette nuit, et pourquoi

### 1. Les groupes du menu déplient au lieu de naviguer

**Pourquoi :** trois pages (`/app/store`, `/app/application`, `/app/marketing`) ne faisaient que
réafficher le menu sous forme de cartes. Un clic amenait sur une page qui redisait ce que
l'utilisateur venait de lire. C'est un coût sans contrepartie.

**Pourquoi un chevron a été ajouté**, alors que l'ancien commentaire du code disait « aucune flèche » :
tant que le groupe était un lien, l'absence de flèche était cohérente. Dès lors qu'il déplie, il faut
signaler l'affordance, sinon l'utilisateur ne sait pas que le clic va ouvrir plutôt que naviguer.
C'est ce que font Shopify et Linear.

**Pourquoi l'état d'ouverture est mémorisé :** sans mémorisation, le menu se referme dès qu'on
quitte la section, et l'utilisateur perd son repère à chaque navigation.

**Pourquoi des redirections plutôt qu'une suppression sèche :** les anciennes URL peuvent être en
marque-page. Un 404 sur une page qu'on a soi-même supprimée est une faute gratuite.

### 2. Les tuiles KPI passent de 11 à 6

**Pourquoi :** trois d'entre elles (abonnés actifs, MRR, renouvellement) étaient déjà dans la carte
« Abonnements » juste en dessous. Benjamin l'avait vu.

**Pourquoi la carte gagne contre la tuile :** la carte met le chiffre en contexte (nouveaux, perdus,
ARR côte à côte). La tuile donnait un nombre nu. À information égale, on garde la version qui
raconte quelque chose.

**Pourquoi 6 et pas 4 comme Postback :** Postback ne fait que l'attribution, Appolyn couvre aussi
l'ASO et la fiche. Six est le compromis entre la référence et le périmètre réel.

**Pourquoi `arppu` et `ltv` sont retirés du défaut mais restent disponibles :** ce sont des
métriques qu'on consulte quand on a déjà une base d'abonnés. Les mettre par défaut à 0 abonné,
c'est afficher trois tirets qui n'apprennent rien.

### 3. L'entonnoir devient un vrai entonnoir

**Pourquoi :** l'ancienne version alignait une barre de 96 pixels de large dans une colonne. On
lisait des chiffres, on ne **voyait** pas la fuite. Or l'entonnoir n'existe que pour ça.

**Ce qui a été copié à Postback, et c'est la seule chose :** le **pourcentage de perte affiché entre
deux marches**, avec le nombre de personnes perdues. C'est ce qui rend le leur utile. Benjamin
croyait que c'était sa forme en zigzag, il a corrigé lui-même : ce n'est pas la forme.

**Ce qui n'a pas été copié, et pourquoi :** leurs globes interactifs d'activité en direct. C'est
joli et ça ne répond à aucune question. Un dashboard n'est pas une vitrine.

**Le dégradé des marches, et une erreur que j'ai faite.** J'ai d'abord inventé un dégradé
bleu → violet à partir des variables `--chart-*`. **C'était exactement la faute que Benjamin
reproche au produit : inventer au lieu d'utiliser ce qui existe.** Il y avait déjà un code couleur
officiel du tunnel dans `lib/funnel.ts`, bleu → magenta → rose → orange → **vert (les payants)**,
utilisé par les pages Utilisateurs et Paywalls.

Corrigé : une fonction `funnelStepColor(index, total)` a été ajoutée dans `lib/funnel.ts` et
interpole sur cette gamme officielle. Les entonnoirs d'Analytics et d'Onboarding parlent donc la
même langue que le reste du produit, et le vert continue de signifier « payant » partout.

**Pourquoi des barres de 28 px et pas 8 :** en dessous de ~24 px, l'œil compare des longueurs et
non des volumes, et l'effet d'entonnoir disparaît.

**Pourquoi la conversion de bout en bout est affichée en bas :** c'est le seul chiffre de ce bloc
qu'on retient et qu'on compare d'une semaine sur l'autre. Postback l'affiche aussi.

### 4. La base de données avant le visuel

**Pourquoi cet ordre :** Benjamin a demandé du visuel, mais il a aussi dit « l'analytics elle est
biaisée, elle est complètement fausse » et « il y a un gros temps d'attente ». Un tableau de bord
superbe qui met huit secondes à afficher des chiffres douteux reste inutilisable. La lenteur était
mesurable et sa cause identifiable ; elle a été traitée d'abord.

---

## Ce qui reste à trancher, avec mon avis

### La palette

Appolyn est en noir avec un bleu iOS (`211 100% 50%`). Shopify est en vert, Stripe en violet,
Linear en bleu-gris.

**Avis : garder le bleu.** Il est cohérent avec l'univers Apple dans lequel vit l'outil, et surtout
changer de couleur est le genre de chantier qui donne l'impression d'avancer sans rien améliorer
pour l'utilisateur. Le problème d'Appolyn n'a jamais été sa teinte.

### Les onglets Events / Funnel / Détail

Benjamin les a repérés chez Postback et les veut. **Avis : oui pour Events, non pour Détail.**
La vue Events (une ligne par événement, avec les volumes) répond à une question réelle :
« qu'est-ce que mon SDK remonte, et est-ce que ça marche ». La vue Détail, elle, dédouble ce que
l'entonnoir montre déjà.

### Les install locations cliquables

Pays, région, ville, modèle d'appareil, devise, proceeds par install. **Avis : oui, mais après.**
C'est un vrai plus, et c'est aussi beaucoup de surface pour un compte qui n'a pas encore
d'utilisateurs à segmenter. À faire quand il y aura des données à trancher.

### L'application mobile

**Avis : la question à se poser d'abord n'est pas comment la construire, c'est ce qu'elle apporte
que NewSub ne donne pas déjà.** NewSub est installé, gratuit, et fait exactement le « cling ».
Construire une app mobile Appolyn pour son usage personnel, c'est plusieurs jours de travail pour
remplacer quelque chose qui existe déjà et qui marche.

Elle se justifie le jour où Appolyn a des clients qui la réclament. Pas avant.

---

## Le système visuel existant, relevé et documenté

Un audit du code a compté ce qui est réellement utilisé. Le résultat explique la sensation de
« c'est moche » sans qu'on puisse dire pourquoi : ce n'est pas la couleur, c'est **l'absence de
règle écrite**. Sept rayons d'arrondi et cinq paddings de carte cohabitent.

### Ce qui est en fait cohérent, et qu'il ne faut pas « corriger »

- **`rounded-2xl` sur les pages publiques** (landing, blog, site client) contre `rounded-xl` dans
  le dashboard. Ce n'est pas un écart : le marketing respire, l'outil est dense. C'est un choix
  juste, à garder.
- **L'échelle `p-4` / `p-5` / `p-6`** suit une hiérarchie réelle : `p-4` pour un élément de liste,
  `p-5` pour un bloc standard, `p-6` pour une grande carte de réglages. Uniformiser détruirait
  cette information.

### La règle à écrire et à tenir

| Élément | Valeur | Pourquoi |
|---|---|---|
| Carte de contenu | `rounded-xl` + `border-border/40` | le standard du dashboard, 134 usages |
| Contrôle (champ, bouton, ligne de menu) | `rounded-lg` | assez distinct de la carte pour créer une hiérarchie |
| Badge, pastille, avatar | `rounded-full` | — |
| Élément de liste dans une carte | `p-4` | — |
| Bloc autonome | `p-5` | — |
| Grande carte de réglages | `p-6` | — |
| Surface publique (landing, blog) | `rounded-2xl` | registre marketing, volontairement plus ample |

⛔ **`rounded-sm`, `rounded-3xl` et `border-border/30` sont des accidents** : 23, 2 et quelques
occurrences isolées, sans logique repérable. À aligner au fil des passages dans les fichiers,
jamais par un remplacement global qui casserait des mises en page sans possibilité de vérifier.

### Couleur

Palette conservée : bleu iOS `211 100% 50%` en primaire, variantes `--chart-1` à `--chart-5`
jusqu'au violet `250 80% 66%`.

**Nouvel usage introduit cette nuit :** le dégradé bleu → violet le long des marches d'un entonnoir.
Il porte une information (le sens de lecture, du haut vers le bas) au lieu d'être décoratif, et il
n'introduit aucune couleur nouvelle. Les entonnoirs d'Analytics et d'Onboarding partagent désormais
ce langage, ce qui n'était pas le cas.

**Vert et rouge sont réservés aux variations** (une hausse, une perte). Ils ne servent jamais
d'accent décoratif, sinon ils perdent leur sens de signal.
