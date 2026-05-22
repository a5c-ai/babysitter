import test from 'node:test';

import assert from 'node:assert/strict';

import { execFileSync } from 'node:child_process';

import { existsSync, readFileSync } from 'node:fs';

import { buildMinikubePlan } from '../../scripts/setup-minikube.mjs';



const requiredChartFiles = [

  '../charts/Chart.yaml',

  '../charts/values.yaml',

  '../charts/crds/repositories.yaml',

  '../charts/crds/aggregated-resources.yaml',

  '../charts/templates/apiservice.yaml',

  '../charts/templates/deployments.yaml',

  '../charts/templates/rbac.yaml',

  '../charts/templates/services.yaml',


  '../charts/templates/networkpolicy.yaml',
  '../charts/templates/gitea.yaml',
  '../charts/templates/argocd-application.yaml',

  'examples/minikube-demo.yaml'

];



test('chart package contains the MVP Kubernetes install surface', () => {

  for (const file of requiredChartFiles) assert.equal(existsSync(file), true, `${file} exists`);

  const chart = requiredChartFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
  const values = readFileSync('../charts/values.yaml', 'utf8');

  for (const kind of ['CustomResourceDefinition', 'Deployment', 'Service', 'ServiceAccount', 'ClusterRole', 'NetworkPolicy', 'PersistentVolumeClaim']) assert.ok(chart.includes(`kind: ${kind}`), `chart includes ${kind}`);

  for (const resource of ['Organization', 'Repository', 'SSHKey', 'RepositoryPermission', 'BranchProtection', 'RefPolicy', 'PullRequest', 'Issue', 'Review', 'Pipeline', 'Job', 'RunnerPool', 'WebhookSubscription', 'WebhookDelivery', 'View', 'Selector']) assert.ok(chart.includes(`kind: ${resource}`), `package covers ${resource}`);
  assert.ok(chart.includes('kind: Pipeline'), 'package includes demo Pipeline workflow');
  assert.ok(chart.includes('kind: Application'), 'package includes Argo CD Application');
  assert.ok(chart.includes('krate-kubevela'), 'package installs KubeVela through Argo CD');
  assert.ok(chart.includes('core.oam.dev'), 'Krate service account can manage delivery resources');
  assert.ok(chart.includes('create') && chart.includes('delete'), 'Krate service account can compose and remove delivery resources');
  assert.ok(chart.includes('vela-core'), 'package references upstream KubeVela vela-core chart');
  assert.ok(chart.includes('apiService') && chart.includes('enabled: false'), 'APIService registration is optional for CRD-backed local installs');
  assert.ok(chart.includes('gitea/gitea'), 'package includes Gitea backend image');
  assert.ok(chart.includes('readinessProbe'), 'workloads expose readiness probes for live installs');
  assert.ok(chart.includes('serviceAccountName'), 'workloads run with the Krate service account');
  assert.ok(chart.includes('customresourcedefinitions'), 'service account can discover installed Krate CRDs');
  assert.ok(chart.includes('krate.webImage'), 'web deployment uses the web container image');
  assert.ok(chart.includes('sshkeys.krate.a5c.ai'), 'package includes SSH key reconciliation resources');
  assert.ok(chart.includes('repositorypermissions.krate.a5c.ai'), 'package includes Gitea permission reconciliation resources');
  assert.ok(chart.includes('revoked'), 'package access CRDs allow revocation state');
  assert.ok(chart.includes('KRATE_CONTROLLER_URL'), 'web deployment points at the in-cluster controller API');
  assert.ok(values.includes('port: 80'), 'controller API service exposes an HTTP service port for in-cluster web fetches');
  assert.ok(!values.includes('port: 443'), 'controller API does not expose plain HTTP through a TLS-looking service port');
  assert.ok(chart.includes('containerPort: 2222'), 'rootless Gitea SSH service targets port 2222');
  assert.ok(chart.includes('krate.fullname') && chart.includes('gitea-http'), 'Gitea and Argo CD URLs derive the release-scoped service name');
  assert.ok(chart.includes('krate.a5c.ai/gitops-engine: argocd'), 'package labels Argo CD GitOps engine');
  assert.ok(!chart.includes('`n'), 'package values use real YAML newlines');
  assert.ok(chart.includes('.Values.argocd.syncPolicy.prune'), 'Argo CD template consumes syncPolicy.prune');
  assert.ok(chart.includes('.Values.argocd.syncPolicy.selfHeal'), 'Argo CD template consumes syncPolicy.selfHeal');
  assert.ok(chart.includes('- CreateNamespace=true'), 'values expose Argo CD CreateNamespace sync option');
  for (const valueTerm of ['externalDependencies', 'objectStorage', 'oidc', 'gatekeeper', 'autoscaling', 'targetCPUUtilizationPercentage', 'gitea', 'argocd', 'repoURL', 'syncPolicy']) assert.ok(chart.includes(valueTerm), `values expose ${valueTerm}`);
});



test('minikube setup dry-run exposes deterministic local install commands', () => {

  const plan = buildMinikubePlan({ apply: false, json: true, profile: 'krate-test', namespace: 'krate-system', release: 'krate', driver: 'docker', chart: '../charts' });

  const commands = plan.commands.map(([cmd, args]) => [cmd, ...args].join(' '));

  assert.equal(plan.mode, 'dry-run');

  assert.ok(commands.some((command) => command.startsWith('minikube start -p krate-test')));

  assert.ok(commands.includes('helm lint ../charts'));

  assert.ok(commands.some((command) => command.includes('helm upgrade --install krate ../charts')));

  assert.ok(commands.includes('kubectl apply -n krate-system -f examples/minikube-demo.yaml'));

  assert.ok(commands.includes('node scripts/smoke.mjs'));

});



test('setup:minikube --dry-run --json is machine-readable', () => {

  const output = execFileSync(process.execPath, ['scripts/setup-minikube.mjs', '--dry-run', '--json', '--profile=krate-test'], { encoding: 'utf8' });

  const parsed = JSON.parse(output);

  assert.equal(parsed.mode, 'dry-run');

  assert.ok(parsed.requiredTools.includes('minikube'));

  assert.ok(parsed.commands.some((command) => command.includes('helm lint ../charts')));

});




