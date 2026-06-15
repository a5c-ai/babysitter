export const dynamic = 'force-dynamic';

import { UserProfilePage } from '../../../ui-shell.jsx';

export const metadata = { title: 'Profile | Kradle' };

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  return <UserProfilePage org={org} />;
}
