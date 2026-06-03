// Routes: /orgs/[org]/artifacts — artifact registries and feed management.
import { loadKrateUi, DegradedBanner } from '../lib/krate-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { ArtifactRegistryManager } from '../components/artifact-registry.jsx';

export async function ArtifactRegistriesPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const allResources = ui.model.resources || [];
  const registries = allResources.filter((r) => r.kind === 'ArtifactRegistry').flatMap((r) => r.items || []);
  const feeds = allResources.filter((r) => r.kind === 'ArtifactFeed').flatMap((r) => r.items || []);
  const externalProviders = allResources.filter((r) => r.kind === 'ArtifactRegistryProvider').flatMap((r) => r.items || []);
  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model.orgs}
      currentPath="/artifacts"
      eyebrow="artifact management"
      title="Artifact Registries"
      text="Manage package registries, artifact feeds, and published versions. Supports npm, pip, Docker, and generic artifact types."
      actions={[['/artifacts', 'Refresh']]}
      breadcrumbs={[['/', 'Krate'], ['/artifacts', 'Artifacts']]}
    >
      <DegradedBanner model={ui.model} />
      <ArtifactRegistryManager org={activeOrg} registries={registries} feeds={feeds} externalProviders={externalProviders} />
    </PageFrame>
  );
}

export async function ArtifactRegistryDetailPage({ org = null, registryName = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const allResources = ui.model.resources || [];
  const registries = allResources.filter((r) => r.kind === 'ArtifactRegistry').flatMap((r) => r.items || []);
  const feeds = allResources.filter((r) => r.kind === 'ArtifactFeed').flatMap((r) => r.items || []);
  const externalProviders = allResources.filter((r) => r.kind === 'ArtifactRegistryProvider').flatMap((r) => r.items || []);
  const registry = registryName ? registries.find((r) => r.metadata?.name === registryName) : null;
  const registryFeeds = registry ? feeds.filter((f) => f.spec?.registryRef === registryName) : feeds;
  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model.orgs}
      currentPath="/artifacts"
      eyebrow="registry detail"
      title={registry ? `Registry: ${registryName}` : 'Artifact Registries'}
      text={registry ? `${registry.spec?.registryType || 'generic'} registry with ${registry.spec?.storageBackend || 'internal'} storage. Browse feeds and published versions.` : 'Browse artifact feeds and published versions across all registries.'}
      actions={[['/artifacts', 'All registries']]}
      breadcrumbs={[['/', 'Krate'], ['/artifacts', 'Artifacts'], ...(registryName ? [[`/artifacts/${registryName}`, registryName]] : [])]}
    >
      <DegradedBanner model={ui.model} />
      <ArtifactRegistryManager org={activeOrg} registries={registry ? [registry] : registries} feeds={registryFeeds} externalProviders={externalProviders} />
    </PageFrame>
  );
}
