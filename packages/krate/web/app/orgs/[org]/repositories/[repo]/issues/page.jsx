export const metadata = { title: 'Issues | Krate' };
export const dynamic = 'force-dynamic';

import { RepositoryIssuesPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <RepositoryIssuesPage org={org} repo={repo} />;
}
