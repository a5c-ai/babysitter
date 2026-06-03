export const metadata = { title: 'Playground | Krate' };
export const dynamic = 'force-dynamic';

import { PlaygroundPage } from '../../../pages/playground-pages.jsx';

export default async function Page({ params }) {
  const { org } = await params;
  return <PlaygroundPage org={org} />;
}
