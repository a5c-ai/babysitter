---
name: pnpm-workspaces
description: pnpm workspace patterns and dependency management.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# pnpm Workspaces Skill

Expert assistance for pnpm workspace management.

## Capabilities

- Configure workspaces
- Manage dependencies
- Handle peer dependencies
- Publish packages
- Optimize node_modules

## Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// package.json
{
  "name": "root",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev"
  }
}
```

## Commands

```bash
# Install in workspace
pnpm add lodash --filter @repo/web

# Run in all packages
pnpm -r build

# Run in specific package
pnpm --filter @repo/ui build
```

## Target Processes

- monorepo-setup
- dependency-management
- package-publishing
