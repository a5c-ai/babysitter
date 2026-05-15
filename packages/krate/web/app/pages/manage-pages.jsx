import { createAuthProviderConfig, listEnabledAuthProviders } from '@a5c-ai/krate-sdk';
import { loadKrateUi, orgHref, publicResource, StatusPill, DegradedBanner, EmptyState } from '../lib/krate-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { SectionPage } from './repo-pages.jsx';
import { SecretManager } from '../components/secret-manager.jsx';
import { ResourceActions, InlineCreateForm } from '../components/resource-crud-actions.jsx';
import { HealthMonitor } from '../components/health-monitor.jsx';

export function LoginPage() {
  const config = createAuthProviderConfig();
  const methods = listEnabledAuthProviders(config).map((provider) => ({ id: provider.id, href: `/api/auth/${provider.id}`, label: `Continue with ${provider.label}` }));
  if (config.delegatedIdentity.enabled) methods.push({ id: 'workspace-identity', href: '/api/auth/delegated', label: 'Use workspace identity' });
  return <main id="main-content" className="loginMain" aria-labelledby="login-title">
    <section className="loginCard" aria-label="Krate sign in">
      <a className="loginBrand" href="/login" aria-label="a5c.ai Krate sign in"><span className="brandSigil">K</span><span className="brandWordmark"><strong>Kr<span>ate</span></strong><em>a5c.ai</em></span></a>
      <span className="eyebrow">account</span>
      <h1 id="login-title">Sign in to Krate</h1>
      <p className="lede">Use an administrator-configured sign-in method to continue.</p>
      {methods.length ? <div className="heroActions verticalActions" aria-label="Sign-in methods">{methods.map((method) => <a key={method.id} href={method.href}>{method.label}</a>)}</div> : <p className="loginNotice">No browser sign-in method is configured for this endpoint.</p>}
    </section>
  </main>;
}

export async function LogoutPage({ org = process.env.KRATE_ORG || 'default' } = {}) {
  return <PageFrame org={org} eyebrow="account" title="Sign out" text="End your browser session and return to the sign-in page." actions={[["/api/auth/logout", "Sign out now"], ["/", "Back to dashboard"]]} />;
}

export async function ControllerApiPage() { return <SectionPage section="controller-api" />; }
export async function RepositoriesPage({ org = null } = {}) { return <SectionPage org={org} section="repositories" />; }
export async function ApplicationsPage({ org = null } = {}) { return <SectionPage org={org} section="deployments" />; }
export async function PeoplePage({ org = null } = {}) { return <SectionPage org={org} section="people" />; }
export async function InboxPage({ org = null } = {}) { return <SectionPage org={org} section="inbox" />; }
export async function RunsPage({ org = null } = {}) { return <SectionPage org={org} section="runs" />; }
export async function RunnersCiPage({ org = null } = {}) { return <SectionPage org={org} section="runners-ci" />; }
export async function HooksEventsPage({ org = null } = {}) { return <SectionPage org={org} section="hooks-events" />; }
export async function InsightsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/insights" eyebrow="observability" title="System Health & Insights" text="Real-time connectivity status, agent activity, and system health." breadcrumbs={[['/', 'Krate'], ['/insights', 'Insights']]}>
    <HealthMonitor org={activeOrg} />
  </PageFrame>;
}
export async function ApiDocsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/api-docs" eyebrow="developer" title="API Reference" text="Interactive documentation for the Krate HTTP API. Try endpoints directly against your organization." breadcrumbs={[['/', 'Krate'], ['/api-docs', 'API Docs']]}>
    <p className="lede">Use the route at <a href={orgHref(activeOrg, '/api-docs')}>/orgs/{activeOrg}/api-docs</a> for the full interactive API explorer.</p>
  </PageFrame>;
}
export async function OperationsInstallPage({ org = null } = {}) { return <SectionPage org={org} section="operations-install" />; }
export async function AdvancedPlansPage({ org = null } = {}) { return <SectionPage org={org} section="advanced-plans" />; }

