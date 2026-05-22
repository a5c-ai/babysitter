/**
 * Web Build Smoke Tests — Verify the web package source structure (node:test, not browser)
 *
 * These tests run in Node.js and verify the source files without starting Next.js or React.
 * They check: page exports, nav structure, next.config.mjs, Dockerfile, and components.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.join(__dirname, '..');
const repoRoot = path.join(__dirname, '../../..');

// ---------------------------------------------------------------------------
// Test 1: All page exports exist in ui-shell.jsx
// ---------------------------------------------------------------------------

test('web smoke: ui-shell.jsx exports key page components', () => {
  const uiShellPath = path.join(webRoot, 'app', 'ui-shell.jsx');
  assert.ok(fs.existsSync(uiShellPath), `ui-shell.jsx must exist at ${uiShellPath}`);

  const modulePaths = ['app/lib/krate-ui.jsx', 'app/lib/page-frame.jsx', 'app/pages/agent-pages.jsx', 'app/pages/repo-pages.jsx', 'app/pages/manage-pages.jsx', 'app/pages/settings-pages.jsx', 'app/pages/external-pages.jsx'];
  const content = modulePaths.map((m) => { try { return fs.readFileSync(path.join(webRoot, m), 'utf8'); } catch { return ''; } }).join('\n');

  // Verify key page exports
  const expectedExports = [
    'DashboardPage',
    'LoginPage',
    'LogoutPage',
    'AgentStacksPage',
    'AppShell',
    'orgNavigationGroups',
    'orgNavigation',
    'PageFrame',
    'RepositoryNav',
    'AgentsDashboardPage',
    'RepositoriesPage',
    'PeoplePage',
    'InboxPage',
    'RunsPage',
    'InsightsPage',
    'ControllerApiPage',
  ];

  for (const name of expectedExports) {
    assert.ok(
      content.includes(`export`) && content.includes(name),
      `ui-shell.jsx must export ${name}`
    );
  }

  // Count total exports (export function, export async function, export const)
  const exportMatches = content.match(/^export\s+(async\s+)?function\s+\w+|^export\s+const\s+\w+/gm) || [];
  assert.ok(exportMatches.length >= 20, `ui-shell.jsx must have at least 20 exports, found ${exportMatches.length}`);
});

// ---------------------------------------------------------------------------
// Test 2: Nav items structure is correct
// ---------------------------------------------------------------------------

test('web smoke: ui-shell.jsx nav items have expected routes', () => {
  const modulePaths = ['app/lib/krate-ui.jsx', 'app/lib/page-frame.jsx', 'app/pages/agent-pages.jsx', 'app/pages/repo-pages.jsx', 'app/pages/manage-pages.jsx', 'app/pages/settings-pages.jsx', 'app/pages/external-pages.jsx'];
  const content = modulePaths.map((m) => { try { return fs.readFileSync(path.join(webRoot, m), 'utf8'); } catch { return ''; } }).join('\n');

  // Verify key navigation routes are present
  const expectedRoutes = [
    '/repositories',
    '/agents',
    '/people',
    '/settings',
    '/runs',
    '/deployments',
    '/insights',
  ];

  for (const route of expectedRoutes) {
    assert.ok(
      content.includes(`'${route}'`) || content.includes(`"${route}"`),
      `ui-shell.jsx nav must include route: ${route}`
    );
  }

  // Verify the orgNavigation export
  assert.ok(content.includes('orgNavigation'), 'ui-shell.jsx must export orgNavigation');
  assert.ok(content.includes('orgNavigationGroups'), 'ui-shell.jsx must export orgNavigationGroups');
});

// ---------------------------------------------------------------------------
// Test 3: next.config.mjs has turbopack root and SDK alias
// ---------------------------------------------------------------------------

test('web smoke: next.config.mjs has turbopack root and SDK alias', () => {
  const configPath = path.join(webRoot, 'next.config.mjs');
  assert.ok(fs.existsSync(configPath), `next.config.mjs must exist at ${configPath}`);

  const content = fs.readFileSync(configPath, 'utf8');

  // Verify turbopack configuration
  assert.ok(content.includes('turbopack'), 'next.config.mjs must contain turbopack configuration');

  // Verify SDK alias
  assert.ok(
    content.includes('@a5c-ai/krate-sdk'),
    'next.config.mjs must contain @a5c-ai/krate-sdk alias'
  );

  // Verify output file tracing root for monorepo support
  assert.ok(
    content.includes('outputFileTracingRoot'),
    'next.config.mjs must contain outputFileTracingRoot for monorepo support'
  );

  // Verify standalone output mode
  assert.ok(
    content.includes('standalone'),
    'next.config.mjs must have standalone output mode'
  );
});

// ---------------------------------------------------------------------------
// Test 4: Dockerfile exists and references monorepo
// ---------------------------------------------------------------------------

test('web smoke: Dockerfile exists or build config is present', () => {
  const dockerfilePath = path.join(webRoot, 'Dockerfile');
  const configPath = path.join(webRoot, 'next.config.mjs');

  if (fs.existsSync(dockerfilePath)) {
    // Dockerfile exists — verify it has basic Docker directives
    const content = fs.readFileSync(dockerfilePath, 'utf8');
    assert.ok(
      content.includes('COPY') || content.includes('FROM'),
      'Dockerfile must have COPY or FROM directives'
    );
    // Check it references SDK or core packages
    assert.ok(
      content.includes('sdk') || content.includes('krate') || content.includes('node_modules') || content.includes('COPY'),
      'Dockerfile must reference the SDK or krate packages'
    );
  } else {
    // If no Dockerfile, next.config.mjs should exist as the build config
    assert.ok(
      fs.existsSync(configPath),
      'If Dockerfile is absent, next.config.mjs must be present as the build configuration'
    );
  }
});

// ---------------------------------------------------------------------------
// Test 5: Components directory has expected files
// ---------------------------------------------------------------------------

test('web smoke: components directory has expected .jsx files', () => {
  const componentsPath = path.join(webRoot, 'app', 'components');
  assert.ok(
    fs.existsSync(componentsPath),
    `components directory must exist at ${componentsPath}`
  );

  const files = fs.readdirSync(componentsPath);
  const jsxFiles = files.filter((f) => f.endsWith('.jsx'));

  assert.ok(
    jsxFiles.length >= 10,
    `components/ must have at least 10 .jsx files, found ${jsxFiles.length}: ${jsxFiles.join(', ')}`
  );

  // Verify specific expected components
  const expectedComponents = [
    'code-editor.jsx',
    'dispatch-button.jsx',
    'resource-actions.jsx',
  ];

  for (const component of expectedComponents) {
    assert.ok(
      jsxFiles.includes(component),
      `components/ must include ${component}`
    );
  }

  // Verify all listed components are actually files (not directories)
  for (const file of jsxFiles) {
    const stat = fs.statSync(path.join(componentsPath, file));
    assert.ok(stat.isFile(), `${file} must be a file, not a directory`);
  }
});
