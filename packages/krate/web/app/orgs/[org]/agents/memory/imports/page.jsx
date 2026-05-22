export const metadata = { title: 'Memory Imports | Krate' };
export const dynamic = 'force-dynamic';

import { AgentMemoryImportsPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentMemoryImportsPage org={org} />;
}
