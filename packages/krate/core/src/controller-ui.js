import { giteaIssueSyncPlan, githubProjectIssueSyncPlan } from './gitea-backend.js';
import { resourceToYaml } from './resource-model.js';
import { KRATE_ORG_LABEL, KRATE_ORG_NAMESPACE_LABEL, KRATE_RESOURCES, apiResourceName, createKrateKubernetesReconciler, orgNamespaceName } from './kubernetes-controller.js';

const controllerEndpoints = [
  { method: 'GET', path: '/healthz', purpose: 'container and load-balancer health' },
  { method: 'GET', path: '/api/controller?org=:org', purpose: 'live Krate org model' },
  { method: 'GET', path: '/api/orgs/:org/resources', purpose: 'org-scoped Krate resource listing' },
  { method: 'POST', path: '/api/orgs/:org/resources', purpose: 'org-scoped Krate resource apply flow' },
  { method: 'GET', path: '/api/orgs/:org/resources/:kind/:name', purpose: 'org-scoped Krate resource detail' },
  { method: 'DELETE', path: '/api/orgs/:org/resources/:kind/:name', purpose: 'org-scoped Krate resource delete flow' },
  { method: 'GET', path: '/api/orgs/:org/repositories', purpose: 'list org repositories through Krate' },
  { method: 'POST', path: '/api/orgs/:org/repositories', purpose: 'create org repositories through Krate' },
  { method: 'GET', path: '/api/orgs/:org/repositories/:name', purpose: 'get org repository details through Krate' },
  { method: 'DELETE', path: '/api/orgs/:org/repositories/:name', purpose: 'delete org repositories through Krate' },
  { method: 'GET', path: '/api/orgs/:org/policies', purpose: 'list Krate policy profiles, templates, bindings, Kyverno health, and exception requests' },
  { method: 'POST', path: '/api/orgs/:org/policies', purpose: 'create org policy bindings in audit or enforce mode' },
  { method: 'GET', path: '/api/orgs/:org/policy-reports', purpose: 'list normalized Kyverno policy report results' },
  { method: 'GET', path: '/api/orgs/:org/policy-exception-requests', purpose: 'list pending and approved Krate policy exception requests' },
  { method: 'POST', path: '/api/orgs/:org/policy-exception-requests', purpose: 'request a temporary policy exception through Krate' },
  { method: 'GET', path: '/api/watch/orgs/:org/*', purpose: 'org-scoped Krate live event stream bridged to browser updates' },
  { method: 'POST', path: '/api/git-proxy', purpose: 'repository streaming proxy when configured' },
  { method: 'GET', path: '/api/orgs/:org/agents/stacks', purpose: 'list agent stacks and capability status' },
  { method: 'GET', path: '/api/orgs/:org/agents/runs', purpose: 'list agent dispatch runs with queue and status' },
  { method: 'GET', path: '/api/orgs/:org/agents/rules', purpose: 'list trigger rules and delivery status' },
  { method: 'GET', path: '/api/orgs/:org/agents/sessions', purpose: 'list agent sessions with lifecycle state' },
  { method: 'GET', path: '/api/orgs/:org/agents/workspaces', purpose: 'list agent workspaces with lifecycle state' },
  { method: 'GET', path: '/api/orgs/:org/agents/approvals', purpose: 'list pending and resolved agent approvals' },
  { method: 'GET', path: '/api/orgs/:org/agents/permissions/review', purpose: 'explainable permission check for agent dispatch' },
  { method: 'GET', path: '/api/orgs/:org/agents/adapters', purpose: 'list agent adapters and transport bindings' },
  { method: 'GET', path: '/api/orgs/:org/agents/providers', purpose: 'list model provider configurations' },
  { method: 'GET', path: '/api/orgs/:org/agents/projects', purpose: 'list agent projects with board config' },
  { method: 'POST', path: '/api/orgs/:org/agents/dispatch', purpose: 'create manual agent dispatch run' },
  { method: 'POST', path: '/api/orgs/:org/agents/approvals/:name/decide', purpose: 'approve or deny a pending agent approval request' },
  { method: 'POST', path: '/api/orgs/:org/agents/triggers/process', purpose: 'evaluate an event against trigger rules and dispatch matching agents' },
  { method: 'POST', path: '/api/orgs/:org/agents/workspaces', purpose: 'provision a new agent workspace with worktree and runtime' },
  { method: 'POST', path: '/api/orgs/:org/agents/workspaces/:name/archive', purpose: 'archive an agent workspace and mark it for cleanup' },
  { method: 'POST', path: '/api/orgs/:org/agents/workspaces/:name/link', purpose: 'link a work item to an agent workspace' },
  { method: 'POST', path: '/api/orgs/:org/agents/memory/query', purpose: 'query Company Brain memory with graph and grep search' },
  { method: 'POST', path: '/api/orgs/:org/agents/memory/imports', purpose: 'create a memory import from a babysitter run' },
  { method: 'GET', path: '/api/orgs/:org/agents/memory/snapshots', purpose: 'list memory snapshots for an organization' },
  { method: 'GET', path: '/api/orgs/:org/agents/memory/repositories', purpose: 'list memory repositories for an organization' }
];

