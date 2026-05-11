import { createKubernetesResourceGateway } from './kubernetes-resource-gateway.js';
import { createPermissionReviewer } from './agent-permission-review.js';
import { createAgentDispatchController } from './agent-dispatch-controller.js';
import { createAgentApprovalController } from './agent-approval-controller.js';
import { createAgentTriggerController } from './agent-trigger-controller.js';

export const KRATE_API_CONTROLLER_BOUNDARY = {
  role: 'krate-api-controller',
  scope: 'HTTP/application facade for validation, request orchestration, user-facing DTOs, API errors, and workflow affordances',
  owns: ['input validation', 'forge DTOs', 'API errors', 'workflow affordances', 'controller UI snapshots'],
  delegatesTo: ['kubernetes-resource-gateway', 'git-data-plane'],
  mustNotOwn: ['kubectl process execution', 'Kubernetes reconciliation loops', 'watch stream internals', 'repository storage internals']
};

export function createKrateApiController(options = {}) {
  const resourceGateway = options.resourceGateway || createKubernetesResourceGateway(options);
  const namespace = options.namespace || resourceGateway.namespace || process.env.KRATE_NAMESPACE || 'krate-system';

  return {
    role: 'krate-api-controller',
    namespace,
    resourceGateway,
    resourceDefinitions: resourceGateway.resourceDefinitions,
    async snapshot() {
      return withArchitecture(await resourceGateway.snapshot(), namespace);
    },
    async listRepositoriesForForge() {
      const resources = await resourceGateway.list('Repository');
      return normalizeResourceList(resources).map((resource) => repositoryForgeSummary(resource, namespace));
    },
    async getRepositoryForgeView(name) {
      const resource = await resourceGateway.get('Repository', name);
      const repository = resource?.resource || resource;
      return repositoryForgeView(repository, namespace);
    },
    async listResource(kindOrPlural) {
      return resourceGateway.list(kindOrPlural);
    },
    async getResource(kindOrPlural, name) {
      return resourceGateway.get(kindOrPlural, name);
    },
    async applyResource(resource) {
      return resourceGateway.apply(resource);
    },
    async deleteResource(kindOrPlural, name) {
      return resourceGateway.delete(kindOrPlural, name);
    },
    async createRepository(input) {
      const created = await resourceGateway.createRepository(input);
      const repository = created?.resource || created;
      return {
        operation: created?.operation || 'create-repository',
        command: created?.command || 'kubectl apply -f -',
        repository: repositoryForgeSummary(repository, namespace),
        resource: repository
      };
    },
    async createOrganization(input) {
      return resourceGateway.createOrganization(input);
    },
    watchResource(resourcePath, handlers = {}) {
      return resourceGateway.watch(resourcePath, handlers);
    },
    async reviewAgentPermissions(input) {
      const reviewer = createPermissionReviewer();
      const snapshot = await this.snapshot();
      return reviewer.reviewPermissions({
        ...input,
        resources: snapshot.resources
      });
    },
    async dispatchAgent(input) {
      const snapshot = await this.snapshot();
      const controller = createAgentDispatchController(input.controllerOptions || {});
      return controller.createManualDispatch({
        ...input,
        resources: snapshot.resources
      });
    },
    async approveAgentAction(input) {
      const snapshot = await this.snapshot();
      const approvalController = createAgentApprovalController();
      return approvalController.recordDecision({
        ...input,
        decision: 'approve',
        resources: snapshot.resources
      });
    },
    async denyAgentAction(input) {
      const snapshot = await this.snapshot();
      const approvalController = createAgentApprovalController();
      return approvalController.recordDecision({
        ...input,
        decision: 'deny',
        resources: snapshot.resources
      });
    },
    async processWebhookEvent(input) {
      const snapshot = await this.snapshot();
      const dispatchController = createAgentDispatchController(input.controllerOptions || {});
      const triggerController = createAgentTriggerController({ dispatchController });
      return triggerController.processEvent({
        event: input.event,
        resources: snapshot.resources,
        namespace: input.namespace || namespace,
        organizationRef: input.organizationRef || 'default',
      });
    }
  };
}

