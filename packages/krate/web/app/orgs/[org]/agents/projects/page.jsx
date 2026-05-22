export const dynamic = 'force-dynamic';

import { AgentProjectsPage } from '../../../../ui-shell.jsx';

export const metadata = { title: 'Projects | Krate' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentProjectsPage org={org} />;
}
