export const dynamic = 'force-dynamic';

import { AgentRunsPage } from '../../../../ui-shell.jsx';

export const metadata = { title: 'Dispatch Runs | Krate' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentRunsPage org={org} linkToDetail />;
}
