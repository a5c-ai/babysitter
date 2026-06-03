// Routes: /orgs/[org]/external, /external/sync, /external/conflicts — external provider management.
import { loadKrateUi, orgHref, DegradedBanner } from '../lib/krate-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { ExternalProviderList } from '../components/external/external-provider-list.jsx';
import { ExternalProviderWizard } from '../components/external/external-provider-wizard.jsx';
import { ExternalSyncDashboard } from '../components/external/external-sync-dashboard.jsx';
import { ExternalConflictResolver } from '../components/external/external-conflict-resolver.jsx';

const TYPED_PROVIDER_KINDS = ['GitProvider', 'CiProvider', 'IssueTrackerProvider', 'AppHostingProvider', 'ArtifactRegistryProvider'];

function collectTypedProviders(resources) {
  const items = [];
  for (const kind of TYPED_PROVIDER_KINDS) {
    const group = (resources || []).find((r) => r.kind === kind);
    if (group?.items) {
      for (const item of group.items) {
        items.push({ ...item, kind });
      }
    }
  }
  return items;
}

export async function ExternalProvidersPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const externalView = ui.model.external || {};
  const providers = externalView.providers?.items
    ? TYPED_PROVIDER_KINDS.flatMap((kind) => {
        const group = (externalView.providers?.items || []).filter((p) => TYPED_PROVIDER_KINDS.includes(p.kind));
        return group.map((p) => ({ ...p }));
      })
    : collectTypedProviders(ui.model.resources);
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/external" eyebrow="external backends" title="External backend providers" text="Connect external forges, issue trackers, and CI/CD systems as Krate-managed provider backends." actions={[['/external/providers/new', 'Add provider'], ['/external/sync', 'Sync status'], ['/external/conflicts', 'Conflicts']]} breadcrumbs={[['/', 'Krate'], ['/external', 'Providers']]}>
    <DegradedBanner model={ui.model} />
    <div className="card">
      <ExternalProviderList org={activeOrg} providers={providers} addHref={orgHref(activeOrg, '/external/providers/new')} />
    </div>
  </PageFrame>;
}

export async function ExternalSyncPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const externalView = ui.model.external || {};
  const bindings = externalView.bindings?.items || (ui.model.resources || []).find((r) => r.kind === 'ExternalBackendBinding')?.items || [];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/external" eyebrow="external sync" title="External sync dashboard" text="Monitor sync state, pending write intents, and open conflicts for all external backend bindings." actions={[['/external', 'Providers'], ['/external/conflicts', 'Conflicts']]} breadcrumbs={[['/', 'Krate'], ['/external', 'Providers'], ['/external/sync', 'Sync']]}>
    <DegradedBanner model={ui.model} />
    <div className="card">
      <ExternalSyncDashboard org={activeOrg} bindings={bindings} />
    </div>
  </PageFrame>;
}

export async function ExternalProviderNewPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/external" eyebrow="external backends" title="Add external provider" text="Connect a new forge, issue tracker, or CI/CD system as an external backend provider." actions={[['/external', 'All providers']]} breadcrumbs={[['/', 'Krate'], ['/external', 'Providers'], ['/external/providers/new', 'New']]}>
    <DegradedBanner model={ui.model} />
    <div className="card">
      <ExternalProviderWizard org={activeOrg} onCancel={null} onSuccess={null} />
    </div>
  </PageFrame>;
}

export async function ExternalConflictsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const externalView = ui.model.external || {};
  const conflicts = externalView.conflicts?.items || (ui.model.resources || []).find((r) => r.kind === 'ExternalFieldConflict')?.items || [];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/external" eyebrow="conflict resolution" title="External conflict resolution" text="Resolve field-level conflicts between local Krate state and external provider values." actions={[['/external', 'Providers'], ['/external/sync', 'Sync status']]} breadcrumbs={[['/', 'Krate'], ['/external', 'Providers'], ['/external/conflicts', 'Conflicts']]}>
    <DegradedBanner model={ui.model} />
    <div className="card">
      <ExternalConflictResolver org={activeOrg} conflicts={conflicts} />
    </div>
  </PageFrame>;
}
