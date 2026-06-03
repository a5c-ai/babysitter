export const metadata = { title: 'Meeting Templates | Krate' };
export const dynamic = 'force-dynamic';

import { MeetingTemplatesPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <MeetingTemplatesPage org={org} />;
}
