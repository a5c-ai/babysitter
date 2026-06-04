export const dynamic = 'force-dynamic';

import { AgentSessionsPage } from '../../../../ui-shell.jsx';

export const metadata = { title: 'Sessions | Kradle' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentSessionsPage org={org} />;
}
