import { redirect } from 'next/navigation';

// Marketing is split into Organique / Publicité (sidebar dropdown). Land on Organique.
export default function MarketingPage() {
  redirect('/app/marketing/organic');
}
