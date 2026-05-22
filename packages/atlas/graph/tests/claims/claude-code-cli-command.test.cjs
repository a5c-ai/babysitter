// Claim under test: claim:claude-code-cli-command
// Statement: Claude Code 1.x is launched via the `claude` CLI command.
// Source: docs.anthropic.com/en/docs/claude-code (vendor doc)
// Cadence: weekly. Vendors rarely rename their CLI binary, but renames
// have happened (e.g. "openai" → "codex"), so a periodic regression check
// is cheap and high-value.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('node:fs').readFileSync;

// Load the AgentVersion record and assert the cliCommand attribute.
// This is a structural test — it verifies the catalog\'s recorded value
// matches the vendor-documented expectation. To detect *vendor* drift,
// pair this with the live-monitoring path below (recorded fixture of
// `claude --help` output).
test('claim:claude-code-cli-command — catalog records cliCommand="claude"', () => {
  const versionFile = path.resolve(
    __dirname,
    '../..',
    'graph/agent-stack/versions/claude-code-1-x.yaml',
  );
  const text = fs.readFileSync(versionFile, 'utf8');
  // Lightweight regex — avoids pulling in a YAML parser dep.
  const match = text.match(/^\s*cliCommand:\s*"?([\w-]+)"?\s*$/m);
  assert.ok(match, 'cliCommand attribute missing from agent-version:claude-code@1.x');
  assert.equal(match[1], 'claude');
});

// Vendor-drift detection: if a fixture of `claude --help` output exists,
// assert it still advertises the recorded command name. Keep the fixture
// gitignored if it carries auth/license artifacts; this is a smoke test
// that only runs when a fixture is present (skipped otherwise).
test('claim:claude-code-cli-command — claude --help fixture still mentions "claude"', { skip: !fixtureExists() }, () => {
  const fixturePath = path.resolve(
    __dirname,
    '__fixtures__/claim-claude-code-cli-command/help-output.txt',
  );
  const helpOutput = fs.readFileSync(fixturePath, 'utf8');
  assert.match(helpOutput, /^\s*claude\b/m, 'fixture no longer advertises `claude` as the binary name');
});

function fixtureExists() {
  try {
    fs.accessSync(
      path.resolve(__dirname, '__fixtures__/claim-claude-code-cli-command/help-output.txt'),
    );
    return true;
  } catch {
    return false;
  }
}
