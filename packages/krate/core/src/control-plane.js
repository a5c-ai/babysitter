import { clone, matchLabels, resourceKey, storageClassForKind, toKubernetesList, validateResource } from './resource-model.js';
import { defaultAuthorizer, evaluateAdmission } from './identity-policy.js';

export const STORAGE_BOUNDARY_DESCRIPTIONS = { etcd: 'Kubernetes etcd CRD config', postgres: 'Aggregated API Postgres records' };

export class ControlPlane {
  constructor({ authorizer = defaultAuthorizer(), admissionPolicies = [] } = {}) {
    this.authorizer = authorizer;
    this.admissionPolicies = admissionPolicies;
    this.stores = { etcd: new Map(), postgres: new Map() };
    this.auditLog = [];
    this.events = [];
    this.watchers = new Map();
  }

  addAdmissionPolicy(policy) { this.admissionPolicies.push(policy); }
  create(resource, user) { return this.#mutate('create', resource, user); }
  update(resource, user) { return this.#mutate('update', resource, user); }

  patchStatus(kind, namespace, name, statusPatch, user) {
    const existing = this.get(kind, namespace, name);
    if (!existing) throw new Error(`${kind}/${namespace}/${name} not found`);
    const next = clone(existing);
    next.status = { ...next.status, ...clone(statusPatch) };
    return this.#mutate('update', next, user, { statusOnly: true });
  }

  get(kind, namespace = 'default', name) {
    const storage = storageClassForKind(kind);
    return clone(this.stores[storage].get(`${kind}/${namespace}/${name}`));
  }

  list(kind, { namespace, labels } = {}) {
    const storage = storageClassForKind(kind);
    const items = [...this.stores[storage].values()]
      .filter((resource) => resource.kind === kind)
      .filter((resource) => !namespace || resource.metadata.namespace === namespace)
      .filter((resource) => !labels || matchLabels(resource, labels))
      .map(clone);
    return toKubernetesList(kind, items);
  }

  watch(kind, handler) {
    if (!this.watchers.has(kind)) this.watchers.set(kind, new Set());
    this.watchers.get(kind).add(handler);
    return () => this.watchers.get(kind)?.delete(handler);
  }

  storageReport() {
    return {
      etcd: [...this.stores.etcd.values()].map((resource) => resource.kind),
      postgres: [...this.stores.postgres.values()].map((resource) => resource.kind)
    };
  }

  exportSnapshot() {
    return {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'ControlPlaneSnapshot',
      stores: {
        etcd: [...this.stores.etcd.values()].map(clone),
        postgres: [...this.stores.postgres.values()].map(clone)
      },
      auditLog: clone(this.auditLog),
      events: clone(this.events)
    };
  }

  importSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') throw new Error('snapshot must be an object');
    const stores = snapshot.stores || {};
    const nextStores = { etcd: new Map(), postgres: new Map() };
    for (const storage of ['etcd', 'postgres']) {
      for (const resource of stores[storage] || []) {
        const valid = validateResource(clone(resource));
        const expectedStorage = storageClassForKind(valid.kind);
        if (expectedStorage !== storage) throw new Error(`${valid.kind} belongs in ${expectedStorage}, not ${storage}`);
        valid.status.storage = storage;
        nextStores[storage].set(`${valid.kind}/${valid.metadata.namespace}/${valid.metadata.name}`, clone(valid));
      }
    }
    this.stores = nextStores;
    this.auditLog = clone(snapshot.auditLog || []);
    this.events = clone(snapshot.events || []);
    this.#emit({ type: 'snapshot.imported', storage: 'control-plane', resource: createSnapshotResource(this.exportSnapshot()), audit: null });
    return this.exportSnapshot();
  }

  #mutate(operation, resource, user, options = {}) {
    const candidate = validateResource(clone(resource));
    const namespace = candidate.metadata.namespace;
    const verb = options.statusOnly ? 'update' : operation;
    if (!this.authorizer.can(user, verb, candidate.kind, namespace)) {
      throw new Error(`RBAC denied ${user?.name || 'anonymous'} ${verb} ${candidate.kind}`);
    }
    const admission = evaluateAdmission(this.admissionPolicies, { operation, resource: candidate, user, options });
    const auditEntry = {
      at: new Date().toISOString(),
      operation,
      user: user?.name || 'anonymous',
      groups: user?.groups || [],
      resource: resourceKey(candidate),
      warnings: admission.warnings,
      allowed: admission.allowed
    };
    this.auditLog.push(auditEntry);
    if (!admission.allowed) {
      const messages = admission.violations.map((violation) => violation.message).join('; ');
      throw new Error(`Admission denied ${candidate.kind}: ${messages}`);
    }
    const storage = storageClassForKind(candidate.kind);
    const key = `${candidate.kind}/${namespace}/${candidate.metadata.name}`;
    candidate.metadata.resourceVersion = String((Number(this.stores[storage].get(key)?.metadata?.resourceVersion || 0) || 0) + 1);
    candidate.status.storage = storage;
    this.stores[storage].set(key, clone(candidate));
    this.#emit({ type: operation, storage, resource: candidate, audit: auditEntry });
    return clone(candidate);
  }

  #emit(event) {
    const publicEvent = { ...event, resource: clone(event.resource) };
    this.events.push(publicEvent);
    for (const handler of this.watchers.get(event.resource.kind) || []) handler(publicEvent);
    for (const handler of this.watchers.get('*') || []) handler(publicEvent);
  }
}

function createSnapshotResource(snapshot) {
  return {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'ControlPlaneSnapshot',
    metadata: { namespace: 'default', name: 'latest', labels: {}, annotations: {}, resourceVersion: '1' },
    spec: { resourceCounts: Object.fromEntries(Object.entries(snapshot.stores).map(([storage, resources]) => [storage, resources.length])) },
    status: { storage: 'control-plane', phase: 'Imported' }
  };
}