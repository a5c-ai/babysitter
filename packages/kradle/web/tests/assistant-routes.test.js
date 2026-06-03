/**
 * Assistant Routes Tests
 *
 * Verify that the assistant API route files exist and that the
 * assistant UI page exists in the Next.js app directory.
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

test('assistant chat API route exists', () => {
  const routePath = path.join(
    webRoot,
    'app', 'api', 'orgs', '[org]', 'assistant', 'chat',
    'route.js'
  );
  assert.ok(
    fs.existsSync(routePath),
    `assistant chat route must exist at ${routePath}`
  );
});

test('assistant sessions API route exists', () => {
  const routePath = path.join(
    webRoot,
    'app', 'api', 'orgs', '[org]', 'assistant', 'sessions',
    'route.js'
  );
  assert.ok(
    fs.existsSync(routePath),
    `assistant sessions route must exist at ${routePath}`
  );
});

test('assistant generate API route exists', () => {
  const routePath = path.join(
    webRoot,
    'app', 'api', 'orgs', '[org]', 'assistant', 'generate',
    'route.js'
  );
  assert.ok(
    fs.existsSync(routePath),
    `assistant generate route must exist at ${routePath}`
  );
});

// ---------------------------------------------------------------------------
// UI page existence
// ---------------------------------------------------------------------------

test('assistant UI page exists in orgs/[org]', () => {
  const pagePath = path.join(
    webRoot,
    'app', 'orgs', '[org]', 'assistant', 'page.jsx'
  );
  assert.ok(
    fs.existsSync(pagePath),
    `assistant page must exist at ${pagePath}`
  );
});

test('assistant UI page references AssistantPage', () => {
  const pagePath = path.join(
    webRoot,
    'app', 'orgs', '[org]', 'assistant', 'page.jsx'
  );
  const content = fs.readFileSync(pagePath, 'utf8');
  assert.ok(
    content.includes('AssistantPage'),
    'assistant page must reference AssistantPage component'
  );
});

test('assistant sessions directory exists', () => {
  const sessionsDir = path.join(
    webRoot,
    'app', 'api', 'orgs', '[org]', 'assistant', 'sessions'
  );
  assert.ok(
    fs.existsSync(sessionsDir),
    `assistant sessions directory must exist at ${sessionsDir}`
  );
});
