import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Suppression des données — Appolyn' };

const CONTACT = 'benjamin.ezidu77@gmail.com';

export default function DataDeletionPage() {
  return (
    <>
      <h1>Suppression des données</h1>
      <p>Dernière mise à jour : 10 juin 2026</p>

      <p>
        Vous pouvez supprimer vos données à tout moment. Cette page décrit comment, conformément aux exigences
        des plateformes (notamment Meta) et au RGPD.
      </p>

      <h2>Déconnecter un compte de réseau social</h2>
      <p>
        Dans Appolyn, ouvrez <strong>Marketing &gt; Organique</strong> et déconnectez le compte concerné. Le jeton
        d&apos;accès correspondant (TikTok, Instagram, YouTube ou Facebook) est immédiatement supprimé de nos serveurs.
        Vous pouvez aussi révoquer l&apos;accès directement depuis les réglages de sécurité de la plateforme concernée.
      </p>

      <h2>Supprimer un contenu</h2>
      <p>
        Chaque post que vous créez peut être supprimé depuis le cockpit de contenu. La suppression retire le post,
        ses légendes et le média associé de nos serveurs.
      </p>

      <h2>Supprimer l&apos;intégralité de votre compte et de vos données</h2>
      <p>
        Pour supprimer définitivement votre compte et toutes les données associées (identifiants App Store Connect
        chiffrés, comptes connectés, contenu et médias), envoyez une demande à
        {' '}<a href={`mailto:${CONTACT}?subject=Suppression%20de%20compte%20Appolyn`}>{CONTACT}</a> depuis
        l&apos;adresse e-mail de votre compte, avec l&apos;objet « Suppression de compte ».
      </p>
      <p>
        Nous traitons la demande sous 30 jours. À l&apos;issue, vos données sont supprimées de la base de données et du
        stockage, et les jetons d&apos;accès tiers sont révoqués. Certaines informations strictement nécessaires à des
        obligations légales peuvent être conservées le temps requis par la loi.
      </p>

      <h2>Contact</h2>
      <p>Pour toute question sur la suppression de vos données : <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
    </>
  );
}
