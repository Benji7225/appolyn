import { redirect } from 'next/navigation';

// App management now lives in Réglages → Mes apps. Keep this route as a redirect
// so old links and bookmarks still work.
export default function AppsRedirect() {
  redirect('/app/settings/apps');
}
