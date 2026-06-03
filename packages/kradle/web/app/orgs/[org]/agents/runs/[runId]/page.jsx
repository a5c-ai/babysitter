export const metadata = { title: 'Agent Run | Krate' };
export const dynamic = 'force-dynamic';

import { AgentRunDetailPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const runId = routeParams.runId;
  return <AgentRunDetailPage org={org} runId={runId} />;
}
