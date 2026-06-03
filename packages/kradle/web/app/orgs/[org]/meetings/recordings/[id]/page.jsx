export const metadata = { title: 'Recording | Krate' };
export const dynamic = 'force-dynamic';

import { RecordingDetailPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const id = routeParams.id;
  return <RecordingDetailPage org={org} id={id} />;
}
