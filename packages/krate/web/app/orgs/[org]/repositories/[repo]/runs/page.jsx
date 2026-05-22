export const metadata = { title: 'Repository Runs | Krate' };
export const dynamic = 'force-dynamic';

import { RepositoryRunsPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <RepositoryRunsPage org={org} repo={repo} />;
}
