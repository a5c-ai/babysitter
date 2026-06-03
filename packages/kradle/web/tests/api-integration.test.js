/**
 * API Integration Tests -- Verify that every API route module exports the
 * expected HTTP method handlers as functions and follows structural conventions.
 *
 * Reads route.js files as text (no server startup) and asserts that exported
 * symbols match the expected shape.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = path.join(webRoot, 'app', 'api');

/** Recursively collect all route.js files under a directory. */
function collectRouteFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectRouteFiles(full));
    else if (entry.name === 'route.js') results.push(full);
  }
  return results;
}

const allRouteFiles = collectRouteFiles(apiDir);
const VALID_HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']);

// ---------------------------------------------------------------------------
// 1. Every route.js exports at least one valid HTTP method handler
// ---------------------------------------------------------------------------

test('every route.js exports at least one HTTP method handler', () => {
  assert.ok(allRouteFiles.length >= 40, `expected >= 40 route files, found ${allRouteFiles.length}`);

  for (const file of allRouteFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    const exportedMethods = [];
    for (const method of VALID_HTTP_METHODS) {
      // Match: export const GET = ..., export async function GET(...), export function GET(...)
      const pattern = new RegExp(
        `export\\s+(?:const\\s+${method}\\s*=|(?:async\\s+)?function\\s+${method}\\s*\\()`,
      );
      if (pattern.test(src)) exportedMethods.push(method);
    }
    assert.ok(
      exportedMethods.length >= 1,
      `${rel} must export at least one HTTP method handler (GET, POST, etc.)`,
    );
  }
});

// ---------------------------------------------------------------------------
// 2. All exported HTTP method symbols are functions (arrow / async function)
// ---------------------------------------------------------------------------

test('all exported HTTP method symbols are functions, not plain values', () => {
  for (const file of allRouteFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    for (const method of VALID_HTTP_METHODS) {
      // Check for export const METHOD = <non-function> patterns
      const constExport = new RegExp(`export\\s+const\\s+${method}\\s*=`);
      if (constExport.test(src)) {
        // Must be followed by an arrow function, withAuth(...), or function keyword
        const fullPattern = new RegExp(
          `export\\s+const\\s+${method}\\s*=\\s*(?:async\\s+)?(?:\\(|withAuth|function|[A-Z])`,
        );
        assert.ok(
          fullPattern.test(src),
          `${rel}: export const ${method} must be assigned a function (arrow, async, or withAuth wrapper)`,
        );
      }
    }
  }
});

// ---------------------------------------------------------------------------
// 3. Resources route exports both GET and POST
// ---------------------------------------------------------------------------

test('resources route exports both GET and POST', () => {
  const resourceRoute = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'resources', 'route.js',
  );
  const src = fs.readFileSync(resourceRoute, 'utf8');
  assert.ok(
    /export\s+(?:const\s+GET\s*=|(?:async\s+)?function\s+GET)/.test(src),
    'resources route must export GET',
  );
  assert.ok(
    /export\s+(?:const\s+POST\s*=|(?:async\s+)?function\s+POST)/.test(src),
    'resources route must export POST',
  );
});

// ---------------------------------------------------------------------------
// 4. Resources [kind]/[name] route exports GET, PATCH, POST, and DELETE
// ---------------------------------------------------------------------------

test('resources [kind]/[name] route exports GET, PATCH, POST, and DELETE', () => {
  const routeFile = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'resources', '[kind]', '[name]', 'route.js',
  );
  const src = fs.readFileSync(routeFile, 'utf8');
  for (const method of ['GET', 'PATCH', 'POST', 'DELETE']) {
    const pattern = new RegExp(
      `export\\s+(?:const\\s+${method}\\s*=|(?:async\\s+)?function\\s+${method})`,
    );
    assert.ok(pattern.test(src), `resources [kind]/[name] route must export ${method}`);
  }
});

// ---------------------------------------------------------------------------
// 5. Inference routes export the right HTTP methods
// ---------------------------------------------------------------------------

test('inference services list route exports GET and POST', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'inference', 'services', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
});

test('inference service detail route exports GET and DELETE', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'inference', 'services', '[name]', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(/export\s+(?:const\s+DELETE|(?:async\s+)?function\s+DELETE)/.test(src), 'must export DELETE');
});

test('inference infer route exports POST only', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'inference', 'services', '[name]', 'infer', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
  // Should NOT export GET -- infer is write-only
  assert.ok(
    !/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src),
    'infer route must not export GET',
  );
});

test('inference runtimes route exports GET and POST', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'inference', 'runtimes', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
});

test('inference catalog route exports GET only', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'inference', 'catalog', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(
    !/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src),
    'catalog route must not export POST (read-only)',
  );
});

test('inference virtual-models route exports GET and POST', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'inference', 'virtual-models', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
});

