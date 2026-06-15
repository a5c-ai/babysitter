# MCP UI Developer Agent

## Overview

The MCP UI Developer is a specialized frontend agent that implements the client-side interactive UIs for MCP Apps. These UIs render inside sandboxed iframes within MCP-enabled AI chat hosts. The agent handles App lifecycle management, event handler implementation, host styling integration, and framework-specific patterns.

## Key Capabilities

- **App Lifecycle**: Creates App instances with PostMessageTransport, manages the full lifecycle from initialization to teardown
- **Event Handlers**: Implements ontoolinput, ontoolinputpartial, ontoolresult, onhostcontextchanged, and onteardown
- **Host Theming**: Integrates with host CSS variables and SDK styling helpers for consistent appearance
- **Framework Support**: React (useApp hook), Vanilla JS (manual lifecycle), Vue/Svelte/Preact/Solid (adapted lifecycle)
- **Hybrid Mode**: Implements dual-mode initialization for apps that work both standalone and in MCP hosts

## When to Use This Agent

Use the MCP UI Developer when:
- Implementing the client-side UI for a new MCP App
- Adding interactive UI capabilities to an existing MCP server's tools
- Converting a web app's frontend to work in MCP sandboxed iframes
- Migrating from OpenAI Apps SDK client patterns to MCP App patterns
- Debugging handler lifecycle issues or theming problems

## Agent Profile

| Attribute | Value |
|-----------|-------|
| **Role** | MCP UI Developer |
| **Primary Focus** | Client-side App lifecycle and UI implementation |
| **Critical Invariant** | Register ALL handlers BEFORE app.connect() |
| **Framework Preference** | React (first-class SDK support via useApp hook) |

## Handler Lifecycle

1. Create App instance with PostMessageTransport
2. Register ontoolinput handler
3. Register ontoolinputpartial handler (if streaming)
4. Register ontoolresult handler
5. Register onhostcontextchanged handler
6. Register onteardown handler
7. Call app.connect() -- ALWAYS LAST

## Integration with Processes

| Process | Integration Point |
|---------|------------------|
| create-mcp-app.js | Phase 5: Client UI Implementation |
| add-app-to-mcp-server.js | Phase 5: UI Implementation |
| convert-web-app-to-mcp.js | Phase 5: Hybrid Initialization, Phase 6: Host Styling |
| migrate-openai-app-to-mcp.js | Phase 5: Client-Side Migration |

## References

- [MCP Apps SDK](https://www.npmjs.com/package/@modelcontextprotocol/ext-apps)
- [MCP Apps Quickstart](https://modelcontextprotocol.io/quickstart/apps)
- [Host Styling Patterns](https://modelcontextprotocol.io/docs/concepts/apps/patterns#host-styling)
