export const dynamic = 'force-dynamic';

import { AgentSessionsPage } from '../../../../ui-shell.jsx';

export const metadata = { title: 'Sessions | Krate' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentSessionsPage org={org} />;
}
