export const dynamic = 'force-dynamic';

import { EvalSuiteDetailPage } from '../../../../ui-shell.jsx';

export const metadata = { title: 'Eval Suite | Kradle' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const suiteId = routeParams.suiteId;
  return <EvalSuiteDetailPage org={org} suiteId={suiteId} />;
}