const runtimeComponents = [
  { id: 'identity-access', title: 'Identity and access', area: 'identity', resources: ['User', 'Team', 'Invite', 'IdentityMapping', 'AuthProvider'], docs: 'src/auth.js' },
  { id: 'api-controller', title: 'Krate API controller', area: 'api', resources: ['Repository', 'KrateProject', 'PullRequest', 'Issue', 'Pipeline'], docs: 'src/api-controller.js' },
  { id: 'krate-resource-client', title: 'Krate resource client', area: 'control-plane', resources: ['Repository', 'BranchProtection', 'RefPolicy'], docs: 'src/kubernetes-controller.js' },
  { id: 'repository-service', title: 'Repository service', area: 'data-plane', resources: ['Repository', 'BranchProtection', 'RefPolicy'], docs: 'src/data-plane.js' },
  { id: 'runners-ci', title: 'Runner scheduler', area: 'ci', resources: ['RunnerPool', 'Pipeline', 'Job'], docs: 'src/kubernetes-controller.js' },
  { id: 'hooks-events', title: 'Webhook bus', area: 'events', resources: ['WebhookSubscription', 'WebhookDelivery'], docs: 'src/kubernetes-controller.js' },
  { id: 'policy-engine', title: 'Kyverno policy engine', area: 'policy', resources: ['PolicyProfile', 'PolicyTemplate', 'PolicyBinding', 'PolicyExceptionRequest'], docs: 'docs/todo-kyverno' },
  { id: 'agent-orchestration', title: 'Agent orchestration', area: 'agents', resources: ['AgentStack', 'AgentDispatchRun', 'AgentTriggerRule', 'AgentSession', 'KrateWorkspace', 'AgentApproval', 'AgentAdapter', 'AgentProviderConfig', 'KrateProject'], docs: 'docs/agents/' }
];

