export const dynamic = 'force-dynamic';

import { ArtifactRegistryDetailPage } from '../../../../ui-shell.jsx';

export const metadata = { title: 'Registry Detail | Kradle' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const registryName = routeParams.registryName;
  return <ArtifactRegistryDetailPage org={org} registryName={registryName} />;
}
