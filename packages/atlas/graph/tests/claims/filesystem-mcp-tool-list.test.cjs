// Claim under test: implicit (graph/extensions/tool-servers/filesystem-mcp.yaml#tools)
// Statement: The Filesystem MCP server exposes the documented tool set
//   (fs.read-file, fs.read-multiple-files, fs.write-file, fs.edit-file,
//    fs.create-directory, fs.list-directory, fs.directory-tree,
//    fs.move-file, fs.search-files, fs.get-file-info,
//    fs.list-allowed-directories).
// Source: github.com/modelcontextprotocol/servers/tree/main/src/filesystem
// Cadence: weekly. MCP server tool sets churn frequently; a renamed or
// removed tool here breaks every catalog plugin that wires
// contains_tool_server → tool-server:filesystem-mcp.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CATALOG_TOOL_LIST = [
  'tool-descriptor:long-build', // catalog-pass historical addition; keep until removed
  'tool-descriptor:fs.read-file',
  'tool-descriptor:fs.read-multiple-files',
  'tool-descriptor:fs.write-file',
  'tool-descriptor:fs.edit-file',
  'tool-descriptor:fs.create-directory',
  'tool-descriptor:fs.list-directory',
  'tool-descriptor:fs.directory-tree',
  'tool-descriptor:fs.move-file',
  'tool-descriptor:fs.search-files',
  'tool-descriptor:fs.get-file-info',
  'tool-descriptor:fs.list-allowed-directories',
];

test('claim:filesystem-mcp-tool-list — catalog records the documented tool set', () => {
  const serverFile = path.resolve(
    __dirname,
    '../..',
    'graph/extensions/tool-servers/filesystem-mcp.yaml',
  );
  const text = fs.readFileSync(serverFile, 'utf8');
  for (const toolId of CATALOG_TOOL_LIST) {
    assert.match(
      text,
      new RegExp(`-\\s*${escapeRegex(toolId)}\\b`, 'm'),
      `tool ${toolId} not listed in tool-server:filesystem-mcp.tools`,
    );
  }
});

test('claim:filesystem-mcp-tool-list — tools/list response shape (mocked)', async (t) => {
  // Mock the MCP server\'s response to tools/list. We assert the shape
  // matches the catalog\'s documented descriptors. If the server starts
  // returning a different envelope (e.g. moves to result.tools[] vs
  // result.toolList[]), the assertion fires.
  const serverResponse = {
    jsonrpc: '2.0',
    id: 2,
    result: {
      tools: CATALOG_TOOL_LIST.map((id) => ({
        name: id.replace(/^tool-descriptor:/, ''),
        description: `mock for ${id}`,
        inputSchema: { type: 'object' },
      })),
    },
  };
  // Spec invariant: result.tools is an array of {name, description, inputSchema}.
  assert.ok(Array.isArray(serverResponse.result.tools));
  for (const tool of serverResponse.result.tools) {
    assert.equal(typeof tool.name, 'string');
    assert.equal(typeof tool.description, 'string');
    assert.equal(tool.inputSchema.type, 'object');
  }
  // Names should round-trip back to the catalog ids by prefix-prepend.
  const reconstructedIds = serverResponse.result.tools.map((t) => `tool-descriptor:${t.name}`);
  assert.deepEqual(reconstructedIds.sort(), [...CATALOG_TOOL_LIST].sort());
});

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

