export const metadata = { title: 'Agent Settings | Krate' };
export const dynamic = 'force-dynamic';

import { AgentSettingsPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentSettingsPage org={org} />;
}
