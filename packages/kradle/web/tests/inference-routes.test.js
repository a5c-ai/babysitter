/**
 * Inference Routes Tests
 *
 * Verify that the KServe inference API route files exist and that the
 * inference UI pages exist in the Next.js app directory.
 * Runs in Node.js without starting Next.js or React.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.join(__dirname, '..');

// ---------------------------------------------------------------------------
// API route existence
// ---------------------------------------------------------------------------

test('inference services API route exists', () => {
  const routePath = path.join(
    webRoot,
    'app', 'api', 'orgs', '[org]', 'inference', 'services',
    'route.js'
  );
  assert.ok(
    fs.existsSync(routePath),
    `inference services route must exist at ${routePath}`
  );
});

test('inference runtimes API route exists', () => {
  const routePath = path.join(
    webRoot,
    'app', 'api', 'orgs', '[org]', 'inference', 'runtimes',
    'route.js'
  );
  assert.ok(
    fs.existsSync(routePath),
    `inference runtimes route must exist at ${routePath}`
  );
});

test('inference service detail route exists', () => {
  const routePath = path.join(
    webRoot,
    'app', 'api', 'orgs', '[org]', 'inference', 'services', '[name]',
    'route.js'
  );
  assert.ok(
    fs.existsSync(routePath),
    `inference service detail route must exist at ${routePath}`
  );
});

// ---------------------------------------------------------------------------
// UI page existence
// ---------------------------------------------------------------------------

test('inference UI page exists in orgs/[org]', () => {
  const pagePath = path.join(
    webRoot,
    'app', 'orgs', '[org]', 'inference', 'page.jsx'
  );
  assert.ok(
    fs.existsSync(pagePath),
    `inference page must exist at ${pagePath}`
  );
});

test('inference service detail UI page exists', () => {
  const pagePath = path.join(
    webRoot,
    'app', 'orgs', '[org]', 'inference', '[name]', 'page.jsx'
  );
  assert.ok(
    fs.existsSync(pagePath),
    `inference service detail page must exist at ${pagePath}`
  );
});

test('inference UI page references InferenceServicesPage', () => {
  const pagePath = path.join(
    webRoot,
    'app', 'orgs', '[org]', 'inference', 'page.jsx'
  );
  const content = fs.readFileSync(pagePath, 'utf8');
  assert.ok(
    content.includes('InferenceServicesPage'),
    'inference page must reference InferenceServicesPage component'
  );
});
