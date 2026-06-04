import { AgentCreateRoutePage } from '../../../../../ui-shell.jsx';

export const metadata = { title: 'New Agent - Kradle' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  const { org } = await params;
  return <AgentCreateRoutePage org={org} />;
}
