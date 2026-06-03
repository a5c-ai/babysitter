export const metadata = { title: 'Agent Approvals | Krate' };
export const dynamic = 'force-dynamic';

import { AgentApprovalsPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentApprovalsPage org={org} />;
}
