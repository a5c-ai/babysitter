export const metadata = { title: 'Controller API | Krate' };
export const dynamic = 'force-dynamic';

import { ControllerApiPage } from '../../../ui-shell.jsx';

export default async function Page({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const repo = routeParams.repo;
  return <ControllerApiPage org={org} />;
}
