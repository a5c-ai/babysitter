export const metadata = { title: 'Inference Service | Krate' };
export const dynamic = 'force-dynamic';

import { InferenceServiceDetailPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const { org, name } = routeParams;
  return <InferenceServiceDetailPage org={org} name={name} />;
}
