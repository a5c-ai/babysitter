export const metadata = { title: 'Runners & CI | Krate' };
export const dynamic = 'force-dynamic';

import { RunnersCiPage } from '../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <RunnersCiPage org={org} />;
}
