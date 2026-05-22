export const dynamic = 'force-dynamic';

import { ProjectIssueDetailPage } from '../../../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const projectId = routeParams.projectId;
  const issue = routeParams.issue;
  return <ProjectIssueDetailPage org={org} projectId={projectId} issue={issue} />;
}
