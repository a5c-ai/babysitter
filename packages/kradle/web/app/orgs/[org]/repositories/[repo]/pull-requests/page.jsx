export const metadata = { title: 'Pull Requests | Krate' };
export const dynamic = 'force-dynamic';

import { RepositoryPullRequestsPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <RepositoryPullRequestsPage org={org} repo={repo} />;
}