export async function SecretManagerPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const allResources = ui.model.resources || [];
  const secretGrants = allResources.filter((r) => r.kind === 'AgentSecretGrant');
  const configGrants = allResources.filter((r) => r.kind === 'AgentConfigGrant');
  const allGrants = [...secretGrants, ...configGrants];
  const secrets = secretGrants.reduce((acc, grant) => {
    const sName = grant.spec?.secretName || grant.spec?.secretRef;
    if (sName && !acc.find((s) => s.name === sName)) {
      acc.push({ name: sName, type: 'Opaque', createdAt: grant.status?.createdAt || null, grants: [] });
    }
    return acc;
  }, []);
  const configMaps = configGrants.reduce((acc, grant) => {
    const cName = grant.spec?.configMapName || grant.spec?.configMapRef;
    if (cName && !acc.find((c) => c.name === cName)) {
      acc.push({ name: cName, type: 'ConfigMap', createdAt: grant.status?.createdAt || null, grants: [] });
    }
    return acc;
  }, []);
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/settings/secrets" eyebrow="secrets & config management" title="Secrets & ConfigMaps" text="Manage Kubernetes Secrets and ConfigMaps. Use grants to control which agent stacks can access each resource." actions={[['/settings/secrets', 'Refresh']]} breadcrumbs={[['/', 'Krate'], ['/settings/secrets', 'Secrets & ConfigMaps']]}>
    <DegradedBanner model={ui.model} />
    <SecretManager org={activeOrg} secrets={secrets} configMaps={configMaps} grants={allGrants} />
  </PageFrame>;
}

export async function SSHKeysPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const sshKeys = (ui.model.resources || []).filter((r) => r.kind === 'SSHKey');
  const items = sshKeys.flatMap((r) => r.items || []);
  const sshKeyFields = [
    { name: 'name', label: 'Name', placeholder: 'my-deploy-key', required: true },
    { name: 'scope', label: 'Scope', placeholder: 'deploy | user | automation', required: true },
    { name: 'key', label: 'Public key', placeholder: 'ssh-ed25519 AAAA...', required: true, type: 'textarea' }
  ];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/access/ssh-keys" eyebrow="access management" title="SSH keys" text="Manage deploy keys, user SSH keys, and automation keys. Keys are reconciled into repository key APIs." actions={[['/people', 'People'], ['/access/permissions', 'Permissions']]} breadcrumbs={[['/', 'Krate'], ['/access/ssh-keys', 'SSH keys']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="cardTitle"><h2>SSH keys</h2><StatusPill tone={items.length ? 'good' : 'neutral'}>{items.length} keys</StatusPill></div>
        {items.length ? <div className="resourceTable">{items.map((key) => {
          const name = key.metadata?.name || 'unknown';
          const scope = key.spec?.scope || 'unknown';
          const phase = key.status?.phase || 'Pending';
          const fingerprint = key.status?.fingerprint || '';
          const phaseTone = phase === 'Synced' ? 'good' : phase === 'Revoked' ? 'danger' : 'neutral';
          return <div key={name} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <strong>{name}</strong>
            <span className="pill neutral" style={{ fontSize: '0.75rem' }}>{scope}</span>
            <StatusPill tone={phaseTone}>{phase}</StatusPill>
            {fingerprint ? <small style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '0.75rem' }}>{fingerprint.substring(0, 20)}</small> : null}
            <ResourceActions org={activeOrg} apiPath={`sshkeys/${name}`} actions={phase === 'Revoked' ? ['delete'] : ['revoke', 'delete']} />
          </div>;
        })}</div> : <EmptyState title="No SSH keys" text="Add deploy keys for CI/CD pipelines, user SSH keys for developer access, or automation keys for agent workspaces." />}
      </div>
      <InlineCreateForm
        org={activeOrg}
        kind="SSHKey"
        title="Add SSH key"
        fields={sshKeyFields}
        successText="SSH key added"
      />
    </section>
  </PageFrame>;
}

