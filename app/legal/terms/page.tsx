import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Conditions d\'utilisation — Appolyn' };

const CONTACT = 'benjamin.ezidu77@gmail.com';

export default function TermsPage() {
  return (
    <>
      <h1>Conditions d&apos;utilisation</h1>
      <p>Dernière mise à jour : 10 juin 2026</p>

      <p>
        En utilisant Appolyn (« le service »), vous acceptez les présentes conditions. Si vous n&apos;êtes pas
        d&apos;accord, n&apos;utilisez pas le service.
      </p>

      <h2>Le service</h2>
      <p>
        Appolyn est un outil d&apos;App Store Optimization et de gestion de contenu : analyse de vos données
        App Store, gestion des métadonnées, génération assistée par IA et préparation/publication de contenu
        sur les réseaux sociaux que vous connectez.
      </p>

      <h2>Votre compte</h2>
      <ul>
        <li>Vous êtes responsable de la confidentialité de vos identifiants de connexion et de l&apos;activité sur votre compte.</li>
        <li>Vous devez disposer des droits nécessaires sur les comptes App Store Connect et de réseaux sociaux que vous connectez.</li>
        <li>Vous vous engagez à fournir des informations exactes.</li>
      </ul>

      <h2>Utilisation acceptable</h2>
      <ul>
        <li>Vous publiez uniquement du contenu dont vous détenez les droits et qui respecte les règles des plateformes concernées (Apple, Meta, TikTok, YouTube).</li>
        <li>Vous n&apos;utilisez pas le service à des fins illégales, trompeuses, ou pour du spam.</li>
        <li>Vous restez responsable du contenu que vous créez, importez et publiez via le service.</li>
      </ul>

      <h2>Connexions tierces</h2>
      <p>
        Le service se connecte à des plateformes tierces via leurs API officielles, en votre nom et avec votre
        autorisation. Votre usage de ces plateformes reste soumis à leurs propres conditions. Nous ne sommes pas
        responsables des changements, limites ou interruptions de ces API.
      </p>

      <h2>Intelligence artificielle</h2>
      <p>
        Les suggestions générées par IA (métadonnées, légendes) sont fournies à titre d&apos;aide. Vous restez
        responsable de la relecture et de la validation du contenu avant publication.
      </p>

      <h2>Disponibilité</h2>
      <p>
        Le service est fourni « en l&apos;état ». Nous nous efforçons d&apos;assurer sa disponibilité mais ne garantissons
        pas une absence totale d&apos;interruption ou d&apos;erreur.
      </p>

      <h2>Résiliation</h2>
      <p>
        Vous pouvez cesser d&apos;utiliser le service et demander la suppression de votre compte à tout moment. Nous
        pouvons suspendre un compte en cas de violation des présentes conditions.
      </p>

      <h2>Contact</h2>
      <p>Pour toute question : <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
    </>
  );
}
