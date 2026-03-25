---
name: esbuild
description: esbuild bundling, plugins, and build optimization.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# esbuild Skill

Expert assistance for fast bundling with esbuild.

## Capabilities

- Configure esbuild
- Create plugins
- Optimize builds
- Handle TypeScript
- Bundle for Node.js/browser

## Usage

```javascript
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['es2020'],
  outfile: 'dist/bundle.js',
  plugins: [myPlugin],
});
```

## Target Processes

- build-optimization
- cli-tools
- fast-bundling
