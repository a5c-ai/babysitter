export const metadata = { title: 'Agent Session | Krate' };
export const dynamic = 'force-dynamic';

import { AgentSessionDetailPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const sessionId = routeParams.sessionId;
  return <AgentSessionDetailPage org={org} sessionId={sessionId} />;
}
