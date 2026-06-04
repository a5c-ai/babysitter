export const metadata = { title: 'Playground | Kradle' };
export const dynamic = 'force-dynamic';

import { PlaygroundPage } from '../../../pages/playground-pages.jsx';

export default async function Page({ params }) {
  const { org } = await params;
  return <PlaygroundPage org={org} />;
}
