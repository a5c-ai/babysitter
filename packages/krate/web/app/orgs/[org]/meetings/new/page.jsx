export const metadata = { title: 'New Meeting | Krate' };
export const dynamic = 'force-dynamic';

import { CreateMeetingPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <CreateMeetingPage org={org} />;
}
