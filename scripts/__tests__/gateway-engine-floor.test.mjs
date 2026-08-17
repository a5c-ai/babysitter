/**
 * FIX-008 — repo-wide enforcement of the program's definition-of-done item
 * "all accepted Node engine versions can import their package roots".
 *
 * `@a5c-ai/adapters-gateway` throws from `assertNodeSupportsGatewaySqlite()` at
 * module load below Node 22.13.0 (that is where `node:sqlite` stops needing
 * `--experimental-sqlite`). The gateway's own manifest, README and CI matrix
 * are pinned by packages/adapters/gateway/tests/node-engine-floor.test.ts, but
 * that gate only covers the gateway. Any *other* published package whose root
 * (or bin, or any exported subpath) statically evaluates the gateway inherits
 * the same floor — and `@a5c-ai/adapters-cli` shipped `>=20.9.0` while its root
 * imported the gateway through `./commands/gateway/index.js`, so npm accepted
 * installs on Node 20 that crashed on the first import.
 *
 * This suite derives the affected set from the sources instead of trusting a
 * hand-maintained list: scripts/lib/gateway-engine-floor.cjs walks the static
 * import graph from every published entrypoint across workspace boundaries.
 * Adding a static gateway import to a new package therefore fails here until
 * that package's `engines.node` is raised.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {
  collectGatewayReachingPackages,
  compareVersions,
  manifestNodeFloor,
  readGatewayMinimumNodeVersion,
} = require(path.join(repoRoot, 'scripts', 'lib', 'gateway-engine-floor.cjs'));

const GATEWAY_FLOOR = readGatewayMinimumNodeVersion(repoRoot);

test('the gateway floor is one number, shared by the gateway manifest and the derivation', () => {
  const gatewayManifest = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'packages', 'adapters', 'gateway', 'package.json'), 'utf8'),
  );
  assert.equal(manifestNodeFloor(gatewayManifest, '@a5c-ai/adapters-gateway'), GATEWAY_FLOOR);
  assert.equal(GATEWAY_FLOOR, '22.13.0');
});

test('the import-graph derivation resolves every edge it walks', () => {
  const { unresolved } = collectGatewayReachingPackages(repoRoot);
  const unique = [...new Set(unresolved.map((entry) => `${entry.file} -> ${entry.specifier}`))];
  assert.deepEqual(
    unique,
    [],
    'an unresolvable module edge means the derivation is blind on that path and could miss a gateway import',
  );
});

test('the derivation still finds the known gateway importer (the analysis is not silently empty)', () => {
  const { reaching } = collectGatewayReachingPackages(repoRoot);
  const names = reaching.map((entry) => entry.name);
  assert.ok(
    names.includes('@a5c-ai/adapters-cli'),
    '@a5c-ai/adapters-cli statically imports the gateway from its root (src/commands/gateway/serve.ts); ' +
      'if this is no longer detected the graph walk is broken, not the code',
  );
});

test('FIX-008: every published package that evaluates the gateway declares the gateway Node floor', () => {
  const { reaching } = collectGatewayReachingPackages(repoRoot);
  const violations = [];
  for (const entry of reaching) {
    const floor = manifestNodeFloor(entry.manifest, entry.name);
    if (floor === null) {
      violations.push(
        `${entry.name} declares no engines.node but evaluates the gateway via ${entry.via.join(' -> ')}`,
      );
      continue;
    }
    if (compareVersions(floor, GATEWAY_FLOOR) < 0) {
      violations.push(
        `${entry.name} declares engines.node >=${floor}, below the gateway floor ${GATEWAY_FLOOR}, ` +
          `via ${entry.via.join(' -> ')}`,
      );
    }
  }
  assert.deepEqual(violations, [], violations.join('\n'));
});

test('FIX-008: the packages that inherit the floor document the same number', () => {
  // Every place that publishes a Node floor for the adapters CLI family. A
  // stale "20.9.0" here is what sent users to an install that cannot import.
  const surfaces = [
    'README.md',
    'packages/adapters/cli/README.md',
    'packages/adapters/sdk/README.md',
    'docs/user-guide/getting-started/installation.md',
    'docs/user-guide/getting-started/migration.md',
    'docs/user-guide/reference/adapters-cli.md',
    'docs/user-guide/reference/glossary.md',
    'docs/user-guide/reference/troubleshooting.md',
    'docs/user-guide/reference/error-catalog.md',
    'docs/adapters/reference/10-cli-reference.md',
    'docs/adapters/reference/11-process-lifecycle-and-platform.md',
    // The adapters reference facts table. Its `Runtime` row published 20.9.0
    // for `@a5c-ai/adapters` long after that package inherited the gateway
    // floor, and nothing checked it; it is a surface now.
    'docs/adapters/reference/01-core-types-and-client.md',
  ];
  const { reaching } = collectGatewayReachingPackages(repoRoot);
  const inheritingNames = reaching.map((entry) => entry.name);

  const stale = [];
  for (const surface of surfaces) {
    const contents = fs.readFileSync(path.join(repoRoot, surface), 'utf8');
    contents.split('\n').forEach((line, index) => {
      const mentionsInheritingPackage = inheritingNames.some((name) => line.includes(name));
      const mentionsAdaptersCliBinary = /\badapters\b\s+CLI|`adapters`/i.test(line);
      if (!mentionsInheritingPackage && !mentionsAdaptersCliBinary) return;
      if (/\b20\.9(?:\.\d+)?\b/.test(line)) {
        stale.push(`${surface}:${index + 1}: ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(
    stale,
    [],
    `these lines still publish the pre-FIX-008 Node floor for a package that now requires >=${GATEWAY_FLOOR}:\n` +
      stale.join('\n'),
  );

  // And the two package READMEs must state the number itself.
  for (const readme of ['packages/adapters/cli/README.md', 'packages/adapters/sdk/README.md']) {
    assert.match(
      fs.readFileSync(path.join(repoRoot, readme), 'utf8'),
      new RegExp(`Node\\.js >= ${GATEWAY_FLOOR.replace(/\./g, '\\.')}`),
      `${readme} must document the Node floor it actually requires`,
    );
  }
});

test('a manifest below the floor is detected (the comparison is not vacuous)', () => {
  assert.equal(manifestNodeFloor({ engines: { node: '>=20.9.0' } }, 'fixture'), '20.9.0');
  assert.ok(compareVersions('20.9.0', GATEWAY_FLOOR) < 0);
  assert.ok(compareVersions('22.12.0', GATEWAY_FLOOR) < 0);
  assert.ok(compareVersions(GATEWAY_FLOOR, GATEWAY_FLOOR) === 0);
  assert.ok(compareVersions('24.0.0', GATEWAY_FLOOR) > 0);
  assert.equal(manifestNodeFloor({}, 'fixture'), null);
  assert.throws(
    () => manifestNodeFloor({ engines: { node: '^22.13.0' } }, 'fixture'),
    /exact ">=x\.y\.z" floor is required/,
  );
});
