import { LoginPage } from '../ui-shell.jsx';

export const metadata = { title: 'Login | Krate' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  return <LoginPage />;
}
