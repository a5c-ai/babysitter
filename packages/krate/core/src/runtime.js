import { ControlPlane } from './control-plane.js';
import { GiteaGitService, GiteaRepositoryStore } from './data-plane.js';
import { WebhookBus } from './hooks-events.js';
import { createAdmissionPolicy, mapOidcIdentity } from './identity-policy.js';
import { createInviteResource, createTeamResource, createAuthProviderResources, mapLoginProfileToKrateIdentity } from './auth.js';
import { createResource, clone } from './resource-model.js';
import { RunnerScheduler } from './runners-ci.js';

const DEFAULT_ORG = 'default';
const DEFAULT_NAMESPACE = 'krate-org-default';

export function createDefaultKrateUsers() {
  return {
    platformEngineer: mapOidcIdentity({ subject: 'user:platform', email: 'platform@example.com', groups: ['krate:platform-engineers'] }),
    developer: mapOidcIdentity({ subject: 'user:dev', email: 'dev@example.com', groups: ['krate:developers'] }),
    repoAdmin: mapOidcIdentity({ subject: 'user:admin', email: 'admin@example.com', groups: ['krate:repo-admins'] })
  };
}

export class KrateRuntime {
  constructor({ organizationRef = DEFAULT_ORG, namespace = DEFAULT_NAMESPACE, users = createDefaultKrateUsers(), controlPlane, git, runners, webhooks } = {}) {
    this.organizationRef = organizationRef;
    this.namespace = namespace;
    this.users = users;
    this.controlPlane = controlPlane || new ControlPlane();
    this.controlPlane.addAdmissionPolicy(createAdmissionPolicy({
      name: 'pr-title-required',
      mode: 'enforce',
      match: ({ resource }) => resource.kind === 'PullRequest',
      validate: ({ resource }) => Boolean(resource.spec.title && resource.spec.title.length >= 8),
      message: 'PullRequest spec.title must be descriptive'
    }));
    this.git = git || new GiteaGitService({ controlPlane: this.controlPlane, stores: [new GiteaRepositoryStore({ name: 'gitea-primary', receivePackReady: true })] });
    this.runners = runners || new RunnerScheduler({ controlPlane: this.controlPlane });
    this.webhooks = webhooks || new WebhookBus({ controlPlane: this.controlPlane });
    this.seeded = false;
  }

  static fromSnapshot(snapshot, options = {}) {
    const runtime = new KrateRuntime(options);
    runtime.importSnapshot(snapshot);
    return runtime;
  }

  bootstrap({ repository = 'krate-demo', webhookUrl = 'https://hooks.example.test/krate' } = {}) {
    if (this.seeded) return this.snapshot();
    const { platformEngineer, repoAdmin } = this.users;
    this.git.createRepository({ name: repository, namespace: this.namespace, organizationRef: this.organizationRef }, repoAdmin);
    this.controlPlane.create(createResource('BranchProtection', { name: 'main-protection', namespace: this.namespace }, { organizationRef: this.organizationRef, refs: ['refs/heads/main'], requirePullRequest: true, requiredChecks: ['test'], requiredApprovals: 1 }), repoAdmin);
    this.controlPlane.create(createResource('RefPolicy', { name: 'deny-internal-refs', namespace: this.namespace }, { organizationRef: this.organizationRef, deny: ['refs/internal/'] }), repoAdmin);
    this.runners.createRunnerPool({ name: 'trusted-linux', namespace: this.namespace, organizationRef: this.organizationRef, warmReplicas: 1, maxReplicas: 4 }, platformEngineer);
    this.webhooks.subscribe({ name: 'chatops', namespace: this.namespace, organizationRef: this.organizationRef, url: webhookUrl, events: ['pullrequest.created', 'pullrequest.merged'] }, repoAdmin);
    this.controlPlane.create(createTeamResource({ name: 'maintainers', organizationRef: this.organizationRef, displayName: 'Maintainers', members: ['admin'], maintainers: ['admin'], repositoryGrants: [{ repository, permission: 'admin' }], namespace: this.namespace }), platformEngineer);
    const identity = mapLoginProfileToKrateIdentity({ provider: 'sso', subject: 'user:admin', email: 'admin@example.com', displayName: 'Admin', username: 'admin', teams: ['maintainers'], admin: true, namespace: this.namespace, organizationRef: this.organizationRef });
    this.controlPlane.create(identity.user, platformEngineer);
    this.controlPlane.create(identity.mapping, platformEngineer);
    this.controlPlane.create(createInviteResource({ email: 'new-user@example.com', role: 'member', teams: ['maintainers'], invitedBy: 'admin', namespace: this.namespace, organizationRef: this.organizationRef }), repoAdmin);
    for (const provider of createAuthProviderResources(undefined, this.namespace, this.organizationRef)) this.controlPlane.create(provider, platformEngineer);
    this.seeded = true;
    return this.snapshot();
  }

