export const dynamic = 'force-dynamic';

import { ExternalProvidersPage } from '../../../ui-shell.jsx';

export const metadata = { title: 'External Providers | Krate' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <ExternalProvidersPage org={org} />;
}
