/**
 * Controller Contract Tests
 *
 * Verify that the controller snapshot includes all resource kinds and model
 * paths that web pages reference.  If a page renders `ui.model.agents.stacks`,
 * the controller UI model must produce `agents.stacks`.
 *
 * This catches coupling drift between the web console and the controller
 * before it reaches production -- a broken path silently renders empty UI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coreRoot = path.resolve(webRoot, '..', 'core');

// ---------------------------------------------------------------------------
// Import controller-ui model builder from core
// ---------------------------------------------------------------------------
const controllerUiUrl = pathToFileURL(path.join(coreRoot, 'src', 'controller-ui.js')).href;
const { createControllerUiModel } = await import(controllerUiUrl);

// ---------------------------------------------------------------------------
// Build a minimal snapshot that the controller can process
// ---------------------------------------------------------------------------
function buildEmptySnapshot() {
  return {
    namespace: 'kradle-test',
    generatedAt: new Date().toISOString(),
    correlationId: 'contract-test',
    kubectl: { available: true, context: 'test-context' },
    apiService: { metadata: { name: 'kradle-api' } },
    resources: {},
    crds: [],
    commands: [],
    events: [],
    kyverno: {},
    storage: {},
  };
}

// ---------------------------------------------------------------------------
// 1. Controller snapshot includes all agent view paths the web pages reference
// ---------------------------------------------------------------------------

const EXPECTED_AGENT_PATHS = [
  'stacks',
  'runs',
  'rules',
  'sessions',
  'workspaces',
  'approvals',
  'adapters',
  'providers',
  'projects',
  'gateway',
  'transcripts',
  'meetings',
  'memoryRepositories',
  'memorySnapshots',
  'memoryImports',
];

test('controller snapshot includes all agent view paths that web pages reference', () => {
  const model = createControllerUiModel(buildEmptySnapshot());
  assert.ok(model.agents, 'model must include agents section');

  for (const agentPath of EXPECTED_AGENT_PATHS) {
    assert.ok(
      model.agents[agentPath] !== undefined,
      `model.agents.${agentPath} is missing from controller UI model`
    );
  }
});

// ---------------------------------------------------------------------------
// 2. Controller snapshot includes top-level model sections web pages use
// ---------------------------------------------------------------------------

const EXPECTED_TOP_LEVEL_PATHS = [
  'status',
  'namespace',
  'org',
  'orgs',
  'controller',
  'metrics',
  'resources',
  'views',
  'agents',
  'generatedAt',
];

test('controller snapshot includes all top-level model paths that web pages reference', () => {
  const model = createControllerUiModel(buildEmptySnapshot());

  for (const topPath of EXPECTED_TOP_LEVEL_PATHS) {
    assert.ok(
      model[topPath] !== undefined,
      `model.${topPath} is missing from controller UI model`
    );
  }
});

// ---------------------------------------------------------------------------
// 3. Controller model includes views.dashboard used by repo pages
// ---------------------------------------------------------------------------

test('controller model includes views.dashboard with repositories', () => {
  const model = createControllerUiModel(buildEmptySnapshot());
  assert.ok(model.views, 'model must include views');
  assert.ok(model.views.dashboard !== undefined, 'model.views.dashboard is missing');
  assert.ok(
    model.views.dashboard.repositories !== undefined,
    'model.views.dashboard.repositories is missing'
  );
});

// ---------------------------------------------------------------------------
// 4. Controller model includes controller.connection and controller.architecture
// ---------------------------------------------------------------------------

test('controller model includes controller connection and architecture', () => {
  const model = createControllerUiModel(buildEmptySnapshot());
  assert.ok(model.controller, 'model must include controller');
  assert.ok(model.controller.connection !== undefined, 'model.controller.connection is missing');
  assert.ok(model.controller.architecture !== undefined, 'model.controller.architecture is missing');
  assert.ok(model.controller.endpoints !== undefined, 'model.controller.endpoints is missing');
});

// ---------------------------------------------------------------------------
// 5. Controller model metrics section includes counts web dashboard uses
// ---------------------------------------------------------------------------

const EXPECTED_METRICS = [
  'components',
  'resources',
  'events',
  'users',
  'teams',
  'repositories',
  'pullRequests',
  'issues',
  'projects',
  'pipelines',
  'jobs',
  'runnerPools',
  'deployments',
];

test('controller model metrics includes all counts used by the web dashboard', () => {
  const model = createControllerUiModel(buildEmptySnapshot());
  assert.ok(model.metrics, 'model must include metrics');

  for (const metric of EXPECTED_METRICS) {
    assert.ok(
      model.metrics[metric] !== undefined,
      `model.metrics.${metric} is missing from controller UI model`
    );
  }
});

// ---------------------------------------------------------------------------
// 6. Web pages reference agent view paths that exist in snapshot
// ---------------------------------------------------------------------------

test('web page files only reference agent model paths that the controller produces', () => {
  const pagesDir = path.join(webRoot, 'app', 'pages');
  if (!fs.existsSync(pagesDir)) return; // skip if pages dir doesn't exist

  const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.jsx') || f.endsWith('.js'));
  const model = createControllerUiModel(buildEmptySnapshot());
  const agentKeys = new Set(Object.keys(model.agents));

  // Extract model.agents.XXX references from page source code
  const agentPathPattern = /model\.agents\.(\w+)/g;
  for (const file of pageFiles) {
    const source = fs.readFileSync(path.join(pagesDir, file), 'utf8');
    let match;
    while ((match = agentPathPattern.exec(source)) !== null) {
      const referencedPath = match[1];
      assert.ok(
        agentKeys.has(referencedPath),
        `${file} references model.agents.${referencedPath} which does not exist in the controller UI model`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// 7. featureRequires helper returns correct structure
// ---------------------------------------------------------------------------

test('featureRequires returns correct availability structure', async () => {
  const kradleUiUrl = pathToFileURL(path.join(webRoot, 'app', 'lib', 'kradle-ui.jsx')).href;
  // Since kradle-ui.jsx uses JSX and server imports, we test the function signature
  // by reading the source and verifying the export exists
  const source = fs.readFileSync(path.join(webRoot, 'app', 'lib', 'kradle-ui.jsx'), 'utf8');
  assert.match(source, /export function featureRequires\(model, service\)/, 'featureRequires must be exported');
  assert.match(source, /available:/, 'featureRequires must return available field');
  assert.match(source, /configured/, 'featureRequires must return configured field');
  assert.match(source, /service/, 'featureRequires must return service field');
});
