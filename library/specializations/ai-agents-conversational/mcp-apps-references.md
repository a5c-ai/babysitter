# MCP Apps - References

Comprehensive reference materials for building interactive UI MCP Apps that render inline in MCP-enabled AI chat hosts.

## MCP Apps SDK

### Official Resources

- **Repository**: https://github.com/modelcontextprotocol/ext-apps
- **npm Package**: https://www.npmjs.com/package/@modelcontextprotocol/ext-apps
- **Specification (Stable 2026-01-26)**: Available in the repository under `docs/`
- **Specification (Draft)**: Available in the repository under `docs/` for upcoming features

### SDK Documentation

- **Overview**: `docs/overview.md` in the ext-apps repository
- **Quickstart Guide**: `docs/quickstart.md` -- step-by-step guide for building a first MCP App
- **Advanced Patterns**: `docs/patterns.md` -- recipes for app-only tools, polling, chunked data, error handling, binary resources, CSP/CORS, host context, fullscreen, model context, view state, visibility-based pause, streaming input
- **CSP and CORS Guide**: `docs/csp-cors.md` -- Content Security Policy and Cross-Origin Resource Sharing configuration
- **Authorization Patterns**: `docs/authorization.md` -- authentication and authorization for MCP Apps
- **Testing Guide**: `docs/testing-mcp-apps.md` -- testing strategies for MCP Apps
- **OpenAI Migration Reference**: `docs/migrate_from_openai_apps.md` -- detailed before/after mapping tables for migrating from OpenAI Apps SDK
- **Agent Skills Installation**: `docs/agent-skills.md` -- installing agent skills across AI coding agents

### SDK Source (API Reference)

Key source files that serve as authoritative API documentation:

- **`src/app.ts`** -- `App` class: client-side application instance with `connect()`, event handlers (`ontoolinput`, `ontoolresult`, `onhostcontextchanged`, `onteardown`, `ontoolinputpartial`), `callServerTool()`, `updateModelContext()`, `sendMessage()`, `getHostContext()`, `getUiCapability()`
- **`src/server/index.ts`** -- Server-side registration helpers: `registerAppTool()`, `registerAppResource()`, `RESOURCE_MIME_TYPE`
- **`src/spec.types.ts`** -- TypeScript type definitions for the MCP Apps specification
- **`src/styles.ts`** -- Host styling helpers: `applyDocumentTheme()`, `applyHostStyleVariables()`, `applyHostFonts()`
- **`src/react/useApp.tsx`** -- React hook for MCP App lifecycle management
- **`src/react/useHostStyles.ts`** -- React hooks: `useHostStyles()`, `useHostStyleVariables()`, `useHostFonts()`

### Transport

- **`PostMessageTransport`** -- Client-side transport for communication between sandboxed iframe and host via `window.postMessage`

## Example Applications

### Framework Templates (Basic Servers)

Reference implementations for each supported framework:

| Example | Framework | Path |
|---|---|---|
| `basic-server-react/` | React | First-class SDK support via `useApp` hook |
| `basic-server-vanillajs/` | Vanilla JS | Manual lifecycle management |
| `basic-server-vue/` | Vue | Manual lifecycle with Vue reactivity |
| `basic-server-svelte/` | Svelte | Manual lifecycle with Svelte stores |
| `basic-server-preact/` | Preact | Lightweight React alternative |
| `basic-server-solid/` | Solid | Fine-grained reactivity |

### Feature Showcase Applications

More complex examples demonstrating advanced patterns:

| Example | Description |
|---|---|
| `basic-host/` | Reference host implementation for testing MCP Apps locally |
| `map-server/` | Interactive map rendering with external tile service (CSP example) |
| `pdf-server/` | PDF document viewer (binary resource handling) |
| `system-monitor-server/` | Real-time system metrics dashboard (polling pattern) |
| `sheet-music-server/` | Music notation rendering (specialized rendering library) |
| `threejs-server/` | 3D visualization with Three.js (heavy library bundling) |
| `shadertoy-server/` | WebGL shader playground (GPU-intensive rendering) |

