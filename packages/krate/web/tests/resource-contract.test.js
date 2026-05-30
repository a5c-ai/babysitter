import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coreRoot = path.resolve(webRoot, '..', 'core');

function readFile(...parts) {
  return fs.readFileSync(path.join(webRoot, ...parts), 'utf8');
}

function readCoreFile(...parts) {
  return fs.readFileSync(path.join(coreRoot, ...parts), 'utf8');
}

// Dynamically import the resource model to get RESOURCE_DEFINITIONS
import { pathToFileURL } from 'node:url';
const resourceModelUrl = pathToFileURL(path.join(coreRoot, 'src', 'resource-model.js')).href;
const { RESOURCE_DEFINITIONS, validateResource, ALL_KINDS } = await import(resourceModelUrl);

// ── Contract: every known kind has a definition with requiredSpec ──────────

test('every CONFIG_KIND and AGGREGATED_KIND has a RESOURCE_DEFINITIONS entry', () => {
  for (const kind of ALL_KINDS) {
    assert.ok(RESOURCE_DEFINITIONS[kind], `Missing RESOURCE_DEFINITIONS entry for ${kind}`);
    assert.ok(Array.isArray(RESOURCE_DEFINITIONS[kind].requiredSpec), `${kind} missing requiredSpec array`);
  }
});

// ── Contract: validateResource catches missing required fields ─────────────

test('validateResource rejects resources missing required spec fields', () => {
  assert.throws(
    () => validateResource({ kind: 'AgentStack', metadata: { name: 'test' }, spec: {}, status: {} }),
    /spec\.organizationRef is required/
  );
  assert.throws(
    () => validateResource({ kind: 'AgentStack', metadata: { name: 'test' }, spec: { organizationRef: 'default' }, status: {} }),
    /spec\.baseAgent is required/
  );
});

test('validateResource accepts resources with all required fields', () => {
  const result = validateResource({
    kind: 'AgentStack',
    metadata: { name: 'test' },
    spec: { organizationRef: 'default', baseAgent: 'claude-code', adapter: 'default', runtimeIdentity: { serviceAccountRef: 'default' } },
    status: {}
  });
  assert.equal(result.kind, 'AgentStack');
});

// ── Contract: frontend stack builder sends all required AgentStack fields ──

test('stack builder graph emits all required AgentStack spec fields', () => {
  // Read all split modules that compose the stack builder graph
  const source = [
    readFile('app', 'components', 'agent', 'stack-builder-graph.jsx'),
    readFile('app', 'components', 'agent', 'stack-builder-graph-styles.jsx'),
    readFile('app', 'components', 'agent', 'stack-builder-graph-nodes.jsx'),
    readFile('app', 'components', 'agent', 'stack-builder-graph-panels.jsx'),
  ].join('\n');
  const requiredFields = RESOURCE_DEFINITIONS.AgentStack.requiredSpec;
  for (const field of requiredFields) {
    if (field === 'organizationRef') continue; // added by API route
    assert.ok(
      source.includes(field),
      `stack-builder-graph modules do not reference required AgentStack field: ${field}`
    );
  }
});

// ── Contract: InlineCreateForm adds organizationRef ───────────────────────

test('InlineCreateForm always adds organizationRef to spec', () => {
  const source = readFile('app', 'components', 'resource-crud-actions.jsx');
  assert.match(source, /organizationRef:\s*org/);
});

// ── Contract: resources POST route validates before apply ─────────────────

test('resources POST route calls validateResource before applyResource', () => {
  const route = readFile('app', 'api', 'orgs', '[org]', 'resources', 'route.js');
  assert.match(route, /validateResource/);
  assert.match(route, /Validation failed/);
  const validatePos = route.indexOf('validateResource');
  const applyPos = route.indexOf('applyResource');
  assert.ok(validatePos < applyPos, 'validateResource must be called before applyResource');
});

// ── Contract: trigger rule form sends all required fields ─────────────────

