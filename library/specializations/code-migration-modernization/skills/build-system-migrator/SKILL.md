---
name: build-system-migrator
description: Migrate build systems to modern alternatives with build file conversion and CI/CD integration
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Build System Migrator Skill

Migrates build systems to modern alternatives, handling build file conversion, plugin migration, and CI/CD integration.

## Purpose

Enable build modernization for:
- Build file conversion
- Plugin migration
- Dependency management migration
- CI/CD integration
- Cache optimization

## Capabilities

### 1. Build File Conversion
- Convert build configurations
- Migrate between tools
- Preserve build logic
- Handle custom tasks

### 2. Plugin Migration
- Map plugin equivalents
- Configure replacements
- Handle custom plugins
- Document gaps

### 3. Dependency Management Migration
- Convert dependency declarations
- Handle version management
- Migrate lockfiles
- Manage repositories

### 4. CI/CD Integration
- Update pipeline configurations
- Adapt build commands
- Handle caching
- Optimize parallelization

### 5. Cache Optimization
- Configure build caches
- Set up remote caching
- Handle cache invalidation
- Optimize cache keys

### 6. Incremental Build Setup
- Configure incremental builds
- Handle change detection
- Optimize rebuild time
- Manage artifacts

## Tool Integrations

| From/To | Tools | Integration Method |
|---------|-------|-------------------|
| Maven -> Gradle | Gradle init | CLI |
| Webpack -> Vite | Manual/Codemods | CLI |
| Make -> Bazel | Manual | Config |
| npm -> pnpm | pnpm import | CLI |
| Lerna -> Nx | Nx migrate | CLI |
| Turborepo | turbo init | CLI |

## Output Schema

```json
{
  "migrationId": "string",
  "timestamp": "ISO8601",
  "source": {
    "buildTool": "string",
    "version": "string"
  },
  "target": {
    "buildTool": "string",
    "version": "string"
  },
  "artifacts": {
    "buildFile": "string",
    "configFiles": [],
    "ciConfig": "string"
  },
  "plugins": {
    "migrated": "number",
    "manual": "number"
  }
}
```

## Integration with Migration Processes

- **build-system-modernization**: Primary migration tool

## Related Skills

- `configuration-migrator`: Config conversion

## Related Agents

- `build-pipeline-migrator`: CI/CD migration