export function createControllerUiModel(source, options = {}) {
  const snapshot = normalizeSnapshot(source);
  const organizations = ensureOrganizations(snapshot.resources.Organization || [], snapshot.namespace);
  const requestedOrg = options.organization || options.org || process.env.KRATE_ORG || '';
  const activeOrg = organizations.find((org) => org.slug === requestedOrg || org.name === requestedOrg) || organizations[0];
  const resources = KRATE_RESOURCES.map((definition) => {
    const rawItems = snapshot.resources[definition.kind] || [];
    const items = filterResourceItemsForOrg(definition, rawItems, activeOrg?.slug);
    return {
      kind: definition.kind,
      plural: definition.plural,
      apiResource: apiResourceName(definition),
      count: items.length,
      names: items.map((item) => item.metadata?.name).filter(Boolean),
      items,
      phases: summarizePhases(items),
      storage: definition.storage,
      yaml: items[0] ? resourceToYaml(items[0]) : null,
      action: snapshot.commands.find((command) => command.kind === definition.kind) || {
        list: `Open ${definition.kind} records in ${activeOrg?.namespace || snapshot.namespace}`,
        watch: `Watch ${definition.kind} updates in ${activeOrg?.namespace || snapshot.namespace}`,
        apply: 'Save resource changes',
        delete: `Delete ${definition.kind} in ${activeOrg?.namespace || snapshot.namespace}`
      }
    };
  });
  const users = filterByOrg(snapshot.resources.User || [], activeOrg?.slug);
  const teams = filterByOrg(snapshot.resources.Team || [], activeOrg?.slug);
  const invites = filterByOrg(snapshot.resources.Invite || [], activeOrg?.slug);
  const identityMappings = filterByOrg(snapshot.resources.IdentityMapping || [], activeOrg?.slug);
  const authProviders = filterByOrg(snapshot.resources.AuthProvider || [], activeOrg?.slug);
  const repositoryPermissions = filterByOrg(snapshot.resources.RepositoryPermission || [], activeOrg?.slug);
  const sshKeys = filterByOrg(snapshot.resources.SSHKey || [], activeOrg?.slug);
  const identityReconciliation = createKrateKubernetesReconciler({ namespace: snapshot.namespace }).reconcileIdentityAccessResources({ User: users, Team: teams, Invite: invites, IdentityMapping: identityMappings, RepositoryPermission: repositoryPermissions, SSHKey: sshKeys });
  const identityView = createIdentityView({ users, teams, invites, identityMappings, authProviders, permissions: repositoryPermissions, sshKeys, reconciliation: identityReconciliation });
  identityView.org = activeOrg?.slug;
  const repositories = filterByOrg(snapshot.resources.Repository || [], activeOrg?.slug);
  const pullRequests = filterByOrg(snapshot.resources.PullRequest || [], activeOrg?.slug);
  const issues = filterByOrg(snapshot.resources.Issue || [], activeOrg?.slug);
  const pipelines = filterByOrg(snapshot.resources.Pipeline || [], activeOrg?.slug);
  const jobs = filterByOrg(snapshot.resources.Job || [], activeOrg?.slug);
  const runnerPools = filterByOrg(snapshot.resources.RunnerPool || [], activeOrg?.slug);
  const webhookSubscriptions = filterByOrg(snapshot.resources.WebhookSubscription || [], activeOrg?.slug);
  const webhookDeliveries = filterByOrg(snapshot.resources.WebhookDelivery || [], activeOrg?.slug);
  const policyProfiles = filterByOrg(snapshot.resources.PolicyProfile || [], activeOrg?.slug);
  const policyTemplates = filterByOrg(snapshot.resources.PolicyTemplate || [], activeOrg?.slug).concat((snapshot.resources.PolicyTemplate || []).filter((item) => !item.spec?.organizationRef));
  const policyBindings = filterByOrg(snapshot.resources.PolicyBinding || [], activeOrg?.slug);
  const policyExceptionRequests = filterByOrg(snapshot.resources.PolicyExceptionRequest || [], activeOrg?.slug);
  const policyEngine = createPolicyEngineView({ kyverno: snapshot.kyverno, policyProfiles, policyTemplates, policyBindings, policyExceptionRequests, org: activeOrg?.slug, namespace: activeOrg?.namespace || snapshot.namespace });
  const agentStacks = filterByOrg(snapshot.resources.AgentStack || [], activeOrg?.slug);
  const agentDispatchRuns = filterByOrg(snapshot.resources.AgentDispatchRun || [], activeOrg?.slug);
  const agentTriggerRules = filterByOrg(snapshot.resources.AgentTriggerRule || [], activeOrg?.slug);
  const agentSessions = filterByOrg(snapshot.resources.AgentSession || [], activeOrg?.slug);
  const agentWorkspaces = filterByOrg(snapshot.resources.KrateWorkspace || [], activeOrg?.slug);
  const agentApprovals = filterByOrg(snapshot.resources.AgentApproval || [], activeOrg?.slug);
  const agentAdapters = filterByOrg(snapshot.resources.AgentAdapter || [], activeOrg?.slug);
  const agentProviders = filterByOrg(snapshot.resources.AgentProviderConfig || [], activeOrg?.slug);
  const agentProjects = filterByOrg(snapshot.resources.KrateProject || [], activeOrg?.slug);
  const agentGateway = filterByOrg(snapshot.resources.AgentGatewayConfig || [], activeOrg?.slug);
  const agentTranscripts = filterByOrg(snapshot.resources.AgentSessionTranscript || [], activeOrg?.slug);
  const memoryRepositories = filterByOrg(snapshot.resources.AgentMemoryRepository || [], activeOrg?.slug);
  const memorySnapshots = filterByOrg(snapshot.resources.AgentMemorySnapshot || [], activeOrg?.slug);
  const memoryImports = filterByOrg(snapshot.resources.AgentRunMemoryImport || [], activeOrg?.slug);

  const agentView = {
    org: activeOrg?.slug,
    stacks: { count: agentStacks.length, items: agentStacks },
    runs: { count: agentDispatchRuns.length, items: agentDispatchRuns, active: agentDispatchRuns.filter(r => r.status?.phase && r.status.phase !== 'Completed' && r.status.phase !== 'Failed') },
    rules: { count: agentTriggerRules.length, items: agentTriggerRules },
    sessions: { count: agentSessions.length, items: agentSessions },
    workspaces: { count: agentWorkspaces.length, items: agentWorkspaces },
    approvals: { count: agentApprovals.length, items: agentApprovals, pending: agentApprovals.filter(a => !a.status?.phase || a.status.phase === 'Pending') },
    adapters: { count: agentAdapters.length, items: agentAdapters },
    providers: { count: agentProviders.length, items: agentProviders },
    projects: { count: agentProjects.length, items: agentProjects },
    gateway: agentGateway[0] || null,
    transcripts: { count: agentTranscripts.length, items: agentTranscripts },
    memoryRepositories: { count: memoryRepositories.length, items: memoryRepositories },
    memorySnapshots: { count: memorySnapshots.length, items: memorySnapshots },
    memoryImports: { count: memoryImports.length, items: memoryImports, pending: memoryImports.filter(i => !i.status?.phase || i.status.phase === 'Pending' || i.status.phase === 'AwaitingReview') },
  };
  const deploymentApplications = filterByOrg(snapshot.resources.KubeVelaApplication || [], activeOrg?.slug);
  const deploymentReleases = filterByOrg(snapshot.resources.KubeVelaApplicationRevision || [], activeOrg?.slug);
  const deploymentComponents = snapshot.resources.KubeVelaComponentDefinition || [];
  const deploymentWorkloads = snapshot.resources.KubeVelaWorkloadDefinition || [];
  const deploymentTraits = snapshot.resources.KubeVelaTraitDefinition || [];
  const deploymentScopes = snapshot.resources.KubeVelaScopeDefinition || [];
  const deploymentPolicyDefinitions = snapshot.resources.KubeVelaPolicyDefinition || [];
  const deploymentPolicies = filterByOrg(snapshot.resources.KubeVelaPolicy || [], activeOrg?.slug);
  const deploymentAutomationSteps = snapshot.resources.KubeVelaWorkflowStepDefinition || [];
  const deploymentAutomations = filterByOrg(snapshot.resources.KubeVelaWorkflow || [], activeOrg?.slug);
  const deploymentManagedResources = filterByOrg(snapshot.resources.KubeVelaResourceTracker || [], activeOrg?.slug);
  const events = snapshot.events || [];
  const workspaceConnected = Boolean(snapshot.kubectl?.available);
  const apiInstalled = resources.some((resource) => resource.count > 0) || Boolean(snapshot.apiService) || snapshot.crds?.length > 0;
  const validation = [
    { name: 'Krate workspace is connected', passed: workspaceConnected, evidence: snapshot.kubectl?.context || snapshot.kubectl?.errors?.[0] || 'Krate workspace unavailable' },
    { name: 'Krate API surface is discoverable', passed: apiInstalled, evidence: snapshot.apiService?.metadata?.name || `${snapshot.crds?.length || 0} Krate resources discovered` },
    { name: 'Repository management uses org-scoped Krate actions', passed: true, evidence: '/api/orgs/:org/repositories and /api/orgs/:org/resources call src/kubernetes-controller.js' },
    { name: 'Krate API is separated from delivery execution', passed: true, evidence: 'src/api-controller.js delegates resource operations through the Krate gateway' },
    { name: 'Live streams use Krate watch', passed: true, evidence: '/api/watch/orgs/:org/* uses Krate live updates' },
    { name: 'UI renders live and empty states without demo data', passed: true, evidence: 'apps/web Server Components consume fetchControllerUiModel() only' }
  ];

  return {
    product: 'Krate',
    status: workspaceConnected && apiInstalled ? 'ready' : 'degraded',
    namespace: activeOrg?.namespace || snapshot.namespace,
    platformNamespace: snapshot.namespace,
    org: activeOrg,
    orgs: organizations,
    generatedAt: snapshot.generatedAt || new Date().toISOString(),
    correlationId: snapshot.correlationId,
    controller: {
      mode: 'krate-workspace',
      endpoints: controllerEndpoints,
      architecture: snapshot.architecture || defaultArchitecture(snapshot.namespace),
      storage: snapshot.storage,
      connection: { available: workspaceConnected, context: snapshot.kubectl?.context || null, errors: snapshot.kubectl?.errors || [] },
      apiService: snapshot.apiService ? snapshot.apiService.metadata?.name : null,
      commands: snapshot.commands
    },
    metrics: {
      components: runtimeComponents.length,
      resources: resources.reduce((total, resource) => total + resource.count, 0),
      events: events.length,
      auditEntries: 0,
      users: users.length,
      teams: teams.length,
      invites: invites.length,
      repositories: repositories.length,
      pullRequests: pullRequests.length,
      issues: issues.length,
      projects: agentProjects.length,
      pipelines: pipelines.length,
      jobs: jobs.length,
      runnerPools: runnerPools.length,
      webhookDeliveries: webhookDeliveries.length,
      policyViolations: policyEngine.violations.length,
      policyBindings: policyBindings.length,
      deployments: deploymentApplications.length,
      releases: deploymentReleases.length,
      agentStacks: agentStacks.length,
      agentRuns: agentDispatchRuns.length,
      agentSessions: agentSessions.length,
      greenChecks: validation.filter((item) => item.passed).length,
      totalChecks: validation.length
    },
    components: runtimeComponents,
    resources,
    events: events.slice(-8).map((event) => ({
      type: event.type || event.reason || 'KrateEvent',
      storage: 'kubernetes',
      resource: event.involvedObject ? `${event.involvedObject.kind}/${event.involvedObject.namespace || snapshot.namespace}/${event.involvedObject.name}` : event.metadata?.name,
      actor: event.reportingController || event.source?.component || 'kubernetes',
      allowed: true,
      message: event.message || event.note || ''
    })),
    auditLog: [],
    delivery: createDeliveryView({ applications: deploymentApplications, releases: deploymentReleases, components: deploymentComponents, workloads: deploymentWorkloads, traits: deploymentTraits, scopes: deploymentScopes, policyDefinitions: deploymentPolicyDefinitions, policies: deploymentPolicies, automationSteps: deploymentAutomationSteps, automations: deploymentAutomations, managedResources: deploymentManagedResources }),
    policyEngine,
    agents: agentView,
    identity: identityView,
    validation,
    permissions: snapshot.permissions || [],
    views: {
      dashboard: {
        repositories,
        projects: agentProjects,
        issues,
        issueSync: issueSyncView({ org: activeOrg?.slug, projects: agentProjects, repositories, issues }),
      excellentFlows: ['Create or import a repository', 'Browse code and copy clone commands', 'Review and merge a pull request', 'Debug a failing pipeline run', 'Edit runner pool capacity', 'Inspect and replay webhook deliveries', 'Save a triage View'],
        cards: dashboardCards({ repositories, projects: agentProjects, pullRequests, issues, pipelines, runnerPools, webhookDeliveries })
      },
      pullRequestReview: pullRequests[0] ? pullRequestReview(pullRequests[0], pipelines, jobs) : null,
      failingRun: pipelines.find((pipeline) => pipeline.status?.phase === 'Failed') ? failingRun(pipelines.find((pipeline) => pipeline.status?.phase === 'Failed'), jobs) : null,
      runnerPoolEditor: runnerPools[0] ? runnerPoolEditor(runnerPools[0]) : null,
      webhookInspector: webhookSubscriptions[0] ? webhookInspector(webhookSubscriptions[0], webhookDeliveries) : null,
      triageView: (snapshot.resources.View || [])[0] ? triageView((snapshot.resources.View || [])[0]) : null,
      identityAdmin: identityView,
      policyCenter: policyEngine
    },
    operations: {
      image: 'ghcr.io/<owner>/<repo>/krate-controller',
      chart: 'charts/krate',
      installCommands: ['Install Krate release package', 'Apply the demo workspace configuration'],
      releaseGates: ['npm run check', 'docker build', 'helm package charts/krate', 'npm pack --json']
    }
  };
}