test('trigger rule form emits all required AgentTriggerRule spec fields', () => {
  const source = readFile('app', 'components', 'agent', 'trigger-rule-form.jsx');
  const requiredFields = RESOURCE_DEFINITIONS.AgentTriggerRule.requiredSpec;
  for (const field of requiredFields) {
    if (field === 'organizationRef') continue;
    assert.ok(
      source.includes(field),
      `trigger-rule-form.jsx does not reference required AgentTriggerRule field: ${field}`
    );
  }
  assert.match(source, /agentIdentityOptions/, 'trigger rule form should expose AgentDefinition targets as well as stacks');
  assert.match(source, /agentDefinition/, 'trigger rule form must be able to emit spec.agentDefinition');
  assert.match(source, /agentStack/, 'trigger rule form must preserve legacy spec.agentStack fallback');
});

// ── Contract: external provider wizard sends typed provider kinds ─────────

test('external provider wizard references typed provider kinds (GitProvider, CiProvider, etc.)', () => {
  const source = readFile('app', 'components', 'external', 'external-provider-wizard.jsx');
  assert.match(source, /GitProvider/, 'wizard must reference GitProvider');
  assert.match(source, /CiProvider/, 'wizard must reference CiProvider');
  assert.match(source, /IssueTrackerProvider/, 'wizard must reference IssueTrackerProvider');
  assert.match(source, /AppHostingProvider/, 'wizard must reference AppHostingProvider');
  assert.match(source, /ArtifactRegistryProvider/, 'wizard must reference ArtifactRegistryProvider');
  assert.match(source, /platform/, 'wizard must reference platform field');
  assert.match(source, /endpoint/, 'wizard must reference endpoint field');
  assert.match(source, /organizationRef/, 'wizard must include organizationRef in spec');
  assert.doesNotMatch(source, /kind:\s*['"]ExternalBackendProvider['"]/, 'wizard must not use ExternalBackendProvider kind');
});

test('external provider wizard creates multiple resources via Promise.all', () => {
  const source = readFile('app', 'components', 'external', 'external-provider-wizard.jsx');
  assert.match(source, /Promise\.all/, 'wizard must use Promise.all for parallel resource creation');
});

// ── Contract: external sync forwards supported request options ────────────

test('external sync route forwards supported body fields as sync options', () => {
  const route = readFile('app', 'api', 'orgs', '[org]', 'external', 'sync', 'route.js');
  assert.match(
    route,
    /syncExternalBinding\(\s*body\.bindingName\s*,/,
    'syncExternalBinding must keep bindingName as the first positional argument and pass an options object'
  );
  for (const field of ['kind', 'localName', 'namespace', 'spec', 'externalEnvelope', 'watermark']) {
    assert.match(route, new RegExp(`${field}\\s*:\\s*body\\.${field}`), `external sync route must forward body.${field}`);
  }
});

// ── Contract: inference infer route uses an existing org-scoped list API ──

test('inference infer route lists virtual models with the org-scoped controller API', () => {
  const route = readFile('app', 'api', 'orgs', '[org]', 'inference', 'services', '[name]', 'infer', 'route.js');
  assert.doesNotMatch(route, /controller\.listResources\(/, 'createKrateApiController does not expose listResources');
  assert.match(
    route,
    /controller\.listResourceForOrg\(\s*org\s*,\s*['"]KrateVirtualModel['"]\s*\)/,
    'inference infer must load KrateVirtualModel resources through listResourceForOrg(org, kind)'
  );
});

// ── Contract: curated deploy route creation failures are visible ──────────

test('curated model deploy surfaces route auto-create failures to the user', () => {
  const source = readFile('app', 'components', 'inference', 'curated-model-catalog.jsx');
  assert.match(source, /routeRes/, 'route auto-create response must be captured');
  assert.match(source, /routeWarning/, 'route auto-create failure must produce a user-visible warning');
  assert.match(source, /setDeployResult\(\{\s*success:\s*true[\s\S]*routeWarning/s);
  assert.doesNotMatch(
    source,
    /fetch\(`\/api\/orgs\/\$\{org\}\/inference\/routes`[\s\S]{0,500}\.catch\(\(err\)\s*=>\s*console\.warn/,
    'route auto-create failure must not be handled only by console.warn'
  );
});

// ── Contract: memory ontology editor sends required fields ────────────────

test('memory ontology editor emits required AgentMemoryOntology fields', () => {
  const source = readFile('app', 'components', 'workspace', 'memory-ontology-editor.jsx');
  assert.match(source, /memoryRepository/);
  assert.match(source, /ontologyPath/);
  assert.match(source, /AgentMemoryOntology/);
});

// ── Contract: InlineCreateForm does not hardcode Active phase ─────────────

test('InlineCreateForm does not hardcode status.phase to Active', () => {
  const source = readFile('app', 'components', 'resource-crud-actions.jsx');
  assert.doesNotMatch(source, /phase:\s*['"]Active['"]/);
});

// ── Contract: ExternalWebhookConfig is a known resource kind ──────────────

test('ExternalWebhookConfig is in RESOURCE_DEFINITIONS', () => {
  assert.ok(RESOURCE_DEFINITIONS.ExternalWebhookConfig, 'ExternalWebhookConfig must be in RESOURCE_DEFINITIONS');
  assert.ok(Array.isArray(RESOURCE_DEFINITIONS.ExternalWebhookConfig.requiredSpec));
});

// ── Contract: adapter form sends required fields ──────────────────────────

test('adapter settings form emits required AgentAdapter fields', () => {
  const source = readFile('app', 'components', 'settings', 'settings-adapters.jsx');
  const requiredFields = RESOURCE_DEFINITIONS.AgentAdapter.requiredSpec;
  for (const field of requiredFields) {
    if (field === 'organizationRef') continue;
    assert.ok(
      source.includes(field),
      `settings-adapters.jsx does not reference required AgentAdapter field: ${field}`
    );
  }
});

// ── Contract: provider config form sends required fields ──────────────────

test('provider settings form emits required AgentProviderConfig fields', () => {
  const source = readFile('app', 'components', 'settings', 'settings-providers.jsx');
  const requiredFields = RESOURCE_DEFINITIONS.AgentProviderConfig.requiredSpec;
  for (const field of requiredFields) {
    if (field === 'organizationRef') continue;
    assert.ok(
      source.includes(field),
      `settings-providers.jsx does not reference required AgentProviderConfig field: ${field}`
    );
  }
});

// ── Contract: gateway form sends required fields ──────────────────────────

test('gateway settings form emits required AgentGatewayConfig fields', () => {
  const source = readFile('app', 'components', 'settings', 'settings-gateway.jsx');
  const requiredFields = RESOURCE_DEFINITIONS.AgentGatewayConfig.requiredSpec;
  for (const field of requiredFields) {
    if (field === 'organizationRef') continue;
    assert.ok(
      source.includes(field),
      `settings-gateway.jsx does not reference required AgentGatewayConfig field: ${field}`
    );
  }
});

// ── Contract: RBAC form sends required AgentServiceAccount fields ─────────

test('RBAC settings form emits required AgentServiceAccount fields', () => {
  const source = readFile('app', 'components', 'settings', 'settings-rbac.jsx');
  const requiredFields = RESOURCE_DEFINITIONS.AgentServiceAccount.requiredSpec;
  for (const field of requiredFields) {
    if (field === 'organizationRef') continue;
    assert.ok(
      source.includes(field),
      `settings-rbac.jsx does not reference required AgentServiceAccount field: ${field}`
    );
  }
});

// ── Contract: project create form sends required KrateProject fields ──────

test('agent pages reference required KrateProject fields', () => {
  const source = readFile('app', 'pages', 'agent-project-pages.jsx');
  assert.match(source, /KrateProject/);
  assert.match(source, /displayName/);
});

// ── Contract: pull request form sends required fields ─────────────────────

test('pull request list form emits required PullRequest fields', () => {
  const source = readFile('app', 'components', 'repo', 'pull-request-list.jsx');
  const requiredFields = RESOURCE_DEFINITIONS.PullRequest.requiredSpec;
  for (const field of requiredFields) {
    if (field === 'organizationRef') continue;
    assert.ok(
      source.includes(field),
      `pull-request-list.jsx does not reference required PullRequest field: ${field}`
    );
  }
});

// ── Contract: issue create form sends required fields ─────────────────────

test('issue editor form emits required Issue fields', () => {
  const source = readFile('app', 'components', 'repo', 'issue-editor.jsx');
  const requiredFields = RESOURCE_DEFINITIONS.Issue.requiredSpec;
  for (const field of requiredFields) {
    if (field === 'organizationRef') continue;
    assert.ok(
      source.includes(field),
      `issue-editor.jsx does not reference required Issue field: ${field}`
    );
  }
});

// ── Contract: webhook form sends required fields ──────────────────────────

test('webhook manager references ExternalWebhookConfig kind', () => {
  const source = readFile('app', 'components', 'webhook-manager.jsx');
  assert.match(source, /ExternalWebhookConfig/);
});

// ── Contract: inference service form sends required fields ─────────────────

test('inference service manager emits required KrateInferenceService fields', () => {
  const source = readFile('app', 'components', 'inference', 'inference-service-manager.jsx')
    + readFile('app', 'components', 'inference', 'inference-service-list.jsx');
  const requiredFields = RESOURCE_DEFINITIONS.KrateInferenceService.requiredSpec;
  for (const field of requiredFields) {
    if (field === 'organizationRef') continue;
    assert.ok(
      source.includes(field),
      `inference-service-manager.jsx does not reference required KrateInferenceService field: ${field}`
    );
  }
});

// ── Contract: model route creation form sends required fields ────────────

test('model route form emits required KrateModelRoute spec fields', () => {
  const source = readFile('app', 'components', 'inference', 'inference-service-manager.jsx')
    + readFile('app', 'components', 'inference', 'model-route-manager.jsx');
  const requiredFields = RESOURCE_DEFINITIONS.KrateModelRoute.requiredSpec;
  for (const field of requiredFields) {
    if (field === 'organizationRef') continue;
    assert.ok(
      source.includes(field),
      `inference-service-manager.jsx does not reference required KrateModelRoute field: ${field}`
    );
  }
});

// ── Contract: model route API route emits required fields ────────────────

test('model routes API route creates KrateModelRoute with required fields', () => {
  const route = readFile('app', 'api', 'orgs', '[org]', 'inference', 'routes', 'route.js');
  assert.match(route, /KrateModelRoute/);
  assert.match(route, /modelName/);
  assert.match(route, /routeType/);
  assert.match(route, /organizationRef/);
  assert.match(route, /clearSnapshotCache/);
  assert.match(route, /invalidateApiCache/);
});

// ── Contract: virtual model form references required KrateVirtualModel fields ──

test('virtual model form references required KrateVirtualModel fields', () => {
  const source = readFile('app', 'components', 'inference', 'inference-service-manager.jsx')
    + readFile('app', 'components', 'inference', 'virtual-model-manager.jsx');
  const requiredFields = RESOURCE_DEFINITIONS.KrateVirtualModel.requiredSpec;
  for (const field of requiredFields) {
    if (field === 'organizationRef') continue; // added by API route
    assert.ok(
      source.includes(field),
      `inference-service-manager.jsx does not reference required KrateVirtualModel field: ${field}`
    );
  }
});

// ── Contract: virtual model API route emits required fields ────────────────

test('virtual model API route creates KrateVirtualModel with required fields', () => {
  const route = readFile('app', 'api', 'orgs', '[org]', 'inference', 'virtual-models', 'route.js');
  assert.match(route, /KrateVirtualModel/);
  assert.match(route, /modelName/);
  assert.match(route, /routes/);
  assert.match(route, /organizationRef/);
  assert.match(route, /clearSnapshotCache/);
  assert.match(route, /invalidateApiCache/);
});

// ── Contract: resources GET route supports limit/offset pagination ───────────

test('resources GET route parses limit and offset from searchParams', () => {
  const route = readFile('app', 'api', 'orgs', '[org]', 'resources', 'route.js');
  assert.match(route, /searchParams\.get\(['"]limit['"]\)/);
  assert.match(route, /searchParams\.get\(['"]offset['"]\)/);
  assert.match(route, /\.slice\(/);
  assert.match(route, /hasMore/);
  assert.match(route, /total/);
});

test('agent identity typed routes persist the documented resource kinds', () => {
  const routeChecks = [
    { path: ['agents', 'personas', 'route.js'], kind: 'AgentPersona' },
    { path: ['agents', 'personas', '[name]', 'route.js'], kind: 'AgentPersona' },
    { path: ['agents', 'souls', '[name]', 'route.js'], kind: 'AgentSoul' },
    { path: ['agents', 'appearances', '[name]', 'route.js'], kind: 'AgentAppearance' },
    { path: ['agents', 'voices', '[name]', 'route.js'], kind: 'AgentVoiceProfile' },
    { path: ['agents', 'definitions', 'route.js'], kind: 'AgentDefinition' },
    { path: ['agents', 'definitions', '[name]', 'route.js'], kind: 'AgentDefinition' },
  ];
  for (const check of routeChecks) {
    const route = readFile('app', 'api', 'orgs', '[org]', ...check.path);
    assert.match(route, new RegExp(check.kind), `${check.path.join('/')} must reference ${check.kind}`);
    assert.match(route, /validateResource/, `${check.path.join('/')} must validate resource writes`);
    assert.match(route, /applyResource/, `${check.path.join('/')} must persist through controller`);
    assert.match(route, /clearSnapshotCache/, `${check.path.join('/')} must clear snapshots after writes`);
    assert.match(route, /invalidateApiCache/, `${check.path.join('/')} must invalidate API cache after writes`);
  }
});

test('agent create wizard posts all identity resources with compensation', () => {
  const wizard = readFile('app', 'components', 'agent', 'agent-create-wizard.jsx');
  for (const kind of ['AgentPersona', 'AgentSoul', 'AgentAppearance', 'AgentVoiceProfile', 'AgentDefinition']) {
    assert.match(wizard, new RegExp(kind), `wizard must create ${kind}`);
  }
  assert.match(wizard, /DELETE/, 'wizard compensation must delete already-created resources on failure');
  assert.match(wizard, /createdResources/, 'wizard must track created resources for rollback');
  assert.match(wizard, /personaRef/, 'wizard must bind identity resources to personaRef');
  assert.match(wizard, /stackRef/, 'wizard must bind AgentDefinition to stackRef');
  assert.match(wizard, /resources\/\$\{resource\.kind\}\/\$\{encodeURIComponent\(resource\.metadata\?\.name\)\}/, 'wizard rollback must target the generic resource DELETE route with kind and name');
  const deleteRoute = readFile('app', 'api', 'orgs', '[org]', 'resources', '[kind]', '[name]', 'route.js');
  assert.match(deleteRoute, /export\s+const\s+DELETE\s*=\s*withAuth/, 'generic resource route must expose authenticated DELETE for wizard rollback');
  assert.match(deleteRoute, /deleteResourceForOrg\(\s*org\s*,\s*kind\s*,\s*name\s*\)/, 'generic resource DELETE must use org-scoped controller delete');
});

test('inference services GET route supports limit/offset pagination', () => {
  const route = readFile('app', 'api', 'orgs', '[org]', 'inference', 'services', 'route.js');
  assert.match(route, /searchParams\.get\(['"]limit['"]\)/);
  assert.match(route, /searchParams\.get\(['"]offset['"]\)/);
  assert.match(route, /\.slice\(/);
  assert.match(route, /hasMore/);
});

test('inference routes GET route supports limit/offset pagination', () => {
  const route = readFile('app', 'api', 'orgs', '[org]', 'inference', 'routes', 'route.js');
  assert.match(route, /searchParams\.get\(['"]limit['"]\)/);
  assert.match(route, /searchParams\.get\(['"]offset['"]\)/);
  assert.match(route, /\.slice\(/);
  assert.match(route, /hasMore/);
});

test('inference virtual-models GET route supports limit/offset pagination', () => {
  const route = readFile('app', 'api', 'orgs', '[org]', 'inference', 'virtual-models', 'route.js');
  assert.match(route, /searchParams\.get\(['"]limit['"]\)/);
  assert.match(route, /searchParams\.get\(['"]offset['"]\)/);
  assert.match(route, /\.slice\(/);
  assert.match(route, /hasMore/);
});

// ── Contract: Pagination component exists ───────────────────────────────────

test('Pagination component exists with expected props', () => {
  const source = readFile('app', 'components', 'shell', 'pagination.jsx');
  assert.match(source, /export const Pagination/);
  assert.match(source, /total/);
  assert.match(source, /limit/);
  assert.match(source, /offset/);
  assert.match(source, /onPageChange/);
  assert.match(source, /onLimitChange/);
  assert.match(source, /Prev/);
  assert.match(source, /Next/);
});

test('inference-service-manager uses Pagination via ResourceTabContent', () => {
  const manager = readFile('app', 'components', 'inference', 'inference-service-manager.jsx');
  assert.match(manager, /ResourceTabContent/);
  const helpers = readFile('app', 'components', 'inference', 'inference-service-helpers.jsx');
  assert.match(helpers, /import.*Pagination.*from.*pagination/);
  assert.match(helpers, /<Pagination/);
});