export function withArchitecture(snapshot, namespace = snapshot?.namespace || 'default') {
  return {
    ...snapshot,
    architecture: {
      apiController: {
        ...KRATE_API_CONTROLLER_BOUNDARY,
        owns: [...KRATE_API_CONTROLLER_BOUNDARY.owns, '/api/controller', '/api/orgs/:org/resources', '/api/orgs/:org/repositories', '/api/watch/orgs/:org/*'],
        scope: `${KRATE_API_CONTROLLER_BOUNDARY.scope}; never owns Kubernetes reconciliation loops`
      },
      resourceGateway: {
        role: 'kubernetes-resource-gateway',
        scope: 'Narrow application port translating API controller intent into Kubernetes resource-client calls',
        namespace,
        delegatesTo: ['kubernetes-resource-client']
      },
      kubernetesClient: {
        role: 'kubernetes-resource-client',
        scope: 'kubectl-backed Kubernetes API discovery, SubjectAccessReview checks, list/get/apply/delete/watch; no UI flow or product workflow ownership',
        namespace,
        owns: ['Krate CRDs', 'aggregated API resources', 'Kubernetes watch streams']
      },
      kubernetesReconciler: {
        role: 'krate-kubernetes-reconciler',
        scope: 'Repository status projection, repository hosting intent, policy projection, and data-plane sync intent; never owns HTTP routes or browser flows',
        namespace,
        delegatesTo: ['kubernetes-resource-gateway', 'git-data-plane']
      },
      dataPlane: {
        role: 'git-data-plane',
        scope: 'Repository streaming, SSH hosting, object storage, search indexing, and warm receive-pack paths',
        boundary: process.env.KRATE_GITEA_HTTP_URL || 'repository service not configured'
      }
    }
  };
}

export function repositoryForgeSummary(resource, namespace = 'krate-system') {
  const metadata = resource?.metadata || {};
  const spec = resource?.spec || {};
  const name = metadata.name || 'unknown-repository';
  const repositoryNamespace = metadata.namespace || namespace;
  const org = spec.organizationRef || metadata.labels?.['krate.a5c.ai/org'] || 'default';
  const repoPath = `/orgs/${encodeURIComponent(org)}/repositories/${encodeURIComponent(name)}`;
  return {
    kind: 'Repository',
    name,
    org,
    namespace: repositoryNamespace,
    visibility: spec.visibility || 'internal',
    defaultBranch: spec.defaultBranch || 'main',
    phase: resource?.status?.phase || (resource ? 'Ready' : 'Unknown'),
    href: `${repoPath}/code`,
    cloneUrl: spec.gitHosting?.httpUrl || `<krate-repository-service>/${encodeURIComponent(org)}/${name}.git`,
    actions: {
      code: `${repoPath}/code`,
      pullRequests: `${repoPath}/pull-requests`,
      issues: `${repoPath}/issues`,
      runs: `${repoPath}/runs`,
      pipelines: `${repoPath}/runs`,
      hooks: `${repoPath}/hooks`,
      settings: `${repoPath}/settings`,
      yaml: `/orgs/${encodeURIComponent(org)}/advanced-plans?kind=Repository&name=${encodeURIComponent(name)}`
    },
    kubectl: {
      get: `kubectl get repositories.krate.a5c.ai ${name} -n ${repositoryNamespace} -o yaml`,
      delete: `kubectl delete repositories.krate.a5c.ai ${name} -n ${repositoryNamespace}`
    }
  };
}

export function repositoryForgeView(resource, namespace = 'default') {
  const summary = repositoryForgeSummary(resource, namespace);
  return {
    ...summary,
    primaryFlow: 'browse-code-open-pr-review-merge',
    emptyState: resource ? null : 'Repository resource is not available from the Kubernetes resource gateway.',
    sections: [
      { id: 'code', label: 'Code', href: summary.actions.code, state: 'branch-and-path-aware' },
      { id: 'pull-requests', label: 'Pull requests', href: summary.actions.pullRequests, state: 'review-merge-checks' },
      { id: 'issues', label: 'Issues', href: summary.actions.issues, state: 'triage-policy-aware' },
      { id: 'runs', label: 'Runs', href: summary.actions.runs, state: 'runner-and-job-aware' },
      { id: 'hooks', label: 'Hooks', href: summary.actions.hooks, state: 'delivery-replay-aware' },
      { id: 'settings', label: 'Settings', href: summary.actions.settings, state: 'branch-protection-rbac-danger-actions' }
    ]
  };
}

function normalizeResourceList(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.resources)) return result.resources;
  if (result?.resource) return [result.resource];
  return [];
}

