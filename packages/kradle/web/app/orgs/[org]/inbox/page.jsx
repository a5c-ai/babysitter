export const metadata = { title: 'Inbox | Krate' };
export const dynamic = 'force-dynamic';

import { InboxPage } from '../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <InboxPage org={org} />;
}
