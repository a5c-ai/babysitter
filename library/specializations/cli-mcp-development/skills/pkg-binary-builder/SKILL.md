---
name: pkg-binary-builder
description: Configure pkg for Node.js binary builds with asset bundling and cross-platform targets.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Pkg Binary Builder

Configure pkg for Node.js binary builds.

## Generated Patterns

```json
{
  "pkg": {
    "scripts": "dist/**/*.js",
    "assets": ["dist/**/*.json", "node_modules/better-sqlite3/**/*"],
    "targets": ["node18-linux-x64", "node18-macos-x64", "node18-win-x64"],
    "outputPath": "build"
  },
  "scripts": {
    "build:binary": "pkg . --compress GZip"
  }
}
```

## Target Processes

- cli-binary-distribution
- package-manager-publishing
