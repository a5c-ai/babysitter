export const dynamic = 'force-dynamic';

import { DashboardPage } from '../../ui-shell.jsx';

export const metadata = { title: 'Dashboard | Krate' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <DashboardPage org={org} />;
}