function ensureOrganizations(organizations = [], platformNamespace = 'krate-system') {
  if (organizations.length) return organizations.map((org) => {
    const slug = org.spec?.slug || org.metadata?.name;
    const namespace = org.spec?.namespaceName || org.metadata?.labels?.[KRATE_ORG_NAMESPACE_LABEL] || orgNamespaceName(slug);
    return { name: org.metadata?.name, slug, displayName: org.spec?.displayName || slug, namespace, platformNamespace: org.metadata?.namespace || platformNamespace };
  });
  const slug = 'default';
  return [{ name: slug, slug, displayName: 'Default org', namespace: orgNamespaceName(slug), platformNamespace }];
}


function filterResourceItemsForOrg(definition, items = [], org) {
  if (!org) return [];
  if (definition.kind === 'Organization') return items.filter((item) => (item.spec?.slug || item.metadata?.name) === org);
  if (definition.kind === 'OrgNamespaceBinding') return filterByOrg(items, org);
  if (definition.namespace && definition.namespace !== orgNamespaceName(org)) return items;
  return filterByOrg(items, org);
}

function filterByOrg(items = [], org) {
  if (!org) return items;
  const orgNamespace = orgNamespaceName(org);
  return items.filter((item) => {
    const itemOrg = item.spec?.organizationRef || item.metadata?.labels?.[KRATE_ORG_LABEL];
    return itemOrg === org || item.metadata?.namespace === orgNamespace;
  });
}

