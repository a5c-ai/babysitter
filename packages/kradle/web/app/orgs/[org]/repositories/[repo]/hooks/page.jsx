export const metadata = { title: 'Repository Hooks | Kradle' };
export const dynamic = 'force-dynamic';

import { RepositoryHooksPage } from '../../../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <RepositoryHooksPage org={org} repo={repo} />;
}
