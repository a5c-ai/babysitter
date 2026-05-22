import { execFileSync } from 'node:child_process';
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

const failures = [];
const details = {};

const VALID_MODES = new Set(['current-source', 'committed-baseline', 'audit']);
const options = parseOptions(process.argv.slice(2));
const sourceMode = options.mode === 'committed-baseline' ? 'committed' : 'current';
const auditWarnings = [];
const dirtySourcePathCache = new Map();

const SOURCE_AREAS = {
  crds: ['packages/krate/charts/crds'],
  krateWebApi: ['packages/krate/web/app/api'],
};

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
  krateKnowledgeFabricMemorySystems: 1,
  krateKnowledgeSources: 5,
  krateKnowledgeDomains: 3,
  krateRetrievalPipelines: 3,
  krateKnowledgeFabricUsesMemoryEdges: 1,
  krateKnowledgeFeedsEdges: 5,
  krateKnowledgeProvidesEdges: 4,
  krateKnowledgeRetrievesEdges: 6,
  krateMemorySystemIntegratesEdges: 3,
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
  'packages/atlas/graph/agent-stack/knowledge-fabric-impls/krate-kf-current.yaml',
  'packages/atlas/graph/domain/knowledge-fabric/krate-company-brain-topology.yaml',
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

function fail(message, detail) {
  failures.push(detail ? `${message}: ${detail}` : message);
}

function parseOptions(args) {
  const parsed = { mode: 'current-source' };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/validate-krate-graph.mjs [--mode=current-source|committed-baseline|audit]');
      process.exit(0);
    }
    if (arg === '--audit') {
      parsed.mode = 'audit';
      continue;
    }
    if (arg === '--committed-baseline') {
      parsed.mode = 'committed-baseline';
      continue;
    }
    if (arg === '--current-source') {
      parsed.mode = 'current-source';
      continue;
    }
    if (arg === '--mode') {
      parsed.mode = args[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith('--mode=')) {
      parsed.mode = arg.slice('--mode='.length);
      continue;
    }
    fail('unknown argument', arg);
  }

  if (!VALID_MODES.has(parsed.mode)) {
    fail('invalid mode', `expected one of ${[...VALID_MODES].join(', ')} actual=${parsed.mode}`);
    parsed.mode = 'current-source';
  }

  return parsed;
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function toRepoRelative(file) {
  return path.relative(repoRoot, file).replace(/\\/g, '/');
}

function getDirtySourcePaths(area) {
  if (dirtySourcePathCache.has(area)) return dirtySourcePathCache.get(area);
  const sourcePaths = SOURCE_AREAS[area] ?? [];
  if (!sourcePaths.length) return [];
  const output = git(['status', '--porcelain', '--', ...sourcePaths]);
  const paths = output
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => line.slice(3).replace(/^[^ ]+ -> /, ''));
  dirtySourcePathCache.set(area, paths);
  return paths;
}

function sourceFail(message, detail, area) {
  const dirtySourcePaths = getDirtySourcePaths(area);
  if (options.mode === 'audit') {
    auditWarnings.push({
      message,
      detail,
      sourceArea: area,
      dirtySourcePaths: dirtySourcePaths.slice(0, 20),
    });
    return;
  }
  fail(message, detail);
}

function assertSourceEqual(name, actual, expected, area) {
  details[name] = actual;
  if (actual !== expected) {
    sourceFail(`${name} mismatch`, `expected=${expected} actual=${actual}`, area);
  }
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

function loadYamlDocumentsFromText(text) {
  return YAML.parseAllDocuments(text).map((document) => document.toJSON()).filter(Boolean);
}

function loadYamlDocuments(file) {
  return loadYamlDocumentsFromText(fs.readFileSync(file, 'utf8'));
}

function getSourceFiles(rootDir, predicate) {
  if (sourceMode === 'committed') {
    const relativeRoot = toRepoRelative(rootDir);
    return git(['ls-tree', '-r', '--name-only', 'HEAD', '--', relativeRoot])
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((relative) => predicate(relative))
      .sort()
      .map((relative) => ({
        name: path.basename(relative),
        relative,
        read: () => git(['show', `HEAD:${relative}`]),
      }));
  }

  const files = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(absolute);
        continue;
      }
      const relative = toRepoRelative(absolute);
      if (!predicate(relative)) continue;
      files.push({
        name: entry.name,
        relative,
        read: () => fs.readFileSync(absolute, 'utf8'),
      });
    }
  }
  visit(rootDir);
  return files.sort((a, b) => a.relative.localeCompare(b.relative));
}

