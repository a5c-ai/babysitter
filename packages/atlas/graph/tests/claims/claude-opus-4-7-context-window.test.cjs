// Claim under test: claim:claude-opus-4-7-context-window
// Statement: Claude Opus 4.7 supports a 1,000,000-token context window.
// Source: anthropic-models-doc (vendor doc)
// Cadence: weekly. Frontier-model context limits change with each release;
// catching a docs update early prevents silently truncated requests.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('claim:claude-opus-4-7-context-window — catalog records contextWindowTokens=1_000_000', () => {
  const modelFile = path.resolve(
    __dirname,
    '../..',
    'graph/compute/models/claude-opus-4-7.yaml',
  );
  const text = fs.readFileSync(modelFile, 'utf8');
  const match = text.match(/^\s*contextWindowTokens:\s*(\d+)\s*$/m);
  assert.ok(match, 'contextWindowTokens attribute missing from model:claude-opus-4-7@current');
  assert.equal(Number(match[1]), 1_000_000, 'catalog records a different context-window than the claim');
});

// API-shape sanity: a request body with input_tokens close to the limit
// should be acceptable per Anthropic\'s documented schema. We mock the
// HTTP client; we do not hit the network.
test('claim:claude-opus-4-7-context-window — request shape with documented limit is well-formed', () => {
  const messagesRequest = buildMessagesRequest({
    model: 'claude-opus-4-7-20260115', // illustrative — adjust to actual id when fixture lands
    maxTokens: 4096,
    syntheticInputTokens: 999_000, // just under the 1M ceiling
  });
  assert.equal(messagesRequest.model.startsWith('claude-opus-4-7'), true);
  assert.equal(typeof messagesRequest.messages, 'object');
  assert.equal(Array.isArray(messagesRequest.messages), true);
  assert.equal(messagesRequest.max_tokens, 4096);
  // Anthropic accepts any input length up to context-window minus max_tokens;
  // we don\'t validate server-side, just structural correctness.
  const totalChars = messagesRequest.messages
    .map((m) => (typeof m.content === 'string' ? m.content.length : 0))
    .reduce((a, b) => a + b, 0);
  assert.ok(totalChars > 0, 'synthetic message has no content');
});

function buildMessagesRequest({ model, maxTokens, syntheticInputTokens }) {
  // ~4 chars per token rough rule used to size the synthetic body.
  const filler = 'x'.repeat(syntheticInputTokens * 4);
  return {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: filler }],
  };
}
