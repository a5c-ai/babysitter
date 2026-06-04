import { LoginPage } from '../ui-shell.jsx';

export const metadata = { title: 'Login | Kradle' };
export const dynamic = 'force-dynamic';

export default async function Page({ searchParams }) {
  const params = await searchParams;
  return <LoginPage error={params?.error} />;
}
