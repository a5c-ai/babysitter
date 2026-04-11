---
name: mcp-app-scaffolding
description: Scaffolds MCP App project structure with correct directory layout, dependencies, entry points, and framework-specific templates. Handles React (useApp hook), Vanilla JS, Vue, Svelte, Preact, and Solid.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# mcp-app-scaffolding

Scaffold MCP App projects from scratch with correct structure, dependencies, and framework-specific templates following the reference-code-first methodology.

## Overview

MCP Apps are interactive UIs that render inline in MCP-enabled hosts (Claude Desktop, ChatGPT, VS Code, Goose, Postman). Every MCP App requires:
- A **Tool** (called by the LLM/host, returns data) registered via `registerAppTool`
- A **Resource** (serves bundled HTML UI) registered via `registerAppResource`
- The tool's `_meta.ui.resourceUri` references the resource's URI

This skill handles the initial project scaffolding: cloning the SDK reference code, selecting a framework, generating the directory structure, and creating all entry points.

## Capabilities

### Reference Code Acquisition
- Clone SDK repository at exact published npm version
- Access framework templates from `examples/basic-server-{framework}/`
- Access API reference source from `src/`
- Access advanced patterns from `docs/patterns.md`
- Access basic-host reference for testing from `examples/basic-host/`

### Framework Selection Decision Tree
- **React** (first-class support): SDK-provided `useApp` hook, `useHostStyles`, `useHostStyleVariables`, `useHostFonts`
- **Vanilla JS**: Manual App lifecycle, simplest setup, no framework overhead
- **Vue / Svelte / Preact / Solid**: Manual lifecycle management, follow team preference

### Project Structure Generation
- Directory layout with `src/`, build configs, entry points
- Separate server and client source directories
- Proper `.gitignore` for build artifacts

### Dependency Installation
- Runtime: `@modelcontextprotocol/ext-apps`, `@modelcontextprotocol/sdk`, `zod`
- Dev: `typescript`, `vite`, `vite-plugin-singlefile`, `tsx`, `concurrently`
- Framework-specific: `react`, `react-dom`, `@types/react`, `@types/react-dom` (for React)
- Always use `npm install` -- never hardcode version numbers

## Usage

### Step 1: Clone Reference Code

```bash
# Clone SDK at the exact version published to npm
git clone --branch "v$(npm view @modelcontextprotocol/ext-apps version)" \
  --depth 1 https://github.com/modelcontextprotocol/ext-apps.git /tmp/mcp-ext-apps
```

**Key reference locations:**
| Path | Content |
|------|---------|
| `/tmp/mcp-ext-apps/examples/basic-server-react/` | React template |
| `/tmp/mcp-ext-apps/examples/basic-server-vanillajs/` | Vanilla JS template |
| `/tmp/mcp-ext-apps/examples/basic-server-vue/` | Vue template |
| `/tmp/mcp-ext-apps/examples/basic-server-svelte/` | Svelte template |
| `/tmp/mcp-ext-apps/examples/basic-server-preact/` | Preact template |
| `/tmp/mcp-ext-apps/examples/basic-server-solid/` | Solid template |
| `/tmp/mcp-ext-apps/src/app.ts` | App class API |
| `/tmp/mcp-ext-apps/src/server/index.ts` | Server registration helpers |
| `/tmp/mcp-ext-apps/src/react/useApp.tsx` | React useApp hook |
| `/tmp/mcp-ext-apps/src/styles.ts` | Host styling helpers |
| `/tmp/mcp-ext-apps/docs/patterns.md` | Advanced patterns |
| `/tmp/mcp-ext-apps/examples/basic-host/` | Test host |

### Step 2: Framework Decision Tree

```
Is the team familiar with React?
  YES -> Use React with useApp hook (SDK-provided, first-class)
  NO  -> Is this a simple app with minimal UI?
           YES -> Use Vanilla JS with manual lifecycle
           NO  -> Use team's preferred framework (Vue/Svelte/Preact/Solid)
                  with manual App lifecycle management
```

### Step 3: Initialize Project

