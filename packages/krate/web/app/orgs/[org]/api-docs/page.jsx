export const dynamic = 'force-dynamic';

import { PageFrame } from '../../../ui-shell.jsx';
import { ApiExplorer } from '../../../components/api-explorer.jsx';

export const metadata = { title: 'API Docs | Krate' };

export default async function ApiDocsPage({ params }) {
  const { org } = await params;
  return (
    <PageFrame
      org={org}
      eyebrow="developer"
      title="API Reference"
      text="Interactive documentation for the Krate HTTP API. Explore endpoints grouped by category and try requests directly against your organization."
      currentPath="/api-docs"
      breadcrumbs={[['/', 'Krate'], ['/api-docs', 'API Docs']]}
    >
      <ApiExplorer org={org} />
    </PageFrame>
  );
}