## MCP Protocol Foundation

### Core MCP Resources

- **MCP Specification**: https://spec.modelcontextprotocol.io/
- **MCP Documentation**: https://modelcontextprotocol.io/
- **MCP GitHub Organization**: https://github.com/modelcontextprotocol
- **TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk (`@modelcontextprotocol/sdk`)
- **Python SDK**: https://github.com/modelcontextprotocol/python-sdk

### Protocol Concepts

- **Tools**: https://modelcontextprotocol.io/docs/concepts/tools
- **Resources**: https://modelcontextprotocol.io/docs/concepts/resources
- **Transports**: https://modelcontextprotocol.io/docs/concepts/transports
- **Architecture**: https://modelcontextprotocol.io/docs/concepts/architecture

## Supported Hosts

MCP Apps render inline in these MCP-enabled AI chat clients:

| Host | Status | Notes |
|---|---|---|
| Claude Desktop | Supported | Full MCP Apps support |
| ChatGPT | Supported | MCP Apps rendering |
| VS Code | Supported | Via MCP extension |
| Goose | Supported | Open-source AI agent |
| Postman | Supported | API testing with MCP |
| MCPJam | Supported | Community MCP playground |

## Build Tooling

### Vite and Single-File Bundling

- **Vite**: https://vite.dev/ -- Build tool used for MCP App UI bundling
- **vite-plugin-singlefile**: https://github.com/nicobrinkkemper/vite-plugin-singlefile -- Mandatory plugin that inlines all assets (JS, CSS, images, fonts) into a single HTML file for sandboxed iframe compatibility
- **tsx**: https://github.com/privatenumber/tsx -- TypeScript execution for MCP server development

### Framework Resources

- **React**: https://react.dev/ -- First-class SDK support via `useApp` hook
- **Vue**: https://vuejs.org/
- **Svelte**: https://svelte.dev/
- **Preact**: https://preactjs.com/
- **Solid**: https://www.solidjs.com/

## Third-Party Ecosystem

### Community Frameworks

- **mcp-ui**: Community framework extending MCP Apps patterns (check npm for latest)

## Security References

### Content Security Policy (CSP)

- **MDN CSP Reference**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- **CSP Evaluator**: https://csp-evaluator.withgoogle.com/
- **Sandboxed Iframe Specification**: https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox

### CORS

- **MDN CORS Reference**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **MCP CORS Headers**: `mcp-session-id`, `mcp-protocol-version`, `last-event-id` (allow); `mcp-session-id` (expose)

## Key Concepts Quick Reference

### Tool + Resource Pattern

```
Host -> calls Tool (LLM decides) -> Server processes -> returns:
  1. content[] (text fallback for non-UI hosts)
  2. structuredContent (data for UI)
  3. _meta.ui.resourceUri (link to Resource)

Host -> fetches Resource at URI -> sandboxed iframe renders HTML
  - App instance created with PostMessageTransport
  - Handlers registered BEFORE connect()
  - ontoolinput receives tool arguments
  - ontoolresult receives tool result with structuredContent
  - onhostcontextchanged receives theme/styling
  - onteardown for cleanup
```

### CSP Domain Categories

| Category | Purpose | Example |
|---|---|---|
| `resourceDomains` | Scripts, styles, images, fonts loaded by the app | `["https://cdn.example.com"]` |
| `connectDomains` | Fetch/XHR/WebSocket targets | `["https://api.example.com"]` |
| `frameDomains` | Nested iframes within the app | `["https://embed.example.com"]` |

### Host CSS Variable Groups

| Group | Variables | Purpose |
|---|---|---|
| Background | `--color-background-*` | Surface colors |
| Text | `--color-text-*` | Text colors |
| Border | `--color-border-*` | Border colors |
| Font Family | `--font-sans`, `--font-mono` | Typography |
| Font Size | `--font-text-*-size` | Text sizing |
| Border Radius | `--border-radius-*` | Corner rounding |

---

**Created**: 2026-04-04
**Version**: 1.0.0
**Specialization**: AI Agents and Conversational AI / MCP Apps
