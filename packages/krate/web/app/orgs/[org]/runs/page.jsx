export const metadata = { title: 'Runs | Krate' };
export const dynamic = 'force-dynamic';

import { RunsPage } from '../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <RunsPage org={org} />;
}
