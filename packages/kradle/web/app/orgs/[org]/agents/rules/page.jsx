export const metadata = { title: 'Agent Rules | Krate' };
export const dynamic = 'force-dynamic';

import { AgentRulesPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentRulesPage org={org} />;
}
