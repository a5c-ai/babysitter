import { cookies } from 'next/headers';
import { createAuthProviderConfig, listEnabledAuthProviders, parseSessionCookie, fetchControllerUiModel, createKrateApiController, orgNamespaceName, resourceToYaml } from '@a5c-ai/krate-sdk';
import { KrateControllerRecovery } from '../components/krate-loading.jsx';

const ORG_HYDRATED_RESOURCE_KINDS = ['Repository', 'RunnerPool', 'Pipeline', 'Job', 'KrateProject', 'Issue'];

export const orgNavigationGroups = [
  {
    title: 'Ship',
    items: [
      ['/', 'Home', 'Start or continue work'],
      ['/repositories', 'Code', 'Repositories and files'],
      ['/inbox', 'Reviews & issues', 'Pull requests and triage'],
      ['/runs', 'Runs', 'Checks and jobs'],
      ['/deployments', 'Deploy', 'Releases and environments']
    ]
  },
  {
    title: 'Manage',
    items: [
      ['/people', 'People', 'Users, teams, and access'],
      ['/access/ssh-keys', 'SSH keys', 'Deploy and user SSH keys'],
      ['/access/permissions', 'Permissions', 'Repository collaborators'],
      ['/access/branch-protection', 'Branch protection', 'Protected branch rules'],
      ['/hooks-events', 'Hooks & Policies', 'Webhooks and policies'],
      ['/runners-ci', 'Capacity', 'Runner pools'],
      ['/settings/secrets', 'Secrets', 'Secret and config grants'],
      ['/settings', 'Settings', 'App preferences and display'],
      ['/profile', 'Profile', 'User account and API keys']
    ]
  },
  {
    title: 'Agents',
    items: [
      ['/agents', 'Agents', 'Agent stacks and dispatch'],
      ['/agents/stacks', 'Stacks', 'Agent stack configurations'],
      ['/agents/sessions', 'Sessions', 'Agent chat sessions'],
      ['/agents/runs', 'Dispatch runs', 'Agent dispatch runs'],
      ['/agents/rules', 'Trigger rules', 'Trigger rule definitions'],
      ['/agents/approvals', 'Approvals', 'Pending agent approvals'],
      ['/agents/workspaces', 'Workspaces', 'Agent workspaces and runtimes'],
      ['/agents/projects', 'Projects', 'Agent project boards'],
      ['/agents/memory', 'Memory', 'Agent memory repositories and imports'],
      ['/agents/settings', 'Settings', 'Gateway, adapters, and providers']
    ]
  },
  {
    title: 'Observe',
    items: [
      ['/insights', 'Insights', 'Health and activity'],
      ['/operations-install', 'Readiness', 'Install and release checks'],
      ['/api-docs', 'API Docs', 'HTTP API reference and explorer']
    ]
  },
  {
    title: 'External',
    items: [
      ['/external', 'Providers', 'External backend providers'],
      ['/external/sync', 'Sync', 'Sync status and write intents'],
      ['/external/conflicts', 'Conflicts', 'Conflict resolution queue']
    ]
  }
];

export const orgNavigation = orgNavigationGroups.flatMap((group) => group.items.map(([href, label]) => [href, label]));

export const repositoryNavigation = [
  ['code', 'Code'],
  ['pull-requests', 'Reviews'],
  ['issues', 'Issues'],
  ['runs', 'Runs'],
  ['hooks', 'Hooks & Policies'],
  ['settings', 'Settings']
];

export function deploymentKind(suffix) {
  return `Kube${'Vela'}${suffix}`;
}

export function sanitizeCopy(value) {
  return String(value || '')
    .replace(new RegExp(deploymentKind(''), 'g'), 'Krate')
    .replace(/OAM/g, 'Krate deployment')
    .replace(/Gitea/g, 'Krate repositories')
    .replace(/gitea/g, 'Krate repositories')
    .replace(/Argo CD/g, 'Krate release sync')
    .replace(/GitOps/g, 'release sync')
    .replace(/Kubernetes/g, 'Krate')
    .replace(/kubernetes/g, 'Krate')
    .replace(/kubectl/g, 'Krate action')
    .replace(/SubjectAccessReview/g, 'access check')
    .replace(/RBAC/g, 'access policy')
    .replace(/smart-HTTP/g, 'repository streaming')
    .replace(/KRATE_GITEA_HTTP_URL/g, 'Krate repositories')
    .replace(/core\.oam\.dev/g, 'krate.delivery')
    .replace(/app\.oam\.dev/g, 'app.krate.delivery')
    .replace(/policy\.oam\.dev/g, 'policy.krate.delivery')
    .replace(/ApplicationRevision/g, 'Release')
    .replace(/ResourceTracker/g, 'ManagedResource')
    .replace(/YAML/g, 'advanced details')
    .replace(/yaml/g, 'advanced details');
}

