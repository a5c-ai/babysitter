import { AgentProfileRoutePage } from '../../../../../ui-shell.jsx';

export const metadata = { title: 'Agent Profile - Krate' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  const { org, name } = await params;
  return <AgentProfileRoutePage org={org} name={name} />;
}
