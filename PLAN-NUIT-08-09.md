# Plan de la nuit du 08 au 09/09/2026

> Mission donnée par Benjamin : **analyse concurrentielle très profonde d'abord**, puis application au code.
> Il insiste : « tu t'arrêtes pas au premier ou au dixième », « que tu saches pour chaque point pourquoi
> tu l'as mis ou pourquoi tu ne l'as pas mis ». Il estime 6 à 7 h d'analyse minimum.
> Il revient vers **9h30 - 10h le 09/09**.
> ⛔ Le 09/09, il s'est interdit de retoucher Appolyn. Ne pas l'y réinviter.

## État d'avancement

- [x] E0. Retours de Benjamin consignés (`RETOURS-BENJI-08-09.md`)
- [x] E1. Cartographie d'Appolyn (40 pages, 70 composants, Next.js + Radix)
- [x] E2. Audit interne écran par écran, avec captures de l'état actuel
- [x] E3. Analyse concurrentielle profonde (le gros morceau)
- [x] E4. Synthèse : système de design et décisions, chaque point justifié
- [x] E5. Application au code
- [~] E6. Si et seulement si tout est fini : application mobile

## E2. Audit interne

Passer chaque écran et noter : ce qui est affiché, d'où viennent les données, ce qui est faux,
ce qui est lent, ce qui est laid, ce qui est en double.
Les défauts qu'il a signalés lui-même sont le point de départ, pas la liste complète :
menu déroulant qui ouvre des pages inutiles, pages Marketing et Application à supprimer,
analytics fausse, doublons du MRR, latence sur 7 jours, étapes de lancement en retard.

## E3. Analyse concurrentielle

**Priorité absolue, c'est sa référence :**
1. `postback.sh` (Arthur Spalanzani) : entonnoir, onglets Events/Funnel/Détail, install locations,
   dashboard d'accueil, proceeds organique vs publié, partie Apple Ads
2. `AppSprint` (même auteur) : c'est de là que viennent les parties d'Appolyn qu'il trouve belles

**Le reste du marché, à couvrir sérieusement :**
RevenueCat, Appfigures, AppFollow, Sensor Tower, TelemetryDeck, Kickstart, NewSub, AppSales, AppStats,
Astro, Superwall, Adapty, Mixpanel, Amplitude.

**Références de dashboards hors niche, pour la qualité visuelle :**
Shopify, Stripe, Vercel, Linear, Plausible.

Pour chaque produit : structure de navigation, hiérarchie de la page d'accueil, choix des métriques,
formes de graphiques, densité, typographie, palette, états vides, états de chargement, interactions
au survol, ce qui est cliquable, comment le détail est révélé.
**Et pour chaque choix : pourquoi ils l'ont fait.**

## E4. Synthèse

Un document de décisions, point par point, avec la justification de chaque inclusion et de chaque rejet.
Palette : Appolyn est en noir aujourd'hui. Les concurrents type Shopify sont sur bleu et vert.
À trancher avec argument, pas par goût.

## E5. Code

Ordre imposé par le bon sens, pas par l'esthétique : **d'abord ce qui est faux, ensuite ce qui est laid.**
Un tableau de bord joli qui affiche des chiffres faux ne sert à rien.

## Journal

- 00h40 : plan posé, cartographie faite, départ sur E2.
- 01h15 : E3 en cours. Postback, AppSprint, Astro et cartographie du marche faits. Reste RevenueCat, Appfigures et les references visuelles.
- 02h35 : E2 fait. Trois corrections appliquees : base de donnees (68 policies + 10 index),
  navigation (3 pages hub supprimees, sidebar depliante), analytics (doublon KPI resolu).
  Detail dans CHANGEMENTS-NUIT-09-09.md. Suite : entonnoir et travail visuel.
- 03h20 : E3 et E4 faits. DECISIONS-DESIGN.md ecrit. Entonnoirs analytics ET onboarding refaits, typecheck propre. Suite : E5, poursuite du visuel.
- 05h05 : CAUSE RACINE TROUVEE ET CORRIGEE. sdk_events et sdk_clients sont VIDES.
  Ma 1re conclusion (distribution cassee) etait FAUSSE : le depot appolyn-ios existe, est
  public, Package.swift est a sa racine, tags 1.5.0 et 1.6.0, et le package est deja
  reference dans Vision.xcodeproj. Il manque juste `import Appolyn` et `Appolyn.start(key:)`
  dans VisionApp.swift. Non applique : ca touche Vision et impose une resoumission App Store.
  Voir DIAGNOSTIC-SDK.md.
- 06h40 : build complet VALIDE (exit 0). Analyse des critiques concurrents ajoutee : 3 ouvertures identifiees (web vs macOS, la boucle complete, la densite).
- 07h05 : sidebar rendue retractable sous 768px + bouton dans la topbar. Appolyn devient consultable au telephone, ce que ses 2 concurrents macOS ne permettent pas.
- 08h40 : VERIFICATION VISUELLE FAITE (lecon des 49 clips non ouverts). Serveur lance en local,
  page de test temporaire creee pour VOIR les entonnoirs, deux variantes comparees a l'ecran,
  variante retenue = aplat + degrade vertical (la version douce etait plus jolie mais on ne
  lisait plus la decroissance). Page de test SUPPRIMEE, build final valide, serveur arrete.
  ⚠️ Limite honnete : le dashboard authentifie n'a PAS pu etre vu (pas de session en local).
- 08h45 : loop arrete. Travail de la nuit termine.
