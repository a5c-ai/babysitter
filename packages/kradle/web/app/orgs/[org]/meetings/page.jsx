export const metadata = { title: 'Meetings | Krate' };
export const dynamic = 'force-dynamic';

import { MeetingsPage } from '../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <MeetingsPage org={org} />;
}
