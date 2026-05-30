export const metadata = { title: 'Meeting Recordings | Krate' };
export const dynamic = 'force-dynamic';

import { RecordingsPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <RecordingsPage org={org} />;
}
