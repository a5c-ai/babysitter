export const dynamic = 'force-dynamic';

import { ArtifactRegistriesPage } from '../../../ui-shell.jsx';

export const metadata = { title: 'Artifact Registries | Krate' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <ArtifactRegistriesPage org={org} />;
}
