export const dynamic = 'force-dynamic';

import { SecretManagerPage } from '../../../../ui-shell.jsx';

export const metadata = { title: 'Secrets | Krate' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <SecretManagerPage org={org} />;
}
