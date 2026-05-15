import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const indexPath = path.join(packageRoot, 'src', 'index.json');
const crdDir = path.join(repoRoot, 'packages', 'krate', 'charts', 'crds');
const krateWebApiDir = path.join(repoRoot, 'packages', 'krate', 'web', 'app', 'api');

const EXPECTED_FAMILY_COUNTS = {
  agent: 22,
  aggregated: 28,
  'external-backend': 10,
  policy: 4,
  'repository-identity': 11,
};

const EXPECTED_COUNTS = {
  crdRecords: 75,
  controllers: 3,
  presentationSurfaces: 225,
  apiServes: 75,
  controllerReconciles: 89,
  governanceEdges: 13,
  externalMappings: 46,
  krateWebApiEndpoints: 46,
  scopedDuplicateIds: 0,
  danglingKrateTypedEdges: 0,
};

const EXPECTED_CONTROLLERS = new Set([
  'kubernetes-controller:krate-core-controller',
  'kubernetes-controller:krate-external-sync-controller',
  'kubernetes-controller:krate-policy-admission',
]);

const SCOPED_GRAPH_FILES = [
  'packages/atlas/graph/domain/products/krate.yaml',
  'packages/atlas/graph/domain/products/krate-components.yaml',
  'packages/atlas/graph/domain/products/krate-connectivity.yaml',
  'packages/atlas/graph/domain/products/krate-inventory-gap-map.yaml',
  'packages/atlas/graph/domain/products/krate-crd-kinds.yaml',
  'packages/atlas/graph/domain/products/krate-controllers.yaml',
  'packages/atlas/graph/agent-stack/platform-impls/krate-platform-current.yaml',
  'packages/atlas/graph/agent-stack/interaction-primitives/krate-orchestration.yaml',
  'packages/atlas/graph/extensions/api-endpoints/krate-web-api-endpoints.yaml',
];

const KRATE_TYPED_EDGE_KINDS = new Set([
  'defined_by_crd_source',
  'belongs_to_resource_family',
  'maps_to_external_resource',
  'watches_resource',
  'reconciles_resource',
  'emits_resource_status',
  'serves_kubernetes_resource',
  'governs_resource',
  'surfaces_resource',
  'supports_orchestration_primitive',
]);

const failures = [];
const details = {};

