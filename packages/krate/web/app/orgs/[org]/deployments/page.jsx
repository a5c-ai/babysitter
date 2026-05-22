export const metadata = { title: 'Deployments | Krate' };
export const dynamic = 'force-dynamic';

import { ApplicationsPage } from '../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <ApplicationsPage org={org} />;
}
