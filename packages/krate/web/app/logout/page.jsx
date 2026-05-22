import { LogoutPage } from '../ui-shell.jsx';

export const metadata = { title: 'Logout | Krate' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <LogoutPage />;
}
