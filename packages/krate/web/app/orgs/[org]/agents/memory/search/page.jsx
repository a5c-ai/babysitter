export const metadata = { title: 'Memory Search | Krate' };
export const dynamic = 'force-dynamic';

import { AgentMemorySearchPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentMemorySearchPage org={org} />;
}
