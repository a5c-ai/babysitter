# MCP App Scaffolding Skill

## Overview

The `mcp-app-scaffolding` skill scaffolds new MCP App projects from scratch with the correct directory layout, dependencies, entry points, and framework-specific templates. It follows the reference-code-first methodology: always clone the SDK repo at the pinned npm version before writing any code.

## Key Features

- **Reference-Code-First**: Clones the MCP Apps SDK repo at the exact published version for templates and API docs
- **Framework Decision Tree**: Guides selection between React (first-class useApp hook), Vanilla JS, Vue, Svelte, Preact, and Solid
- **Complete Project Setup**: Generates all files needed for a working MCP App (server, client, build config, types)
- **Correct Dependencies**: Installs via `npm install` with no hardcoded versions

## Prerequisites

1. **Node.js 18+** and npm
2. **Git** for cloning SDK reference code
3. **Framework knowledge**: React, Vanilla JS, or another supported framework

## Quick Start

### 1. Clone Reference Code

```bash
git clone --branch "v$(npm view @modelcontextprotocol/ext-apps version)" \
  --depth 1 https://github.com/modelcontextprotocol/ext-apps.git /tmp/mcp-ext-apps
```

### 2. Initialize Project

```bash
mkdir my-mcp-app && cd my-mcp-app
npm init -y
npm install @modelcontextprotocol/ext-apps @modelcontextprotocol/sdk zod
npm install -D typescript vite vite-plugin-singlefile tsx concurrently @types/node
```

### 3. Follow SKILL.md

The `SKILL.md` provides the complete scaffolding workflow including framework selection, directory layout, entry point creation, and build configuration.

## Use Cases

### Greenfield MCP App
Start from nothing and create a fully working MCP App with Tool + Resource pattern, text fallback, host styling, and single-file bundling.

### Adding UI to Existing MCP Server
When used alongside `mcp-tool-resource-pattern`, sets up the project structure needed to add interactive UI to tools that already exist.

## Integration with Babysitter Processes

| Process | Integration Point |
|---------|------------------|
| create-mcp-app.js | Phases 2-3: Framework selection and project initialization |
| add-app-to-mcp-server.js | Phase 3: Dependencies and build pipeline setup |

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| appName | string | required | Name of the MCP App project |
| framework | string | react | Framework choice: react, vanilla, vue, svelte, preact, solid |
| transport | string | stdio | MCP transport: stdio or http |
| existingServer | boolean | false | Whether adding to an existing MCP server |

## References

- [MCP Apps SDK](https://github.com/modelcontextprotocol/ext-apps)
- [MCP Apps Quickstart](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/quickstart.md)

## Related Resources

- mcp-tool-resource-pattern - Core Tool + Resource implementation
- single-file-bundling - Vite single-file build configuration
- mcp-host-styling-integration - Host theme integration
