/**
 * Artifact Registry Routes Tests
 *
 * Verify that the artifact registry API route files exist and that the
 * artifact UI pages exist in the Next.js app directory.
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

test('artifact registries API route exists', () => {
  const routePath = path.join(
    webRoot,
    'app', 'api', 'orgs', '[org]', 'artifacts', 'registries',
    'route.js'
  );
  assert.ok(
    fs.existsSync(routePath),
    `artifact registries route must exist at ${routePath}`
  );
});

test('artifact feeds API route exists', () => {
  const routePath = path.join(
    webRoot,
    'app', 'api', 'orgs', '[org]', 'artifacts', 'feeds',
    'route.js'
  );
  assert.ok(
    fs.existsSync(routePath),
    `artifact feeds route must exist at ${routePath}`
  );
});

test('artifact publish API route exists', () => {
  const routePath = path.join(
    webRoot,
    'app', 'api', 'orgs', '[org]', 'artifacts', 'feeds', '[feed]', 'publish',
    'route.js'
  );
  assert.ok(
    fs.existsSync(routePath),
    `artifact publish route must exist at ${routePath}`
  );
});

// ---------------------------------------------------------------------------
// UI page existence
// ---------------------------------------------------------------------------

test('artifact registries UI page exists in orgs/[org]', () => {
  const pagePath = path.join(
    webRoot,
    'app', 'orgs', '[org]', 'artifacts', 'page.jsx'
  );
  assert.ok(
    fs.existsSync(pagePath),
    `artifact registries page must exist at ${pagePath}`
  );
});

test('artifact registry detail UI page exists', () => {
  const pagePath = path.join(
    webRoot,
    'app', 'orgs', '[org]', 'artifacts', '[registryName]', 'page.jsx'
  );
  assert.ok(
    fs.existsSync(pagePath),
    `artifact registry detail page must exist at ${pagePath}`
  );
});

test('artifact registries UI page references ArtifactRegistriesPage', () => {
  const pagePath = path.join(
    webRoot,
    'app', 'orgs', '[org]', 'artifacts', 'page.jsx'
  );
  const content = fs.readFileSync(pagePath, 'utf8');
  assert.ok(
    content.includes('ArtifactRegistriesPage'),
    'artifacts page must reference ArtifactRegistriesPage component'
  );
});
