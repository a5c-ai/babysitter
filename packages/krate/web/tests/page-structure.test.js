/**
 * Page Structure Tests -- Verify that Next.js page files follow conventions:
 * - export default async function
 * - export const metadata with title
 * - export const dynamic = 'force-dynamic'
 * - error.jsx and loading.jsx files exist where expected
 *
 * Reads files as text -- no JSX compilation or React required.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const orgPagesDir = path.join(webRoot, 'app', 'orgs', '[org]');

/** Recursively collect all page.jsx files under a directory. */
function collectPageFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectPageFiles(full));
    else if (entry.name === 'page.jsx') results.push(full);
  }
  return results;
}

/** Recursively collect all error.jsx files under a directory. */
function collectErrorFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectErrorFiles(full));
    else if (entry.name === 'error.jsx') results.push(full);
  }
  return results;
}

const orgPageFiles = collectPageFiles(orgPagesDir);
const allErrorFiles = collectErrorFiles(path.join(webRoot, 'app'));

// ---------------------------------------------------------------------------
// 1. Every page.jsx under /app/orgs/[org]/ exports a default async function
// ---------------------------------------------------------------------------

test('all org page.jsx files export a default async function', () => {
  assert.ok(orgPageFiles.length >= 40, `expected >= 40 page files, found ${orgPageFiles.length}`);

  const violations = [];
  for (const file of orgPageFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    if (!/export\s+default\s+async\s+function/.test(src)) {
      violations.push(rel);
    }
  }
  assert.deepEqual(
    violations, [],
    `Pages must export default async function:\n${violations.join('\n')}`,
  );
});

// ---------------------------------------------------------------------------
// 2. Every page.jsx has export const metadata with at least a title
// ---------------------------------------------------------------------------

test('all org page.jsx files have metadata with a title', () => {
  const violations = [];
  for (const file of orgPageFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    if (!/export\s+const\s+metadata\s*=/.test(src)) {
      violations.push(`${rel}: missing export const metadata`);
    } else if (!/title\s*:/.test(src)) {
      violations.push(`${rel}: metadata has no title`);
    }
  }
  assert.deepEqual(
    violations, [],
    `Pages must have metadata with title:\n${violations.join('\n')}`,
  );
});

// ---------------------------------------------------------------------------
// 3. Every page.jsx has export const dynamic = 'force-dynamic'
// ---------------------------------------------------------------------------

test('all org page.jsx files have force-dynamic', () => {
  const violations = [];
  for (const file of orgPageFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    if (!/dynamic\s*=\s*'force-dynamic'/.test(src)) {
      violations.push(rel);
    }
  }
  assert.deepEqual(
    violations, [],
    `Pages must set dynamic = 'force-dynamic':\n${violations.join('\n')}`,
  );
});

// ---------------------------------------------------------------------------
// 4. Error boundary files export default function Error with reset param
// ---------------------------------------------------------------------------

test('all error.jsx files export default function Error', () => {
  assert.ok(allErrorFiles.length >= 10, `expected >= 10 error files, found ${allErrorFiles.length}`);

  const violations = [];
  for (const file of allErrorFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    if (!/export\s+default\s+function\s+Error/.test(src)) {
      violations.push(`${rel}: missing export default function Error`);
    }
  }
  assert.deepEqual(
    violations, [],
    `Error files must export default function Error:\n${violations.join('\n')}`,
  );
});

test('all error.jsx files accept a reset parameter', () => {
  const violations = [];
  for (const file of allErrorFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    if (!src.includes('reset')) {
      violations.push(`${rel}: missing reset parameter`);
    }
  }
  assert.deepEqual(
    violations, [],
    `Error files must accept reset param:\n${violations.join('\n')}`,
  );
});

test('all error.jsx files start with "use client" directive', () => {
  const violations = [];
  for (const file of allErrorFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    const firstLine = src.split('\n').find((l) => l.trim().length > 0);
    if (!firstLine || !firstLine.includes('use client')) {
      violations.push(rel);
    }
  }
  assert.deepEqual(
    violations, [],
    `Error files must start with 'use client':\n${violations.join('\n')}`,
  );
});

// ---------------------------------------------------------------------------
// 5. Loading files exist for key route groups
// ---------------------------------------------------------------------------

test('loading.jsx files exist for key route groups under orgs/[org]', () => {
  const expectedGroups = [
    'agents',
    'inference',
    'external',
    'repositories',
    'models',
    'playground',
    'costs',
    'settings',
  ];
  const missing = [];
  for (const group of expectedGroups) {
    const loadingPath = path.join(orgPagesDir, group, 'loading.jsx');
    if (!fs.existsSync(loadingPath)) {
      missing.push(group);
    }
  }
  assert.deepEqual(missing, [], `Missing loading.jsx for groups: ${missing.join(', ')}`);
});

