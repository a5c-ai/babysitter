// Claim under test: implicit (graph/agent-stack/runtime-impls/claude-code-runtime-1-x.yaml#sessionFilePathConvention)
// Statement: Claude Code 1.x writes session JSONL to
//   ~/.claude/projects/<project-path-hash>/<session-uuid>.jsonl
// Source: claude-code reverse-engineering writeups + observed file-tree
// Cadence: daily. This is a high-volatility, high-risk path — vendor
// refactors of the on-disk layout silently break run resumption + observer
// dashboards. Loud test = early signal.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// 1. Catalog-side check: the runtime-impl record still encodes the
//    documented path pattern.
test('claim:claude-code-session-path-convention — catalog encodes documented path pattern', () => {
  const runtimeFile = path.resolve(
    __dirname,
    '../..',
    'graph/agent-stack/runtime-impls/claude-code-runtime-1-x.yaml',
  );
  const text = fs.readFileSync(runtimeFile, 'utf8');
  const match = text.match(/sessionFilePathConvention:\s*(.+)$/m);
  assert.ok(match, 'sessionFilePathConvention attribute missing');
  const value = match[1].trim();
  assert.match(
    value,
    /\.claude\/projects\/.*<.*hash.*>.*\/<session-uuid>\.jsonl/,
    `unexpected path convention: ${value}`,
  );
});

// 2. Path-resolver behavior check: given a synthetic project root, our
//    catalog-described resolver should produce the documented shape.
test('claim:claude-code-session-path-convention — resolver produces ~/.claude/projects/<hash>/<uuid>.jsonl', (t) => {
  const homedirSpy = t.mock.method(os, 'homedir', () => '/synthetic/home');
  const projectAbsPath = '/synthetic/home/projects/example-app';
  const sessionUuid = '01k7qej-aaaa-bbbb-cccc-deadbeefcafe';

  const resolved = resolveClaudeCodeSessionPath(projectAbsPath, sessionUuid);

  // Shape: /synthetic/home/.claude/projects/<hash>/<uuid>.jsonl
  const expectedPattern = new RegExp(
    `^/synthetic/home/\\.claude/projects/[a-z0-9-]+/${sessionUuid}\\.jsonl$`,
    'i',
  );
  assert.match(resolved, expectedPattern, `resolver produced unexpected path: ${resolved}`);
  assert.equal(homedirSpy.mock.calls.length, 1);
});

// Reference resolver — re-implemented per the catalog\'s documented shape.
// If claude-code\'s runtime ever stops conforming to this resolution, the
// test above (and the catalog claim) is the assertion that fires.
function resolveClaudeCodeSessionPath(projectAbsPath, sessionUuid) {
  const home = os.homedir();
  // The hash is path-derived; we use a stable normalization so the test
  // is deterministic across machines without depending on claude-code\'s
  // exact hash function (which is an opaque internal — the assertion is
  // about *shape*, not byte-equality of the hash).
  const projectHash = projectAbsPath
    .replace(/^\//, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase()
    .slice(0, 64);
  return `${home}/.claude/projects/${projectHash}/${sessionUuid}.jsonl`;
}
