export const metadata = { title: 'Insights | Kradle' };
export const dynamic = 'force-dynamic';

import { InsightsPage } from '../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <InsightsPage org={org} />;
}
