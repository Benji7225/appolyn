// Source unique de la checklist de lancement (utilisée par la page Lancement ET
// le score de santé). Contenu réel et actionnable pour un indie hacker mobile.

export type LaunchItem = { key: string; title: string; desc: string; href?: string };
export type LaunchPhase = { phase: string; subtitle: string; items: LaunchItem[] };

export const LAUNCH_PHASES: LaunchPhase[] = [
  {
    phase: "Avant le lancement",
    subtitle: "Tout préparer pour partir fort",
    items: [
      { key: "aso_metadata", title: "Optimise ta fiche App Store", desc: "Titre, sous-titre, mots-clés et description travaillés par langue, avec un bon score ASO.", href: "/app/localization" },
      { key: "screenshots", title: "Soigne tes captures et ton aperçu", desc: "Des visuels qui montrent la valeur de l'app en 3 secondes.", href: "/app/localization" },
      { key: "localization", title: "Localise tes marchés clés", desc: "Chaque langue ajoutée ouvre un nouveau marché.", href: "/app/localization" },
      { key: "keywords", title: "Valide tes mots-clés cibles", desc: "Vise des mots-clés recherchés où ton app peut vraiment ranker.", href: "/app/keywords" },
      { key: "pricing", title: "Configure prix et abonnements", desc: "Prix, essai gratuit et offres prêts dans App Store Connect." },
      { key: "legal", title: "Confidentialité et conditions", desc: "URLs en ligne et liées dans ta fiche (obligatoire Apple)." },
      { key: "sdk", title: "Branche le SDK Appolyn", desc: "Une ligne pour capter installs, sources et revenus automatiquement.", href: "/app/settings/connections" },
      { key: "presskit", title: "Prépare ton press-kit", desc: "Dossier de presse prêt à envoyer (Product Hunt, journalistes).", href: "/app/press-kit" },
      { key: "beta", title: "Teste en bêta (TestFlight)", desc: "Quelques testeurs réels pour corriger avant le grand jour." },
    ],
  },
  {
    phase: "Le jour du lancement",
    subtitle: "Maximiser le pic du jour J",
    items: [
      { key: "publish", title: "Publie la version", desc: "Mets ton app en vente sur l'App Store." },
      { key: "producthunt", title: "Lance sur Product Hunt", desc: "Prépare la veille, publie à 00:01 PST, mobilise ton réseau tôt." },
      { key: "crosspost", title: "Annonce sur tes réseaux", desc: "Poste partout en un coup (TikTok, Insta, X, YouTube).", href: "/app/marketing/organic" },
      { key: "communities", title: "Poste dans les communautés", desc: "Reddit, Indie Hackers, Discord pertinents, sans spammer." },
    ],
  },
  {
    phase: "Après le lancement",
    subtitle: "Transformer le lancement en croissance",
    items: [
      { key: "track", title: "Suis tes installs et revenus", desc: "Sources d'acquisition, conversion et revenu réel.", href: "/app/analytics" },
      { key: "reviews", title: "Réponds aux avis", desc: "Des réponses rapides = meilleure note et plus de confiance.", href: "/app/reviews" },
      { key: "iterate_aso", title: "Itère ton ASO", desc: "Ajuste tes mots-clés et ta fiche selon ce qui ranke vraiment.", href: "/app/keywords" },
      { key: "competitors", title: "Surveille tes concurrents", desc: "Repère leurs mouvements et leurs mots-clés.", href: "/app/competitors" },
      { key: "content", title: "Publie du contenu régulier", desc: "Le cross-post organique entretient la croissance.", href: "/app/marketing/organic" },
      { key: "ask_reviews", title: "Demande des avis au bon moment", desc: "Sollicite les utilisateurs satisfaits, pas au hasard." },
      { key: "optimize_paywall", title: "Optimise ton paywall et tes prix", desc: "Teste des variantes pour améliorer la conversion." },
    ],
  },
];

export const LAUNCH_KEYS = LAUNCH_PHASES.flatMap((p) => p.items.map((i) => i.key));
