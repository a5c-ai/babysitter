---
name: single-file-bundling
description: Configure Vite with vite-plugin-singlefile for mandatory single-file HTML bundling of MCP Apps. All assets (JS, CSS, images, fonts) must be inlined into a single HTML file for sandboxed iframe compatibility.
allowed-tools: Read, Write, Edit, Bash
---

# single-file-bundling

Configure Vite with vite-plugin-singlefile to produce a single self-contained HTML file for MCP Apps running in sandboxed iframes.

## Overview

MCP Apps run in sandboxed iframes with no same-origin server. This means:
- **No relative asset URLs** -- `<script src="./main.js">` will not resolve
- **No CSS file imports** -- `<link href="./styles.css">` will not load
- **No image/font paths** -- relative paths to assets will fail
- The **entire UI must be a single HTML file** with all JS, CSS, images, and fonts inlined

`vite-plugin-singlefile` handles this by inlining all assets into one HTML file during the Vite build. This is **mandatory** for MCP Apps -- without it, the app will show a blank iframe.

## Capabilities

### Vite Configuration
- Configure Vite with `vite-plugin-singlefile`
- Set correct `base`, `build.outDir`, and entry point
- Handle framework-specific Vite plugins (React, Vue, Svelte, Preact, Solid)

### Single HTML File Output
- All JavaScript inlined as `<script>` tags
- All CSS inlined as `<style>` tags
- All images converted to data URIs
- All fonts converted to base64

### Two-Phase Build Setup
- Phase 1: Vite bundles UI into `dist/mcp-app.html`
- Phase 2: TypeScript compiles server into `dist/server.js`
- Combined build script orchestrates both phases

### Hybrid Build Pipelines
- Add MCP build alongside existing standalone build
- Separate Vite configs for MCP and standalone if needed
- Separate HTML entry points (`mcp-app.html` vs `index.html`)

## Usage

### Basic Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist',
    // Entry point for the MCP App UI
    rollupOptions: {
      input: 'mcp-app.html',
    },
  },
});
```

### React Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'mcp-app.html',
    },
  },
});
```

### Vue Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [vue(), viteSingleFile()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'mcp-app.html',
    },
  },
});
```

### Svelte Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [svelte(), viteSingleFile()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'mcp-app.html',
    },
  },
});
```

### HTML Entry Point

```html
<!-- mcp-app.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My MCP App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

For React (`.tsx` entry):

```html
<!-- mcp-app.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My MCP App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

### Package.json Build Scripts

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

### Server Reading the Bundled HTML

```typescript
import fs from 'fs';
import path from 'path';
import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps';

// Read the single-file bundle produced by Vite
const bundledHtml = fs.readFileSync(
  path.join(__dirname, '../dist/mcp-app.html'),
  'utf-8'
);

registerAppResource(server, {
  uri: 'app:///my-app',
  name: 'My App',
  mimeType: RESOURCE_MIME_TYPE,
  async read() {
    return {
      contents: [{
        uri: 'app:///my-app',
        mimeType: RESOURCE_MIME_TYPE,
        text: bundledHtml,
      }],
    };
  },
});
```

### Hybrid Build Pipeline (MCP + Standalone)

When converting a web app that already has its own build:

```typescript
// vite.config.mcp.ts -- MCP-specific build config
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist/mcp',
    rollupOptions: {
      input: 'mcp-app.html',  // Separate entry from index.html
    },
  },
});
```

```json
{
  "scripts": {
    "build:standalone": "vite build",
    "build:mcp:ui": "vite build --config vite.config.mcp.ts",
    "build:mcp:server": "tsc --project tsconfig.server.json",
    "build:mcp": "npm run build:mcp:ui && npm run build:mcp:server",
    "build:all": "npm run build:standalone && npm run build:mcp"
  }
}
```

### Installing Dependencies

```bash
# Required dev dependencies
npm install -D vite vite-plugin-singlefile

# Framework-specific (pick one)
npm install -D @vitejs/plugin-react       # React
npm install -D @vitejs/plugin-vue         # Vue
npm install -D @sveltejs/vite-plugin-svelte  # Svelte
```

## Common Pitfalls

1. **Forgetting vite-plugin-singlefile**: Without it, Vite produces separate JS/CSS files that won't load in the sandboxed iframe.
2. **Wrong entry point**: The `rollupOptions.input` must point to the MCP App HTML file, not the standalone `index.html`.
3. **Large bundle size**: Inline images and fonts increase HTML file size. Consider optimizing assets or using CSP `resourceDomains` for large external resources.
4. **TypeScript server in Vite output**: The server should be compiled separately (Phase 2), not included in the Vite bundle.
5. **Missing `type="module"`**: The `<script>` tag in the HTML entry must have `type="module"` for Vite to process it.

## Verification Checklist

- [ ] `vite-plugin-singlefile` in devDependencies
- [ ] `vite.config.ts` imports and uses `viteSingleFile()`
- [ ] `rollupOptions.input` points to `mcp-app.html` (not `index.html`)
- [ ] `mcp-app.html` entry point exists with `<script type="module">`
- [ ] `npm run build:ui` produces `dist/mcp-app.html`
- [ ] `dist/mcp-app.html` is self-contained (no external `src=` or `href=` to files)
- [ ] Build scripts defined: `build:ui`, `build:server`, `build`
- [ ] Server reads from `dist/mcp-app.html` at runtime
- [ ] Framework-specific Vite plugin included (if applicable)

## Task Definition

```javascript
const singleFileBundlingTask = defineTask({
  name: 'single-file-bundling',
  description: 'Configure Vite with vite-plugin-singlefile for MCP App',

  inputs: {
    framework: { type: 'string', required: true },
    entryPoint: { type: 'string', default: 'mcp-app.html' },
    outDir: { type: 'string', default: 'dist' },
    hybrid: { type: 'boolean', default: false }
  },

  outputs: {
    viteConfigCreated: { type: 'boolean' },
    entryPointCreated: { type: 'boolean' },
    buildScriptsAdded: { type: 'boolean' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Configure single-file bundling (${inputs.framework})`,
      skill: {
        name: 'single-file-bundling',
        context: {
          framework: inputs.framework,
          entryPoint: inputs.entryPoint,
          outDir: inputs.outDir,
          hybrid: inputs.hybrid,
          instructions: [
            'Install vite and vite-plugin-singlefile',
            'Create vite.config.ts with framework plugin and singlefile',
            'Create mcp-app.html entry point',
            'Add build scripts to package.json',
            inputs.hybrid ? 'Create separate MCP Vite config alongside existing build' : null,
            'Build and verify single-file output'
          ].filter(Boolean)
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

## External Dependencies

- Vite (build tool)
- vite-plugin-singlefile (asset inlining)
- Framework-specific Vite plugins (@vitejs/plugin-react, @vitejs/plugin-vue, etc.)

## References

- [vite-plugin-singlefile](https://github.com/nicogulo/vite-plugin-singlefile)
- [Vite Documentation](https://vitejs.dev/)
- [MCP Apps SDK Examples](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples)

## Related Skills

- mcp-app-scaffolding
- mcp-tool-resource-pattern
- mcp-app-verification

## Related Agents

- mcp-app-architect
- mcp-ui-developer
