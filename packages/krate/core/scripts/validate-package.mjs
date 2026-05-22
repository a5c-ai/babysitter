import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'Dockerfile',
  '.dockerignore',
  '.github/workflows/publish.yml',
  '../web/app/page.jsx',
  '../web/app/layout.jsx',
  '../web/app/orgs/[org]/deployments/page.jsx',
  '../web/app/globals.css',
  '../web/next.config.mjs',
  '../charts/Chart.yaml',
  '../charts/values.yaml',
  '../charts/crds/repositories.yaml',
  '../charts/crds/aggregated-resources.yaml',
  '../charts/crds/policy-resources.yaml',
  '../charts/templates/apiservice.yaml',
  '../charts/templates/deployments.yaml',
  '../charts/templates/rbac.yaml',
  '../charts/templates/serviceaccount.yaml',
  '../charts/templates/services.yaml',
  '../charts/templates/networkpolicy.yaml',
  '../charts/templates/gitea.yaml',
  '../charts/templates/ingress.yaml',
  '../charts/templates/auth-secret.yaml',
  '../charts/templates/argocd-application.yaml',
  '../charts/templates/kubevela-application.yaml',
  '../charts/templates/NOTES.txt',
  'examples/minikube-demo.yaml',
  'examples/policy-kyverno-pr-title.yaml',
  'scripts/setup-minikube.mjs'
];

const requiredKinds = ['Deployment', 'Service', 'ServiceAccount', 'ClusterRole', 'ClusterRoleBinding', 'NetworkPolicy', 'PersistentVolumeClaim'];
const requiredCrds = ['Organization', 'OrgNamespaceBinding', 'User', 'Team', 'Invite', 'IdentityMapping', 'AuthProvider', 'Repository', 'SSHKey', 'RepositoryPermission', 'BranchProtection', 'RefPolicy', 'PolicyProfile', 'PolicyTemplate', 'PolicyBinding', 'PolicyExceptionRequest', 'PullRequest', 'Issue', 'Review', 'Pipeline', 'Job', 'RunnerPool', 'WebhookSubscription', 'WebhookDelivery', 'View', 'Selector'];
const requiredExampleKinds = ['Pipeline', 'Application'];
const requiredValueTerms = ['externalDependencies', 'postgres', 'objectStorage', 'nats', 'arc', 'kyverno', 'gatekeeper', 'ingress', 'oidc', 'auth', 'github', 'sso', 'delegatedIdentity', 'autoscaling', 'targetCPUUtilizationPercentage', 'gitea', 'argocd', 'repoURL', 'syncPolicy', 'apiService', 'kubevela', 'vela-core'];
const missing = [];
for (const file of requiredFiles) if (!existsSync(file)) missing.push(`missing file: ${file}`);
const chartText = requiredFiles.filter((file) => file.startsWith('../charts/') && existsSync(file)).map((file) => readFileSync(file, 'utf8')).join('\n');
const exampleText = existsSync('examples/minikube-demo.yaml') ? readFileSync('examples/minikube-demo.yaml', 'utf8') : '';
const valuesText = existsSync('../charts/values.yaml') ? readFileSync('../charts/values.yaml', 'utf8') : '';
const argocdTemplate = ['../charts/templates/argocd-application.yaml', '../charts/templates/kubevela-application.yaml'].filter((file) => existsSync(file)).map((file) => readFileSync(file, 'utf8')).join('\n');
for (const kind of requiredKinds) if (!chartText.includes(`kind: ${kind}`)) missing.push(`chart missing kind: ${kind}`);
for (const kind of requiredCrds) if (!chartText.includes(`kind: ${kind}`) && !exampleText.includes(`kind: ${kind}`)) missing.push(`package missing resource kind: ${kind}`);
for (const kind of requiredExampleKinds) if (!exampleText.includes(`kind: ${kind}`)) missing.push(`example missing resource kind: ${kind}`);
for (const term of requiredValueTerms) if (!valuesText.includes(term)) missing.push(`values missing ${term}`);
if (valuesText.includes('`n')) missing.push('values contains escaped newline markers instead of YAML structure');
const requiredValuePatterns = [
  [/^gitea:\s*$/m, 'values missing gitea block'],
  [/^argocd:\s*$/m, 'values missing argocd block'],
  [/^  repoURL:\s*\S+/m, 'values missing argocd repoURL value'],
  [/^  syncPolicy:\s*$/m, 'values missing structured argocd syncPolicy block'],
  [/^    automated:\s*true\s*$/m, 'values missing argocd syncPolicy.automated=true'],
  [/^    prune:\s*true\s*$/m, 'values missing argocd syncPolicy.prune=true'],
  [/^    selfHeal:\s*true\s*$/m, 'values missing argocd syncPolicy.selfHeal=true'],
  [/^    syncOptions:\s*$/m, 'values missing argocd syncPolicy.syncOptions block'],
  [/^      - CreateNamespace=true\s*$/m, 'values missing CreateNamespace sync option']
];
for (const [pattern, message] of requiredValuePatterns) if (!pattern.test(valuesText)) missing.push(message);
for (const requiredTemplateUse of ['.Values.argocd.syncPolicy.automated', '.Values.argocd.syncPolicy.prune', '.Values.argocd.syncPolicy.selfHeal', '.Values.argocd.syncPolicy.syncOptions']) {
  if (!argocdTemplate.includes(requiredTemplateUse)) missing.push(`argocd template does not consume ${requiredTemplateUse}`);
}

const dockerignore = existsSync('.dockerignore') ? readFileSync('.dockerignore', 'utf8') : '';
for (const ignored of ['.a5c', 'node_modules', '**/.next', 'dist']) if (!dockerignore.includes(ignored)) missing.push(`dockerignore missing ${ignored}`);

const packageInfo = JSON.parse(readFileSync('package.json', 'utf8'));
for (const fileSet of ['bin', 'examples', 'scripts', 'src', 'tests', 'Dockerfile']) {
  if (!packageInfo.files?.includes(fileSet)) missing.push(`package files missing ${fileSet}`);
}
for (const script of ['e2e', 'package:check', 'setup:minikube']) if (!packageInfo.scripts?.[script]) missing.push(`package script missing ${script}`);
if (missing.length) {
  console.error(JSON.stringify({ status: 'failed', missing }, null, 2));
  process.exit(1);
}

const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packOutput = execFileSync(npmBin, ['pack', '--dry-run', '--json'], { encoding: 'utf8', shell: process.platform === 'win32' });
const pack = JSON.parse(packOutput)[0];
const packedFiles = new Set(pack.files.map((file) => file.path));
for (const file of ['Dockerfile', 'examples/minikube-demo.yaml', 'scripts/setup-minikube.mjs', 'scripts/validate-package.mjs']) {
  if (!packedFiles.has(file)) missing.push(`npm pack missing ${file}`);
}
if (missing.length) {
  console.error(JSON.stringify({ status: 'failed', missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'success', checkedFiles: requiredFiles.length, requiredKinds: requiredKinds.length, requiredCrds: requiredCrds.length, packedFiles: pack.files.length, packageSize: pack.size, requiredExampleKinds: requiredExampleKinds.length, requiredValueTerms: requiredValueTerms.length }, null, 2));



