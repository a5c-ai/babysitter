import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readFile(...parts) {
  return fs.readFileSync(path.join(webRoot, ...parts), 'utf8');
}

// ── API Route Structure Tests ─────────────────────────────────────────────
// These verify that all API routes follow consistent patterns.

test('all org API routes use force-dynamic', () => {
  const routeDir = path.join(webRoot, 'app', 'api', 'orgs');
  const routeFiles = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'route.js') routeFiles.push(full);
    }
  }
  walk(routeDir);
  assert.ok(routeFiles.length > 10, `expected 10+ route files, got ${routeFiles.length}`);
  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    assert.match(content, /dynamic.*=.*'force-dynamic'/, `${path.relative(webRoot, file)} missing force-dynamic`);
  }
});

test('all mutating routes (POST/DELETE/PATCH) use withAuth', () => {
  const routeDir = path.join(webRoot, 'app', 'api', 'orgs');
  const violations = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'route.js') {
        const content = fs.readFileSync(full, 'utf8');
        const hasMutation = /export\s+(const\s+)?(POST|DELETE|PATCH)\b/.test(content);
        const hasAuth = content.includes('withAuth');
        const isWebhook = full.includes('webhooks/ingest');
        const isCallback = full.includes('callback');
        if (hasMutation && !hasAuth && !isWebhook && !isCallback) {
          violations.push(path.relative(webRoot, full));
        }
      }
    }
  }
  walk(routeDir);
  assert.deepEqual(violations, [], `Routes with mutations but no withAuth: ${violations.join(', ')}`);
});

test('all GET routes returning org data use withAuth or requireAuth', () => {
  const routeDir = path.join(webRoot, 'app', 'api', 'orgs');
  const violations = [];
  const exemptPatterns = ['webhooks/ingest', 'callback', 'auth/'];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'route.js') {
        const rel = path.relative(webRoot, full);
        if (exemptPatterns.some(p => rel.includes(p))) continue;
        const content = fs.readFileSync(full, 'utf8');
        const hasGet = /export\s+(const\s+)?GET\b/.test(content) || /export\s+async\s+function\s+GET/.test(content);
        const hasAuth = content.includes('withAuth') || content.includes('requireAuth');
        if (hasGet && !hasAuth) {
          violations.push(rel);
        }
      }
    }
  }
  walk(routeDir);
  assert.deepEqual(violations, [], `GET routes without auth: ${violations.join(', ')}`);
});

test('no silent error swallowing in API routes (catch {} without logging)', () => {
  const routeDir = path.join(webRoot, 'app', 'api', 'orgs');
  const violations = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'route.js') {
        const content = fs.readFileSync(full, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if ((line === 'catch {}' || line === '} catch {}' || line === 'catch () {}') &&
              !lines[i + 1]?.includes('console')) {
            violations.push(`${path.relative(webRoot, full)}:${i + 1}`);
          }
        }
      }
    }
  }
  walk(routeDir);
  // Allow a few known acceptable silent catches (e.g., optional virtual model loading)
  assert.ok(violations.length <= 5, `Too many silent catches in API routes: ${violations.join(', ')}`);
});

test('pagination support in resources GET route', () => {
  const route = readFile('app', 'api', 'orgs', '[org]', 'resources', 'route.js');
  assert.match(route, /limit/);
  assert.match(route, /offset/);
  assert.match(route, /hasMore/);
});

test('all inference routes have pagination', () => {
  const routes = [
    readFile('app', 'api', 'orgs', '[org]', 'inference', 'services', 'route.js'),
    readFile('app', 'api', 'orgs', '[org]', 'inference', 'routes', 'route.js'),
    readFile('app', 'api', 'orgs', '[org]', 'inference', 'virtual-models', 'route.js'),
  ];
  for (const route of routes) {
    assert.match(route, /limit/, 'route must support limit param');
    assert.match(route, /offset/, 'route must support offset param');
  }
});

test('error.jsx files exist for major route groups', () => {
  const groups = ['agents', 'inference', 'external', 'repositories'];
  for (const group of groups) {
    const errorPath = path.join(webRoot, 'app', 'orgs', '[org]', group, 'error.jsx');
    assert.ok(fs.existsSync(errorPath), `Missing error.jsx for ${group}`);
  }
});

test('loading.jsx files exist for major route groups', () => {
  const groups = ['agents', 'inference', 'external', 'repositories', 'models', 'playground', 'costs', 'settings'];
  for (const group of groups) {
    const loadingPath = path.join(webRoot, 'app', 'orgs', '[org]', group, 'loading.jsx');
    assert.ok(fs.existsSync(loadingPath), `Missing loading.jsx for ${group}`);
  }
});

// ── Module Existence & Export Tests ───────────────────────────────────────