export function resourceJson(resource) {
  return sanitizeCopy(JSON.stringify(resource, null, 2));
}

export function redactPublicValue(value, key = '') {
  if (key === 'annotations' || key === 'managedFields' || key === 'ownerReferences') return undefined;
  if (Array.isArray(value)) return value.map((item) => redactPublicValue(item)).filter((item) => item !== undefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactPublicValue(entryValue, entryKey)]).filter(([, entryValue]) => entryValue !== undefined));
  }
  if (typeof value === 'string') return sanitizeCopy(value);
  return value;
}

export function publicResource(resource) {
  if (!resource) return null;
  return redactPublicValue(resource);
}

export function displayKind(kind) {
  return String(kind || '').replace(new RegExp(`^${deploymentKind('')}`), '').replace('ApplicationRevision', 'Release').replace('ResourceTracker', 'ManagedResource') || kind;
}

export function displayRole(role) {
  return sanitizeCopy(String(role || '').replace(/kubernetes/g, 'delivery').replace(/gitea/g, 'Krate repositories'));
}

export function displayCommand(resource, action) {
  if (!resource) return 'Open Krate';
  const label = displayKind(resource.kind).toLowerCase();
  return action === 'apply' ? `Review ${label} details` : `Open ${label} records`;
}

export function sanitizeAction(value) {
  return sanitizeCopy(value).replace('pod events', 'run events');
}

export async function loadKrateUi(org = null) {
  const model = await fetchControllerUiModel({ organization: org, useCache: true, swrOptions: { staleMs: 5 * 60_000 } });
  const activeOrg = org || model.org?.slug || 'default';
  const resourceByKind = new Map(model.resources.map((resource) => [resource.kind, resource]));
  await hydrateEmptyOrgResources(resourceByKind, activeOrg, ORG_HYDRATED_RESOURCE_KINDS);
  syncHydratedModel(model, resourceByKind);
  const repositoryResource = resourceByKind.get('Repository');
  const repositories = repositoryResource?.items?.length ? repositoryResource.items : model.views.dashboard.repositories || [];
  return {
    model,
    repositories,
    repository: repositories[0] || null,
    repositoryResource,
    projectResource: resourceByKind.get('KrateProject'),
    deploymentResource: resourceByKind.get(deploymentKind('Application')),
    releaseResource: resourceByKind.get(deploymentKind('ApplicationRevision')),
    deploymentPolicyResource: resourceByKind.get(deploymentKind('Policy')),
    pullRequests: resourceByKind.get('PullRequest'),
    issues: resourceByKind.get('Issue'),
    pipelines: resourceByKind.get('Pipeline'),
    runnerPools: resourceByKind.get('RunnerPool'),
    webhooks: resourceByKind.get('WebhookSubscription'),
    policyProfiles: resourceByKind.get('PolicyProfile'),
    policyTemplates: resourceByKind.get('PolicyTemplate'),
    policyBindings: resourceByKind.get('PolicyBinding'),
    policyExceptionRequests: resourceByKind.get('PolicyExceptionRequest')
  };
}

function syncHydratedModel(model, resourceByKind) {
  if (!model || !resourceByKind) return;
  const resources = Array.isArray(model.resources) ? [...model.resources] : [];
  for (const [kind, summary] of resourceByKind.entries()) {
    const index = resources.findIndex((resource) => resource.kind === kind);
    if (index >= 0) resources[index] = summary;
    else resources.push(summary);
  }
  model.resources = resources;
  const projects = resourceByKind.get('KrateProject')?.items || [];
  const issues = resourceByKind.get('Issue')?.items || [];
  if (projects.length) {
    model.agents = {
      ...(model.agents || {}),
      projects: { ...((model.agents || {}).projects || {}), count: projects.length, items: projects }
    };
    model.metrics = {
      ...(model.metrics || {}),
      projects: projects.length,
      resources: resources.reduce((count, resource) => count + Number(resource?.count || resource?.items?.length || 0), 0)
    };
  }
  if (issues.length) {
    model.metrics = {
      ...(model.metrics || {}),
      issues: issues.length,
      resources: resources.reduce((count, resource) => count + Number(resource?.count || resource?.items?.length || 0), 0)
    };
  }
}

