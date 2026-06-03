export const metadata = { title: 'New External Provider | Krate' };
export const dynamic = 'force-dynamic';

import { ExternalProviderNewPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <ExternalProviderNewPage org={org} />;
}
