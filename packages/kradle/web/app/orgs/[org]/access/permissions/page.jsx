export const metadata = { title: 'Permissions | Kradle' };
export const dynamic = 'force-dynamic';

import { RepositoryPermissionsPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <RepositoryPermissionsPage org={org} />;
}