export async function RepositoryPermissionsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const permResources = (ui.model.resources || []).filter((r) => r.kind === 'RepositoryPermission');
  const items = permResources.flatMap((r) => r.items || []);
  const repositories = ui.repositories || [];
  const permFields = [
    { name: 'name', label: 'Name', placeholder: 'repo-user-read', required: true },
    { name: 'repository', label: 'Repository', placeholder: 'my-repo', required: true },
    { name: 'subject', label: 'Subject', placeholder: 'username or team name', required: true },
    { name: 'permission', label: 'Permission', placeholder: 'read | write | admin', required: true }
  ];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/access/permissions" eyebrow="access management" title="Repository permissions" text="Manage repository collaborators and team access grants. Permissions are synced with the underlying repository hosting." actions={[['/people', 'People'], ['/access/ssh-keys', 'SSH keys']]} breadcrumbs={[['/', 'Krate'], ['/access/permissions', 'Permissions']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="cardTitle"><h2>Repository permissions</h2><StatusPill tone={items.length ? 'good' : 'neutral'}>{items.length} grants</StatusPill></div>
        {items.length ? <div className="resourceTable">
          <div className="resourceRow" style={{ fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Name</span><span>Repository</span><span>Subject</span><span>Permission</span><span>Status</span>
          </div>
          {items.map((perm) => {
            const name = perm.metadata?.name || 'unknown';
            const repo = perm.spec?.repository || '--';
            const subject = perm.spec?.subject || '--';
            const permission = perm.spec?.permission || 'read';
            const phase = perm.status?.phase || 'Pending';
            const phaseTone = phase === 'Synced' ? 'good' : phase === 'Revoked' ? 'danger' : 'neutral';
            return <div key={name} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <strong>{name}</strong>
              <span>{repo}</span>
              <span>{subject}</span>
              <span className="pill neutral" style={{ fontSize: '0.75rem' }}>{permission}</span>
              <StatusPill tone={phaseTone}>{phase}</StatusPill>
              <ResourceActions org={activeOrg} apiPath={`repositorypermissions/${name}`} actions={phase === 'Revoked' ? ['delete'] : ['revoke', 'delete']} />
            </div>;
          })}
        </div> : <EmptyState title="No repository permissions" text="Grant collaborator or team access to repositories. Permissions are reconciled with the repository hosting platform." />}
      </div>
      <InlineCreateForm
        org={activeOrg}
        kind="RepositoryPermission"
        title="Grant access"
        fields={permFields}
        successText="Permission granted"
      />
    </section>
  </PageFrame>;
}

export async function BranchProtectionPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const bpResources = (ui.model.resources || []).filter((r) => r.kind === 'BranchProtection');
  const items = bpResources.flatMap((r) => r.items || []);
  const refPolicyResources = (ui.model.resources || []).filter((r) => r.kind === 'RefPolicy');
  const refPolicies = refPolicyResources.flatMap((r) => r.items || []);
  const bpFields = [
    { name: 'name', label: 'Name', placeholder: 'protect-main', required: true },
    { name: 'refs', label: 'Protected refs', placeholder: 'refs/heads/main, refs/heads/release/*', required: true },
    { name: 'requiredReviews', label: 'Required reviews', placeholder: '1', required: false },
    { name: 'requireStatusChecks', label: 'Require status checks', placeholder: 'true', required: false }
  ];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/access/branch-protection" eyebrow="access management" title="Branch protection" text="Define protected branch rules and ref policies. Control force-push, signing requirements, and merge gates." actions={[['/people', 'People'], ['/access/permissions', 'Permissions']]} breadcrumbs={[['/', 'Krate'], ['/access/branch-protection', 'Branch protection']]}>
    <DegradedBanner model={ui.model} />
    <section className="routeGrid two" style={{ alignItems: 'start' }}>
      <div className="stack">
        <div className="card">
          <div className="cardTitle"><h2>Branch protection rules</h2><StatusPill tone={items.length ? 'good' : 'neutral'}>{items.length} rules</StatusPill></div>
          {items.length ? <div className="resourceTable">{items.map((bp) => {
            const name = bp.metadata?.name || 'unknown';
            const refs = bp.spec?.refs || [];
            const phase = bp.status?.phase || 'Pending';
            const phaseTone = phase === 'Active' || phase === 'Ready' || phase === 'Synced' ? 'good' : phase === 'Failed' ? 'danger' : 'neutral';
            return <div key={name} className="resourceRow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <strong>{name}</strong>
              <span>{Array.isArray(refs) ? refs.join(', ') : String(refs)}</span>
              <StatusPill tone={phaseTone}>{phase}</StatusPill>
              <ResourceActions org={activeOrg} apiPath={`branchprotections/${name}`} actions={['delete']} />
            </div>;
          })}</div> : <EmptyState title="No branch protection rules" text="Add branch protection rules to enforce review requirements, status checks, and merge policies on protected branches." />}
        </div>
        <div className="card">
          <div className="cardTitle"><h2>Ref policies</h2><StatusPill tone={refPolicies.length ? 'good' : 'neutral'}>{refPolicies.length} policies</StatusPill></div>
          {refPolicies.length ? <div className="resourceTable">{refPolicies.map((rp) => {
            const name = rp.metadata?.name || 'unknown';
            const phase = rp.status?.phase || 'Pending';
            return <div key={name} className="resourceRow">
              <strong>{name}</strong>
              <StatusPill tone={phase === 'Active' || phase === 'Ready' ? 'good' : 'neutral'}>{phase}</StatusPill>
              <ResourceActions org={activeOrg} apiPath={`refpolicies/${name}`} actions={['delete']} />
            </div>;
          })}</div> : <p className="emptyText">No ref policies configured. Ref policies control force-push, signing requirements, and custom hook gates.</p>}
        </div>
      </div>
      <InlineCreateForm
        org={activeOrg}
        kind="BranchProtection"
        title="Add protection rule"
        fields={bpFields}
        successText="Branch protection rule created"
      />
    </section>
  </PageFrame>;
}