```bash
mkdir my-mcp-app && cd my-mcp-app
npm init -y

# Core dependencies
npm install @modelcontextprotocol/ext-apps @modelcontextprotocol/sdk zod

# Dev dependencies
npm install -D typescript vite vite-plugin-singlefile tsx concurrently @types/node

# React-specific (if using React)
npm install react react-dom
npm install -D @types/react @types/react-dom
```

### Step 4: Project Directory Layout

```
my-mcp-app/
├── src/
│   ├── server.ts          # MCP server with registerAppTool + registerAppResource
│   ├── main.ts            # Client UI entry (or main.tsx for React)
│   └── global.css         # Styles with host CSS variable fallbacks
├── mcp-app.html           # HTML entry point for Vite (or mcp-app.tsx for React)
├── vite.config.ts         # Vite + vite-plugin-singlefile
├── tsconfig.json          # TypeScript configuration
├── package.json           # Scripts: build:ui, build:server, build, dev
└── .gitignore             # dist/, node_modules/, /tmp/
```

### Step 5: Package.json Scripts

```json
{
  "scripts": {
    "build:ui": "vite build",
    "build:server": "tsc --project tsconfig.server.json",
    "build": "npm run build:ui && npm run build:server",
    "dev": "concurrently \"vite\" \"tsx watch src/server.ts\"",
    "serve": "tsx src/server.ts"
  }
}
```

### Step 6: TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

## Verification Checklist

- [ ] SDK reference code cloned at pinned version
- [ ] Framework selected based on team context
- [ ] All dependencies installed via `npm install` (no manual versions)
- [ ] Server entry point created (`server.ts`)
- [ ] Client entry point created (`main.ts` / `main.tsx`)
- [ ] HTML entry point created (`mcp-app.html` / `mcp-app.tsx`)
- [ ] Vite config with `vite-plugin-singlefile` present
- [ ] Build scripts defined (`build:ui`, `build:server`, `build`)
- [ ] TypeScript configured correctly
- [ ] `.gitignore` includes `dist/` and `node_modules/`

## Task Definition

```javascript
const mcpAppScaffoldingTask = defineTask({
  name: 'mcp-app-scaffolding',
  description: 'Scaffold MCP App project structure with framework-specific templates',

  inputs: {
    appName: { type: 'string', required: true },
    framework: { type: 'string', default: 'react' },
    description: { type: 'string', default: '' },
    transport: { type: 'string', default: 'stdio' },
    existingServer: { type: 'boolean', default: false }
  },

  outputs: {
    projectDir: { type: 'string' },
    framework: { type: 'string' },
    files: { type: 'array' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Scaffold MCP App: ${inputs.appName} (${inputs.framework})`,
      skill: {
        name: 'mcp-app-scaffolding',
        context: {
          appName: inputs.appName,
          framework: inputs.framework,
          description: inputs.description,
          transport: inputs.transport,
          existingServer: inputs.existingServer,
          instructions: [
            'Clone SDK reference code at published npm version',
            'Execute framework selection decision tree',
            'Generate project directory structure',
            'Install all dependencies via npm install',
            'Create server and client entry points',
            'Configure Vite with vite-plugin-singlefile',
            'Set up TypeScript and build scripts'
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

## External Dependencies

- Node.js 18+
- npm
- Git (for cloning SDK reference code)
- @modelcontextprotocol/ext-apps npm package
- @modelcontextprotocol/sdk npm package

## References

- [MCP Apps SDK Repository](https://github.com/modelcontextprotocol/ext-apps)
- [MCP Apps SDK npm](https://www.npmjs.com/package/@modelcontextprotocol/ext-apps)
- [MCP Apps Quickstart](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/quickstart.md)
- [MCP Apps Overview](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/overview.md)
- [MCP Specification (2026-01-26)](https://spec.modelcontextprotocol.io/)

## Related Skills

- mcp-tool-resource-pattern
- mcp-host-styling-integration
- single-file-bundling
- mcp-app-verification

## Related Agents

- mcp-app-architect
- mcp-ui-developer
