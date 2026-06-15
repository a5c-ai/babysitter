export const dynamic = 'force-dynamic';

import { EvalRunDetailPage } from '../../../../../../ui-shell.jsx';

export const metadata = { title: 'Eval Run | Kradle' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const suiteId = routeParams.suiteId;
  const runId = routeParams.runId;
  return <EvalRunDetailPage org={org} suiteId={suiteId} runId={runId} />;
}
