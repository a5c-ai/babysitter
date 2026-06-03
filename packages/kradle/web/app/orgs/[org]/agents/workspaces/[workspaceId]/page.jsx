export const metadata = { title: 'Agent Workspace | Krate' };
export const dynamic = 'force-dynamic';

import { AgentWorkspaceDetailPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const workspaceId = routeParams.workspaceId;
  return <AgentWorkspaceDetailPage org={org} workspaceId={workspaceId} />;
}
