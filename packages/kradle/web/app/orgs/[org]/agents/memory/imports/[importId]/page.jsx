export const metadata = { title: 'Memory Import Detail | Krate' };
export const dynamic = 'force-dynamic';

import { AgentMemoryImportDetailPage } from '../../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const importId = routeParams.importId;
  return <AgentMemoryImportDetailPage org={org} importId={importId} />;
}
