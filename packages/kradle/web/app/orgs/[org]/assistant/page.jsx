export const dynamic = 'force-dynamic';

import { AssistantPage } from '../../../ui-shell.jsx';

export const metadata = { title: 'Assistant | Krate' };

export default async function Page({ params }) {
  const { org } = await params;
  return <AssistantPage org={org} />;
}
