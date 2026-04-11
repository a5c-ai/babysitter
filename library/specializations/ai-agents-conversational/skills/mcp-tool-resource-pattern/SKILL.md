---
name: mcp-tool-resource-pattern
description: Implements the core MCP Apps architectural pattern where a Tool declares _meta.ui.resourceUri referencing a registered Resource. Covers registerAppTool, registerAppResource, text fallback, structuredContent, and app-only helper tools.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# mcp-tool-resource-pattern

Implement the foundational Tool + Resource pattern that every MCP App requires: a Tool that returns data and references a Resource that serves the interactive UI.

## Overview

Every MCP App is built on the Tool + Resource pattern:

1. **Tool** (registered via `registerAppTool`): Called by the LLM/host, returns data. Its `_meta.ui.resourceUri` tells the host which Resource provides the UI.
2. **Resource** (registered via `registerAppResource`): Serves a bundled HTML file that renders the interactive UI in a sandboxed iframe.
3. The tool passes data to the UI via `structuredContent` (available in `ontoolresult` handler).
4. The tool MUST also return a `content` array with text fallback for non-UI hosts.

## Capabilities

### registerAppTool Implementation
- Register tools with `_meta.ui.resourceUri` linking to a resource
- Pass data via `structuredContent` for rich UI rendering
- Always include `content` array with text fallback
- Configure tool input schemas via Zod

### registerAppResource Implementation
- Register HTML resources with `RESOURCE_MIME_TYPE`
- Serve single-file bundled HTML
- Configure CSP domains in `contents[]` return
- Support multiple tools sharing the same resource URI

### App-Only Helper Tools
- Create tools with `visibility: ['app']` -- only callable from the UI iframe, not by the LLM
- Use cases: polling for updates, loading additional data, pagination, state mutations
- Implement via `app.callServerTool()` from client-side

### Graceful Degradation
- Detect UI capability via `getUiCapability()` on the server
- Return richer responses when UI is available
- Always maintain text-only fallback path

## Usage

### Basic Tool + Resource Pattern

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const server = new McpServer({ name: 'my-app', version: '1.0.0' });

// Read the bundled HTML (built by vite-plugin-singlefile)
const bundledHtml = fs.readFileSync(
  path.join(__dirname, '../dist/mcp-app.html'),
  'utf-8'
);

// 1. Register the Resource (serves the UI)
registerAppResource(server, {
  uri: 'app:///my-app',
  name: 'My App UI',
  mimeType: RESOURCE_MIME_TYPE,
  async read() {
    return {
      contents: [{
        uri: 'app:///my-app',
        mimeType: RESOURCE_MIME_TYPE,
        text: bundledHtml,
        // CSP domains (if needed)
        // resourceDomains: ['https://cdn.example.com'],
        // connectDomains: ['https://api.example.com'],
      }],
    };
  },
});

// 2. Register the Tool (returns data, references the resource)
registerAppTool(server, {
  name: 'show_dashboard',
  description: 'Show an interactive dashboard',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: { type: 'string', description: 'Search query' },
    },
    required: ['query'],
  },
  // _meta.ui.resourceUri is set automatically by registerAppTool
  resourceUri: 'app:///my-app',
  async handler(args) {
    const data = await fetchDashboardData(args.query);

    return {
      // Text fallback for non-UI hosts (REQUIRED)
      content: [
        {
          type: 'text' as const,
          text: `Dashboard results for "${args.query}":\n${formatAsText(data)}`,
        },
      ],
      // Rich data for the UI (available in ontoolresult handler)
      structuredContent: {
        query: args.query,
        results: data.results,
        metadata: data.metadata,
      },
    };
  },
});
```

### App-Only Helper Tools

```typescript
// This tool is ONLY callable from the UI iframe via app.callServerTool()
// The LLM/host cannot call it directly
registerAppTool(server, {
  name: 'load_page',
  description: 'Load a specific page of results',
  visibility: ['app'],  // App-only: not visible to LLM
  inputSchema: {
    type: 'object' as const,
    properties: {
      page: { type: 'number' },
      pageSize: { type: 'number' },
    },
    required: ['page'],
  },
  resourceUri: 'app:///my-app',
  async handler(args) {
    const data = await fetchPage(args.page, args.pageSize || 20);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data) }],
      structuredContent: data,
    };
  },
});
```

### Client-Side: Calling App-Only Tools

```typescript
import { App, PostMessageTransport } from '@modelcontextprotocol/ext-apps';

const app = new App({ transport: new PostMessageTransport() });

// Call an app-only tool from the UI
async function loadNextPage(page: number) {
  const result = await app.callServerTool('load_page', {
    page,
    pageSize: 20,
  });
  renderResults(result.structuredContent);
}
```

### Multiple Tools Sharing One Resource

```typescript
// Both tools reference the same resource URI
// The UI handles both by checking which tool triggered

