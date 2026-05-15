export const metadata = { title: 'Operations Install | Krate' };
export const dynamic = 'force-dynamic';

import { OperationsInstallPage } from '../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <OperationsInstallPage org={org} />;
}