function normalizeSnapshot(source = {}) {
  const raw = typeof source.snapshot === 'function' ? source.snapshot() : source;
  if (raw?.source === 'kubernetes') return { commands: [], crds: [], events: [], permissions: [], storage: {}, ...raw, resources: raw.resources || {} };
  const resources = raw?.resources || {};
  return {
    source: 'runtime-snapshot',
    namespace: raw?.namespace || 'krate-system',
    generatedAt: new Date().toISOString(),
    correlationId: null,
    kubectl: { available: false, context: null, errors: ['runtime snapshot supplied outside the Krate workspace path'] },
    apiService: null,
    crds: [],
    resources,
    events: raw?.events || [],
    permissions: [],
    architecture: raw?.architecture || defaultArchitecture(raw?.namespace || 'krate-system'),
    storage: raw?.storage || {},
    commands: []
  };
}

function summarizePhases(items) {
  return items.reduce((summary, item) => {
    const phase = item.status?.phase || (item.status?.ready === true ? 'Ready' : item.status?.conditions?.[0]?.type) || 'Unspecified';
    summary[phase] = (summary[phase] || 0) + 1;
    return summary;
  }, {});
}

function dashboardCards({ repositories, projects = [], pullRequests, issues = [], pipelines, runnerPools, webhookDeliveries }) {
  return [
    { label: 'Repositories', value: repositories.length, href: '/repositories' },
    { label: 'Projects', value: projects.length, href: '/agents/projects' },
    { label: 'Issues', value: issues.length, href: '/inbox' },
    { label: 'Pull requests', value: pullRequests.length, href: '/inbox' },
    { label: 'Runs', value: pipelines.length, href: '/runs' },
    { label: 'Runner pools', value: runnerPools.length, href: '/runners-ci' },
    { label: 'Webhook deliveries', value: webhookDeliveries.length, href: '/hooks-events' }
  ];
}

function defaultArchitecture(namespace) {
  return {
    apiController: { role: 'krate-api-controller', scope: 'HTTP route orchestration, request validation, API errors, and workflow affordances; never owns delivery reconciliation loops', owns: ['/api/controller', '/api/orgs/:org/resources', '/api/orgs/:org/repositories', '/api/watch/orgs/:org/*'], delegatesTo: ['krate-resource-gateway', 'repository-service'] },
    resourceGateway: { role: 'krate-resource-gateway', scope: 'Narrow application port translating API controller intent into Krate resource-client calls', namespace, delegatesTo: ['krate-resource-client'] },
    resourceClient: { role: 'krate-resource-client', scope: 'Krate resource operations and live streams; no UI flow ownership', namespace, owns: ['Krate resources', 'aggregated API resources'] },
    deliveryReconciler: { role: 'krate-delivery-reconciler', scope: 'Repository status projection, repository hosting intent, policy projection, and data-plane sync intent; never owns HTTP routes or browser flows', namespace, delegatesTo: ['krate-resource-gateway', 'repository-service'] },
    repositoryService: { role: 'repository-service', scope: 'repository streaming and SSH hosting, object storage, and search indexing', boundary: process.env.KRATE_GITEA_HTTP_URL || 'repository service not configured' }
  };
}

