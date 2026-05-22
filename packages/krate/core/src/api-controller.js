import { createKubernetesResourceGateway } from './kubernetes-resource-gateway.js';
import { clearSnapshotCache } from './snapshot-cache.js';
import { createPermissionReviewer } from './agent-permission-review.js';
import { createAgentDispatchController } from './agent-dispatch-controller.js';
import { createAgentApprovalController } from './agent-approval-controller.js';
import { createAgentTriggerController } from './agent-trigger-controller.js';
import { createAgentWorkspaceController } from './agent-workspace-controller.js';
import { createAgentMemoryController } from './agent-memory-controller.js';
import { orgNamespaceName, normalizeOrgSlug } from './org-scoping.js';
import { globalEventBus } from './event-bus.js';
import { createSyncController } from './external/sync-controller.js';
import { createWebhookController } from './external/webhook-controller.js';
import { createWriteController } from './external/write-controller.js';
import { createConflictController } from './external/conflict-controller.js';

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
  const onAuditEvent = typeof options.onAuditEvent === 'function' ? options.onAuditEvent : null;

  function emitAuditEvent(resource, operation) {
    if (!onAuditEvent) return;
    try {
      const org = resource.spec?.organizationRef || resource.metadata?.labels?.['krate.a5c.ai/org'] || '';
      onAuditEvent({
        operation,
        org,
        namespace: org ? orgNamespaceName(org) : (resource.metadata?.namespace || namespace),
        kind: resource.kind,
        name: resource.metadata?.name,
        timestamp: new Date().toISOString()
      });
    } catch {
      // Audit failures must not crash apply operations
    }
  }

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
    async listResourceForOrg(org, kindOrPlural) {
      const orgNs = orgNamespaceName(normalizeOrgSlug(org));
      // Client-side filtering is used because the resource gateway's list()
      // method does not currently support namespace-scoped listing.  The
      // gateway aggregates resources across namespaces at snapshot time, so
      // filtering here is both correct and consistent with the gateway API.
      const result = await resourceGateway.list(kindOrPlural);
      const items = normalizeResourceList(result).filter(
        (item) => item.metadata?.namespace === orgNs
      );
      return { ...result, items };
    },
    async getResource(kindOrPlural, name) {
      return resourceGateway.get(kindOrPlural, name);
    },
    async applyResource(resource) {
      // Cross-org admission check: if the resource has an organizationRef,
      // ensure the namespace matches the org's derived namespace.
      const resourceOrg = resource.spec?.organizationRef;
      const resourceNs = resource.metadata?.namespace;
      if (resourceOrg) {
        const expectedNs = orgNamespaceName(resourceOrg);
        if (resourceNs && resourceNs !== expectedNs) {
          // Explicit namespace does not match the org — reject
          throw new Error(
            `Cross-org namespace mismatch: resource organizationRef "${resourceOrg}" expects namespace "${expectedNs}" but got "${resourceNs}"`
          );
        }
        if (!resourceNs) {
          // organizationRef present but no namespace — auto-assign
          resource = {
            ...resource,
            metadata: { ...resource.metadata, namespace: expectedNs }
          };
        }
      }
      const result = await resourceGateway.apply(resource);
      clearSnapshotCache();
      const appliedResource = result.resource || resource;
      emitAuditEvent(appliedResource, result.operation || 'apply');
      globalEventBus.emitResourceChange(
        appliedResource.kind || resource.kind || 'Unknown',
        appliedResource.metadata?.name || resource.metadata?.name || 'unknown',
        result.operation || 'apply'
      );
      return result;
    },
    async applyResourceForOrg(orgSlug, resource) {
      const slug = normalizeOrgSlug(orgSlug);
      const orgNs = orgNamespaceName(slug);
      const resourceOrg = resource.spec?.organizationRef;
      if (resourceOrg && normalizeOrgSlug(resourceOrg) !== slug) {
        throw new Error(
          `Org mismatch: resource organizationRef "${resourceOrg}" does not match target org "${slug}"`
        );
      }
      const scopedResource = {
        ...resource,
        metadata: { ...resource.metadata, namespace: orgNs },
        spec: { ...resource.spec, organizationRef: slug }
      };
      const result = await resourceGateway.apply(scopedResource);
      clearSnapshotCache();
      const appliedResource = result.resource || scopedResource;
      emitAuditEvent(appliedResource, result.operation || 'apply');
      globalEventBus.emitResourceChange(
        appliedResource.kind || scopedResource.kind || 'Unknown',
        appliedResource.metadata?.name || scopedResource.metadata?.name || 'unknown',
        result.operation || 'apply'
      );
      return { ...result, resource: appliedResource };
    },
    async deleteResource(kindOrPlural, name) {
      const result = await resourceGateway.delete(kindOrPlural, name);
      clearSnapshotCache();
      emitAuditEvent(
        { kind: kindOrPlural, metadata: { name, namespace }, spec: {} },
        'delete'
      );
      globalEventBus.emitResourceChange(kindOrPlural, name, 'delete');
      return result;
    },
    async deleteResourceForOrg(orgSlug, kindOrPlural, name) {
      const slug = normalizeOrgSlug(orgSlug);
      const orgNs = orgNamespaceName(slug);
      // Verify the resource exists and belongs to the org before deleting
      const existing = await resourceGateway.get(kindOrPlural, name);
      const resource = existing?.resource || existing;
      if (resource) {
        const resourceNs = resource.metadata?.namespace;
        if (!resourceNs || resourceNs !== orgNs) {
          throw new Error(
            `Cross-org denial: resource "${name}" is in namespace "${resourceNs || '(none)'}" which does not match org "${slug}" namespace "${orgNs}"`
          );
        }
      }
      const result = await resourceGateway.delete(kindOrPlural, name);
      clearSnapshotCache();
      emitAuditEvent(
        { kind: kindOrPlural, metadata: { name, namespace: orgNs }, spec: { organizationRef: slug } },
        'delete'
      );
      globalEventBus.emitResourceChange(kindOrPlural, name, 'delete');
      return result;
    },
    async getResourceForOrg(orgSlug, kindOrPlural, name) {
      const slug = normalizeOrgSlug(orgSlug);
      const orgNs = orgNamespaceName(slug);
      const existing = await resourceGateway.get(kindOrPlural, name);
      const resource = existing?.resource || existing;
      if (resource) {
        const resourceNs = resource.metadata?.namespace;
        if (!resourceNs || resourceNs !== orgNs) {
          throw new Error(
            `Cross-org denial: resource "${name}" is in namespace "${resourceNs || '(none)'}" which does not match org "${slug}" namespace "${orgNs}"`
          );
        }
      }
      return existing;
    },
    async createRepository(input) {
      const created = await resourceGateway.createRepository(input);
      const repository = created?.resource || created;
      emitAuditEvent(
        repository?.kind ? repository : { kind: 'Repository', metadata: repository?.metadata || { name: input.name || input.metadata?.name }, spec: repository?.spec || input.spec || input },
        'create-repository'
      );
      return {
        operation: created?.operation || 'create-repository',
        command: created?.command || 'kubectl apply -f -',
        repository: repositoryForgeSummary(repository, namespace),
        resource: repository
      };
    },
    async createOrganization(input) {
      const result = await resourceGateway.createOrganization(input);
      const orgResource = result?.organization || result?.resource || result;
      emitAuditEvent(
        orgResource?.kind ? orgResource : { kind: 'Organization', metadata: orgResource?.metadata || { name: input.slug || input.name || input.metadata?.name }, spec: orgResource?.spec || input.spec || input },
        'create-organization'
      );
      return result;
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
    },
    async provisionAgentWorkspace(input) {
      const workspaceController = createAgentWorkspaceController();
      return workspaceController.provisionWorkspace({
        ...input,
        namespace: input.namespace || namespace,
        organizationRef: input.organizationRef || 'default'
      });
    },
    async archiveAgentWorkspace(input) {
      const snapshot = await this.snapshot();
      const workspaceController = createAgentWorkspaceController();
      return workspaceController.archiveWorkspace({
        ...input,
        resources: snapshot.resources
      });
    },
    async linkWorkItem(input) {
      const workspaceController = createAgentWorkspaceController();
      return workspaceController.linkWorkItem({
        ...input,
        namespace: input.namespace || namespace,
        organizationRef: input.organizationRef || 'default'
      });
    },
    async queryAgentMemory(input) {
      const memoryController = createAgentMemoryController();
      return memoryController.queryMemory({
        ...input,
        namespace: input.namespace || namespace,
        organizationRef: input.organizationRef || 'default'
      });
    },
    async createMemoryImport(input) {
      const memoryController = createAgentMemoryController();
      return memoryController.createImport({
        ...input,
        namespace: input.namespace || namespace,
        organizationRef: input.organizationRef || 'default'
      });
    },

    // ---------------------------------------------------------------------------
    // External controller integration
    // ---------------------------------------------------------------------------

    /**
     * Sync an external resource into the Krate resource store.
     * Creates a SyncController with a persistFn that calls applyResource, then
     * upserts the resource and optionally advances the watermark.
     *
     * @param {string} bindingName
     * @param {{ kind, localName, namespace?, spec, externalEnvelope, watermark? }} options
     */
    async syncExternalBinding(bindingName, options = {}) {
      const self = this;
      const syncController = createSyncController({
        persistFn: async (resource) => {
          await resourceGateway.apply(resource);
        }
      });

      const {
        kind,
        localName,
        namespace: resourceNamespace = 'default',
        spec = {},
        externalEnvelope,
        watermark
      } = options;

      const resource = syncController.upsertResource({
        kind,
        localName,
        namespace: resourceNamespace,
        spec,
        externalEnvelope
      });

      if (watermark) {
        syncController.updateWatermark(bindingName, watermark);
      }

      // Keep a reference to the sync controller so getExternalSyncStatus can read it
      if (!self._syncControllers) self._syncControllers = new Map();
      self._syncControllers.set(bindingName, syncController);

      return { resource, bindingName };
    },

    /**
     * Create a write intent for an external operation.
     *
     * @param {{ interfaceKey, operation, payload?, resourceRef, requiresApproval?,
     *           maxRetries?, namespace?, organizationRef? }} input
     */
    async createExternalWriteIntent(input) {
      const writeController = createWriteController({
        persistFn: async (resource) => {
          await resourceGateway.apply(resource);
        }
      });
      return writeController.createWriteIntent(input);
    },

    /**
     * Approve a PendingApproval ExternalWriteIntent.
     *
     * @param {{ intentName, approvedBy, resources? }} opts
     */
    async approveExternalWriteIntent(opts) {
      const writeController = createWriteController({
        persistFn: async (resource) => {
          await resourceGateway.apply(resource);
        }
      });
      return writeController.approveWriteIntent(opts);
    },

    /**
     * Cancel (reject) an ExternalWriteIntent.
     *
     * @param {{ intentName, cancelledBy, resources? }} opts
     */
    async cancelExternalWriteIntent({ intentName, cancelledBy, resources } = {}) {
      const writeController = createWriteController({
        persistFn: async (resource) => {
          await resourceGateway.apply(resource);
        }
      });
      return writeController.rejectWriteIntent({
        intentName,
        rejectedBy: cancelledBy,
        reason: 'cancelled',
        resources
      });
    },

    /**
     * Detect a conflict between local and external field values.
     *
     * @param {{ resourceRef, fieldPath, localValue, externalValue, namespace?, organizationRef? }} input
     */
    async detectExternalConflict(input) {
      const conflictController = createConflictController({
        persistFn: async (resource) => {
          await resourceGateway.apply(resource);
        }
      });
      return conflictController.detectConflict(input);
    },

    /**
     * Resolve an Open ExternalSyncConflict using the specified strategy.
     *
     * @param {{ conflictName, strategy, resolvedValue?, resources? }} opts
     */
    async resolveExternalConflict(opts) {
      const conflictController = createConflictController({
        persistFn: async (resource) => {
          await resourceGateway.apply(resource);
        }
      });
      return conflictController.resolveConflict(opts);
    },

    /**
     * Return the current sync state for a binding (watermark, etc.).
     *
     * @param {string} bindingName
     * @returns {{ bindingName: string, watermark: string|null }}
     */
    async getExternalSyncStatus(bindingName) {
      const syncController = this._syncControllers?.get(bindingName);
      const watermark = syncController ? syncController.getWatermark(bindingName) : null;
      return { bindingName, watermark };
    },

    /**
     * Process an inbound external webhook payload.
     * Creates a WebhookController, processes the delivery, and emits events.
     *
     * @param {{ deliveryId, eventType, payload, rawBody, providerType?, secret? }} params
     */
    async processExternalWebhook({ deliveryId, eventType, payload, rawBody, providerType, secret } = {}) {
      const webhookController = createWebhookController({ secret: secret || '' });
      return webhookController.processDelivery({ deliveryId, eventType, payload, rawBody });
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

