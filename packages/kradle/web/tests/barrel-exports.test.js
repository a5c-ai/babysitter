/**
 * Barrel index tests -- verify components/index.js re-exports from all
 * subdirectories, exposes the expected symbol count, and has no duplicates.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const barrelPath = path.join(webRoot, 'app', 'components', 'index.js');
const barrelSrc = fs.readFileSync(barrelPath, 'utf8');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract every exported name from `export { A, B } from '...'` lines. */
function extractExportedNames(src) {
  const names = [];
  // Named re-exports: export { Foo, Bar } from '...'
  for (const m of src.matchAll(/export\s*\{([^}]+)\}\s*from/g)) {
    for (const token of m[1].split(',')) {
      const name = token.trim().split(/\s+as\s+/).pop().trim();
      if (name) names.push(name);
    }
  }
  return names;
}

/** Extract the subdirectory each import line references (e.g. './agent/...' -> 'agent'). */
function extractReferencedSubdirs(src) {
  const dirs = new Set();
  for (const m of src.matchAll(/from\s+['"]\.\/([\w-]+)\//g)) {
    dirs.add(m[1]);
  }
  return dirs;
}

// ---------------------------------------------------------------------------
// Tests — subdirectory coverage
// ---------------------------------------------------------------------------

const EXPECTED_SUBDIRS = [
  'agent',
  'inference',
  'workspace',
  'repo',
  'kanban',
  'external',
  'settings',
  'shell',
  'observability',
  'assistant',
];

test('barrel index re-exports from all 10 component subdirectories', () => {
  const referenced = extractReferencedSubdirs(barrelSrc);
  for (const dir of EXPECTED_SUBDIRS) {
    assert.ok(referenced.has(dir), `barrel must re-export from ./${dir}/`);
  }
});

for (const dir of EXPECTED_SUBDIRS) {
  test(`barrel index references the "${dir}" subdirectory`, () => {
    const pattern = new RegExp(`from\\s+['\"]\\.\\/` + dir + `\\/`);
    assert.match(barrelSrc, pattern, `missing re-export from ./${dir}/`);
  });
}

// ---------------------------------------------------------------------------
// Tests — export volume & shape
// ---------------------------------------------------------------------------

test('barrel index exports at least 80 symbols', () => {
  const names = extractExportedNames(barrelSrc);
  assert.ok(
    names.length >= 80,
    `expected >= 80 exported symbols, got ${names.length}`
  );
});

test('barrel index has no duplicate export names', () => {
  const names = extractExportedNames(barrelSrc);
  const seen = new Set();
  const dupes = [];
  for (const n of names) {
    if (seen.has(n)) dupes.push(n);
    seen.add(n);
  }
  assert.deepEqual(dupes, [], `duplicate export names: ${dupes.join(', ')}`);
});

test('barrel index contains only re-export statements and comments (no logic)', () => {
  // The barrel uses multi-line export blocks, so continuation lines (identifiers,
  // closing braces with `from`) are allowed alongside `export` lines and comments.
  const nonExportLines = barrelSrc
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;                         // blank
      if (l.startsWith('//')) return false;          // comment
      if (l.startsWith('export ') || l.startsWith('export{')) return false; // export start
      if (l.startsWith('}')) return false;           // closing brace of multi-line export
      // Continuation line inside multi-line export { ... } -- identifiers with commas
      if (/^[\w\s,]+,?$/.test(l)) return false;
      return true;
    });
  assert.deepEqual(
    nonExportLines,
    [],
    `barrel should only contain export lines and comments, found: ${nonExportLines.join(' | ')}`
  );
});

// ---------------------------------------------------------------------------
// Tests — file existence for every referenced module
// ---------------------------------------------------------------------------

test('every barrel import path resolves to an existing file', () => {
  const missing = [];
  for (const m of barrelSrc.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
    const relPath = m[1];
    const absPath = path.resolve(path.join(webRoot, 'app', 'components'), relPath);
    if (!fs.existsSync(absPath)) {
      missing.push(relPath);
    }
  }
  assert.deepEqual(missing, [], `barrel references missing files: ${missing.join(', ')}`);
});

test('every component subdirectory has at least one file referenced by barrel', () => {
  const componentsDir = path.join(webRoot, 'app', 'components');
  const subdirs = fs.readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const referenced = extractReferencedSubdirs(barrelSrc);
  const unreferenced = subdirs.filter((d) => !referenced.has(d));
  assert.deepEqual(
    unreferenced,
    [],
    `subdirectories not referenced by barrel: ${unreferenced.join(', ')}`
  );
});

test('barrel index exports agent identity components', () => {
  const expected = [
    'AgentDirectory',
    'AgentProfileCard',
    'AgentProfilePage',
    'AgentPersonaEditor',
    'AgentSoulEditor',
    'AgentAppearanceEditor',
    'AgentVoiceEditor',
    'AgentDefinitionForm',
    'AgentCreateWizard',
    'AgentPersonalityTraits',
  ];
  for (const symbol of expected) {
    assert.ok(barrelSrc.includes(symbol), `components barrel must export ${symbol}`);
  }
});
