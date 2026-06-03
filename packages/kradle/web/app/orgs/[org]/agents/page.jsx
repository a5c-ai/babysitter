export const metadata = { title: 'Agents | Krate' };
export const dynamic = 'force-dynamic';

import { AgentsDashboardPage } from '../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentsDashboardPage org={org} />;
}