test('loading.jsx files export default function Loading', () => {
  const loadingDir = orgPagesDir;
  const loadingFiles = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'loading.jsx') loadingFiles.push(full);
    }
  }
  walk(loadingDir);

  assert.ok(loadingFiles.length >= 5, `expected >= 5 loading files, found ${loadingFiles.length}`);

  const violations = [];
  for (const file of loadingFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    if (!/export\s+default\s+function\s+Loading/.test(src)) {
      violations.push(rel);
    }
  }
  assert.deepEqual(
    violations, [],
    `Loading files must export default function Loading:\n${violations.join('\n')}`,
  );
});

// ---------------------------------------------------------------------------
// 6. Error boundary files exist for major route groups
// ---------------------------------------------------------------------------

test('error.jsx files exist for major route groups under orgs/[org]', () => {
  const expectedGroups = [
    'agents',
    'inference',
    'external',
    'repositories',
    'people',
    'profile',
    'runs',
  ];
  const missing = [];
  for (const group of expectedGroups) {
    const errorPath = path.join(orgPagesDir, group, 'error.jsx');
    if (!fs.existsSync(errorPath)) {
      missing.push(group);
    }
  }
  assert.deepEqual(missing, [], `Missing error.jsx for groups: ${missing.join(', ')}`);
});

// ---------------------------------------------------------------------------
// 7. All page files are non-trivial (have enough content)
// ---------------------------------------------------------------------------

test('no page.jsx is trivially empty', () => {
  const violations = [];
  for (const file of orgPageFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    const lines = src.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 4) {
      violations.push(`${rel}: only ${lines.length} non-empty lines`);
    }
  }
  assert.deepEqual(
    violations, [],
    `Page files must have meaningful content:\n${violations.join('\n')}`,
  );
});

// ---------------------------------------------------------------------------
// 8. Root-level pages also follow conventions
// ---------------------------------------------------------------------------

test('root page.jsx and orgs/page.jsx have metadata and dynamic exports', () => {
  const rootPages = [
    path.join(webRoot, 'app', 'page.jsx'),
    path.join(webRoot, 'app', 'orgs', 'page.jsx'),
    path.join(webRoot, 'app', 'login', 'page.jsx'),
    path.join(webRoot, 'app', 'logout', 'page.jsx'),
  ];
  for (const file of rootPages) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    assert.ok(
      /export\s+const\s+metadata\s*=/.test(src),
      `${rel} must have export const metadata`,
    );
    assert.ok(
      /dynamic\s*=\s*'force-dynamic'/.test(src),
      `${rel} must have force-dynamic`,
    );
    assert.ok(
      /export\s+default\s+async\s+function/.test(src),
      `${rel} must export default async function`,
    );
  }
});

test('agent identity directory pages exist and use page conventions', () => {
  const pages = [
    ['agents', 'directory', 'page.jsx'],
    ['agents', 'directory', '[name]', 'page.jsx'],
    ['agents', 'directory', 'new', 'page.jsx'],
  ];
  for (const parts of pages) {
    const file = path.join(orgPagesDir, ...parts);
    assert.ok(fs.existsSync(file), `Missing ${path.relative(webRoot, file)}`);
    const src = fs.readFileSync(file, 'utf8');
    assert.match(src, /export\s+const\s+metadata\s*=/, `${path.relative(webRoot, file)} missing metadata`);
    assert.match(src, /title\s*:/, `${path.relative(webRoot, file)} missing metadata title`);
    assert.match(src, /dynamic\s*=\s*'force-dynamic'/, `${path.relative(webRoot, file)} missing force-dynamic`);
    assert.match(src, /export\s+default\s+async\s+function/, `${path.relative(webRoot, file)} missing async default page`);
  }
});

// ---------------------------------------------------------------------------
// 9. Page metadata titles all include "Krate"
// ---------------------------------------------------------------------------

test('all page metadata titles include "Krate"', () => {
  const allPages = [
    ...orgPageFiles,
    path.join(webRoot, 'app', 'page.jsx'),
    path.join(webRoot, 'app', 'orgs', 'page.jsx'),
    path.join(webRoot, 'app', 'login', 'page.jsx'),
    path.join(webRoot, 'app', 'logout', 'page.jsx'),
  ];
  const violations = [];
  for (const file of allPages) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    // Extract title value from metadata
    const titleMatch = src.match(/title\s*:\s*['"]([^'"]+)['"]/);
    if (titleMatch && !titleMatch[1].includes('Krate')) {
      violations.push(`${rel}: title "${titleMatch[1]}" does not include "Krate"`);
    }
  }
  assert.deepEqual(
    violations, [],
    `All page titles should include "Krate":\n${violations.join('\n')}`,
  );
});

// ---------------------------------------------------------------------------
// 10. Error boundaries include a user-visible recovery action
// ---------------------------------------------------------------------------

test('error.jsx files include a reset or reload recovery action', () => {
  const violations = [];
  for (const file of allErrorFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(webRoot, file);
    const hasRecovery = src.includes('reset') || src.includes('reload') || src.includes('Try again');
    if (!hasRecovery) {
      violations.push(rel);
    }
  }
  assert.deepEqual(
    violations, [],
    `Error files must include a recovery action:\n${violations.join('\n')}`,
  );
});
