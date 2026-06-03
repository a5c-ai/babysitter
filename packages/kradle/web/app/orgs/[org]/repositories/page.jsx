export const dynamic = 'force-dynamic';

import { RepositoriesPage } from '../../../ui-shell.jsx';

export const metadata = { title: 'Repositories | Krate' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <RepositoriesPage org={org} />;
}