function fail(message, detail) {
  failures.push(detail ? `${message}: ${detail}` : message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function arrayFromObjectMap(value, name) {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    fail(`${name} must be an object map`, `actual=${Array.isArray(value) ? 'array' : typeof value}`);
    return [];
  }
  return Object.entries(value).map(([id, record]) => ({ id, ...record }));
}

function edgeCount(index, predicate) {
  return index.edges.filter(predicate).length;
}

function assertEqual(name, actual, expected) {
  details[name] = actual;
  if (actual !== expected) {
    fail(`${name} mismatch`, `expected=${expected} actual=${actual}`);
  }
}

function assertFamilyCounts(actual) {
  details.familyCounts = actual;
  for (const [family, expected] of Object.entries(EXPECTED_FAMILY_COUNTS)) {
    if (actual[family] !== expected) {
      fail(`family count mismatch for ${family}`, `expected=${expected} actual=${actual[family] ?? 0}`);
    }
  }
  for (const family of Object.keys(actual)) {
    if (!(family in EXPECTED_FAMILY_COUNTS)) {
      fail(`unexpected Krate CRD family`, family);
    }
  }
}

function loadYamlDocuments(file) {
  return YAML.parseAllDocuments(fs.readFileSync(file, 'utf8')).map((document) => document.toJSON()).filter(Boolean);
}

function getSourceCrdKinds() {
  const kinds = [];
  for (const file of fs.readdirSync(crdDir).filter((name) => name.endsWith('.yaml')).sort()) {
    const docs = loadYamlDocuments(path.join(crdDir, file));
    for (const doc of docs) {
      if (doc?.kind !== 'CustomResourceDefinition') continue;
      kinds.push({
        file,
        kind: doc.spec?.names?.kind,
        group: doc.spec?.group,
        plural: doc.spec?.names?.plural,
        scope: doc.spec?.scope,
        storageVersion: doc.spec?.versions?.find((version) => version.storage)?.name ?? doc.spec?.versions?.[0]?.name,
      });
    }
  }
  return kinds;
}

function getSourceKrateWebApiEndpoints() {
  const endpoints = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(absolute);
        continue;
      }
      if (entry.name !== 'route.js') continue;
      const relative = path.relative(repoRoot, absolute).replace(/\\/g, '/');
      const source = fs.readFileSync(absolute, 'utf8');
      const routeDir = path.dirname(relative).replace(/\\/g, '/').split('/app/api/')[1];
      const route = ('/api/' + routeDir)
        .replace(/\[\[\.\.\.([^\]]+)\]\]/g, ':$1*?')
        .replace(/\[\.\.\.([^\]]+)\]/g, ':$1*')
        .replace(/\[([^\]]+)\]/g, ':$1');
      for (const match of source.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\b/g)) {
        endpoints.push({ file: relative, method: match[1], path: route });
      }
    }
  }
  visit(krateWebApiDir);
  return endpoints.sort((a, b) => (a.method + ' ' + a.path).localeCompare(b.method + ' ' + b.path));
}
function kebab(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

const index = readJson(indexPath);
const records = index.records ?? {};
const edges = Array.isArray(index.edges) ? index.edges : [];
if (!Array.isArray(index.edges)) fail('index.edges must be an array');
arrayFromObjectMap(records, 'index.records');
arrayFromObjectMap(index.nodeKinds, 'index.nodeKinds');
arrayFromObjectMap(index.edgeKinds, 'index.edgeKinds');

const sourceCrds = getSourceCrdKinds();
assertEqual('sourceCrdDocuments', sourceCrds.length, EXPECTED_COUNTS.crdRecords);

const crdIds = Object.keys(records).filter((id) => id.startsWith('kubernetes-crd-kind:krate-')).sort();
assertEqual('crdRecords', crdIds.length, EXPECTED_COUNTS.crdRecords);

const missingSourceKinds = [];
for (const source of sourceCrds) {
  const id = `kubernetes-crd-kind:krate-${kebab(source.kind)}`;
  const record = records[id];
  if (!record) {
    missingSourceKinds.push(id);
    continue;
  }
  if (record.apiGroup !== source.group) fail(`apiGroup mismatch for ${id}`, `expected=${source.group} actual=${record.apiGroup}`);
  if (record.kind !== source.kind) fail(`kind mismatch for ${id}`, `expected=${source.kind} actual=${record.kind}`);
  if (record.plural !== source.plural) fail(`plural mismatch for ${id}`, `expected=${source.plural} actual=${record.plural}`);
  if (record.scope !== source.scope) fail(`scope mismatch for ${id}`, `expected=${source.scope} actual=${record.scope}`);
  if (record.storageVersion !== source.storageVersion) fail(`storageVersion mismatch for ${id}`, `expected=${source.storageVersion} actual=${record.storageVersion}`);
}
if (missingSourceKinds.length) fail('missing CRD records for source CRDs', missingSourceKinds.join(', '));

details.missingSourceKinds = missingSourceKinds.length;

const familyCounts = {};
for (const id of crdIds) {
  const record = records[id];
  familyCounts[record.family] = (familyCounts[record.family] ?? 0) + 1;
  for (const required of ['apiGroup', 'version', 'storageVersion', 'kind', 'plural', 'scope', 'sourceFile', 'schemaPath', 'family']) {
    if (!record[required]) fail(`missing ${required} on ${id}`);
  }
  if (typeof record.hasStatus !== 'boolean') fail(`hasStatus must be boolean on ${id}`);
  if (typeof record.hasConditions !== 'boolean') fail(`hasConditions must be boolean on ${id}`);
}
assertFamilyCounts(familyCounts);

const controllerIds = Object.keys(records).filter((id) => id.startsWith('kubernetes-controller:krate-')).sort();
assertEqual('controllers', controllerIds.length, EXPECTED_COUNTS.controllers);
for (const id of EXPECTED_CONTROLLERS) {
  if (!records[id]) fail('missing expected controller', id);
}

assertEqual(
  'presentationSurfaces',
  edgeCount(index, (edge) => edge.kind === 'surfaces_resource' && String(edge.from).startsWith('presentation:krate')),
  EXPECTED_COUNTS.presentationSurfaces,
);
assertEqual(
  'apiServes',
  edgeCount(index, (edge) => edge.kind === 'serves_kubernetes_resource' && edge.from === 'tool-server:krate-api'),
  EXPECTED_COUNTS.apiServes,
);
assertEqual(
  'controllerReconciles',
  edgeCount(index, (edge) => edge.kind === 'reconciles_resource' && String(edge.from).startsWith('kubernetes-controller:krate')),
  EXPECTED_COUNTS.controllerReconciles,
);
assertEqual(
  'governanceEdges',
  edgeCount(index, (edge) => edge.kind === 'governs_resource' && (String(edge.from).includes('krate') || String(edge.to).includes('krate'))),
  EXPECTED_COUNTS.governanceEdges,
);
assertEqual(
  'externalMappings',
  edgeCount(index, (edge) => edge.kind === 'maps_to_external_resource' && String(edge.from).startsWith('kubernetes-crd-kind:krate')),
  EXPECTED_COUNTS.externalMappings,
);

const sourceKrateWebApiEndpoints = getSourceKrateWebApiEndpoints();
assertEqual('sourceKrateWebApiEndpoints', sourceKrateWebApiEndpoints.length, EXPECTED_COUNTS.krateWebApiEndpoints);
const krateWebApiEndpointRecords = Object.entries(records)
  .filter(([id, record]) => id.startsWith('api-endpoint:krate-web-') && record._kind === 'APIEndpoint')
  .map(([id, record]) => ({ id, ...record }));
assertEqual('krateWebApiEndpoints', krateWebApiEndpointRecords.length, EXPECTED_COUNTS.krateWebApiEndpoints);
const endpointKeys = new Set(krateWebApiEndpointRecords.map((record) => record.method + ' ' + record.path));
const missingKrateWebApiEndpoints = sourceKrateWebApiEndpoints
  .filter((endpoint) => !endpointKeys.has(endpoint.method + ' ' + endpoint.path));
if (missingKrateWebApiEndpoints.length) {
  fail('missing Krate web APIEndpoint records for source routes', JSON.stringify(missingKrateWebApiEndpoints.slice(0, 10)));
}
const krateWebEndpointEdges = edges.filter((edge) => edge.kind === 'exposed_by'
  && String(edge.from).startsWith('api-endpoint:krate-web-')
  && edge.to === 'package:a5c-ai-krate-web');
assertEqual('krateWebApiEndpointExposedByEdges', krateWebEndpointEdges.length, EXPECTED_COUNTS.krateWebApiEndpoints);
for (const record of krateWebApiEndpointRecords) {
  if (!record.description?.includes('Source: packages/krate/web/app/api/')) fail('missing source route citation on Krate web endpoint', record.id);
}

const danglingKrateTypedEdges = edges.filter((edge) => {
  return KRATE_TYPED_EDGE_KINDS.has(edge.kind)
    && (String(edge.from).includes('krate') || String(edge.to).includes('krate'))
    && (!records[edge.from] || !records[edge.to]);
});
assertEqual('danglingKrateTypedEdges', danglingKrateTypedEdges.length, EXPECTED_COUNTS.danglingKrateTypedEdges);
if (danglingKrateTypedEdges.length) details.danglingKrateTypedEdges = danglingKrateTypedEdges.slice(0, 10);

const scopedSeen = new Map();
for (const relativeFile of SCOPED_GRAPH_FILES) {
  const absoluteFile = path.join(repoRoot, relativeFile);
  const docs = loadYamlDocuments(absoluteFile);
  for (const doc of docs) {
    if (!doc?.id) continue;
    const locations = scopedSeen.get(doc.id) ?? [];
    locations.push(relativeFile);
    scopedSeen.set(doc.id, locations);
  }
}
const scopedDuplicates = [...scopedSeen.entries()].filter(([, locations]) => locations.length > 1);
assertEqual('scopedDuplicateIds', scopedDuplicates.length, EXPECTED_COUNTS.scopedDuplicateIds);
if (scopedDuplicates.length) details.scopedDuplicateSamples = scopedDuplicates.slice(0, 10);

if (failures.length) {
  console.error('[atlas:validate:krate-graph] failed');
  console.error(JSON.stringify({ failures, details }, null, 2));
  process.exit(1);
}

console.log('[atlas:validate:krate-graph] passed');
console.log(JSON.stringify({
  crdRecords: crdIds.length,
  familyCounts,
  controllers: controllerIds.length,
  presentationSurfaces: details.presentationSurfaces,
  apiServes: details.apiServes,
  controllerReconciles: details.controllerReconciles,
  governanceEdges: details.governanceEdges,
  externalMappings: details.externalMappings,
  krateWebApiEndpoints: details.krateWebApiEndpoints,
  sourceKrateWebApiEndpoints: details.sourceKrateWebApiEndpoints,
  krateWebApiEndpointExposedByEdges: details.krateWebApiEndpointExposedByEdges,
  danglingKrateTypedEdges: details.danglingKrateTypedEdges,
  scopedDuplicateIds: details.scopedDuplicateIds,
}, null, 2));
