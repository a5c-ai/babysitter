/**
 * Library smoke test: every JS process file under library/ must:
 *   1. Import without throwing.
 *   2. Export a `process` function (or be a methodology/spec that defines tasks).
 *   3. Pass a minimal-ctx callability check for files that export `process`.
 *
 * This does not exercise real behavior — just catches syntax errors, bad
 * imports, missing exports, and JSON-stringification hazards at the module
 * boundary. Deeper behavior belongs in integration runs.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const LIBRARY_ROOT = resolve(__dirname, '..');

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === '__tests__' || entry === 'node_modules' || entry.startsWith('.')) continue;
    const s = statSync(full);
    if (s.isDirectory()) walk(full, acc);
    else if (s.isFile() && entry.endsWith('.js')) acc.push(full);
  }
  return acc;
}

// Scope to the newly-authored surface areas (Phase 8-10). The broader
// library has pre-existing DuplicateTaskIdError issues (shared task ids
// across unrelated files); that's a separate cleanup.
const SCOPE_DIRS = [
  'processes/shared',
  'specializations/collaboration',
  'specializations/sourcing',
  'specializations/media',
  'specializations/authoring',
  'specializations/observability',
  'specializations/research',
  'specializations/business',
  'specializations/communication',
  'specializations/ux-ui-design/design-language.js',
  'specializations/ux-ui-design/storybook-documentation.js',
  'methodologies/deep-research.js',
  'methodologies/tdd.js',
];

const processFiles = SCOPE_DIRS.flatMap((entry) => {
  const full = join(LIBRARY_ROOT, entry);
  try {
    const s = statSync(full);
    return s.isDirectory() ? walk(full) : [full];
  } catch {
    return [];
  }
});

function makeFakeCtx() {
  // Minimal ctx shape: records calls, returns benign values. Never actually
  // dispatches a task. If process() walks any non-trivial branch that calls
  // ctx.task, the promise resolves synchronously with a placeholder and the
  // test is still satisfied because we only assert the top-level call did
  // not throw before returning.
  const stub = async () => ({ __stub: true });
  const ctx = {
    task: stub,
    agent: stub,
    breakpoint: async () => ({ approved: true, __stub: true }),
    sleepUntil: stub,
    orchestratorTask: stub,
    hook: stub,
    parallel: {
      all: async (promises) => Promise.all(promises),
      map: async (items, fn) => Promise.all(items.map(fn)),
    },
  };
  return ctx;
}

describe('library smoke: every .js file imports cleanly', () => {
  for (const abs of processFiles) {
    const rel = relative(LIBRARY_ROOT, abs).replace(/\\/g, '/');
    it(rel, async () => {
      const url = pathToFileURL(abs).href;
      const mod = await import(url);
      expect(mod).toBeDefined();
      // If the file exports `process`, it must be a function.
      if ('process' in mod) {
        expect(typeof mod.process).toBe('function');
      }
    });
  }
});

describe('library smoke: process() is callable with minimal inputs', () => {
  // A subset that can plausibly run with empty inputs + stub ctx without
  // throwing synchronously. Processes that unconditionally dereference a
  // required input field will be detected here.
  const CALLABLE_SUBSET = [
    'processes/shared/local-dev-workflow.js',
    'processes/shared/ci/idempotency-and-safe-abort.js',
    'specializations/collaboration/github/draft-pr-policy.js',
    'specializations/collaboration/github/issue-only-no-direct-commits.js',
    'specializations/collaboration/github/issue-linking.js',
    'specializations/collaboration/github/label-taxonomy.js',
  ];

  for (const rel of CALLABLE_SUBSET) {
    it(rel, async () => {
      const abs = join(LIBRARY_ROOT, rel);
      const mod = await import(pathToFileURL(abs).href);
      expect(typeof mod.process).toBe('function');
      // Call with empty-ish inputs + stub ctx. We only assert it returns
      // a thenable that resolves (no sync throws, no rejected promise for
      // trivial input).
      const result = await mod.process({}, makeFakeCtx());
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  }
});