  exportSnapshot() {
    return {
      apiVersion: 'krate.a5c.ai/v1alpha1',
      kind: 'KrateRuntimeSnapshot',
      namespace: this.namespace,
      organizationRef: this.organizationRef,
      seeded: this.seeded,
      controlPlane: this.controlPlane.exportSnapshot(),
      git: this.git.snapshot?.() || null
    };
  }

  importSnapshot(snapshot) {
    const controlPlaneSnapshot = snapshot?.controlPlane || snapshot;
    this.controlPlane.importSnapshot(controlPlaneSnapshot);
    if (snapshot?.git) this.git.importSnapshot(snapshot.git);
    this.seeded = Boolean(snapshot?.seeded || this.controlPlane.list('Repository', { namespace: this.namespace }).items.length);
    return this.snapshot();
  }

  createRepository({ name, visibility = 'private' }, user = this.users.repoAdmin) {
    return this.git.createRepository({ name, namespace: this.namespace, organizationRef: this.organizationRef, visibility }, user);
  }

  createPullRequest({ repository, sourceRef = 'refs/heads/feature', targetRef = 'refs/heads/main', title, actor = this.users.developer, fork = false }) {
    this.#requireRepository(repository);
    const index = this.controlPlane.list('PullRequest', { namespace: this.namespace }).items.length + 1;
    const name = `pr-${index}`;
    const pullRequest = this.controlPlane.create(createResource('PullRequest', { name, namespace: this.namespace, labels: { repository } }, {
      organizationRef: this.organizationRef,
      repository,
      sourceRef,
      targetRef,
      title,
      author: actor.name,
      checks: [],
      requiredApprovals: this.#requiredApprovals(targetRef)
    }, { phase: 'Open', approvals: 0, mergeable: false }), actor);
    const pipelineRun = this.runners.startPipeline({ name: `pipeline-${name}`, namespace: this.namespace, organizationRef: this.organizationRef, repository, ref: `refs/pull/${index}/head`, actor, fork, steps: ['checkout', 'test'] }, actor);
    this.webhooks.deliver({ subscriptionName: 'chatops', namespace: this.namespace, organizationRef: this.organizationRef, eventType: 'pullrequest.created', payload: { pullRequest: name, repository, title } }, this.users.repoAdmin);
    return { pullRequest, pipeline: pipelineRun.pipeline, jobs: pipelineRun.jobs };
  }

  completePipeline({ pipeline, phase = 'Succeeded', failedStep = null }, user = this.users.developer) {
    const existing = this.controlPlane.get('Pipeline', this.namespace, pipeline);
    if (!existing) throw new Error(`Pipeline ${pipeline} not found`);
    const jobs = this.controlPlane.list('Job', { namespace: this.namespace, labels: { pipeline } }).items.map((job) => {
      const jobPhase = failedStep && job.spec.step === failedStep ? 'Failed' : phase;
      return this.controlPlane.patchStatus('Job', this.namespace, job.metadata.name, { phase: jobPhase, finishedAt: new Date().toISOString() }, user);
    });
    const pipelinePhase = jobs.some((job) => job.status.phase === 'Failed') ? 'Failed' : phase;
    const updatedPipeline = this.controlPlane.patchStatus('Pipeline', this.namespace, pipeline, { phase: pipelinePhase, currentStep: null, finishedAt: new Date().toISOString() }, user);
    this.#refreshPullRequestMergeability(existing.spec.repository);
    return { pipeline: updatedPipeline, jobs };
  }

  addReview({ pullRequest, decision = 'approved', body = 'Looks good', reviewer = this.users.repoAdmin }) {
    const pr = this.#requirePullRequest(pullRequest);
    const reviewCount = this.controlPlane.list('Review', { namespace: this.namespace, labels: { pullRequest } }).items.length + 1;
    const review = this.controlPlane.create(createResource('Review', { name: `${pullRequest}-review-${reviewCount}`, namespace: this.namespace, labels: { pullRequest, decision } }, {
      organizationRef: this.organizationRef,
      pullRequest,
      repository: pr.spec.repository,
      reviewer: reviewer.name,
      decision,
      body
    }, { phase: decision === 'approved' ? 'Approved' : 'ChangesRequested' }), reviewer);
    this.#refreshPullRequestMergeability(pr.spec.repository);
    return review;
  }

