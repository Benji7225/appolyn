import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Politique de confidentialité — Appolyn' };

// Contact de référence pour les questions liées aux données. Modifiable ici.
const CONTACT = 'benjamin.ezidu77@gmail.com';

export default function PrivacyPage() {
  return (
    <>
      <h1>Politique de confidentialité</h1>
      <p>Dernière mise à jour : 10 juin 2026</p>

      <p>
        Appolyn (« le service ») est un outil d&apos;App Store Optimization et de gestion de contenu destiné
        aux développeurs d&apos;applications. Cette politique explique quelles données nous traitons, pourquoi,
        et comment elles sont protégées. Le responsable du traitement est l&apos;éditeur d&apos;Appolyn, joignable
        à <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>

      <h2>Données que nous traitons</h2>
      <ul>
        <li><strong>Compte</strong> : adresse e-mail et mot de passe (le mot de passe est géré et haché par notre prestataire d&apos;authentification, jamais stocké en clair).</li>
        <li><strong>Identifiants App Store Connect</strong> : Key ID, Issuer ID, numéro de vendeur et clé privée .p8. La clé privée est <strong>chiffrée (AES-256-GCM) avant stockage</strong> et n&apos;est jamais exposée au navigateur.</li>
        <li><strong>Données App Store</strong> récupérées via l&apos;API Apple en votre nom : ventes, revenus, téléchargements, avis et métadonnées de vos apps.</li>
        <li><strong>Comptes de réseaux sociaux connectés</strong> : jetons d&apos;accès OAuth (TikTok, Instagram, YouTube, Facebook), <strong>chiffrés au repos</strong>, utilisés uniquement pour publier le contenu que vous nous demandez de publier.</li>
        <li><strong>Contenu</strong> : titres, scripts, légendes, hashtags et fichiers média que vous importez pour préparer ou publier vos posts.</li>
        <li><strong>Données techniques</strong> minimales liées au fonctionnement du service (journaux, sécurité).</li>
      </ul>

      <h2>Finalités</h2>
      <ul>
        <li>Fournir les fonctionnalités du service : analyse ASO, gestion des métadonnées, préparation et publication de contenu.</li>
        <li>Générer, à votre demande, des suggestions de métadonnées et de légendes via un modèle d&apos;intelligence artificielle.</li>
        <li>Publier du contenu sur les comptes que vous avez explicitement connectés.</li>
        <li>Assurer la sécurité et le bon fonctionnement du service.</li>
      </ul>

      <h2>Sous-traitants</h2>
      <p>Nous nous appuyons sur des prestataires qui traitent des données pour notre compte, uniquement dans la mesure nécessaire au service :</p>
      <ul>
        <li><strong>Supabase</strong> (base de données, authentification, stockage) — hébergement dans l&apos;Union européenne.</li>
        <li><strong>Vercel</strong> (hébergement de l&apos;application).</li>
        <li><strong>Anthropic</strong> (modèle d&apos;IA) — reçoit le texte que vous soumettez pour la génération, le temps de produire le résultat.</li>
        <li><strong>Apple</strong> (App Store Connect API) — pour lire vos données d&apos;app et publier vos métadonnées.</li>
        <li><strong>Meta, TikTok, Google/YouTube</strong> — pour publier le contenu sur les comptes que vous connectez.</li>
      </ul>

      <h2>Sécurité</h2>
      <p>
        Les identifiants les plus sensibles (clé privée .p8, jetons OAuth) sont chiffrés avant stockage. L&apos;accès
        aux données est cloisonné par utilisateur au niveau de la base de données (Row Level Security) : vous ne
        pouvez accéder qu&apos;à vos propres données.
      </p>

      <h2>Conservation</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif. Vous pouvez déconnecter un compte de réseau
        social à tout moment (le jeton correspondant est alors supprimé), supprimer un contenu, ou demander la
        suppression complète de votre compte.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de portabilité
        et d&apos;opposition. Pour exercer ces droits, écrivez à <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. La
        procédure de suppression est détaillée sur la page <a href="/legal/data-deletion">Suppression des données</a>.
      </p>

      <h2>Contact</h2>
      <p>Pour toute question relative à cette politique : <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
    </>
  );
}
