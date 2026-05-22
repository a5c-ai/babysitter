import { giteaIssueSyncPlan, giteaRepositoryIntegrationPlan, orgMemoryRepositoryName } from './gitea-backend.js';
import { clone, createResource } from './resource-model.js';


export function createDefaultGiteaGitBackend({ baseUrl = 'http://krate-gitea-http:3000', sshDomain = 'krate-gitea-ssh', owner = 'krate', webhookBaseUrl = 'http://krate-webhook-worker' } = {}) {
  return { type: 'gitea', baseUrl: baseUrl.replace(/\/$/, ''), sshDomain, owner, webhookBaseUrl: webhookBaseUrl.replace(/\/$/, '') };
}

export function createGiteaRepositoryHosting({ backend = createDefaultGiteaGitBackend(), namespace = 'default', repository, branch = 'main' }) {
  const owner = backend.owner || namespace;
  const httpUrl = `${backend.baseUrl}/${owner}/${repository}.git`;
  const sshUrl = `ssh://git@${backend.sshDomain}/${owner}/${repository}.git`;
  const webhookUrl = `${backend.webhookBaseUrl}/repositories/${namespace}/${repository}`;
  return {
    backend: 'gitea',
    owner,
    repository,
    branch,
    httpUrl,
    sshUrl,
    deployKeyTitle: 'krate-argocd',
    organization: { kind: 'Organization', name: owner, delegatedTo: 'Gitea /api/v1/orgs' },
    sshKeys: { kind: 'SSHKey', scopes: ['user', 'deploy', 'argocd'], delegatedTo: 'Gitea /api/v1/user/keys and /repos/{owner}/{repo}/keys' },
    permissions: { kind: 'RepositoryPermission', defaultCollaborator: 'write', adminTeam: 'maintainers', delegatedTo: 'Gitea collaborators and team repository APIs' },
    forgeRecords: { issues: `Gitea /repos/${owner}/${orgMemoryRepositoryName(namespace)}/issues`, pullRequests: 'Gitea /repos/{owner}/{repo}/pulls' },
    issueSync: giteaIssueSyncPlan({ org: namespace, repositories: [repository] }),
    webhookUrl,
    integrationPlan: giteaRepositoryIntegrationPlan({ owner, repo: repository, deployKeyTitle: 'krate-argocd', permission: 'write', branch, webhookUrl })
  };
}

export function stableRepositoryStoreIndex(repositoryName, storeCount) {
  let hash = 0;
  for (const character of repositoryName) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % storeCount;
}

export class GiteaRepositoryStore {
  constructor({ name = 'gitea-primary', receivePackReady = true, capacity = 1000 } = {}) {
    this.name = name;
    this.receivePackReady = receivePackReady;
    this.capacity = capacity;
    this.repositories = new Map();
    this.objects = new Map();
    this.searchIndex = new Map();
  }

  assign(repository) { this.repositories.set(repository.metadata.name, repository); return this; }
  isReceivePackReady() { return this.receivePackReady; }

  putObject(repository, object) {
    const objects = this.objects.get(repository) || [];
    objects.push(object);
    this.objects.set(repository, objects);
    return object;
  }

  index(repository, entry) {
    const entries = this.searchIndex.get(repository) || [];
    entries.push(entry);
    this.searchIndex.set(repository, entries);
    return entry;
  }

  snapshot() {
    return {
      name: this.name,
      receivePackReady: this.receivePackReady,
      capacity: this.capacity,
      repositories: Object.fromEntries([...this.repositories.entries()].map(([name, resource]) => [name, clone(resource)])),
      objects: Object.fromEntries([...this.objects.entries()].map(([repository, objects]) => [repository, clone(objects)])),
      searchIndex: Object.fromEntries([...this.searchIndex.entries()].map(([repository, entries]) => [repository, clone(entries)]))
    };
  }

  importSnapshot(snapshot = {}) {
    this.receivePackReady = snapshot.receivePackReady ?? this.receivePackReady;
    this.capacity = snapshot.capacity ?? this.capacity;
    this.repositories = new Map(Object.entries(snapshot.repositories || {}).map(([name, resource]) => [name, clone(resource)]));
    this.objects = new Map(Object.entries(snapshot.objects || {}).map(([repository, objects]) => [repository, clone(objects)]));
    this.searchIndex = new Map(Object.entries(snapshot.searchIndex || {}).map(([repository, entries]) => [repository, clone(entries)]));
    return this;
  }
}

export class GiteaGitService {
  constructor({ controlPlane, stores = [new GiteaRepositoryStore()], gitBackend = createDefaultGiteaGitBackend() }) {
    if (!controlPlane) throw new Error('GiteaGitService requires a controlPlane');
    this.controlPlane = controlPlane;
    this.stores = stores;
    this.gitBackend = gitBackend.type === 'gitea' ? gitBackend : createDefaultGiteaGitBackend(gitBackend);
    this.integrationPlans = new Map();
  }

  snapshot() {
    return {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'GiteaGitServiceSnapshot',
      backend: clone(this.gitBackend),
      integrationPlans: Object.fromEntries([...this.integrationPlans.entries()].map(([repository, plan]) => [repository, clone(plan)])),
      stores: this.stores.map((store) => store.snapshot())
    };
  }

