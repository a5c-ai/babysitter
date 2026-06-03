export const metadata = { title: 'Meeting Template | Krate' };
export const dynamic = 'force-dynamic';

import { MeetingTemplateDetailPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const id = routeParams.id;
  return <MeetingTemplateDetailPage org={org} id={id} />;
}
