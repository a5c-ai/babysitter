export const metadata = { title: 'Advanced Plans | Krate' };
export const dynamic = 'force-dynamic';

import { AdvancedPlansPage } from '../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <AdvancedPlansPage org={org} />;
}
