# Single-File Bundling Skill

## Overview

The `single-file-bundling` skill configures Vite with `vite-plugin-singlefile` for mandatory single-file HTML bundling of MCP Apps. MCP Apps run in sandboxed iframes with no same-origin server, so all assets (JavaScript, CSS, images, fonts) must be inlined into a single HTML file. Without this, the app displays a blank iframe.

## Key Features

- **Vite + vite-plugin-singlefile**: Complete build configuration for all supported frameworks
- **Two-Phase Build**: UI bundle (Vite) + server compilation (TypeScript) as separate phases
- **Framework Support**: React, Vue, Svelte, Preact, Solid, and Vanilla JS configurations
- **Hybrid Pipelines**: Add MCP build alongside existing standalone build without disruption
- **Entry Point Creation**: Generate `mcp-app.html` with correct `<script type="module">`

## Prerequisites

1. **Node.js 18+** and npm
2. **Vite** as the build tool
3. A framework-specific Vite plugin (if not using Vanilla JS)

## Quick Start

### Install

```bash
npm install -D vite vite-plugin-singlefile
```

### Configure

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist',
    rollupOptions: { input: 'mcp-app.html' },
  },
});
```

### Build

```bash
npm run build:ui
# Produces dist/mcp-app.html -- a single self-contained HTML file
```

## Why Single-File?

MCP Apps render in `<iframe sandbox="allow-scripts">`. This means:
- No access to the parent page's origin
- No ability to load relative resources (`./main.js`, `./styles.css`)
- The entire app must be contained in the HTML string passed to the iframe
- `vite-plugin-singlefile` inlines everything: JS becomes `<script>` blocks, CSS becomes `<style>` blocks, images become data URIs

## Integration with Babysitter Processes

| Process | Integration Point |
|---------|------------------|
| create-mcp-app.js | Phase 6: Build configuration |
| add-app-to-mcp-server.js | Phase 3: Dependencies and build pipeline setup |
| convert-web-app-to-mcp.js | Phase 4: Build pipeline adaptation |

## References

- [vite-plugin-singlefile](https://github.com/nicogulo/vite-plugin-singlefile)
- [Vite Documentation](https://vitejs.dev/)
- [MCP Apps SDK Examples](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples)

## Related Resources

- mcp-app-scaffolding - Sets up the project that this skill configures the build for
- mcp-app-verification - Verifies the single-file bundle is correct
- mcp-tool-resource-pattern - Server reads the bundle produced by this skill
