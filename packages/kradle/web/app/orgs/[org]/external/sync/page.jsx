export const metadata = { title: 'External Sync | Krate' };
export const dynamic = 'force-dynamic';

import { ExternalSyncPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <ExternalSyncPage org={org} />;
}