test('confirm-dialog.jsx exists and exports ConfirmDialog', () => {
  const filePath = path.join(webRoot, 'app', 'components', 'shell', 'confirm-dialog.jsx');
  assert.ok(fs.existsSync(filePath), 'confirm-dialog.jsx must exist');
  const content = fs.readFileSync(filePath, 'utf8');
  assert.match(content, /export\s+function\s+ConfirmDialog/, 'must export ConfirmDialog');
});

test('fetch-dedup.js exists and exports dedupFetch', () => {
  const filePath = path.join(webRoot, 'app', 'lib', 'fetch-dedup.js');
  assert.ok(fs.existsSync(filePath), 'fetch-dedup.js must exist');
  const content = fs.readFileSync(filePath, 'utf8');
  assert.match(content, /export\s+function\s+dedupFetch/, 'must export dedupFetch');
});

test('agent identity typed API routes exist with expected methods and auth', () => {
  const routes = [
    { path: ['agents', 'personas', 'route.js'], methods: ['GET', 'POST'] },
    { path: ['agents', 'personas', '[name]', 'route.js'], methods: ['GET', 'PATCH', 'DELETE'] },
    { path: ['agents', 'souls', '[name]', 'route.js'], methods: ['GET', 'PATCH'] },
    { path: ['agents', 'appearances', '[name]', 'route.js'], methods: ['GET', 'PATCH'] },
    { path: ['agents', 'appearances', '[name]', 'avatar', 'route.js'], methods: ['POST'] },
    { path: ['agents', 'voices', '[name]', 'route.js'], methods: ['GET', 'PATCH'] },
    { path: ['agents', 'voices', '[name]', 'preview', 'route.js'], methods: ['POST'] },
    { path: ['agents', 'definitions', 'route.js'], methods: ['GET', 'POST'] },
    { path: ['agents', 'definitions', '[name]', 'route.js'], methods: ['GET', 'PATCH', 'DELETE'] },
  ];
  for (const route of routes) {
    const routePath = path.join(webRoot, 'app', 'api', 'orgs', '[org]', ...route.path);
    assert.ok(fs.existsSync(routePath), `Missing ${path.relative(webRoot, routePath)}`);
    const src = fs.readFileSync(routePath, 'utf8');
    assert.match(src, /dynamic\s*=\s*'force-dynamic'/, `${path.relative(webRoot, routePath)} missing force-dynamic`);
    assert.match(src, /withAuth/, `${path.relative(webRoot, routePath)} must use withAuth`);
    assert.match(src, /orgNamespaceName/, `${path.relative(webRoot, routePath)} must scope by org namespace`);
    assert.match(src, /createKrateApiController/, `${path.relative(webRoot, routePath)} must use controller-backed resources`);
    for (const method of route.methods) {
      assert.match(src, new RegExp(`export\\s+const\\s+${method}\\s*=`), `${path.relative(webRoot, routePath)} missing ${method}`);
    }
  }
});

test('use-unsaved-changes.js exists and exports useUnsavedChanges', () => {
  const filePath = path.join(webRoot, 'app', 'hooks', 'use-unsaved-changes.js');
  assert.ok(fs.existsSync(filePath), 'use-unsaved-changes.js must exist');
  const content = fs.readFileSync(filePath, 'utf8');
  assert.match(content, /export\s+function\s+useUnsavedChanges/, 'must export useUnsavedChanges');
});

test('agent-utils.js exports phaseTone, relativeTime, and deriveSegments', () => {
  const filePath = path.join(webRoot, 'app', 'lib', 'agent-utils.js');
  assert.ok(fs.existsSync(filePath), 'agent-utils.js must exist');
  const content = fs.readFileSync(filePath, 'utf8');
  assert.match(content, /export\s+function\s+phaseTone/, 'must export phaseTone');
  assert.match(content, /export\s+function\s+relativeTime/, 'must export relativeTime');
  assert.match(content, /export\s+function\s+deriveSegments/, 'must export deriveSegments');
});

test('components/index.js exists as barrel file', () => {
  const filePath = path.join(webRoot, 'app', 'components', 'index.js');
  assert.ok(fs.existsSync(filePath), 'components/index.js barrel file must exist');
  const content = fs.readFileSync(filePath, 'utf8');
  // A barrel file should have multiple re-exports
  const exportCount = (content.match(/export\s*\{/g) || []).length;
  assert.ok(exportCount >= 5, `barrel file should have at least 5 export blocks, got ${exportCount}`);
});

test('no staging URLs in production code', () => {
  const violations = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.includes('node_modules')) walk(full);
      else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('staging.a5c.ai') && !full.includes('test') && !full.includes('e2e')) {
          violations.push(path.relative(webRoot, full));
        }
      }
    }
  }
  walk(path.join(webRoot, 'app'));
  assert.deepEqual(violations, [], `Files with staging URLs: ${violations.join(', ')}`);
});
