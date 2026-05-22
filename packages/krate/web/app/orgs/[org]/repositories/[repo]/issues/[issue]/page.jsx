export const dynamic = 'force-dynamic';

import { RepositoryIssueDetailPage } from '../../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  const issue = routeParams.issue;
  return <RepositoryIssueDetailPage org={org} repo={repo} issue={issue} />;
}
