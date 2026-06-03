# @a5c-ai/tools-adapter

Tool lifecycle layer for the babysitter monorepo. Provides:

- **ToolRegistry** — in-memory, Map-backed registry for tool descriptors and servers
- **ToolDispatcher** — policy-driven resolution of tool-to-server mapping with glob matching and before/after hook integration
- **Schema translation** — adapters between `ToolDescriptor` and `NormalizedToolDefinition` (transport-mux), plus `translateTools` for provider-specific wire formats
- **ToolHookBridge** — interface (and no-op implementation) bridging tool dispatch to hooks-mux PreToolUse/PostToolUse lifecycle

## Installation

```bash
npm install @a5c-ai/tools-adapter
```

## Usage

```typescript
import {
  ToolRegistry,
  ToolDispatcher,
  NoopToolHookBridge,
  toToolDescriptor,
  translateTools,
} from '@a5c-ai/tools-adapter';

// 1. Build a registry
const registry = new ToolRegistry();
registry.register({
  name: 'read_file',
  source: 'builtin',
  description: 'Read a file from disk',
  parameters: { type: 'object', properties: { path: { type: 'string' } } },
});

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