function getSourceCrdKinds() {
  const kinds = [];
  for (const file of getSourceFiles(crdDir, (relative) => relative.endsWith('.yaml'))) {
    const docs = loadYamlDocumentsFromText(file.read());
    for (const doc of docs) {
      if (doc?.kind !== 'CustomResourceDefinition') continue;
      kinds.push({
        file: file.name,
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
  for (const file of getSourceFiles(krateWebApiDir, (relative) => relative.endsWith('/route.js'))) {
    const routeDir = path.dirname(file.relative).split('/app/api/')[1];
    const route = ('/api/' + routeDir)
      .replace(/\[\[\.\.\.([^\]]+)\]\]/g, ':$1*?')
      .replace(/\[\.\.\.([^\]]+)\]/g, ':$1*')
      .replace(/\[([^\]]+)\]/g, ':$1');
    for (const match of file.read().matchAll(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\b/g)) {
      endpoints.push({ file: file.relative, method: match[1], path: route });
    }
  }
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
assertSourceEqual('sourceCrdDocuments', sourceCrds.length, EXPECTED_COUNTS.crdRecords, 'crds');

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
if (missingSourceKinds.length) sourceFail('missing CRD records for source CRDs', missingSourceKinds.join(', '), 'crds');

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
assertSourceEqual('sourceKrateWebApiEndpoints', sourceKrateWebApiEndpoints.length, EXPECTED_COUNTS.krateWebApiEndpoints, 'krateWebApi');
const krateWebApiEndpointRecords = Object.entries(records)
  .filter(([id, record]) => id.startsWith('api-endpoint:krate-web-') && record._kind === 'APIEndpoint')
  .map(([id, record]) => ({ id, ...record }));
assertEqual('krateWebApiEndpoints', krateWebApiEndpointRecords.length, EXPECTED_COUNTS.krateWebApiEndpoints);
const endpointKeys = new Set(krateWebApiEndpointRecords.map((record) => record.method + ' ' + record.path));
const missingKrateWebApiEndpoints = sourceKrateWebApiEndpoints
  .filter((endpoint) => !endpointKeys.has(endpoint.method + ' ' + endpoint.path));
if (missingKrateWebApiEndpoints.length) {
  sourceFail('missing Krate web APIEndpoint records for source routes', JSON.stringify(missingKrateWebApiEndpoints.slice(0, 10)), 'krateWebApi');
}
const krateWebEndpointEdges = edges.filter((edge) => edge.kind === 'exposed_by'
  && String(edge.from).startsWith('api-endpoint:krate-web-')
  && edge.to === 'package:a5c-ai-krate-web');
assertEqual('krateWebApiEndpointExposedByEdges', krateWebEndpointEdges.length, EXPECTED_COUNTS.krateWebApiEndpoints);
for (const record of krateWebApiEndpointRecords) {
  if (!record.description?.includes('Source: packages/krate/web/app/api/')) fail('missing source route citation on Krate web endpoint', record.id);
}

assertEqual('krateKnowledgeFabricMemorySystems', Object.keys(records).filter((id) => id === 'memory-system:krate-company-brain').length, EXPECTED_COUNTS.krateKnowledgeFabricMemorySystems);
assertEqual('krateKnowledgeSources', Object.keys(records).filter((id) => id.startsWith('knowledge-source:krate-')).length, EXPECTED_COUNTS.krateKnowledgeSources);
assertEqual('krateKnowledgeDomains', Object.keys(records).filter((id) => id.startsWith('knowledge-domain:krate-')).length, EXPECTED_COUNTS.krateKnowledgeDomains);
assertEqual('krateRetrievalPipelines', Object.keys(records).filter((id) => id.startsWith('retrieval-pipeline:krate-')).length, EXPECTED_COUNTS.krateRetrievalPipelines);
assertEqual('krateKnowledgeFabricUsesMemoryEdges', edgeCount(index, (edge) => edge.kind === 'uses_memory_system' && edge.from === 'knowledge-fabric-impl:krate.knowledge@current' && edge.to === 'memory-system:krate-company-brain'), EXPECTED_COUNTS.krateKnowledgeFabricUsesMemoryEdges);
assertEqual('krateKnowledgeFeedsEdges', edgeCount(index, (edge) => edge.kind === 'feeds_knowledge' && String(edge.from).startsWith('knowledge-source:krate-')), EXPECTED_COUNTS.krateKnowledgeFeedsEdges);
assertEqual('krateKnowledgeProvidesEdges', edgeCount(index, (edge) => edge.kind === 'provides_knowledge_to' && String(edge.from).startsWith('knowledge-domain:krate-')), EXPECTED_COUNTS.krateKnowledgeProvidesEdges);
assertEqual('krateKnowledgeRetrievesEdges', edgeCount(index, (edge) => edge.kind === 'retrieves_from' && String(edge.from).startsWith('retrieval-pipeline:krate-')), EXPECTED_COUNTS.krateKnowledgeRetrievesEdges);
assertEqual('krateMemorySystemIntegratesEdges', edgeCount(index, (edge) => edge.kind === 'memory_system_integrates' && edge.from === 'memory-system:krate-company-brain'), EXPECTED_COUNTS.krateMemorySystemIntegratesEdges);

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
  console.error(JSON.stringify({ mode: options.mode, sourceMode, failures, auditWarnings, details }, null, 2));
  process.exit(1);
}

console.log('[atlas:validate:krate-graph] passed');
console.log(JSON.stringify({
  mode: options.mode,
  sourceMode,
  auditWarnings,
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
  krateKnowledgeFabricMemorySystems: details.krateKnowledgeFabricMemorySystems,
  krateKnowledgeSources: details.krateKnowledgeSources,
  krateKnowledgeDomains: details.krateKnowledgeDomains,
  krateRetrievalPipelines: details.krateRetrievalPipelines,
  krateKnowledgeFabricUsesMemoryEdges: details.krateKnowledgeFabricUsesMemoryEdges,
  krateKnowledgeFeedsEdges: details.krateKnowledgeFeedsEdges,
  krateKnowledgeProvidesEdges: details.krateKnowledgeProvidesEdges,
  krateKnowledgeRetrievesEdges: details.krateKnowledgeRetrievesEdges,
  krateMemorySystemIntegratesEdges: details.krateMemorySystemIntegratesEdges,
  danglingKrateTypedEdges: details.danglingKrateTypedEdges,
  scopedDuplicateIds: details.scopedDuplicateIds,
}, null, 2));
