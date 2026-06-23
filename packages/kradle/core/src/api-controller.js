import { createKubernetesResourceGateway } from './kubernetes-resource-gateway.js';
import { clearSnapshotCache } from './snapshot-cache.js';
import { createPermissionReviewer } from './agent-permission-review.js';
import { createAgentDispatchController } from './agent-dispatch-controller.js';
import { createAgentMuxClient } from './adapters-client.js';
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
import { createModelRouteController } from './model-route-controller.js';

export const KRADLE_API_CONTROLLER_BOUNDARY = {
  role: 'kradle-api-controller',
  scope: 'HTTP/application facade for validation, request orchestration, user-facing DTOs, API errors, and workflow affordances',
  owns: ['input validation', 'forge DTOs', 'API errors', 'workflow affordances', 'controller UI snapshots'],
  delegatesTo: ['kubernetes-resource-gateway', 'git-data-plane'],
  mustNotOwn: ['kubectl process execution', 'Kubernetes reconciliation loops', 'watch stream internals', 'repository storage internals']
};

export function createKradleApiController(options = {}) {
  const resourceGateway = options.resourceGateway || createKubernetesResourceGateway(options);
  const namespace = options.namespace || resourceGateway.namespace || process.env.KRADLE_NAMESPACE || 'kradle-system';
  const onAuditEvent = typeof options.onAuditEvent === 'function' ? options.onAuditEvent : null;

  function emitAuditEvent(resource, operation) {
    if (!onAuditEvent) return;
    try {
      const org = resource.spec?.organizationRef || resource.metadata?.labels?.['kradle.a5c.ai/org'] || '';
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
    role: 'kradle-api-controller',
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
    async patchResourceStatusForOrg(orgSlug, kindOrPlural, name, statusPatch) {
      const slug = normalizeOrgSlug(orgSlug);
      const orgNs = orgNamespaceName(slug);
      if (typeof resourceGateway.patchStatus !== 'function') {
        throw new Error('resource gateway does not support status subresource patching');
      }
      // Verify the resource belongs to the org's namespace before mutating status.
      const existing = await resourceGateway.get(kindOrPlural, name);
      const resource = existing?.resource || existing;
      if (resource) {
        const resourceNs = resource.metadata?.namespace;
        if (resourceNs && resourceNs !== orgNs) {
          throw new Error(
            `Cross-org denial: resource "${name}" is in namespace "${resourceNs}" which does not match org "${slug}" namespace "${orgNs}"`
          );
        }
      }
      const result = await resourceGateway.patchStatus(kindOrPlural, name, statusPatch, { namespace: orgNs });
      clearSnapshotCache();
      const patched = result.resource || resource;
      if (patched) {
        emitAuditEvent(patched, 'patch-status');
        globalEventBus.emitResourceChange(
          patched.kind || kindOrPlural,
          patched.metadata?.name || name,
          'patch-status'
        );
      }
      return result;
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
      // Resource resolution: a caller may pre-supply the resources needed to
      // resolve the dispatch target (the org-scoped AgentStack / identity
      // resources). When provided we skip the full cluster snapshot — that
      // snapshot scans ~96 kinds sequentially over the (often remote) kubeconfig
      // and blocks the event loop for tens of seconds; the dispatch path only
      // needs the AgentStack (+ identity kinds), so a scoped read is both correct
      // and orders of magnitude faster.
      const resources = input.resources || (await this.snapshot()).resources;
      const controllerOptions = input.controllerOptions || {};
      const controller = createAgentDispatchController({
        ...controllerOptions,
        agentMuxClient: controllerOptions.agentMuxClient || createAgentMuxClient({ resourceGateway }),
      });
      const result = await controller.createManualDispatch({
        ...input,
        resources
      });
      // Persist the AgentDispatchRun CR. `createManualDispatch` builds the run in
      // memory and only ever submits a K8s Job (runtime path) — it never writes
      // the run resource itself. The control-plane contract (a dispatch creates a
      // queryable AgentDispatchRun) requires us to apply it. The Job submission
      // remains best-effort: the run CR is the durable record regardless of
      // whether the agent runtime is available to pick it up.
      if (result && !result.error && result.run) {
        const runOrg = input.organizationRef || result.run.spec?.organizationRef || 'default';
        try {
          const applied = await this.applyResourceForOrg(runOrg, result.run);
          result.run = applied.resource || result.run;
          result.runApplyResult = applied;
          // `applyResourceForOrg` (kubectl apply) strips the status subresource,
          // so the just-created run would have an empty status and the board would
          // never see it as Running. Persist the initial phase via the status
          // subresource explicitly (same reason the callback patches status).
          const initialStatus = result.run.status;
          if (initialStatus && typeof this.patchResourceStatusForOrg === 'function') {
            try {
              await this.patchResourceStatusForOrg(runOrg, 'AgentDispatchRun', result.run.metadata?.name, initialStatus);
            } catch (statusErr) {
              result.runStatusApplyError = statusErr.message || String(statusErr);
            }
          }
        } catch (err) {
          result.runApplyError = err.message || String(err);
        }
      }
      if (result?.memorySnapshot) {
        result.memorySnapshotApplyResult = await this.applyResourceForOrg(
          input.organizationRef || result.memorySnapshot.spec?.organizationRef || 'default',
          result.memorySnapshot
        );
      }
      // Apply the workspace PVC the dispatch built. createManualDispatch returns
      // the manifest but has no gateway to apply it, so without this the agent
      // Job references a PVC that never exists and the pod stays Pending. The PVC
      // is a core/v1 resource (passed through withOrgScope unchanged).
      if (result && !result.error && result.workspace?.pvcManifest) {
        try {
          await resourceGateway.apply(result.workspace.pvcManifest);
        } catch (err) {
          result.workspaceApplyError = err.message || String(err);
        }
      }
      return result;
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
      const controllerOptions = input.controllerOptions || {};
      const dispatchController = createAgentDispatchController({
        ...controllerOptions,
        agentMuxClient: controllerOptions.agentMuxClient || createAgentMuxClient({ resourceGateway }),
      });
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
      const result = memoryController.queryMemory({
        ...input,
        namespace: input.namespace || namespace,
        organizationRef: input.organizationRef || 'default'
      });
      if (result.queryResource) {
        result.applyResult = await this.applyResourceForOrg(
          result.queryResource.spec?.organizationRef || input.organizationRef || 'default',
          result.queryResource
        );
      }
      return result;
    },
    async createMemoryImport(input) {
      const memoryController = createAgentMemoryController();
      const importResource = memoryController.createImport({
        ...input,
        namespace: input.namespace || namespace,
        organizationRef: input.organizationRef || 'default'
      });
      const applyResult = await this.applyResourceForOrg(
        importResource.spec?.organizationRef || input.organizationRef || 'default',
        importResource
      );
      return { ...importResource, importResource, applyResult };
    },
    async createMemoryUpdate(input) {
      const memoryController = createAgentMemoryController();
      const update = memoryController.createMemoryUpdate({
        ...input,
        namespace: input.namespace || namespace,
        organizationRef: input.organizationRef || 'default'
      });
      const applyResult = await this.applyResourceForOrg(
        update.spec?.organizationRef || input.organizationRef || 'default',
        update
      );
      return { ...update, update, applyResult };
    },
    async applyModelRoute(route, options = {}) {
      const routeController = createModelRouteController();
      const validation = routeController.validate(route);
      if (!validation.valid) {
        throw new Error(`Invalid KradleModelRoute: ${validation.errors.join('; ')}`);
      }

      const routeResult = await this.applyResource(route);
      const appliedRoute = routeResult.resource || route;
      const snapshot = options.resources
        ? { resources: options.resources }
        : await resourceGateway.snapshot();
      const allResources = normalizeResourceList(snapshot?.resources || snapshot?.items || snapshot || []);
      const resolvedEndpoint = routeController.resolveRoute(appliedRoute, allResources);
      if (!resolvedEndpoint.endpoint) {
        throw new Error(`Could not resolve endpoint for KradleModelRoute "${appliedRoute.metadata?.name || 'unknown'}"`);
      }
      const gatewayRoute = routeController.generateEnvoyRouteManifest(appliedRoute, resolvedEndpoint);
      const gatewayRouteResult = await this.applyResource(gatewayRoute);
      return { route: appliedRoute, routeResult, gatewayRoute, gatewayRouteResult };
    },

    // ---------------------------------------------------------------------------
    // Model Route catalog
    // ---------------------------------------------------------------------------

    /**
     * List the unified model catalog for an organization by resolving all
     * KradleModelRoute resources through the model-route-controller.
     *
     * @param {string} org - organization slug
     * @returns {Promise<Array<{ name: string, provider: string, type: string, status: string, endpoint: string, protocol: string }>>}
     */
    async listModelCatalog(org) {
      const slug = normalizeOrgSlug(org);
      const orgNs = orgNamespaceName(slug);
      const result = await resourceGateway.list('KradleModelRoute');
      const routes = normalizeResourceList(result).filter(
        (item) => item.metadata?.namespace === orgNs
      );
      const snapshot = await resourceGateway.snapshot();
      const allResources = normalizeResourceList(snapshot?.resources || snapshot?.items || snapshot || []);
      const routeController = createModelRouteController();
      return routeController.listModelCatalog(routes, allResources);
    },

    // ---------------------------------------------------------------------------
    // External controller integration
    // ---------------------------------------------------------------------------

    /**
     * Sync an external resource into the Kradle resource store.
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
        ...KRADLE_API_CONTROLLER_BOUNDARY,
        owns: [...KRADLE_API_CONTROLLER_BOUNDARY.owns, '/api/controller', '/api/orgs/:org/resources', '/api/orgs/:org/repositories', '/api/watch/orgs/:org/*'],
        scope: `${KRADLE_API_CONTROLLER_BOUNDARY.scope}; never owns Kubernetes reconciliation loops`
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
        owns: ['Kradle CRDs', 'aggregated API resources', 'Kubernetes watch streams']
      },
      kubernetesReconciler: {
        role: 'kradle-kubernetes-reconciler',
        scope: 'Repository status projection, repository hosting intent, policy projection, and data-plane sync intent; never owns HTTP routes or browser flows',
        namespace,
        delegatesTo: ['kubernetes-resource-gateway', 'git-data-plane']
      },
      dataPlane: {
        role: 'git-data-plane',
        scope: 'Repository streaming, SSH hosting, object storage, search indexing, and warm receive-pack paths',
        boundary: process.env.KRADLE_GITEA_HTTP_URL || 'repository service not configured'
      }
    }
  };
}

export function repositoryForgeSummary(resource, namespace = 'kradle-system') {
  const metadata = resource?.metadata || {};
  const spec = resource?.spec || {};
  const name = metadata.name || 'unknown-repository';
  const repositoryNamespace = metadata.namespace || namespace;
  const org = spec.organizationRef || metadata.labels?.['kradle.a5c.ai/org'] || 'default';
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
    cloneUrl: spec.gitHosting?.httpUrl || `<kradle-repository-service>/${encodeURIComponent(org)}/${name}.git`,
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
      get: `kubectl get repositories.kradle.a5c.ai ${name} -n ${repositoryNamespace} -o yaml`,
      delete: `kubectl delete repositories.kradle.a5c.ai ${name} -n ${repositoryNamespace}`
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

