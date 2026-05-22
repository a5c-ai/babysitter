export const dynamic = 'force-dynamic';

import { ProjectIssuesPage } from '../../../../../../ui-shell.jsx';

export default async function Page({ params, searchParams }) {
  const routeParams = await params;
  const query = await searchParams;
  const org = routeParams.org;
  const projectId = routeParams.projectId;
  const view = query?.view === 'list' ? 'list' : 'kanban';
  return <ProjectIssuesPage org={org} projectId={projectId} view={view} />;
}
