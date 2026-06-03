export const metadata = { title: 'SSH Keys | Krate' };
export const dynamic = 'force-dynamic';

import { SSHKeysPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <SSHKeysPage org={org} />;
}
