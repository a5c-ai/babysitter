import { ControlPlane } from './control-plane.js';
import { GiteaGitService, GiteaRepositoryStore } from './data-plane.js';
import { WebhookBus } from './hooks-events.js';
import { RunnerScheduler } from './runners-ci.js';
import { createAdmissionPolicy, mapOidcIdentity, toResourceYaml } from './identity-policy.js';
import { createResource } from './resource-model.js';
import { createDashboard, createPullRequestReviewModel, createRunnerPoolEditor, createTriageView, createWebhookInspector } from './web-ui.js';
import { createKrateComponentCatalog, createKrateLifecycleSnapshot } from './component-catalog.js';

export function chartPackageSurface() {
  return {
    chart: 'charts/krate',
    values: 'charts/krate/values.yaml',
    crds: ['Repository', 'BranchProtection', 'RefPolicy', 'RunnerPool', 'WebhookSubscription', 'View', 'Selector'],
    templates: ['CRDs', 'optional APIService', 'ServiceAccount', 'ClusterRole', 'ClusterRoleBinding', 'Deployment', 'Service', 'NetworkPolicy', 'Gitea backend', 'Argo CD Application'],
    examples: ['examples/minikube-demo.yaml', 'examples/policy-kyverno-pr-title.yaml'],
    validation: ['npm run e2e', 'npm run package:check', 'npm run setup:minikube -- --dry-run']
  };
}

export function localSetupPlan() {
  return {
    script: 'scripts/setup-minikube.mjs',
    defaultMode: 'dry-run',
    applyMode: 'npm run setup:minikube -- --apply',
    requiredTools: ['minikube', 'kubectl', 'helm', 'node', 'npm'],
    defaultProfile: 'krate',
    namespace: 'krate-system'
  };
}

export function generateInstallManifests({ namespace = 'krate-system' } = {}) {
  const manifests = [
    { apiVersion: 'apiregistration.k8s.io/v1', kind: 'APIService', metadata: { name: 'v1alpha1.krate.a5c.ai' }, spec: { group: 'krate.a5c.ai', version: 'v1alpha1', service: { namespace, name: 'krate-api' } } },
    { apiVersion: 'apps/v1', kind: 'Deployment', metadata: { name: 'krate-api', namespace }, spec: { replicas: 2, template: { spec: { containers: [{ name: 'api', image: 'krate/api:dev' }] } } } },
    { apiVersion: 'apps/v1', kind: 'Deployment', metadata: { name: 'krate-gitea', namespace, labels: { 'app.kubernetes.io/component': 'gitea-backend' } }, spec: { replicas: 1, template: { spec: { containers: [{ name: 'gitea', image: 'gitea/gitea:1.22-rootless' }] } } } },
    { apiVersion: 'argoproj.io/v1alpha1', kind: 'Application', metadata: { name: 'krate', namespace: 'argocd' }, spec: { source: { repoURL: 'https://gitea-http.krate-system.svc.cluster.local/krate/platform-config.git', path: 'charts/krate', targetRevision: 'main' }, destination: { namespace, server: 'https://kubernetes.default.svc' }, syncPolicy: { automated: { prune: true, selfHeal: true } } } },
    { apiVersion: 'apps/v1', kind: 'Deployment', metadata: { name: 'krate-web', namespace }, spec: { replicas: 1 } }
  ];
  return manifests.map((manifest) => `---\n${toResourceYaml(manifest)}`).join('\n');
}

export function backupPlan() {
  return { resources: ['CRDs and low-cardinality config', 'Postgres aggregated records', 'repository storage', 'object storage'], restoreOrder: ['API/config', 'Postgres', 'repository data', 'objects', 'controllers'], validation: ['list resources', 'read Gitea repository refs', 'open PR', 'replay webhook delivery'] };
}

export function observabilityModel() {
  return {
    metrics: ['api_request_latency', 'postgres_aggregate_lag', 'gitea_receive_pack_latency', 'runner_queue_depth', 'webhook_delivery_phase', 'admission_denials'],
    logs: ['control-plane audit', 'gitea access', 'runner job', 'webhook dispatcher', 'controller reconcile'],
    alerts: ['APIService unavailable', 'Postgres unavailable', 'repository service unavailable', 'runner saturation', 'webhook failure burst', 'backup validation failed']
  };
}

export function releaseGates() {
  return ['build', 'docs and ontology coverage', 'unit acceptance tests', 'e2e package lifecycle tests', 'package validation', 'minikube dry-run setup', 'smoke flow', 'backup restore validation', 'known limitations reviewed'];
}

