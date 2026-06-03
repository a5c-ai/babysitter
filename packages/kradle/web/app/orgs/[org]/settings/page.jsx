export const dynamic = 'force-dynamic';

import { AppSettingsPage } from '../../../ui-shell.jsx';

export const metadata = { title: 'Settings | Krate' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <AppSettingsPage org={org} />;
}
