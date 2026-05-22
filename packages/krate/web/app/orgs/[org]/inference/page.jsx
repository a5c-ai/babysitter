export const metadata = { title: 'Inference | Krate' };
export const dynamic = 'force-dynamic';

import { InferenceServicesPage } from '../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <InferenceServicesPage org={org} />;
}
