export const metadata = { title: 'Permissions | Krate' };
export const dynamic = 'force-dynamic';

import { RepositoryPermissionsPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <RepositoryPermissionsPage org={org} />;
}
