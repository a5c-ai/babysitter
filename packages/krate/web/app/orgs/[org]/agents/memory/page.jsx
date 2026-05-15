export const metadata = { title: 'Agent Memory | Krate' };
export const dynamic = 'force-dynamic';

import { AgentMemoryPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentMemoryPage org={org} />;
}
