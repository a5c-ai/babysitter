export const metadata = { title: 'New Agent Rule | Krate' };
export const dynamic = 'force-dynamic';

import { AgentRuleBuilderPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentRuleBuilderPage org={org} />;
}
