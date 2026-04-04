# MCP Tool + Resource Pattern Skill

## Overview

The `mcp-tool-resource-pattern` skill implements the foundational architectural pattern of MCP Apps: every app requires a **Tool** (called by the LLM, returns data) that references a **Resource** (serves the HTML UI). This is the core building block that all other MCP App skills build upon.

## Key Features

- **registerAppTool**: Register tools with `_meta.ui.resourceUri` linking to UI resources
- **registerAppResource**: Register HTML resources with `RESOURCE_MIME_TYPE`
- **Text Fallback**: Always include `content` array for non-UI hosts
- **structuredContent**: Pass rich data to the UI via tool results
- **App-Only Tools**: Create tools with `visibility: ['app']` callable only from the iframe
- **Graceful Degradation**: Detect UI capability and adjust response richness

## Prerequisites

1. **@modelcontextprotocol/ext-apps** installed
2. **@modelcontextprotocol/sdk** installed
3. **zod** for input schema validation
4. A bundled HTML file (see `single-file-bundling` skill)

## Quick Start

```typescript
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps';

// Register resource (UI)
registerAppResource(server, {
  uri: 'app:///my-app',
  name: 'My App',
  mimeType: RESOURCE_MIME_TYPE,
  async read() {
    return { contents: [{ uri: 'app:///my-app', mimeType: RESOURCE_MIME_TYPE, text: html }] };
  },
});

// Register tool (data + reference to UI)
registerAppTool(server, {
  name: 'my_tool',
  description: 'Does something useful',
  resourceUri: 'app:///my-app',
  async handler(args) {
    return {
      content: [{ type: 'text', text: 'Text fallback' }],
      structuredContent: { data: 'for the UI' },
    };
  },
});
```

## Critical Rules

1. Tool `resourceUri` MUST match a registered resource URI
2. ALWAYS include `content` array with text fallback
3. CSP goes in `contents[]` of resource read callback, NOT on the tool
4. Use `RESOURCE_MIME_TYPE` constant, never hardcode the MIME string

## Integration with Babysitter Processes

| Process | Integration Point |
|---------|------------------|
| create-mcp-app.js | Phase 4: Server implementation |
| add-app-to-mcp-server.js | Phase 4: Tool conversion |
| convert-web-app-to-mcp.js | Phase 4: MCP server setup |
| migrate-openai-app-to-mcp.js | Phase 4: Server-side migration |

## References

- [MCP Apps SDK](https://github.com/modelcontextprotocol/ext-apps)
- [MCP Apps Patterns](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/patterns.md)

## Related Resources

- mcp-app-scaffolding - Project setup before implementing this pattern
- mcp-host-styling-integration - Client-side styling after implementing this pattern
- mcp-app-verification - Verify the pattern is implemented correctly
