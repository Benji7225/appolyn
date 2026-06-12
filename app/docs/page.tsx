import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation — Appolyn',
  description: "Guide complet d'Appolyn : connecter App Store Connect, générer et publier tes métadonnées dans toutes les langues, comprendre ton score ASO, suivre tes concurrents et tes analytics.",
};

type Section = { id: string; title: string; body: React.ReactNode };

const SECTIONS: Section[] = [
  {
    id: 'demarrer',
    title: 'Démarrer en 3 étapes',
    body: (
      <>
        <p>Appolyn se connecte à ton compte App Store Connect pour lire tes vraies données et publier tes métadonnées. Tout part de là.</p>
        <ol>
          <li><strong>Connecte App Store Connect</strong> avec une clé API (.p8). Voir la section ci-dessous.</li>
          <li><strong>Ajoute ton app</strong> et renseigne son identifiant App Store Connect.</li>
          <li><strong>Génère et publie</strong> tes métadonnées localisées en un clic.</li>
        </ol>
        <p>Une fois connecté, ton accueil affiche tes téléchargements, revenus, notes et une liste d&apos;actions recommandées, calculée sur ta vraie data.</p>
      </>
    ),
  },
  {
    id: 'connecter-asc',
    title: 'Connecter App Store Connect',
    body: (
      <>
        <p>Appolyn a besoin d&apos;une clé API App Store Connect. Elle est chiffrée au repos et n&apos;est jamais exposée dans ton navigateur.</p>
        <p>Dans <strong>App Store Connect → Users and Access → Integrations → App Store Connect API</strong> :</p>
        <ol>
          <li>Génère une clé (rôle <em>Admin</em> ou <em>App Manager</em>) et télécharge le fichier <code>.p8</code> (téléchargeable une seule fois).</li>
          <li>Note le <strong>Key ID</strong> (à côté de la clé) et l&apos;<strong>Issuer ID</strong> (en haut de la page).</li>
          <li>Dans Appolyn, va dans <strong>Réglages → App Store Connect</strong>, colle le <code>.p8</code>, le Key ID et l&apos;Issuer ID.</li>
        </ol>
        <p>Pour voir tes ventes et revenus, ajoute aussi ton <strong>numéro de vendeur</strong> (Sales and Trends → en haut à gauche, à côté du nom de ton équipe).</p>
      </>
    ),
  },
  {
    id: 'generer',
    title: 'Générer tes métadonnées avec l\'IA',
    body: (
      <>
        <p>Écris ta fiche dans une langue, et l&apos;IA d&apos;Appolyn la localise dans les 22 langues de l&apos;App Store, en respectant les limites de caractères exactes d&apos;Apple (titre 30, sous-titre 30, mots-clés 100…).</p>
        <p>Dans <strong>App Store Page</strong>, ouvre une langue, écris ou colle ta fiche, puis utilise <strong>« Générer les langues manquantes »</strong> depuis une langue de base. La localisation est culturelle, pas un mot-à-mot.</p>
        <p>Le bouton <strong>« Améliorer avec l&apos;IA »</strong> réécrit une langue puis ne garde la proposition que si elle obtient un score ASO au moins égal au tien : ton score ne peut jamais baisser.</p>
      </>
    ),
  },
  {
    id: 'publier',
    title: 'Publier dans toutes les langues',
    body: (
      <>
        <p>Depuis l&apos;éditeur d&apos;une langue, le bouton <strong>« Publier »</strong> envoie tes métadonnées directement sur App Store Connect : titre et sous-titre, mots-clés, description et texte promotionnel.</p>
        <p>La publication nécessite une <strong>version éditable</strong> de ton app (par exemple « Prepare for Submission »). Si ta version est déjà en ligne et figée, crée une nouvelle version dans App Store Connect pour pouvoir éditer ta fiche.</p>
        <p>Chaque langue est publiée indépendamment : si une échoue, les autres passent quand même, et Appolyn te dit précisément laquelle a posé problème.</p>
      </>
    ),
  },
  {
    id: 'score-aso',
    title: 'Comprendre ton score ASO',
    body: (
      <>
        <p>Ton score ASO (0 à 100) est calculé automatiquement, gratuitement, sur des données réelles, sans IA payante. Il combine deux choses :</p>
        <ul>
          <li>Un <strong>audit structurel</strong> de ta fiche : longueur du titre, du sous-titre, du champ mots-clés, doublons, chevauchement titre/mots-clés, mots génériques, qualité de la description.</li>
          <li>La <strong>compétitivité réelle de chaque mot-clé</strong> (via les apps qui se classent dessus) : un terme saturé que tu ne peux pas atteindre pèse sur la note.</li>
        </ul>
        <p>Un score de 100 est quasiment impossible, c&apos;est voulu : il reflète une marge de progression honnête, pas une flatterie.</p>
      </>
    ),
  },
  {
    id: 'concurrents',
    title: 'Suivre tes concurrents',
    body: (
      <>
        <p>Ajoute un concurrent par recherche ou par identifiant. Appolyn prend des instantanés réguliers de sa fiche et détecte les changements (titre, sous-titre, captures, prix).</p>
        <p>Sa fiche détaillée montre ses notes et avis publics, les pays où il est le plus présent (d&apos;après le volume d&apos;avis par store), et les mots-clés sur lesquels il se classe avec son rang réel.</p>
      </>
    ),
  },
  {
    id: 'analytics',
    title: 'Analytics & abonnements',
    body: (
      <>
        <p>La page Analytics affiche tes ventes réelles depuis tes rapports App Store : revenu, téléchargements, revenu par téléchargement, par jour, et la répartition par pays.</p>
        <p>Dès que tu as des abonnés, tu vois aussi tes abonnés actifs, ton MRR/ARR, tes nouveaux abonnés, ton taux de renouvellement et ton churn, ainsi qu&apos;un <strong>entonnoir de conversion</strong> qui montre où tu perds des utilisateurs.</p>
        <p>Tu peux personnaliser tes indicateurs : bouton <strong>« Modifier »</strong>, puis masque, réordonne ou ajoute ceux qui comptent pour toi.</p>
      </>
    ),
  },
  {
    id: 'securite',
    title: 'Sécurité & confidentialité',
    body: (
      <>
        <p>Ta clé API App Store Connect (.p8) est chiffrée au repos (AES-256-GCM) et n&apos;est jamais renvoyée à ton navigateur. Aucune donnée n&apos;est inventée : tout ce que tu vois vient de tes vrais rapports Apple.</p>
        <p>Tu restes propriétaire de tes fiches. Si tu résilies, tu gardes ce qui est publié chez Apple et tu perds seulement l&apos;accès à Appolyn (suivi, IA, analytics).</p>
      </>
    ),
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo_3MN_(1).png" alt="Appolyn" width={26} height={26} className="rounded-md" />
            <span className="font-semibold text-sm">Appolyn</span>
            <span className="text-sm text-muted-foreground">/ Docs</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Ouvrir l&apos;app →
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 grid lg:grid-cols-[200px_1fr] gap-10">
        <nav className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Sommaire</p>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">
                {s.title}
              </a>
            ))}
          </div>
        </nav>

        <main>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Documentation</h1>
          <p className="text-muted-foreground mb-10">Tout pour tirer le maximum d&apos;Appolyn, de la connexion à la publication.</p>

          <div className="space-y-12">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold tracking-tight mb-3">{s.title}</h2>
                <div className="prose-docs text-sm text-muted-foreground leading-relaxed space-y-3 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5 [&_ol]:space-y-1.5 [&_ul]:space-y-1.5 [&_strong]:text-foreground [&_code]:text-foreground [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-border/40 text-sm text-muted-foreground">
            Une question sans réponse ici ? Écris-nous depuis l&apos;app, on complète la doc en continu.
          </div>
        </main>
      </div>
    </div>
  );
}
