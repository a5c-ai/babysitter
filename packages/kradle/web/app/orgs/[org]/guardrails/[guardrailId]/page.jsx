export const dynamic = 'force-dynamic';

import { GuardrailDetailPage } from '../../../../ui-shell.jsx';

export const metadata = { title: 'Guardrail Detail | Kradle' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const guardrailId = routeParams.guardrailId;
  return <GuardrailDetailPage org={org} guardrailId={guardrailId} />;
}
