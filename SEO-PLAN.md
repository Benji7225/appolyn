# Appolyn — Plan SEO (fondations posées le 21/06)

> But : faire venir des développeurs d'apps via Google, sans dépendre de la pub.
> Réalité à garder en tête : `appolyn.io` est un domaine JEUNE (autorité ~0). Le SEO
> ne bougera pas avant 3-6 mois. On vise la QUALITÉ et l'utilité, jamais le volume
> d'articles minces (ferme à contenu = inutile + risque de pénalité sur domaine neuf).

## ✅ Fondations techniques posées (21/06)
- `app/robots.ts` : indexe le public, bloque le privé (`/app/`, `/api/`, `/auth/`, `/login`, `/signup`).
- `app/sitemap.ts` : sitemap dynamique (landing, blog, docs, legal + tous les articles `blog_posts` publiés, régénéré chaque heure).
- `app/layout.tsx` : metadata racine FR complète (metadataBase `appolyn.io`, title/description, Open Graph, Twitter card, keywords, canonical, robots index/follow), `lang="fr"`.
- `app/page.tsx` : JSON-LD `SoftwareApplication` (données structurées).
- Le blog existe déjà (`/blog`, `/blog/[slug]` depuis Supabase `blog_posts`) avec metadata par article.

## ⚠️ Décision à prendre par Benji : langue du SEO
La landing est en FR, le blog est en EN. Pour un outil de dev iOS, l'audience qui cherche
sur Google est **majoritairement anglophone** (le marché indé iOS est mondial). Deux options :
- **FR** (cohérent avec "FR partout", marché plus petit, moins de concurrence SEO).
- **EN** (audience 10x plus large, mais concurrence SEO plus rude).
- **Les deux** (hreflang, plus de travail). Recommandation : viser l'EN pour le SEO produit
  (c'est là que sont les acheteurs) tout en gardant l'app en FR. À trancher.

## 🎯 Piliers de contenu (par ordre de levier, PAS de ferme à articles)

### 1. Outils gratuits qui rankent (LE meilleur levier pour un outil dev)
Une page = un outil utile + gratuit, qui ranke sur une intention et draine vers l'inscription.
- Vérificateur de fiche App Store (colle une URL App Store → score ASO + suggestions).
- Recherche de mots-clés App Store gratuite (volume/difficulté estimés).
- Générateur/validateur de tailles de screenshots App Store (guide interactif).
- Aperçu de fiche App Store (comment ta fiche apparaît dans les résultats).
> Modèle prouvé par RevenueCat, AppFigures : free tool → SEO → produit.

### 2. Douleurs App Store Connect (long-tail, intention "comment faire")
Articles/guides qui répondent à des recherches précises de devs :
- "Comment ajouter des localisations sur App Store Connect"
- "Comment changer les mots-clés App Store sans nouvelle version"
- "Pourquoi mes screenshots sont refusés (tailles App Store)"
- "Clé API App Store Connect (.p8) : comment la créer et l'utiliser"

### 3. Le wedge (notre différenciateur)
- "Publier sa fiche App Store dans 22 langues automatiquement"
- "ASO multilingue : couvrir tous les marchés App Store sans copier-coller"

### 4. Comparatifs (à faire quand on a de quoi comparer)
- "Appolyn vs RevenueCat", "alternative à AppTweak/App Radar", etc.

## 🚫 Ne PAS faire
- 100 articles IA génériques sur un domaine neuf (zéro autorité = zéro ranking + risque).
- Du contenu sans intention de recherche réelle derrière.

## ➡️ Suite (chat dédié SEO conseillé)
Quand Benji lance la production : un chat dédié avec la consigne "qualité + outils gratuits + wedge",
1-2 contenus par semaine MAX, chacun vraiment utile, + récupérer quelques backlinks
(Product Hunt, Indie Hackers, communautés iOS) car sans liens, rien ne ranke sur un domaine jeune.
