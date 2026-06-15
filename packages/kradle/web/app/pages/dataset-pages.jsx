// Routes: /orgs/[org]/datasets — dataset management.
import { loadKradleUi, DegradedBanner } from '../lib/kradle-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { DatasetManager } from '../components/dataset/dataset-manager.jsx';
import { DatasetUpload } from '../components/dataset/dataset-upload.jsx';
import { DatasetViewer } from '../components/dataset/dataset-viewer.jsx';

export async function DatasetsPage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const allResources = ui.model.resources || [];
  const datasets = allResources.filter((r) => r.kind === 'Dataset').flatMap((r) => r.items || []);
  const versions = allResources.filter((r) => r.kind === 'DatasetVersion').flatMap((r) => r.items || []);
  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model.orgs}
      currentPath="/datasets"
      eyebrow="quality"
      title="Datasets"
      text="Manage structured datasets for training, evaluation, and reference. Upload CSV or JSON, version your data, and browse records."
      actions={[['/datasets', 'Refresh']]}
      breadcrumbs={[['/', 'Kradle'], ['/datasets', 'Datasets']]}
    >
      <DegradedBanner model={ui.model} />
      <DatasetManager org={activeOrg} datasets={datasets} versions={versions} />
    </PageFrame>
  );
}

export async function DatasetDetailPage({ org = null, datasetId = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const allResources = ui.model.resources || [];
  const datasets = allResources.filter((r) => r.kind === 'Dataset').flatMap((r) => r.items || []);
  const versions = allResources.filter((r) => r.kind === 'DatasetVersion').flatMap((r) => r.items || []);
  const records = allResources.filter((r) => r.kind === 'DatasetRecord').flatMap((r) => r.items || []);
  const dataset = datasetId ? datasets.find((d) => d.metadata?.name === datasetId) : null;
  const datasetVersions = versions.filter((v) => v.spec?.datasetRef === datasetId);
  const datasetRecords = records.filter((r) => {
    const versionNames = new Set(datasetVersions.map((v) => v.metadata?.name));
    return versionNames.has(r.spec?.versionRef);
  });
  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model.orgs}
      currentPath="/datasets"
      eyebrow="dataset"
      title={dataset?.spec?.displayName || datasetId || 'Dataset'}
      text={dataset?.spec?.description || `${datasetVersions.length} versions, ${datasetRecords.length} records.`}
      actions={[['/datasets', 'All datasets']]}
      breadcrumbs={[['/', 'Kradle'], ['/datasets', 'Datasets'], ...(datasetId ? [[`/datasets/${datasetId}`, datasetId]] : [])]}
    >
      <DegradedBanner model={ui.model} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <DatasetUpload org={activeOrg} datasetRef={datasetId} />
        <DatasetViewer org={activeOrg} dataset={dataset} versions={datasetVersions} records={datasetRecords} />
      </div>
    </PageFrame>
  );
}