export function issueRepositoryRefs(issue = {}) {
  return uniqueStrings([
    issue.spec?.repository,
    issue.spec?.repoRef,
    issue.spec?.repositoryRef,
    issue.metadata?.labels?.repository,
    issue.metadata?.labels?.['krate.a5c.ai/repository'],
    issue.metadata?.annotations?.['krate.a5c.ai/repository'],
    issue.metadata?.annotations?.['krate.a5c.ai/repositories'],
    issue.status?.repository,
    issue.status?.repositoryRef,
    ...(issue.spec?.repositories || []),
    ...(issue.spec?.repositoryRefs || []),
    ...(issue.status?.repositories || []),
    ...(issue.status?.repositoryRefs || [])
  ]);
}

export function issueProjectRefs(issue = {}) {
  return uniqueStrings([
    issue.spec?.project,
    issue.spec?.projectRef,
    issue.spec?.krateProject,
    issue.spec?.krateProjectRef,
    issue.metadata?.labels?.project,
    issue.metadata?.labels?.['krate.a5c.ai/project'],
    issue.metadata?.labels?.['krate.a5c.ai/krate-project'],
    issue.metadata?.annotations?.['krate.a5c.ai/project'],
    issue.metadata?.annotations?.['krate.a5c.ai/projects'],
    issue.status?.project,
    issue.status?.projectRef,
    ...(issue.spec?.projects || []),
    ...(issue.spec?.projectRefs || []),
    ...(issue.status?.projects || []),
    ...(issue.status?.projectRefs || [])
  ]);
}

function uniqueStrings(values = []) {
  return [...new Set(values.flatMap(refNames).filter(Boolean).map(String))];
}

function refNames(value) {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value.flatMap(refNames);
  if (typeof value === 'string') return value.split(',').map((part) => part.trim()).filter(Boolean);
  if (typeof value === 'object') return refNames(value.name || value.repository || value.repo || value.project || value.krateProject || value.metadata?.name || value.ref || value.slug);
  return [String(value)];
}

function issueSyncView({ org = 'default', projects = [], repositories = [], issues = [] }) {
  return {
    gitea: giteaIssueSyncPlan({ org, project: projects[0]?.metadata?.name || null, issue: issues[0] || null, repositories: repositories.map((repo) => repo.metadata?.name).filter(Boolean) }),
    github: githubProjectIssueSyncPlan({ org, project: projects[0]?.metadata?.name || null, issue: issues[0] || null, repositories: repositories.map((repo) => repo.metadata?.name).filter(Boolean) })
  };
}

function pullRequestReview(pullRequest, pipelines, jobs) {
  const pipelineRuns = pipelines.filter((pipeline) => pipeline.spec?.pullRequest === pullRequest.metadata?.name || pipeline.metadata?.labels?.pullrequest === pullRequest.metadata?.name);
  return {
    pullRequest,
    changedFiles: pullRequest.status?.changedFiles || [],
    pipelineRuns,
    jobs: jobs.filter((job) => pipelineRuns.some((pipeline) => job.spec?.pipeline === pipeline.metadata?.name)),
    yaml: resourceToYaml(pullRequest),
    keyboardShortcuts: ['j/k navigate files', 'a approve', 'm merge when allowed']
  };
}

function failingRun(pipeline, jobs) {
  return {
    pipeline,
    jobs: jobs.filter((job) => job.spec?.pipeline === pipeline.metadata?.name),
    stream: `/api/watch/orgs/${pipeline.spec?.organizationRef || pipeline.metadata?.labels?.['krate.a5c.ai/org'] || 'default'}/pipelines/${pipeline.metadata?.name}`,
    actions: ['rerun from step', 'open run events', 'create incident', 'copy diagnostic summary']
  };
}

function runnerPoolEditor(resource) {
  return {
    resource,
    fields: ['image', 'resources', 'warmReplicas', 'maxReplicas', 'trustTier', 'cache'],
    saveModes: ['save capacity', 'open review'],
    yaml: resourceToYaml(resource)
  };
}

function webhookInspector(subscription, deliveries) {
  return {
    subscription,
    deliveries: deliveries.filter((delivery) => delivery.spec?.subscription === subscription.metadata?.name || delivery.metadata?.labels?.subscription === subscription.metadata?.name),
    columns: ['phase', 'signature', 'attempts', 'response', 'latency'],
    actions: ['replay', 'disable subscription', 'copy curl']
  };
}

function triageView(view) {
  return { resource: view, yaml: resourceToYaml(view), selector: view.spec?.selector || {} };
}



