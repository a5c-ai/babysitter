export const metadata = { title: 'Memory Ontology | Krate' };
export const dynamic = 'force-dynamic';

import { AgentMemoryOntologyPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AgentMemoryOntologyPage org={org} />;
}
