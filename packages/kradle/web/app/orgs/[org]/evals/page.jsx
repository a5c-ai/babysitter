export const dynamic = 'force-dynamic';

import { EvalSuitesPage } from '../../../ui-shell.jsx';

export const metadata = { title: 'Evaluations | Kradle' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <EvalSuitesPage org={org} />;
}
