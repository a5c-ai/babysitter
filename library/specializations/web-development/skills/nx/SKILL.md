---
name: nx
description: Nx workspace configuration, generators, and affected commands.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:monorepo-extraction]
  roles: [role:tech-lead, role:frontend-engineer]
  topics: [topic:developer-experience, topic:micro-frontend-architecture]

---

# Nx Skill

Expert assistance for Nx monorepo management.

## Capabilities

- Configure Nx workspaces
- Create custom generators
- Use affected commands
- Set up caching
- Define project boundaries

## Configuration

```json
// nx.json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "cache": true
    }
  },
  "affected": {
    "defaultBase": "main"
  }
}
```

## Commands

```bash
# Run affected
nx affected:build
nx affected:test

# Graph
nx graph

# Generate
nx generate @nx/react:component Button
```

## Target Processes

- monorepo-management
- enterprise-architecture
- code-generation
