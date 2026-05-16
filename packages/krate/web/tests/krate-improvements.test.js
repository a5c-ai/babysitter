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
  const browser = readWebFile('app', 'components', 'repo-code-browser.jsx');
  assert.match(browser, /@uiw\/react-codemirror/);
  assert.match(browser, /@codemirror\/lang-javascript/);
  assert.match(browser, /@codemirror\/lang-yaml/);
  assert.match(browser, /languageExtension\(language\)/);
  assert.match(browser, /<CodeMirror/);
});
test('degraded Krate UI renders recovery loader only for controller fetch failures', () => {
  const ui = readWebFile('app', 'lib', 'krate-ui.jsx');
  const loader = readWebFile('app', 'components', 'krate-loading.jsx');
  assert.match(ui, /shouldShowControllerRecovery/);
  assert.match(ui, /KrateControllerRecovery/);
  assert.match(ui, /hasControllerData/);
  assert.match(ui, /metrics\?\.resources/);
  assert.doesNotMatch(ui, /orgs\?\.length/);
  assert.match(ui, /hasFetchFailure/);
  assert.doesNotMatch(ui, /Krate workspace degraded or empty/);
  assert.match(loader, /fetch\(target, \{ cache: 'no-store' \}\)/);
  assert.match(loader, /controllerModelIsReachable/);
  assert.match(loader, /content-type/);
  assert.match(loader, /setRecovered\(true\)/);
  assert.match(loader, /router\.refresh\(\)/);
  assert.match(loader, /sessionStorage/);
  assert.doesNotMatch(loader, /window\.location\.reload\(\)/);
  assert.doesNotMatch(loader, /body\?\.status === 'ready'/);
});

test('loading page uses changing phases and progressing bar', () => {
  const loading = readWebFile('app', 'loading.jsx');
  const css = readWebFile('app', 'globals.css');
  const loader = readWebFile('app', 'components', 'krate-loading.jsx');
  assert.match(loading, /krateRecoveryOverlay/);
  assert.match(css, /\.krateRecoveryOverlay\s*\{[\s\S]*position:\s*fixed[\s\S]*inset:\s*0/);
  assert.match(loading, /KrateLoadingView/);
  assert.match(loader, /KRATE_LOADING_MESSAGES/);
  assert.match(loader, /setInterval\(\(\) => setTick/);
  assert.match(loader, /setInterval\(\(\) => setProgress/);
  assert.match(loader, /shownProgress/);
});

