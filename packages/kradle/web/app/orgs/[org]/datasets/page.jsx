export const dynamic = 'force-dynamic';

import { DatasetsPage } from '../../../ui-shell.jsx';

export const metadata = { title: 'Datasets | Kradle' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <DatasetsPage org={org} />;
}