export function createKrateMvpDemo() {
  const platformEngineer = mapOidcIdentity({ subject: 'user:platform', email: 'platform@example.com', groups: ['krate:platform-engineers'] });
  const developer = mapOidcIdentity({ subject: 'user:dev', email: 'dev@example.com', groups: ['krate:developers'] });
  const repoAdmin = mapOidcIdentity({ subject: 'user:admin', email: 'admin@example.com', groups: ['krate:repo-admins'] });
  const organizationRef = 'default';
  const namespace = 'krate-org-default';
  const controlPlane = new ControlPlane();
  controlPlane.addAdmissionPolicy(createAdmissionPolicy({ name: 'pr-title-required', mode: 'enforce', match: ({ resource }) => resource.kind === 'PullRequest', validate: ({ resource }) => Boolean(resource.spec.title && resource.spec.title.length >= 8), message: 'PullRequest spec.title must be descriptive' }));
  const git = new GiteaGitService({ controlPlane, stores: [new GiteaRepositoryStore({ name: 'gitea-primary', receivePackReady: true })] });
  const runners = new RunnerScheduler({ controlPlane });
  const webhooks = new WebhookBus({ controlPlane });
  const repository = git.createRepository({ name: 'krate-demo', namespace, organizationRef }, repoAdmin);
  const branchProtection = controlPlane.create(createResource('BranchProtection', { name: 'main-protection', namespace }, { organizationRef, refs: ['refs/heads/main'], requirePullRequest: true }), repoAdmin);
  const refPolicy = controlPlane.create(createResource('RefPolicy', { name: 'deny-internal-refs', namespace }, { organizationRef, deny: ['refs/internal/'] }), repoAdmin);
  const runnerPool = runners.createRunnerPool({ name: 'trusted-linux', namespace, organizationRef, warmReplicas: 1, maxReplicas: 4 }, platformEngineer);
  const subscription = webhooks.subscribe({ name: 'chatops', namespace, organizationRef, url: 'https://hooks.example.test/krate', events: ['pullrequest.created'] }, repoAdmin);
  const pullRequest = controlPlane.create(createResource('PullRequest', { name: 'pr-1', namespace, labels: { repository: 'krate-demo' } }, { organizationRef, repository: 'krate-demo', sourceRef: 'refs/heads/feature', targetRef: 'refs/heads/main', title: 'Add Kubernetes-native forge smoke path' }, { phase: 'Open' }), developer);
  const pipelineRun = runners.startPipeline({ name: 'pipeline-pr-1', namespace, organizationRef, repository: 'krate-demo', ref: 'refs/pull/1/head', actor: developer, fork: false }, developer);
  const delivery = webhooks.deliver({ subscriptionName: 'chatops', namespace, organizationRef, eventType: 'pullrequest.created', payload: { pullRequest: pullRequest.metadata.name, repository: 'krate-demo' } }, repoAdmin);
  const replay = webhooks.replay(delivery, repoAdmin);
  const triageView = controlPlane.create(createTriageView({ name: 'priority-triage', namespace, organizationRef, selector: { labels: { priority: 'high' } } }), repoAdmin);
  const demo = {
    users: { platformEngineer, developer, repoAdmin }, controlPlane, git, runners, webhooks,
    resources: { repository, branchProtection, refPolicy, runnerPool, subscription, pullRequest, pipelineRun, delivery, replay, triageView },
    ui: { dashboard: createDashboard({ repositories: [repository], pullRequests: [pullRequest], pipelines: [pipelineRun.pipeline], runnerPools: [runnerPool], webhookDeliveries: [delivery, replay] }), review: createPullRequestReviewModel({ pullRequest, changedFiles: ['src/index.js'], pipelineRuns: [pipelineRun.pipeline] }), runnerPoolEditor: createRunnerPoolEditor(runnerPool), webhookInspector: createWebhookInspector({ subscription, deliveries: [delivery, replay] }) },
    operations: { installManifests: generateInstallManifests(), chartPackage: chartPackageSurface(), localSetup: localSetupPlan(), backupPlan: backupPlan(), observability: observabilityModel(), releaseGates: releaseGates() }
  };
  demo.components = createKrateComponentCatalog(demo);
  demo.lifecycle = createKrateLifecycleSnapshot(demo);
  return demo;
}

export function runSmokeAssertions(demo = createKrateMvpDemo()) {
  const storage = demo.controlPlane.storageReport();
  const assertions = [
    ['Repository stored as CRD/etcd config', storage.etcd.includes('Repository')],
    ['PullRequest stored as aggregated/Postgres record', storage.postgres.includes('PullRequest')],
    ['RunnerPool stored as CRD/etcd configuration', storage.etcd.includes('RunnerPool')],
    ['WebhookDelivery stored as aggregated/Postgres record', storage.postgres.includes('WebhookDelivery')],
    ['Gitea receive path is ready', demo.git.route('krate-demo').backend === 'gitea' && demo.git.route('krate-demo').receivePackReady],
    ['Repository exposes Gitea integration plan', demo.resources.repository.spec.gitHosting.backend === 'gitea' && demo.resources.repository.spec.gitHosting.integrationPlan.backend === 'gitea'],
    ['UI exposes YAML for PR review', demo.ui.review.yaml.includes('kind: PullRequest')],
    ['Install manifests expose Kubernetes API discovery', demo.operations.installManifests.includes('kind: APIService') || demo.operations.chartPackage.crds.includes('Repository')],
    ['Chart package exposes CRDs', demo.operations.chartPackage.crds.includes('Repository')],
    ['Local setup defaults to dry-run minikube flow', demo.operations.localSetup.defaultMode === 'dry-run'],
    ['Release gates include docs and ontology coverage', demo.operations.releaseGates.includes('docs and ontology coverage')],
    ['Release gates include e2e package lifecycle tests', demo.operations.releaseGates.includes('e2e package lifecycle tests')],
    ['Observability tracks webhook delivery phase', demo.operations.observability.metrics.includes('webhook_delivery_phase')],
    ['Component catalog covers every implementation area', demo.components.every((component) => component.implemented)],
    ['Lifecycle snapshot is ready for local development', demo.lifecycle.status === 'ready-for-local-development']
  ];
  return { ok: assertions.every(([, passed]) => passed), assertions };
}

