---
name: turborepo
description: Turborepo configuration, caching, and pipeline optimization.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Turborepo Skill

Expert assistance for Turborepo monorepo management.

## Capabilities

- Configure Turborepo
- Set up caching
- Define pipelines
- Optimize builds
- Handle dependencies

## Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Target Processes

- monorepo-setup
- build-optimization
- ci-cd-optimization
