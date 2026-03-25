---
name: npm-publish-config
description: Configure npm publishing with proper bin entry, files, and registry settings.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# NPM Publish Config

Configure npm publishing for CLI packages.

## Generated Patterns

```json
{
  "name": "@myorg/mycli",
  "version": "1.0.0",
  "bin": { "mycli": "./dist/index.js" },
  "files": ["dist", "README.md", "LICENSE"],
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "engines": { "node": ">=18" },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "scripts": {
    "prepublishOnly": "npm run build && npm test"
  }
}
```

## Target Processes

- package-manager-publishing
- cli-binary-distribution
