export const metadata = { title: 'Agent Stack | Krate' };
export const dynamic = 'force-dynamic';

import { AgentStackDetailPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const name = routeParams.name;
  return <AgentStackDetailPage org={org} name={name} />;
}
