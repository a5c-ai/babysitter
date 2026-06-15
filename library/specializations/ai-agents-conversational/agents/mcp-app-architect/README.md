# MCP App Architect Agent

## Overview

The MCP App Architect is a specialized agent that designs the architecture of interactive UI applications built on the MCP Apps extension specification. These applications render inline within MCP-enabled AI chat hosts such as Claude Desktop, ChatGPT, VS Code, Goose, and Postman.

## Key Capabilities

- **Tool + Resource Pattern Design**: Architects the core pattern where Tools reference Resources that serve bundled HTML UI
- **Transport Architecture**: Selects between stdio and HTTP/SSE based on deployment requirements
- **CSP Security Modeling**: Designs Content Security Policy for sandboxed iframe execution
- **Graceful Degradation**: Ensures apps provide text fallbacks for non-UI hosts
- **Build Pipeline Planning**: Configures Vite + vite-plugin-singlefile for mandatory single-file bundling

## When to Use This Agent

Use the MCP App Architect when:
- Designing a new MCP App from scratch
- Planning the architecture for adding interactive UI to an existing MCP server
- Evaluating whether an existing web app can be converted to a hybrid MCP App
- Reviewing an MCP App design for correctness and security
- Deciding between transport layers, frameworks, or architectural patterns

## Agent Profile

| Attribute | Value |
|-----------|-------|
| **Role** | MCP App Architect |
| **Primary Focus** | Tool + Resource pattern design and security |
| **Output Format** | Architecture design document (JSON) |
| **Critical Invariant** | Handler-before-connect, CSP completeness, text fallbacks |

## Architecture Patterns

### Simple App
Single tool + single resource. Best for focused interactive tools.

### Dashboard App
Multiple tools sharing one resource. Best for multi-view analytics.

### Hybrid App
MCP + standalone browser modes with shared rendering. Best for web app conversions.

### Progressive Enhancement
Core text fallback + app-only helper tools. Best for universal host compatibility.

## Integration with Processes

| Process | Integration Point |
|---------|------------------|
| create-mcp-app.js | Framework selection, architecture design |
| add-app-to-mcp-server.js | Tool analysis, UI benefit assessment |
| convert-web-app-to-mcp.js | Hybrid architecture, data source mapping |

## References

- [MCP Apps Specification](https://modelcontextprotocol.io/specification/2026-01-26/server/apps)
- [MCP Apps SDK](https://www.npmjs.com/package/@modelcontextprotocol/ext-apps)
- [MCP Apps Patterns & Recipes](https://modelcontextprotocol.io/docs/concepts/apps/patterns)
