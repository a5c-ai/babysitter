export const metadata = { title: 'Agent Rule | Krate' };
export const dynamic = 'force-dynamic';

import { AgentRuleDetailPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const ruleName = routeParams.ruleName;
  return <AgentRuleDetailPage org={org} ruleName={ruleName} />;
}
