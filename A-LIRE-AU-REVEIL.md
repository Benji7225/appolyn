# Nuit du 08 au 09/09/2026 sur Appolyn

Quatre documents ont été écrits, mais **si tu n'en lis qu'un, lis celui-ci**.

---

## 1. La découverte qui compte le plus

**Le SDK Appolyn n'a jamais envoyé une seule donnée.** `sdk_events` et `sdk_clients` sont vides
depuis la création. C'est pour ça que tu trouves l'analytics « complètement fausse » : la moitié
du produit (entonnoir, paywalls, utilisateurs, essais, rétention, ARPU) ne peut rien afficher.

Et la cause n'est pas celle qu'on croyait. Le dépôt `appolyn-ios` existe, est public, a ses tags
1.5.0 et 1.6.0, et le package est **déjà** ajouté au projet Xcode de Vision.

Il manque **deux lignes dans `VisionApp.swift`** : `import Appolyn` et `Appolyn.start(key:)`.
Le package est là, personne ne l'appelle.

⛔ Je ne l'ai pas fait : ça touche Vision, pas Appolyn, et ça impose de resoumettre l'app à Apple.
C'est ta décision. Détail dans `DIAGNOSTIC-SDK.md`.

---

## 2. Ce qui a changé et que tu verras

| | Avant | Maintenant |
|---|---|---|
| **Vitesse** | 68 règles de sécurité recalculées à chaque ligne lue | corrigées, plus 10 index manquants |
| **Menu** | cliquer sur ASO/Marketing/Application ouvrait une page qui répétait le menu | le groupe déplie, les 3 pages sont supprimées |
| **Entonnoir de conversion** | trame de points tous les 13 px | remplissage franc, code couleur officiel conservé |
| **Entonnoirs d'onboarding** | barre de 96 px dans une colonne | vraies barres, perte affichée entre chaque marche |
| **Accueil** | 4 nombres nus | + micro-courbe et variation sur téléchargements et revenu |
| **Analytics** | 11 tuiles, dont 3 en double avec la carte Abonnements | 6 tuiles |
| **Écrans vides** | « pas de données » | ce qui s'afficherait ici, + bouton pour brancher le SDK |
| **Téléphone** | barre de 240 px sur 390 px, inutilisable | barre en tiroir, Appolyn devient consultable en mobilité |

Build complet validé, typecheck sans erreur, aucun commit fait : tu décides.

**J'ai regardé le résultat avant de te le livrer.** Serveur lancé en local, entonnoirs affichés à
l'écran, deux variantes de couleur comparées côte à côte. La version douce était plus élégante mais
on ne lisait plus la décroissance : gardé l'aplat, adouci d'un dégradé. La page de test a été
supprimée, le build revalidé après.

⚠️ **Ce que je n'ai PAS pu vérifier :** le dashboard connecté. Ta session Supabase n'existe pas sur
localhost, donc je n'ai pas vu l'accueil, l'analytics ni la barre latérale avec tes vraies données.
Le code compile et les routes répondent, mais le rendu réel de ces écrans reste à confirmer par toi.

---

## 3. Ce que l'analyse concurrentielle a sorti

**AppSprint a fait 5 000 $ de MRR en un mois avec une seule vidéo YouTube.** Pas de Product Hunt,
pas de pub. Arthur animait déjà un podcast où il interviewe des fondateurs d'apps : il avait sa
cible dans l'oreille avant d'avoir un produit. Tu construis une audience sur la santé oculaire.
Ces deux publics ne se recoupent pas. **Le produit n'est pas le goulot d'Appolyn, la distribution
l'est.** Même diagnostic que pour Vision.

**Trois ouvertures réelles, dont une que tu n'exploites pas du tout :**

1. **Astro et AppSprint sont des applications macOS.** Appolyn tourne dans un navigateur : Windows,
   Linux, téléphone. Aucun de tes concurrents ne peut être consulté en mobilité. Ce n'est écrit
   nulle part sur ton site.
2. **La boucle complète que personne ne ferme** : voir un mot-clé, générer la métadonnée en 22
   langues, la publier en un clic, mesurer l'effet. Astro s'arrête au mot-clé, AppSprint édite sans
   générer, Postback mesure sans toucher à l'ASO.
3. Le reproche fait à Appfigures (« complexe, écrasant ») est le risque d'Appolyn avec ses onze
   sections. D'où la réduction de l'accueil cette nuit.

---

## 4. Une erreur que j'ai faite cette nuit

En refaisant les entonnoirs, j'ai inventé un dégradé bleu-violet. Or `lib/funnel.ts` définissait
déjà le code couleur officiel du tunnel (bleu → vert, le vert voulant dire « payant »), utilisé par
Utilisateurs et Paywalls. **C'est exactement ce que tu reproches au produit : inventer au lieu de
suivre la référence qui existe.** Corrigé avant la fin de la nuit.

---

## 5. Sur ton envie d'application mobile

Elle vaut la peine d'être posée plus tard, pas maintenant. `NewSub` est déjà installé sur ton
téléphone et fait exactement le carillon à chaque abonnement, gratuitement. Il te reste à y coller
ta clé App Store Connect, cinq minutes. Et depuis cette nuit, Appolyn s'ouvre correctement sur ton
écran de téléphone pour le reste.

---

## Les autres documents

- `DIAGNOSTIC-SDK.md` — pourquoi l'analytics est vide, et le correctif exact
- `ANALYSE-CONCURRENTS.md` — Postback, AppSprint, Astro, le marché, les critiques des utilisateurs
- `DECISIONS-DESIGN.md` — chaque choix visuel et sa raison, y compris les refus
- `CHANGEMENTS-NUIT-09-09.md` — le détail technique de ce qui a bougé
- `RETOURS-BENJI-08-09.md` — tout ce que tu m'as dit hier soir, consigné
