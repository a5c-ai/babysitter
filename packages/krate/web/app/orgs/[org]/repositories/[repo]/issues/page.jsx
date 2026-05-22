export const metadata = { title: 'Issues | Krate' };
export const dynamic = 'force-dynamic';

import { RepositoryIssuesPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params, searchParams }) {
  const routeParams = await params;
  const query = await searchParams;
  const org = routeParams.org;
  const repo = routeParams.repo;
  const view = query?.view === 'list' ? 'list' : 'kanban';
  return <RepositoryIssuesPage org={org} repo={repo} view={view} />;
}
