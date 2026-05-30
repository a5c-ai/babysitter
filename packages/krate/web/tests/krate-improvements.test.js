import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatPipelineLogs } from '../app/api/orgs/[org]/pipelines/[name]/logs/route.js';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readWebFile(...parts) {
  return fs.readFileSync(path.join(webRoot, ...parts), 'utf8');
}

test('pipeline logs formatter returns useful text for linked jobs', () => {
  const log = formatPipelineLogs(
    {
      metadata: { name: 'deploy-test-1' },
      spec: { repository: 'test2', ref: 'main' },
      status: { phase: 'Running', startedAt: '2026-05-15T18:00:00.000Z' },
    },
    [
      { metadata: { name: 'deploy-test-1-1-build' }, spec: { step: 'build', pipeline: 'deploy-test-1' }, status: { phase: 'Succeeded', message: 'built' } },
      { metadata: { name: 'deploy-test-1-2-test' }, spec: { step: 'test', pipeline: 'deploy-test-1' }, status: { phase: 'Running' } },
    ]
  );

  assert.match(log, /Krate pipeline log: deploy-test-1/);
  assert.match(log, /Repository: test2/);
  assert.match(log, /\[Succeeded\] deploy-test-1-1-build \(build\)/);
  assert.match(log, /message: built/);
});

test('org resources API uses org-scoped listing', () => {
  const route = readWebFile('app', 'api', 'orgs', '[org]', 'resources', 'route.js');
  assert.match(route, /listResourceForOrg\(org, kind\)/);
  assert.doesNotMatch(route, /listResource\(kind\)/);
});

test('repository code browser uses CodeMirror syntax highlighting', () => {
  const browser = readWebFile('app', 'components', 'repo', 'repo-code-browser.jsx');
  assert.match(browser, /@uiw\/react-codemirror/);
  assert.match(browser, /@codemirror\/lang-javascript/);
  assert.match(browser, /@codemirror\/lang-yaml/);
  assert.match(browser, /languageExtension\(language\)/);
  assert.match(browser, /<CodeMirror/);
});
test('degraded Krate UI renders recovery loader only for controller fetch failures', () => {
  const ui = readWebFile('app', 'lib', 'krate-ui.jsx');
  const loader = readWebFile('app', 'components', 'shell', 'krate-loading.jsx');
  const controllerRoute = readWebFile('app', 'api', 'controller', 'route.js');
  assert.match(ui, /shouldShowControllerRecovery/);
  assert.doesNotMatch(ui, /localFallback: false/);
  assert.match(ui, /useCache: true/);
  assert.doesNotMatch(ui, /useCache: false/);
  assert.match(ui, /KrateControllerRecovery/);
  assert.match(ui, /ORG_HYDRATED_RESOURCE_KINDS = \['Repository', 'RunnerPool', 'Pipeline', 'Job', 'KrateProject', 'Issue'\]/);
  assert.match(ui, /syncHydratedModel/);
  assert.match(ui, /model\.agents/);
  assert.match(controllerRoute, /'KrateProject'/);
  assert.match(controllerRoute, /'Issue'/);
  assert.match(controllerRoute, /issues: Number/);
  assert.match(controllerRoute, /model\.agents/);
  assert.match(ui, /hasLiveControllerData/);
  assert.doesNotMatch(ui, /Number\.isFinite\(model\.metrics\?\.resources\)/);
  assert.doesNotMatch(ui, /orgs\?\.length/);
  assert.match(ui, /hasFetchFailure/);
  assert.doesNotMatch(ui, /Krate workspace degraded or empty/);
  assert.match(loader, /fetch\(target, \{ cache: 'no-store' \}\)/);
  assert.match(loader, /controllerModelIsReachable/);
  assert.match(loader, /content-type/);
  assert.match(loader, /if \(hasUnavailableError\) return false/);
  assert.match(loader, /hasResourceMetric/);
  assert.match(loader, /hasControllerEnvelope/);
  assert.match(loader, /Number\.isFinite\(body\.metrics\?\.resources\)/);
  assert.doesNotMatch(loader, /hasUsableControllerData/);
  assert.doesNotMatch(loader, /product === 'Krate' \|\| body\??\.controller/);
  assert.match(loader, /setRecovered\(true\)/);
  assert.match(loader, /router\.refresh\(\)/);
  assert.match(loader, /sessionStorage/);
  assert.doesNotMatch(loader, /window\.location\.reload\(\)/);
  assert.doesNotMatch(loader, /body\?\.status === 'ready'/);
});

