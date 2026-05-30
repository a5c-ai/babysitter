import { AgentDirectoryPage } from '../../../../ui-shell.jsx';

export const metadata = { title: 'Agent Directory - Krate' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  const { org } = await params;
  return <AgentDirectoryPage org={org} />;
}
