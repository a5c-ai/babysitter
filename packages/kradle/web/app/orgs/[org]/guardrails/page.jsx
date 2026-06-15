export const dynamic = 'force-dynamic';

import { GuardrailsPage } from '../../../ui-shell.jsx';

export const metadata = { title: 'Guardrails | Kradle' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <GuardrailsPage org={org} />;
}
