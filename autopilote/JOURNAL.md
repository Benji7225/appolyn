# Journal du pilote automatique Appolyn

> Une entrée par passage, la plus récente en haut. Format : date · section · fait · vérifié · reste.

## 18/11/2026 · SEO · App Store A/B Testing for Indie Developers (PPO)
- slug `app-store-product-page-optimization-ab-testing-guide-for-indie-developers`, publié en base (30 blocs, 9 min). Sources : pages Apple App Store Connect Help. Site injoignable depuis la session, relu en base seulement.

## 18/11/2026 · passage 1 · `keywords`
- Recherche : Astro, AppTweak (sources dans `sections/keywords.md` ; site Astro injoignable depuis la session, noté).
- Fait : colonne **Opportunité** triable (`keywordOpportunity` / `opportunityLabel` dans `lib/aso.ts`, page keywords), dérivée
  des deux métriques réelles, formule affichée en infobulle. Aucune migration.
- Vérifié : typecheck, lint (warnings préexistants), build OK.
- Reste : voir `BACKLOG-AUTO.md`. Prochain passage : `localization`.

## 18/11/2026 · mise en place (session locale, pas un passage)
- Branche `autopilote` créée depuis `main` (b6486da, 09/09/2026). README de mission écrit.
- État constaté : production en panne depuis le 12/11 (Supabase en 402, stockage dépassé par le bucket `vision-content`,
  ménage automatique prévu fin novembre côté Benjamin). Le blog n'a plus publié depuis le 20/06/2026 (11 articles en ligne).
- Prochain passage : section `keywords` (début de la rotation).
