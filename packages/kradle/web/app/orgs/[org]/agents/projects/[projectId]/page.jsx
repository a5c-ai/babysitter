export const metadata = { title: 'Agent Project Board | Kradle' };
export const dynamic = 'force-dynamic';

import { AgentProjectBoardPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const projectId = routeParams.projectId;
  return <AgentProjectBoardPage org={org} projectId={projectId} />;
}