// ---------------------------------------------------------------------------
// 6. Repositories route exports GET and POST
// ---------------------------------------------------------------------------

test('repositories route exports GET and POST', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'repositories', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
});

test('repository detail route exports GET and DELETE', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'repositories', '[name]', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(/export\s+(?:const\s+DELETE|(?:async\s+)?function\s+DELETE)/.test(src), 'must export DELETE');
});

// ---------------------------------------------------------------------------
// 7. Secrets routes export correct methods
// ---------------------------------------------------------------------------

test('secrets list route exports GET and POST', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'secrets', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
});

test('secrets [name] route exports DELETE', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'secrets', '[name]', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+DELETE|(?:async\s+)?function\s+DELETE)/.test(src), 'must export DELETE');
});

// ---------------------------------------------------------------------------
// 8. Assistant routes export correct methods
// ---------------------------------------------------------------------------

test('assistant chat route exports POST', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'assistant', 'chat', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
});

test('assistant sessions route exports GET, POST, and DELETE', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'assistant', 'sessions', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
  assert.ok(/export\s+(?:const\s+DELETE|(?:async\s+)?function\s+DELETE)/.test(src), 'must export DELETE');
});

// ---------------------------------------------------------------------------
// 9. Hooks dispatch and agent dispatch routes export POST
// ---------------------------------------------------------------------------

test('hooks dispatch route exports POST', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'hooks', 'dispatch', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
});

test('agent dispatch route exports POST', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'agents', 'dispatch', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
});

// ---------------------------------------------------------------------------
// 10. No route.js exports non-function values masquerading as HTTP methods
// ---------------------------------------------------------------------------

test('no route exports a string, number, or object literal as an HTTP method', () => {
  const violations = [];
  for (const file of allRouteFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    for (const method of VALID_HTTP_METHODS) {
      // Detect: export const GET = "..." or export const GET = 123 or export const GET = {...}
      const badPatterns = [
        new RegExp(`export\\s+const\\s+${method}\\s*=\\s*['"]`),
        new RegExp(`export\\s+const\\s+${method}\\s*=\\s*\\d`),
        new RegExp(`export\\s+const\\s+${method}\\s*=\\s*\\{(?!\\s*\\()`, 'm'),
      ];
      for (const bp of badPatterns) {
        if (bp.test(src)) {
          violations.push(`${rel}: ${method} exported as non-function`);
        }
      }
    }
  }
  assert.deepEqual(violations, [], `Routes must not export non-function HTTP methods:\n${violations.join('\n')}`);
});

// ---------------------------------------------------------------------------
// 11. Profile route exports GET and PATCH (not POST)
// ---------------------------------------------------------------------------

test('profile route exports GET and PATCH', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'profile', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(/export\s+(?:const\s+PATCH|(?:async\s+)?function\s+PATCH)/.test(src), 'must export PATCH');
});

// ---------------------------------------------------------------------------
// 12. Orgs route exports GET and POST
// ---------------------------------------------------------------------------

test('orgs route exports GET and POST', () => {
  const file = path.join(webRoot, 'app', 'api', 'orgs', 'route.js');
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
});

// ---------------------------------------------------------------------------
// 13. All route files export force-dynamic
// ---------------------------------------------------------------------------

test('every route.js file exports force-dynamic', () => {
  const missing = [];
  for (const file of allRouteFiles) {
    const src = fs.readFileSync(file, 'utf8');
    if (!/dynamic\s*=\s*'force-dynamic'/.test(src)) {
      missing.push(path.relative(webRoot, file));
    }
  }
  assert.deepEqual(missing, [], `Route files missing force-dynamic:\n${missing.join('\n')}`);
});

// ---------------------------------------------------------------------------
// 14. Workspace routes export correct methods
// ---------------------------------------------------------------------------

test('workspace associations route exports GET, POST, and DELETE', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'workspaces', '[name]', 'associations', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
  assert.ok(/export\s+(?:const\s+DELETE|(?:async\s+)?function\s+DELETE)/.test(src), 'must export DELETE');
});

test('workspace codespace route exports GET, POST, and DELETE', () => {
  const file = path.join(
    webRoot, 'app', 'api', 'orgs', '[org]', 'workspaces', '[name]', 'codespace', 'route.js',
  );
  const src = fs.readFileSync(file, 'utf8');
  assert.ok(/export\s+(?:const\s+GET|(?:async\s+)?function\s+GET)/.test(src), 'must export GET');
  assert.ok(/export\s+(?:const\s+POST|(?:async\s+)?function\s+POST)/.test(src), 'must export POST');
  assert.ok(/export\s+(?:const\s+DELETE|(?:async\s+)?function\s+DELETE)/.test(src), 'must export DELETE');
});
