# SEO technique et outils gratuits

## À quoi ça sert
Faire venir des développeurs via Google : un outil gratuit utile = une page qui ranke sur une intention précise et mène à l'inscription (SEO-PLAN.md, pilier 1).

## Concurrents (recherche WebSearch, 21/11/2026, déclaratif)
- AppLaunchFlow : « App Store metadata checker », gratuit sans inscription, compte caractères et octets UTF-8, côté navigateur (applaunchflow.com/tools/app-store-metadata-checker).
- AppScreenshotStudio : compteur de caractères gratuit, 5 champs iOS, bouton IA de réécriture (appscreenshotstudio.com/tools/character-counter).
- AppDrift : character counter et ASO audit gratuits (appdrift.co/tools).
- MobileAction : Metadata Optimizer (aide en ligne), ASOMobile : 16 outils gratuits dont analyseur de texte.
- AppTweak / Appfigures : aucun outil gratuit équivalent trouvé dans cette recherche (non confirmé).

## Décision
Les compteurs de caractères existent déjà ailleurs : on se distingue par le nettoyage du champ mots-clés (doublons, mots génériques, mots déjà indexés via titre/sous-titre, singulier/pluriel) avec résultat copiable, en anglais, sans inscription, 100 % navigateur.

## Fait
- `/tools` (index) et `/tools/app-store-metadata-checker` : `lib/metadata-check.ts` (logique pure), `components/tools/metadata-checker.tsx`. JSON-LD WebApplication + FAQPage, canonical, OG, sitemap, liens en-tête/pied de page et landing.

## Passage 25/11/2026 : outil tailles de screenshots
- Concurrents vus : ScreenKit, Wishkit, AppScreenshotStudio, ButterKit, AppScreenStudio, Newly, appscreens.store (guides de tailles, WebSearch 25/11) ; les guides se contredisent sur l'exigence iPhone (6.9" vs « medium »). Tranché avec la page officielle Apple « Screenshot specifications » (lue le 25/11/2026) : minimum = Dynamic Island (medium) 1206×2622 ou 1179×2556 ; Face ID (large) requis si Dynamic Island (large) absent ; iPad 13" requis si l'app tourne sur iPad ; 1 à 10 par taille ; PNG/JPEG sans alpha.
- Différenciation : pas seulement un tableau, un vérificateur de fichiers 100 % navigateur (taille, format, canal alpha PNG, plus de 10 par set, taille la plus proche à viser).
- Fait : `/tools/app-store-screenshot-sizes`, `lib/screenshot-sizes.ts`, `components/tools/screenshot-size-checker.tsx`, JSON-LD + FAQ, sitemap, index /tools.
- Limite : la page Apple mentionne un set « iPhone Duo » obligatoire dès avril 2027 (SDK iOS 27.1) : lecture par résumé automatique, non confirmée, volontairement NON incluse. À revérifier à la main. Mac/TV/Vision/Watch non validés.

## Reste
Aperçu de fiche, pages « Appolyn vs X », llms.txt, vérificateur par URL App Store (via iTunes API), pages programmatiques.