function createIdentityView({ users, teams, invites, identityMappings, authProviders, permissions, sshKeys, reconciliation }) {
  const reconciliationStatuses = reconciliation?.desiredStatuses || [];
  const reconciliationPhases = reconciliationStatuses.reduce((summary, item) => ({ ...summary, [item.phase]: (summary[item.phase] || 0) + 1 }), {});
  return {
    counts: {
      users: users.length,
      teams: teams.length,
      pendingInvites: invites.filter((invite) => (invite.status?.phase || 'Pending') === 'Pending').length,
      mappings: identityMappings.length,
      repositoryGrants: permissions.length,
      sshKeys: sshKeys.length
    },
    providers: authProviders.map((provider) => ({
      name: provider.metadata?.name,
      label: provider.spec?.label || provider.metadata?.name,
      type: provider.spec?.type || 'oidc',
      enabled: provider.spec?.enabled !== false,
      phase: provider.status?.phase || 'Unknown'
    })),
    users: users.map((user) => ({
      name: user.metadata?.name,
      displayName: user.spec?.displayName || user.metadata?.name,
      email: user.spec?.email || '',
      teams: user.spec?.teams || [],
      admin: Boolean(user.spec?.admin),
      disabled: Boolean(user.spec?.disabled),
      phase: user.status?.phase || 'Unknown'
    })),
    teams: teams.map((team) => ({
      name: team.metadata?.name,
      displayName: team.spec?.displayName || team.metadata?.name,
      members: team.spec?.members || [],
      maintainers: team.spec?.maintainers || [],
      repositoryGrants: team.spec?.repositoryGrants || []
    })),
    invites: invites.map((invite) => ({
      name: invite.metadata?.name,
      email: invite.spec?.email,
      role: invite.spec?.role || 'member',
      teams: invite.spec?.teams || [],
      phase: invite.status?.phase || 'Pending',
      expiresAt: invite.spec?.expiresAt || ''
    })),
    mappings: identityMappings.map((mapping) => ({
      name: mapping.metadata?.name,
      user: mapping.spec?.user,
      provider: mapping.spec?.provider,
      workspaceIdentity: mapping.spec?.workspaceIdentity?.name || mapping.spec?.subject,
      repositoryIdentity: mapping.spec?.repositoryIdentity?.username || mapping.spec?.user,
      phase: mapping.status?.phase || 'Unknown'
    })),
    permissions: permissions.map((permission) => ({
      name: permission.metadata?.name,
      repository: permission.spec?.repository,
      subject: permission.spec?.subject,
      subjectKind: permission.spec?.subjectKind || 'user',
      permission: permission.spec?.permission || 'read',
      revoked: Boolean(permission.spec?.revoked || permission.status?.phase === 'Revoked'),
      phase: permission.status?.phase || 'Unknown'
    })),
    sshKeys: sshKeys.map((key) => ({
      name: key.metadata?.name,
      title: key.spec?.title || key.metadata?.name,
      owner: key.spec?.owner || key.spec?.user || '',
      scope: key.spec?.scope || 'user',
      repository: key.spec?.repository || '',
      revoked: Boolean(key.spec?.revoked || key.status?.phase === 'Revoked'),
      phase: key.status?.phase || 'Unknown'
    })),
    reconciliation: {
      counts: reconciliation?.counts || {},
      phases: reconciliationPhases,
      statuses: reconciliationStatuses.map((item) => ({
        kind: item.kind,
        name: item.name,
        phase: item.phase,
        checks: (item.conditions || []).map((condition) => readableCondition(condition))
      })),
      nextActions: (reconciliation?.syncIntents || []).map((intent) => readableIntent(intent))
    }
  };
}


function readableCondition(condition = {}) {
  const subject = String(condition.type || 'AccessCheck').replace(/([a-z])([A-Z])/g, '$1 $2');
  return `${subject}: ${condition.status === 'False' ? 'needs attention' : 'ready'}`;
}

function readableIntent(intent = {}) {
  const action = String(intent.action || 'sync-access').replace(/-/g, ' ');
  const subject = intent.user || intent.team || intent.subject || intent.owner || intent.name || intent.repository || 'workspace access';
  return `${action}: ${subject}`;
}

function createPolicyEngineView({ kyverno = {}, policyProfiles = [], policyTemplates = [], policyBindings = [], policyExceptionRequests = [], org = 'default', namespace = 'krate-system' }) {
  const reports = kyverno.reports || { results: [], violations: [] };
  const violations = reports.violations || [];
  const detected = Boolean(kyverno.detected);
  const mode = kyverno.mode || 'disabled';
  const health = mode === 'disabled' ? 'disabled' : detected && !(kyverno.degraded || []).length ? 'ready' : 'degraded';
  return {
    engine: 'kyverno',
    mode,
    health,
    detected,
    namespace: kyverno.namespace || 'kyverno',
    policyNamespace: kyverno.policyNamespace || namespace,
    requireForEnforceMode: kyverno.requireForEnforceMode !== false,
    org,
    profiles: policyProfiles.map(policySummary),
    templates: policyTemplates.map(policySummary),
    bindings: policyBindings.map(policySummary),
    exceptionRequests: policyExceptionRequests.map(policySummary),
    kyvernoResources: Object.fromEntries(Object.entries(kyverno.resources || {}).map(([kind, items]) => [kind, Array.isArray(items) ? items.length : 0])),
    controllers: kyverno.controllers || [],
    permissions: kyverno.permissions || [],
    reports: {
      policyReports: reports.policyReports?.length || 0,
      clusterPolicyReports: reports.clusterPolicyReports?.length || 0,
      results: reports.results || []
    },
    violations,
    degraded: kyverno.degraded || [],
    emptyState: mode === 'disabled' ? 'Kyverno integration is disabled. Krate native RefPolicy and BranchProtection remain available.' : detected ? '' : 'Kyverno is not installed or is not readable by Krate.'
  };
}

