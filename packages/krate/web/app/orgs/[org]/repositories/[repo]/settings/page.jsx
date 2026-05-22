export const metadata = { title: 'Repository Settings | Krate' };
export const dynamic = 'force-dynamic';

import { RepositorySettingsPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <RepositorySettingsPage org={org} repo={repo} />;
}
