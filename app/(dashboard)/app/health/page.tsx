import { redirect } from 'next/navigation';

// La Santé de l'app a été FUSIONNÉE dans l'Accueil (score + piliers), pour éviter
// le doublon. On garde cette route pour ne pas casser les anciens liens : elle
// renvoie simplement vers l'accueil.
export default function HealthPage() {
  redirect('/app');
}
