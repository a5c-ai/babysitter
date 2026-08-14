/**
 * scripts/known-package-defects.json is the ONLY way a tracked defect is
 * tolerated by the release gates, so every list in it must obey the same two
 * rules: a structured entry naming its FIX id, and staleness detection that
 * forces the entry out once the defect stops reproducing.
 *
 * The `installScripts` list obeyed NEITHER. It also accepted a bare
 * package-name string (so no fixId was required) and nothing ever noticed an
 * entry had become unnecessary — and it is the one list that switches OFF a
 * security control: every other package is installed into the clean consumer
 * with `--ignore-scripts`, an allowlisted one is not.
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
  DEFECT_SECTIONS,
  collectSchemaProblems,
  collectStaleInstallScriptEntries,
  installScriptAllowlist,
} = require('../lib/known-package-defects.cjs');
const { listPublishablePackages } = require('../lib/publishable-packages.cjs');

const DEFECTS_PATH = path.join(repoRoot, 'scripts', 'known-package-defects.json');
const SOURCE = 'scripts/known-package-defects.json';

function readDefects() {
  return JSON.parse(fs.readFileSync(DEFECTS_PATH, 'utf8'));
}

const VALID_ENTRY = {
  package: '@a5c-ai/atlas',
  fixId: 'FIX-011',
  reason: 'tracked while the underlying fix is in flight',
};

test('installScripts is held to the same entry schema as every other section', () => {
  assert.ok(DEFECT_SECTIONS.includes('installScripts'), 'installScripts must be a governed section');

  assert.deepEqual(collectSchemaProblems({ installScripts: [VALID_ENTRY] }, SOURCE), []);

  // The bare-string form that used to be accepted.
  const bareString = collectSchemaProblems({ installScripts: ['@a5c-ai/atlas'] }, SOURCE);
  assert.equal(bareString.length, 1);
  assert.match(bareString[0], /must be objects/);

  const noFixId = collectSchemaProblems(
    { installScripts: [{ package: '@a5c-ai/atlas', reason: 'because' }] },
    SOURCE,
  );
  assert.equal(noFixId.length, 1);
  assert.match(noFixId[0], /must reference its FIX id/);

  const noReason = collectSchemaProblems(
    { installScripts: [{ package: '@a5c-ai/atlas', fixId: 'FIX-011' }] },
    SOURCE,
  );
  assert.equal(noReason.length, 1);
  assert.match(noReason[0], /must state why/);

  const badFixId = collectSchemaProblems(
    { installScripts: [{ ...VALID_ENTRY, fixId: 'later' }] },
    SOURCE,
  );
  assert.equal(badFixId.length, 1);
  assert.match(badFixId[0], /FIX id/);
});

test('the packed-artifact gate refuses to read an unstructured installScripts allowlist', () => {
  assert.deepEqual(installScriptAllowlist({ installScripts: [VALID_ENTRY] }, SOURCE), ['@a5c-ai/atlas']);
  assert.deepEqual(installScriptAllowlist({}, SOURCE), []);
  assert.throws(
    () => installScriptAllowlist({ installScripts: ['@a5c-ai/atlas'] }, SOURCE),
    /must be objects/,
    'a bare package name must be rejected, not silently honoured',
  );
  assert.throws(
    () => installScriptAllowlist({ installScripts: [{ package: '@a5c-ai/atlas', reason: 'x' }] }, SOURCE),
    /FIX id/,
  );
});

test('an installScripts entry is stale as soon as it stops reproducing', () => {
  const inventory = [
    { name: '@fixture/with-install-script', manifest: { scripts: { postinstall: 'node ./setup.js' } } },
    { name: '@fixture/without-install-script', manifest: { scripts: { build: 'tsc' } } },
  ];

  assert.deepEqual(
    collectStaleInstallScriptEntries({
      defects: { installScripts: [{ package: '@fixture/with-install-script', fixId: 'FIX-011', reason: 'x' }] },
      inventory,
    }),
    [],
    'an entry whose package still runs an install script is not stale',
  );

  const noLifecycle = collectStaleInstallScriptEntries({
    defects: { installScripts: [{ package: '@fixture/without-install-script', fixId: 'FIX-011', reason: 'x' }] },
    inventory,
  });
  assert.equal(noLifecycle.length, 1);
  assert.match(noLifecycle[0], /declares no install lifecycle script/);

  const gone = collectStaleInstallScriptEntries({
    defects: { installScripts: [{ package: '@fixture/deleted', fixId: 'FIX-011', reason: 'x' }] },
    inventory,
  });
  assert.equal(gone.length, 1);
  assert.match(gone[0], /not a publishable package any more/);
});

test('the checked-in defect file obeys the schema and carries no stale installScripts entry', () => {
  const defects = readDefects();
  assert.deepEqual(collectSchemaProblems(defects, SOURCE), []);
  assert.deepEqual(
    collectStaleInstallScriptEntries({ defects, inventory: listPublishablePackages(repoRoot) }),
    [],
  );
});

test('the enforced end-state of every allowlist, installScripts included, is empty', () => {
  const defects = readDefects();
  for (const section of DEFECT_SECTIONS) {
    assert.deepEqual(
      defects[section] ?? [],
      [],
      `${section} must be empty; a tolerated defect is a defect that has not been fixed`,
    );
  }
});
