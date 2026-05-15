export const metadata = { title: 'Branch Protection | Krate' };
export const dynamic = 'force-dynamic';

import { BranchProtectionPage } from '../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <BranchProtectionPage org={org} />;
}
