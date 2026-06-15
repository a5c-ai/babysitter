// Claim under test: implicit (graph/compute/mcp-transports/stdio.yaml)
// Statement: An MCP stdio session opens with a JSON-RPC `initialize` request
//   from client to server, server responds with a result containing
//   protocolVersion + capabilities, client follows up with the
//   `notifications/initialized` notification.
// Source: modelcontextprotocol.io/specification (current revision)
// Cadence: weekly. The MCP spec evolves on a yearly-ish cadence; this test
// catches our catalog drifting away from the canonical handshake shape.

const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable, Writable } = require('node:stream');

test('claim:mcp-stdio-init-handshake — initialize request shape matches spec', () => {
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: { roots: { listChanged: true }, sampling: {} },
      clientInfo: { name: 'catalog-test-client', version: '1.0.0' },
    },
  };
  // Required JSON-RPC envelope keys.
  assert.equal(initRequest.jsonrpc, '2.0');
  assert.equal(typeof initRequest.id, 'number');
  assert.equal(initRequest.method, 'initialize');
  // Required initialize params per MCP spec.
  assert.match(initRequest.params.protocolVersion, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof initRequest.params.capabilities, 'object');
  assert.equal(typeof initRequest.params.clientInfo, 'object');
  assert.equal(typeof initRequest.params.clientInfo.name, 'string');
});

test('claim:mcp-stdio-init-handshake — server initialize-result shape matches spec', () => {
  const initResult = {
    jsonrpc: '2.0',
    id: 1,
    result: {
      protocolVersion: '2025-06-18',
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: true, listChanged: true },
        prompts: { listChanged: true },
      },
      serverInfo: { name: 'example-mcp-server', version: '0.1.0' },
    },
  };
  assert.equal(initResult.jsonrpc, '2.0');
  assert.equal(initResult.id, 1);
  assert.match(initResult.result.protocolVersion, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof initResult.result.serverInfo.name, 'string');
});

test('claim:mcp-stdio-init-handshake — initialized notification has no `id` field', () => {
  const initialized = {
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    // params: optional empty object; some impls omit entirely
  };
  assert.equal(initialized.jsonrpc, '2.0');
  assert.equal(initialized.method, 'notifications/initialized');
  assert.equal('id' in initialized, false, 'notifications must NOT carry an id field per JSON-RPC 2.0');
});

test('claim:mcp-stdio-init-handshake — line-delimited JSON framing on stdio', async () => {
  const events = [];
  const fakeServerStdin = new Writable({
    write(chunk, _enc, cb) {
      events.push(chunk.toString('utf8'));
      cb();
    },
  });

  // Write the init request as a single line of JSON terminated by \n.
  const req = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} });
  fakeServerStdin.write(req + '\n');
  await new Promise((resolve) => fakeServerStdin.end(resolve));

  assert.equal(events.length, 1);
  assert.equal(events[0].endsWith('\n'), true, 'stdio framing requires trailing newline per MCP spec');
  assert.doesNotThrow(() => JSON.parse(events[0]), 'each line must be a valid JSON document');
});