  importSnapshot(snapshot = {}) {
    if (snapshot.backend?.type === 'gitea') this.gitBackend = clone(snapshot.backend);
    this.integrationPlans = new Map(Object.entries(snapshot.integrationPlans || {}).map(([repository, plan]) => [repository, clone(plan)]));
    if (!Array.isArray(snapshot.stores)) return this;
    this.stores = snapshot.stores.map((storeSnapshot) => new GiteaRepositoryStore({
      name: storeSnapshot.name,
      receivePackReady: storeSnapshot.receivePackReady,
      capacity: storeSnapshot.capacity
    }).importSnapshot(storeSnapshot));
    return this;
  }

  route(repositoryName) {
    const store = this.stores[stableRepositoryStoreIndex(repositoryName, this.stores.length)];
    const owner = this.gitBackend.owner || 'krate';
    return { repositoryName, backend: 'gitea', owner, store: store.name, receivePackReady: store.isReceivePackReady(), httpUrl: `${this.gitBackend.baseUrl}/${owner}/${repositoryName}.git`, sshUrl: `ssh://git@${this.gitBackend.sshDomain}/${owner}/${repositoryName}.git` };
  }

  createRepository({ name, namespace = 'krate-org-default', organizationRef = 'default', visibility = 'private' }, user) {
    const route = this.route(name);
    const hosting = createGiteaRepositoryHosting({ backend: this.gitBackend, namespace, repository: name });
    const repository = createResource('Repository', { name, namespace, labels: { gitBackend: 'gitea' } }, {
      organizationRef,
      visibility,
      gitHosting: hosting,
      storage: { mode: 'gitea', persistentVolumeClaim: 'krate-gitea-data', owner: hosting.owner, repository: name, httpUrl: hosting.httpUrl, sshUrl: hosting.sshUrl },
      objectStorage: { lfs: true, artifacts: true },
      search: { provider: 'zoekt', enabled: false }
    }, { ready: true, route: { ...route, backend: 'gitea' }, gitHosting: { backend: 'gitea', httpUrl: hosting.httpUrl, sshUrl: hosting.sshUrl, integrationPlan: hosting.integrationPlan } });
    const created = this.controlPlane.create(repository, user);
    this.integrationPlans.set(name, hosting.integrationPlan);
    this.stores.find((store) => store.name === route.store).assign(created);
    return created;
  }

  receivePack({ repository, namespace = 'krate-org-default', ref, oldRev = '0'.repeat(40), newRev, actor }) {
    const route = this.route(repository);
    if (!route.receivePackReady) throw new Error(`receive-pack for ${repository} is not ready`);
    const refPolicies = this.controlPlane.list('RefPolicy', { namespace }).items;
    const branchProtections = this.controlPlane.list('BranchProtection', { namespace }).items;
    const deniedByPolicy = refPolicies.find((policy) => (policy.spec.deny || []).some((prefix) => ref.startsWith(prefix)));
    if (deniedByPolicy) throw new Error(`RefPolicy ${deniedByPolicy.metadata.name} denied ${ref}`);
    const protectedBranch = branchProtections.find((policy) => (policy.spec.refs || []).includes(ref));
    const isRepoAdmin = actor.groups?.includes('krate:repo-admins') || actor.groups?.includes('krate:platform-engineers');
    if (protectedBranch && protectedBranch.spec.requirePullRequest && !isRepoAdmin) {
      throw new Error(`BranchProtection ${protectedBranch.metadata.name} requires pull request for ${ref}`);
    }
    const event = { repository, namespace, ref, oldRev, newRev, actor: actor.name, backend: 'gitea', store: route.store, remoteUrl: route.httpUrl, at: new Date().toISOString() };
    this.controlPlane.events.push({ type: 'git.receive-pack', resource: event, storage: 'gitea' });
    return event;
  }

  uploadPack({ repository }) {
    const route = this.route(repository);
    return { repository, backend: 'gitea', store: route.store, remoteUrl: route.httpUrl, cacheable: true };
  }

  recordObject({ repository, namespace = 'default', key, size, mediaType = 'application/octet-stream' }) {
    const route = this.route(repository);
    const store = this.stores.find((candidate) => candidate.name === route.store);
    const object = { repository, namespace, key, size, mediaType, store: route.store, storage: 'object-storage', at: new Date().toISOString() };
    store.putObject(repository, object);
    this.controlPlane.events.push({ type: 'git.object-recorded', resource: object, storage: 'object-storage' });
    return object;
  }

  enqueueSearchIndex({ repository, namespace = 'default', commit, paths = [] }) {
    const route = this.route(repository);
    const store = this.stores.find((candidate) => candidate.name === route.store);
    const entry = { repository, namespace, commit, paths, store: route.store, provider: 'zoekt', status: 'queued', at: new Date().toISOString() };
    store.index(repository, entry);
    this.controlPlane.events.push({ type: 'search.index-queued', resource: entry, storage: 'search-index' });
    return entry;
  }
}