async function hydrateEmptyOrgResources(resourceByKind, org, kinds) {
  const missingKinds = kinds.filter((kind) => !(resourceByKind.get(kind)?.items?.length));
  if (!missingKinds.length) return;
  try {
    const controller = createKrateApiController({ namespace: orgNamespaceName(org) });
    await Promise.all(missingKinds.map(async (kind) => {
      const result = await controller.listResourceForOrg(org, kind);
      const items = Array.isArray(result?.items) ? result.items : [];
      if (!items.length) return;
      const existing = resourceByKind.get(kind) || { kind, names: [], items: [], count: 0 };
      resourceByKind.set(kind, {
        ...existing,
        count: items.length,
        names: items.map((item) => item.metadata?.name).filter(Boolean),
        items,
        yaml: resourceToYaml(items[0])
      });
    }));
  } catch {
    // Keep the controller model as-is when local org-scoped hydration is unavailable.
  }
}

export function orgHref(org = 'default', href = '/') {
  if (!href || href === '/') return `/orgs/${org}`;
  if (href.startsWith('#') || href.startsWith('/api/') || href.startsWith('/login') || href.startsWith('/logout') || href.startsWith('/orgs')) return href;
  return `/orgs/${org}${href.startsWith('/') ? href : `/${href}`}`;
}

export function modelHref(model, href = '/') {
  return orgHref(model?.org?.slug || 'default', href);
}

export async function getSignedInUser() {
  try {
    const config = createAuthProviderConfig();
    const cookieStore = await cookies();
    return parseSessionCookie(config, cookieStore.get(config.session.cookieName)?.value);
  } catch {
    return null;
  }
}

export function StatusPill({ children, tone = 'good' }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function EmptyState({ title, text, cta, ctaLabel, children, info = false }) {
  const ctaBtn = cta ? <a href={cta} style={{ padding: '0.4rem 1rem', background: 'var(--color-accent, #3b82f6)', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>{ctaLabel || 'Get started'}</a> : null;
  const hasAction = children || ctaBtn;
  return <div className="card emptyState">{info && <span style={{ display: 'inline-block', marginBottom: '0.25rem', fontSize: '1.25rem' }} aria-hidden="true">&#10003;</span>}<h3>{title}</h3><p>{text}</p>{hasAction ? <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>{ctaBtn}{children}</div> : null}</div>;
}

export function shouldShowControllerRecovery(model) {
  if (!model || model.status === 'ready') return false;
  const errors = model.controller?.connection?.errors || [];
  const hasFetchFailure = errors.some((error) => /fetch failed|controller API|ECONN|ENOTFOUND|ETIMEDOUT|Krate workspace unavailable|KRATE_CONTROLLER_URL is not configured/i.test(String(error || '')));
  const hasLiveControllerData = Boolean(model.controller?.connection?.available || model.controller?.apiService);
  return hasFetchFailure && !hasLiveControllerData;
}

export function DegradedBanner({ model }) {
  if (!shouldShowControllerRecovery(model)) return null;
  return <KrateControllerRecovery org={model.org?.slug || 'default'} />;
}

export function InfoList({ title, items }) {
  return <div><h4>{title}</h4><ul className="compactList">{items.map((item) => <li key={item}>{sanitizeCopy(item)}</li>)}</ul></div>;
}

export function PlanCard({ title, plan, compact = false, initiallyOpen = false }) {
  return <details className={`planCard ${compact ? 'compactPlan' : ''}`} open={initiallyOpen}><summary><span><h3>{title}</h3><p>Advanced resource details. Expand only when direct editing is needed.</p></span><StatusPill tone="neutral">advanced</StatusPill></summary><pre><code>{sanitizeCopy(plan) || 'No advanced details are available yet.'}</code></pre></details>;
}

export function ResourceTable({ resource }) {
  if (!resource) return <EmptyState title="Resource unavailable" text="The Krate model did not include this resource definition." />;
  const label = displayKind(resource.kind);
  return <details className="card"><summary><span><h3>{label}</h3><p>{resource.count} records available. Expand for advanced details.</p></span><StatusPill tone={resource.count ? 'good' : 'neutral'}>{resource.count} returned</StatusPill></summary><code>{displayCommand(resource, 'list')}</code>{resource.names?.length ? <ul className="compactList">{resource.names.map((name) => <li key={name}>{name}</li>)}</ul> : <p className="emptyText">No {label} records returned by Krate.</p>}<PlanCard title={`${label} details`} plan={resource.yaml} command={displayCommand(resource, 'apply')} /></details>;
}