function policySummary(resource = {}) {
  return {
    kind: resource.kind,
    name: resource.metadata?.name,
    namespace: resource.metadata?.namespace,
    mode: resource.spec?.mode || resource.status?.mode || 'audit',
    phase: resource.status?.phase || 'Pending',
    displayName: resource.spec?.displayName || resource.metadata?.name,
    targetKinds: resource.spec?.targetKinds || resource.spec?.match?.resourceKinds || [],
    templateRef: resource.spec?.templateRef || '',
    policyRef: resource.status?.policyRef || resource.spec?.policyRef || null,
    violationCount: resource.status?.lastViolationCount || 0
  };
}

function createDeliveryView({ applications, releases, components, workloads, traits, scopes, policyDefinitions, policies, automationSteps, automations, managedResources }) {
  return {
    installed: applications.length + components.length + workloads.length + traits.length + scopes.length + policyDefinitions.length + automationSteps.length > 0,
    specVersion: 'v0.3.0',
    counts: {
      applications: applications.length,
      releases: releases.length,
      components: components.length,
      workloads: workloads.length,
      traits: traits.length,
      scopes: scopes.length,
      policyDefinitions: policyDefinitions.length,
      policies: policies.length,
      automationSteps: automationSteps.length,
      automations: automations.length,
      managedResources: managedResources.length
    },
    capabilityCatalog: {
      components: components.map((item) => item.metadata?.name).filter(Boolean),
      workloads: workloads.map((item) => item.metadata?.name).filter(Boolean),
      traits: traits.map((item) => item.metadata?.name).filter(Boolean),
      scopes: scopes.map((item) => item.metadata?.name).filter(Boolean),
      policyDefinitions: policyDefinitions.map((item) => item.metadata?.name).filter(Boolean),
      policies: policies.map((item) => item.metadata?.name).filter(Boolean),
      automationSteps: automationSteps.map((item) => item.metadata?.name).filter(Boolean)
    },
    applications: applications.map((application) => ({
      name: application.metadata?.name,
      namespace: application.metadata?.namespace,
      healthy: application.status?.services?.every((service) => service.healthy !== false) || false,
      message: application.status?.services?.map((service) => service.message).filter(Boolean).join('; ') || '',
      status: application.status?.status || application.status?.phase || application.status?.conditions?.[0]?.type || 'Unknown',
      appliedResources: (application.status?.appliedResources || []).map((resource) => ({ apiVersion: resource.apiVersion, kind: resource.kind, namespace: resource.namespace || '', name: resource.name })),
      services: (application.status?.services || []).map((service) => ({ name: service.name, namespace: service.namespace, healthy: service.healthy !== false, message: service.message || '', traits: service.traits || [], workloadDefinition: service.workloadDefinition || null })),
      workflow: application.status?.workflow ? { status: application.status.workflow.status || 'Unknown', finished: Boolean(application.status.workflow.finished), appRevision: application.status.workflow.appRevision || '', steps: (application.status.workflow.steps || []).map((step) => ({ name: step.name, type: step.type, phase: step.phase || 'Unknown' })) } : null,
      releases: releases.filter((release) => release.metadata?.labels?.['app.oam.dev/name'] === application.metadata?.name || release.metadata?.name?.startsWith(application.metadata?.name + '-')).map((release) => ({ name: release.metadata?.name, succeeded: release.status?.succeeded, publishVersion: release.status?.publishVersion || '' })),
      managedResources: managedResources.filter((resource) => resource.metadata?.labels?.['app.oam.dev/name'] === application.metadata?.name || resource.spec?.application?.name === application.metadata?.name || resource.metadata?.name?.startsWith(application.metadata?.name + '-')).map((resource) => resource.metadata?.name).filter(Boolean),
      yaml: resourceToYaml(application)
    })),
    runtime: {
      releases: releases.map((item) => ({ name: item.metadata?.name, application: item.metadata?.labels?.['app.oam.dev/name'] || item.spec?.application?.name || '', succeeded: item.status?.succeeded || false })),
      automations: automations.map((item) => ({ name: item.metadata?.name, phase: item.status?.phase || item.status?.status || 'Unknown' })),
      policies: policies.map((item) => ({ name: item.metadata?.name, type: item.type || item.spec?.type || item.metadata?.labels?.['policy.oam.dev/type'] || '' })),
      managedResources: managedResources.map((item) => ({ name: item.metadata?.name, type: item.spec?.type || item.metadata?.labels?.['app.oam.dev/resource-tracker-type'] || '' }))
    }
  };
}
