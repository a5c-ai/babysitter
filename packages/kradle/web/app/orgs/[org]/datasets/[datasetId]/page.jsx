export const dynamic = 'force-dynamic';

import { DatasetDetailPage } from '../../../../ui-shell.jsx';

export const metadata = { title: 'Dataset Detail | Kradle' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const datasetId = routeParams.datasetId;
  return <DatasetDetailPage org={org} datasetId={datasetId} />;
}
