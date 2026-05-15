export const metadata = { title: 'Hooks & Events | Krate' };
export const dynamic = 'force-dynamic';

import { HooksEventsPage } from '../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <HooksEventsPage org={org} />;
}