registerAppTool(server, {
  name: 'search_products',
  description: 'Search for products',
  resourceUri: 'app:///product-viewer',
  // ...
});

registerAppTool(server, {
  name: 'show_product_details',
  description: 'Show details for a specific product',
  resourceUri: 'app:///product-viewer',  // Same resource
  // ...
});

// In the UI, distinguish via ontoolinput handler:
app.ontoolinput = (params) => {
  if (params.toolName === 'search_products') {
    renderSearchResults(params.arguments);
  } else if (params.toolName === 'show_product_details') {
    renderProductDetails(params.arguments);
  }
};
```

### Graceful Degradation

```typescript
import { getUiCapability } from '@modelcontextprotocol/ext-apps';

registerAppTool(server, {
  name: 'show_chart',
  description: 'Display data as a chart',
  resourceUri: 'app:///chart-viewer',
  async handler(args) {
    const data = await getData(args);
    const uiCapability = getUiCapability();

    // Rich response when UI is available
    if (uiCapability === 'full') {
      return {
        content: [{ type: 'text' as const, text: formatAsTable(data) }],
        structuredContent: {
          chartType: 'bar',
          labels: data.labels,
          values: data.values,
        },
      };
    }

    // Text-only response for non-UI hosts
    return {
      content: [{
        type: 'text' as const,
        text: formatAsAsciiChart(data),
      }],
    };
  },
});
```

## Critical Rules

1. **Tool's `resourceUri` must match a registered resource URI** -- if the resource URI is `app:///my-app`, the tool must reference exactly `app:///my-app`.
2. **Always include `content` array with text fallback** -- non-UI hosts (terminal CLIs, basic chat clients) need a text representation.
3. **CSP goes in `contents[]` of the resource read callback** -- NOT in `_meta` on the tool.
4. **Use `RESOURCE_MIME_TYPE` constant** -- never hardcode the MIME type string.

## Verification Checklist

- [ ] `registerAppTool` called with `resourceUri` matching a registered resource
- [ ] `registerAppResource` called with matching URI and `RESOURCE_MIME_TYPE`
- [ ] Tool handler returns `content` array with text fallback
- [ ] Tool handler returns `structuredContent` for UI data
- [ ] `RESOURCE_MIME_TYPE` imported and used (not hardcoded string)
- [ ] App-only tools use `visibility: ['app']`
- [ ] Resource read callback returns `contents[]` with CSP if needed
- [ ] Multiple tools sharing a resource use the same URI

## Task Definition

```javascript
const mcpToolResourcePatternTask = defineTask({
  name: 'mcp-tool-resource-pattern',
  description: 'Implement Tool + Resource pattern for MCP App',

  inputs: {
    tools: { type: 'array', required: true },
    resourceUri: { type: 'string', required: true },
    appOnlyTools: { type: 'array', default: [] },
    cspDomains: { type: 'object', default: {} }
  },

  outputs: {
    toolsRegistered: { type: 'number' },
    resourceRegistered: { type: 'boolean' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Implement Tool + Resource pattern (${inputs.tools.length} tools)`,
      skill: {
        name: 'mcp-tool-resource-pattern',
        context: {
          tools: inputs.tools,
          resourceUri: inputs.resourceUri,
          appOnlyTools: inputs.appOnlyTools,
          cspDomains: inputs.cspDomains,
          instructions: [
            'Register resource with RESOURCE_MIME_TYPE and bundled HTML',
            'Register each tool with resourceUri linking to the resource',
            'Include text content fallback in every tool handler',
            'Pass rich data via structuredContent',
            'Create app-only helper tools with visibility: [app]',
            'Configure CSP in contents[] if external origins needed'
          ]
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Applicable Processes

- create-mcp-app.js
- add-app-to-mcp-server.js
- convert-web-app-to-mcp.js
- migrate-openai-app-to-mcp.js

## External Dependencies

- `@modelcontextprotocol/ext-apps` (registerAppTool, registerAppResource, RESOURCE_MIME_TYPE)
- `@modelcontextprotocol/sdk` (McpServer)
- `zod` (input schema validation)

## References

- [MCP Apps SDK - Server API](https://github.com/modelcontextprotocol/ext-apps/blob/main/src/server/index.ts)
- [MCP Apps Patterns](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/patterns.md)
- [MCP Apps Overview](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/overview.md)

## Related Skills

- mcp-app-scaffolding
- mcp-host-styling-integration
- mcp-csp-investigation
- single-file-bundling
- mcp-app-verification

## Related Agents

- mcp-app-architect
- mcp-ui-developer