  mergePullRequest({ pullRequest, actor = this.users.repoAdmin }) {
    const pr = this.#requirePullRequest(pullRequest);
    const refreshed = this.#refreshPullRequestMergeability(pr.spec.repository).find((candidate) => candidate.metadata.name === pullRequest) || pr;
    if (!refreshed.status.mergeable) throw new Error(`PullRequest ${pullRequest} is not mergeable`);
    const gitEvent = this.git.receivePack({ repository: refreshed.spec.repository, namespace: this.namespace, ref: refreshed.spec.targetRef, newRev: this.#syntheticRevision(pullRequest), actor });
    const merged = this.controlPlane.patchStatus('PullRequest', this.namespace, pullRequest, { phase: 'Merged', mergeable: false, mergedAt: new Date().toISOString(), mergeCommit: gitEvent.newRev }, actor);
    const delivery = this.webhooks.deliver({ subscriptionName: 'chatops', namespace: this.namespace, organizationRef: this.organizationRef, eventType: 'pullrequest.merged', payload: { pullRequest, repository: refreshed.spec.repository, mergeCommit: gitEvent.newRev } }, this.users.repoAdmin);
    return { pullRequest: merged, gitEvent, delivery };
  }

  snapshot() {
    const kinds = ['Organization', 'User', 'Team', 'Invite', 'IdentityMapping', 'AuthProvider', 'Repository', 'SSHKey', 'RepositoryPermission', 'BranchProtection', 'RefPolicy', 'RunnerPool', 'PullRequest', 'Issue', 'Review', 'Pipeline', 'Job', 'WebhookSubscription', 'WebhookDelivery'];
    const resources = Object.fromEntries(kinds.map((kind) => [kind, this.controlPlane.list(kind, { namespace: this.namespace }).items]));
    return {
      namespace: this.namespace,
      export: this.exportSnapshot(),
      storage: this.controlPlane.storageReport(),
      resources,
      events: clone(this.controlPlane.events),
      auditLog: clone(this.controlPlane.auditLog)
    };
  }

  #requireRepository(repository) {
    const existing = this.controlPlane.get('Repository', this.namespace, repository);
    if (!existing) throw new Error(`Repository ${repository} not found`);
    return existing;
  }

  #requirePullRequest(pullRequest) {
    const existing = this.controlPlane.get('PullRequest', this.namespace, pullRequest);
    if (!existing) throw new Error(`PullRequest ${pullRequest} not found`);
    return existing;
  }

  #requiredApprovals(targetRef) {
    const branchProtection = this.controlPlane.list('BranchProtection', { namespace: this.namespace }).items.find((policy) => (policy.spec.refs || []).includes(targetRef));
    return branchProtection?.spec.requiredApprovals || 0;
  }

  #refreshPullRequestMergeability(repository) {
    const pullRequests = this.controlPlane.list('PullRequest', { namespace: this.namespace, labels: { repository } }).items;
    return pullRequests.map((pr) => {
      if (pr.status.phase !== 'Open') return pr;
      const reviews = this.controlPlane.list('Review', { namespace: this.namespace, labels: { pullRequest: pr.metadata.name } }).items;
      const approvals = reviews.filter((review) => review.spec.decision === 'approved').length;
      const pipelines = this.controlPlane.list('Pipeline', { namespace: this.namespace, labels: { repository } }).items.filter((pipeline) => pipeline.metadata.name === `pipeline-${pr.metadata.name}`);
      const checksPassed = pipelines.length > 0 && pipelines.every((pipeline) => pipeline.status.phase === 'Succeeded');
      return this.controlPlane.patchStatus('PullRequest', this.namespace, pr.metadata.name, { approvals, checksPassed, mergeable: approvals >= (pr.spec.requiredApprovals || 0) && checksPassed }, this.users.repoAdmin);
    });
  }

  #syntheticRevision(seed) {
    const source = Buffer.from(`${seed}:${Date.now()}`).toString('hex');
    return source.padEnd(40, '0').slice(0, 40);
  }
}

export function createKrateRuntime(options = {}) {
  const runtime = new KrateRuntime(options);
  if (options.bootstrap !== false) runtime.bootstrap(options.bootstrapOptions);
  return runtime;
}
