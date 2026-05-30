# @a5c-ai/tool-mux

Tool lifecycle layer for the babysitter monorepo. Provides:

- **ToolRegistry** — in-memory, Map-backed registry for source-qualified tool descriptors and servers
- **ToolDispatcher** — policy-driven resolution of tool-to-server mapping with glob matching and before/after hook integration
- **Schema translation** — adapters between `ToolDescriptor` and `NormalizedToolDefinition` (transport-mux), plus `translateTools` for provider-specific wire formats
- **ToolHookBridge** — interface plus no-op and injectable production bridge for PreToolUse/PostToolUse lifecycle

## Installation

```bash
npm install @a5c-ai/tool-mux
```

## Usage

```typescript
import {
  ToolRegistry,
  ToolDispatcher,
  NoopToolHookBridge,
  toToolDescriptor,
  translateTools,
} from '@a5c-ai/tool-mux';

// 1. Build a registry
const registry = new ToolRegistry();
registry.register({
  name: 'read_file',
  source: 'builtin',
  description: 'Read a file from disk',
  parameters: { type: 'object', properties: { path: { type: 'string' } } },
});

registry.register({
  name: 'search',
  source: 'mcp',
  sourceQualifier: 'docs',
  server: 'docs',
  description: 'Search documentation',
});

const docsSearch = registry.get('search', { source: 'mcp', sourceQualifier: 'docs' });

// 2. Create a dispatcher with a policy
const dispatcher = new ToolDispatcher({
  registry,
  policy: {
    rules: [{ match: 'mcp_*', server: 'mcp-server-1', priority: 10 }],
    defaultServer: 'local',
  },
  hooks: new NoopToolHookBridge(),
});

// 3. Dispatch a tool call
const result = await dispatcher.dispatch(
  { toolName: 'read_file', input: { path: '/tmp/test.txt' } },
  async (tool, ctx) => {
    // your executor logic here
    return { content: '...' };
  },
);

// 4. Translate tool schemas for a specific provider
const anthropicTools = translateTools(registry.list(), 'anthropic');
```

`ToolRegistry` keys tools by `(source, sourceQualifier/server, name)`, so duplicate names from builtins, plugins, custom tools, and MCP servers can coexist. Bare `get(name)` remains available for compatibility and returns the first registered descriptor for that name; use `get(name, { source, sourceQualifier })` or `getByQualifiedName('mcp:docs:search')` when the source matters.

For lazy schemas, register lightweight descriptors first, then register a per-source loader with `registerLoader(source, loader)`. `fetchSchema(name, source?, sourceQualifier?)` loads each qualified tool once and caches the result for `tool_fetch` style discovery.
