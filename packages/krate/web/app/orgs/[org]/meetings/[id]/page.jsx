export const metadata = { title: 'Meeting | Krate' };
export const dynamic = 'force-dynamic';

import { MeetingDetailPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const id = routeParams.id;
  return <MeetingDetailPage org={org} id={id} />;
}
