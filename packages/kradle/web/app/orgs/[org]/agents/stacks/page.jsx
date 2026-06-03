export const dynamic = 'force-dynamic';

import { AgentStacksPage } from '../../../../ui-shell.jsx';

export const metadata = { title: 'Agent Stacks | Krate' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentStacksPage org={org} />;
}
