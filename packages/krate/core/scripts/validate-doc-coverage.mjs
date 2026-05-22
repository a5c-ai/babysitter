import { readFile } from 'node:fs/promises';

const requiredDocs = [
  'README.md',
  'docs/README.md',
  'docs/product-requirements.md',
  'docs/system-requirements.md',
  'docs/architecture-spec.md',
  'docs/user-stories.md',
  'docs/roadmap-mvp.md',
  'docs/install.md',
  'docs/local-minikube.md',
  'docs/components/control-plane.md',
  'docs/components/data-plane.md',
  'docs/components/identity-rbac-policy.md',
  'docs/components/runners-ci.md',
  'docs/components/hooks-events.md',
  'docs/components/web-ui.md',
  'docs/components/operations-publishing.md',
  'docs/components/kubevela-oam.md'
];

const requiredOntology = [
  'docs/ontology/README.md',
  'docs/ontology/world.md',
  'docs/ontology/problem-space.md',
  'docs/ontology/solution-space.md',
  'docs/ontology/bounded-contexts.md',
  'docs/ontology/resource-taxonomy.md',
  'docs/ontology/resource-contracts.md',
  'docs/ontology/personas-and-actors.md',
  'docs/ontology/workflows.md',
  'docs/ontology/policies-and-invariants.md',
  'docs/ontology/storage-and-data-boundaries.md',
  'docs/ontology/events-and-hooks.md',
  'docs/ontology/runners-and-ci.md',
  'docs/ontology/web-ui-excellent-flows.md',
  'docs/ontology/operations-and-release.md',
  'docs/ontology/validation-matrix.md',
  'docs/ontology/oam-kubevela.md'
];

const implementationFiles = [
  'src/resource-model.js',
  'src/control-plane.js',
  'src/data-plane.js',
  'src/identity-policy.js',
  'src/runners-ci.js',
  'src/hooks-events.js',
  'src/web-ui.js',
  'src/operations.js',
  'tests/krate.test.js'
];

async function readRequired(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    throw new Error(`${file} missing or unreadable: ${error.message}`);
  }
}

const docsText = (await Promise.all(requiredDocs.map(readRequired))).join('\n');
const ontologyByFile = Object.fromEntries(await Promise.all(requiredOntology.map(async (file) => [file, await readRequired(file)])));
const ontologyText = Object.values(ontologyByFile).join('\n');
const sourceByFile = Object.fromEntries(await Promise.all(implementationFiles.map(async (file) => [file, await readRequired(file)])));
const allRequirementsText = `${docsText}\n${ontologyText}`;

const requiredTerms = [
  'Repository', 'PullRequest', 'Issue', 'Review', 'Pipeline', 'Job', 'RunnerPool',
  'WebhookSubscription', 'WebhookDelivery', 'RefPolicy', 'BranchProtection', 'View', 'Selector',
  'RBAC', 'OIDC', 'Postgres', 'etcd', 'receive-pack', 'GitOps', 'backup', 'restore',
  'APIService', 'fork', 'admission', 'webhook', 'object storage', 'search', 'release gates', 'KubeVela', 'OAM', 'Application', 'Component', 'Trait', 'Workflow Step'
];

const sourceTerms = [
  ['RESOURCE_DEFINITIONS', 'src/resource-model.js'],
  ['resourceSchemaForKind', 'src/resource-model.js'],
  ['watch', 'src/control-plane.js'],
  ['auditLog', 'src/control-plane.js'],
  ['recordObject', 'src/data-plane.js'],
  ['enqueueSearchIndex', 'src/data-plane.js'],
  ['serviceAccountForJob', 'src/identity-policy.js'],
  ['rerunFromStep', 'src/runners-ci.js'],
  ['inspect', 'src/hooks-events.js'],
  ['createWebhookInspector', 'src/web-ui.js'],
  ['observabilityModel', 'src/operations.js'],
  ['releaseGates', 'src/operations.js']
];

const workflowText = await readRequired('.github/workflows/publish.yml');
const releaseSurfaceTerms = [
  ['Dockerfile', docsText],
  ['controller image', docsText],
  ['GitHub publishing', docsText],
  ['GHCR', docsText],
  ['Helm chart', docsText],
  ['Live-cluster conformance', docsText],
  ['docker/build-push-action', workflowText],
  ['helm push', workflowText],
  ['npm pack', workflowText]
];

const staleReleaseBoundaryPhrases = [
  'does not claim to ship production controller images yet',
  'does not yet ship production controller images',
  'Real controller images, registry publication, and live-cluster conformance remain follow-up release work',
  'Production controller images, registry publication, and live-cluster conformance still remain tracked follow-ups'
];

const ontologyExpectations = [
  ['docs/ontology/resource-taxonomy.md', ['CRD-backed', 'Aggregated', 'Repository', 'WebhookDelivery']],
  ['docs/ontology/resource-contracts.md', ['metadata.name', 'resourceVersion', 'RunnerPool', 'WebhookDelivery']],
  ['docs/ontology/policies-and-invariants.md', ['RBAC', 'Admission', 'Fork PR', 'BranchProtection']],
  ['docs/ontology/storage-and-data-boundaries.md', ['etcd', 'Postgres', 'Gitea', 'Object storage', 'Search']],
  ['docs/ontology/validation-matrix.md',
  'docs/ontology/oam-kubevela.md', ['npm run check', 'docs and ontology coverage']]
];

const missing = [];
for (const term of requiredTerms) {
  if (!allRequirementsText.includes(term)) missing.push(`requirements/ontology missing term: ${term}`);
}
for (const [term, file] of sourceTerms) {
  if (!sourceByFile[file]?.includes(term)) missing.push(`${file} missing implementation term: ${term}`);
}
for (const [term, text] of releaseSurfaceTerms) {
  if (!text.includes(term)) missing.push(`release surface missing term: ${term}`);
}
for (const phrase of staleReleaseBoundaryPhrases) {
  if (allRequirementsText.includes(phrase)) missing.push(`stale release boundary phrase still present: ${phrase}`);
}
for (const [file, terms] of ontologyExpectations) {
  for (const term of terms) {
    if (!ontologyByFile[file]?.includes(term)) missing.push(`${file} missing ontology term: ${term}`);
  }
}

if (missing.length) {
  console.error(JSON.stringify({ status: 'failed', missing }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'success',
  checkedDocs: requiredDocs.length,
  checkedOntologyFiles: requiredOntology.length,
  checkedImplementationFiles: implementationFiles.length,
  requiredTerms: requiredTerms.length,
  sourceTerms: sourceTerms.length,
  releaseSurfaceTerms: releaseSurfaceTerms.length
}, null, 2));
