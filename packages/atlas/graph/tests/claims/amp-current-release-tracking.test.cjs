// Claim under test: implicit (graph/agent-stack/versions/amp-current.yaml)
// Statement: Amp current tracks @ampcode/cli 0.0.1779959155-g362e01 as the
// current npm-backed release, with no public release-note evidence for launch,
// transport, auth, MCP, API, package, or install-method changes.
// Source: npmjs.com/package/@ampcode/cli/v/0.0.1779959155-g362e01 and issue #503.
// Cadence: weekly. Commit-stamped upstream CLI releases are high churn, so the
// catalog needs a cheap guardrail against silently losing the assimilation note.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TARGET_VERSION = '0.0.1779959155-g362e01';

test('claim:amp-current-release-tracking - catalog records target npm release metadata', () => {
  const versionFile = path.resolve(
    __dirname,
    '..',
    '..',
    'agent-stack/versions/amp-current.yaml',
  );
  const text = fs.readFileSync(versionFile, 'utf8');

  assert.match(text, /^id:\s*agent-version:amp@current$/m);
  assert.match(text, /^\s*sourcePackage:\s*"@ampcode\/cli"$/m);
  assert.match(text, new RegExp(`^\\s*versionRange:\\s*">=${escapeRegex(TARGET_VERSION)}"$`, 'm'));
  assert.match(text, new RegExp(`^\\s*currentVersion:\\s*"${escapeRegex(TARGET_VERSION)}"$`, 'm'));
  assert.match(
    text,
    new RegExp(
      `^\\s*releaseNotesUrl:\\s*"https://www\\.npmjs\\.com/package/@ampcode/cli/v/${escapeRegex(TARGET_VERSION)}"$`,
      'm',
    ),
  );
});

test('claim:amp-current-release-tracking - catalog preserves no-public-release-notes finding', () => {
  const versionFile = path.resolve(
    __dirname,
    '..',
    '..',
    'agent-stack/versions/amp-current.yaml',
  );
  const text = fs.readFileSync(versionFile, 'utf8');

  assert.match(text, /no public Amp changelog or GitHub release note was found/);
  assert.match(text, /No release-note evidence of CLI flag, transport, auth, MCP, or package-name changes was found/);
  assert.match(text, /Install method and package name remain npm install -g @ampcode\/cli/);
  assert.match(text, /^\s*cliCommand:\s*"amp"$/m);
  assert.match(text, /^\s*-\s*install:npm$/m);
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
