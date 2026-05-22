export const metadata = { title: 'New Agent Stack | Krate' };
export const dynamic = 'force-dynamic';

import { AgentStackBuilderPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentStackBuilderPage org={org} />;
}