test('recovery overlay progresses without covering normal route navigation', () => {
  const loading = readWebFile('app', 'loading.jsx');
  const css = readWebFile('app', 'globals.css');
  const loader = readWebFile('app', 'components', 'shell', 'krate-loading.jsx');
  assert.match(loading, /krateSpinner/);
  assert.match(loading, /krateLoadingLabel/);
  assert.doesNotMatch(loading, /KrateDelayedRouteLoading/);
  assert.doesNotMatch(loading, /KrateRouteLoadingOverlay/);
  assert.doesNotMatch(loading, /return null/);
  assert.match(css, /\.krateRecoveryOverlay\s*\{[\s\S]*position:\s*fixed[\s\S]*inset:\s*0/);
  assert.match(css, /krateSpinnerRotate/);
  assert.match(loader, /export function KrateControllerRecovery/);
  assert.doesNotMatch(loader, /export function KrateDelayedRouteLoading/);
  assert.doesNotMatch(loader, /export function KrateRouteLoadingOverlay/);
  assert.doesNotMatch(loader, /krate-route-loading-refresh/);
  assert.doesNotMatch(loader, /orgFromPathname/);
  assert.match(loader, /KRATE_LOADING_MESSAGES/);
  assert.match(loader, /setInterval\(\(\) => setTick/);
  assert.match(loader, /setInterval\(\(\) => setProgress/);
  assert.match(loader, /shownProgress/);
});

test('theme setting applies across full page loads', () => {
  const layout = readWebFile('app', 'layout.jsx');
  const settings = readWebFile('app', 'components', 'settings', 'app-settings.jsx');
  const runtime = readWebFile('app', 'components', 'shell', 'theme-runtime.jsx');
  const css = readWebFile('app', 'globals.css');
  assert.match(layout, /ThemeRuntime/);
  assert.match(layout, /themeInitScript/);
  assert.match(layout, /krate-theme/);
  assert.match(layout, /suppressHydrationWarning/);
  assert.match(runtime, /THEME_STORAGE_KEY = 'krate-theme'/);
  assert.ok(runtime.includes("document.documentElement.setAttribute('data-theme'"));
  assert.ok(runtime.includes("window.addEventListener('storage'"));
  assert.match(runtime, /prefers-color-scheme: dark/);
  assert.match(css, /data-theme/);
  assert.match(css, /\.pill/);
  assert.match(css, /\.skipLink/);
  assert.ok(settings.includes('storeTheme') || settings.includes('theme'));
});




test('agents events stream route exists for EventSource consumers', () => {
  const route = readWebFile('app', 'api', 'orgs', '[org]', 'agents', 'events', 'stream', 'route.js');
  assert.match(route, /text\/event-stream/);
  assert.match(route, /globalEventBus/);
  assert.match(route, /KRATE_CONTROLLER_URL/);
  assert.match(route, /type: 'connected'/);
  assert.match(route, /Last-Event-ID/);
  assert.match(route, /searchParams\.get\('cursor'\)/);
  assert.match(route, /replaySince/);
});

test('approval decide route handles approve and deny', () => {
  const route = readWebFile('app', 'api', 'orgs', '[org]', 'agents', 'approvals', '[name]', 'decide', 'route.js');
  assert.match(route, /withAuth/);
  assert.match(route, /approve.*deny|deny.*approve/);
  assert.match(route, /Approved/);
  assert.match(route, /Denied/);
  assert.match(route, /clearSnapshotCache/);
  assert.match(route, /invalidateApiCache/);
});

test('resource crud actions component supports delete, archive, terminate, and revoke', () => {
  const source = readWebFile('app', 'components', 'resource-crud-actions.jsx');
  assert.match(source, /revoke.*Revoked|Revoked.*revoke/);
  assert.match(source, /terminate.*Terminated|Terminated.*terminate/);
  assert.match(source, /archive.*Archived|Archived.*archive/);
  assert.match(source, /action === 'delete'/);
  assert.match(source, /router\.refresh/);
});

test('webhook manager has delete button per webhook', () => {
  const source = readWebFile('app', 'components', 'webhook-manager.jsx');
  assert.match(source, /onDeleted/);
  assert.match(source, /DELETE/);
  assert.match(source, /ExternalWebhookConfig/);
});

test('external provider wizard navigates after success', () => {
  const source = readWebFile('app', 'components', 'external', 'external-provider-wizard.jsx');
  assert.match(source, /handleSuccess/);
  assert.match(source, /handleCancel/);
  assert.match(source, /defaultNav/);
});

test('stack builder graph splits tools into internal and external sub-sections', () => {
  // Read all split modules that compose the stack builder graph
  const source = [
    readWebFile('app', 'components', 'agent', 'stack-builder-graph.jsx'),
    readWebFile('app', 'components', 'agent', 'stack-builder-graph-styles.jsx'),
    readWebFile('app', 'components', 'agent', 'stack-builder-graph-nodes.jsx'),
    readWebFile('app', 'components', 'agent', 'stack-builder-graph-panels.jsx'),
  ].join('\n');
  // STACK_LAYERS should include subcategories on tools layer
  assert.match(source, /subcategories/);
  assert.match(source, /Internal Platform Tools/);
  assert.match(source, /External Tools/);
  // ToolsLayerSection component exists and is used for layers with subcategories
  assert.match(source, /function ToolsLayerSection/);
  assert.match(source, /function ToolSubSection/);
  assert.match(source, /layer\.subcategories \?/);
  // internalTools and externalTools in submit
  assert.match(source, /internalTools:\s*\{\s*enabled:\s*true/);
  assert.match(source, /externalTools:\s*\{/);
  assert.match(source, /mcpServerRefs:/);
  assert.match(source, /cliToolRefs:/);
  assert.match(source, /openApiRefs:/);
});

test('stack builder graph includes memory repository section', () => {
  // Read all split modules that compose the stack builder graph
  const source = [
    readWebFile('app', 'components', 'agent', 'stack-builder-graph.jsx'),
    readWebFile('app', 'components', 'agent', 'stack-builder-graph-styles.jsx'),
    readWebFile('app', 'components', 'agent', 'stack-builder-graph-panels.jsx'),
  ].join('\n');
  // MemoryRepositorySection component
  assert.match(source, /function MemoryRepositorySection/);
  assert.match(source, /AgentMemoryRepository/);
  assert.match(source, /selectedMemoryRepos/);
  assert.match(source, /handleToggleMemoryRepo/);
  // memoryRepositoryRefs in submit payload
  assert.match(source, /memoryRepositoryRefs:\s*selectedMemoryRepos\.map/);
});

test('stack edit form includes memory repository refs field', () => {
  const source = readWebFile('app', 'components', 'agent', 'stack-edit-form.jsx');
  assert.match(source, /memoryRepositoryRefs/);
  assert.match(source, /Memory repository refs/);
  assert.match(source, /org-memory, shared-knowledge/);
  // Save logic splits comma-separated refs
  assert.match(source, /split\(','\)/);
});

test('snapshot route provides health data for insights page', () => {
  const route = readWebFile('app', 'api', 'orgs', '[org]', 'snapshot', 'route.js');
  const probes = fs.readFileSync(path.join(webRoot, '..', 'core', 'src', 'health-probes.js'), 'utf8');
  assert.match(route, /kubernetes/);
  assert.match(route, /gitea/);
  assert.match(route, /agentMux/);
  assert.match(route, /controller/);
  assert.match(route, /assistant/);
  assert.match(route, /collectKrateHealthProbes/);
  assert.match(route, /externalProviders/);
  assert.match(route, /Cache-Control.*no-store/);
  assert.match(probes, /healthz/);
  assert.match(probes, /AbortSignal\.timeout/);
});
