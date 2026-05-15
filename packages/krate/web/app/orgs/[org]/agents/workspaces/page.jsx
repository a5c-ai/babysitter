export const metadata = { title: 'Agent Workspaces | Krate' };
export const dynamic = 'force-dynamic';

import { AgentWorkspacesPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentWorkspacesPage org={org} />;
}
