# Build System Migrator Skill

## Overview

The Build System Migrator skill modernizes build systems. It handles build file conversion, plugin migration, and CI/CD integration updates.

## Quick Start

### Prerequisites

- Current build configuration
- Target build tool installed
- Build process understanding

### Basic Usage

1. **Analyze current build**
   - Document tasks
   - List plugins
   - Map dependencies

2. **Convert build files**
   ```bash
   # Maven to Gradle
   gradle init --type pom
   ```

3. **Update CI/CD**
   - Adapt pipeline
   - Update caching
   - Test builds

## Features

### Migration Paths

| From | To | Automation |
|------|-----|------------|
| Maven | Gradle | High |
| Webpack | Vite | Medium |
| npm | pnpm | High |
| Lerna | Nx | Medium |
| Jenkins | GitHub Actions | Medium |

### Optimization Features

- Remote caching
- Incremental builds
- Parallel execution
- Artifact management

## Configuration

```json
{
  "source": {
    "tool": "maven",
    "path": "./pom.xml"
  },
  "target": {
    "tool": "gradle",
    "version": "8.x",
    "useKotlinDsl": true
  },
  "options": {
    "migratePlugins": true,
    "setupCache": true,
    "updateCi": true
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Gradle Migration Guide](https://docs.gradle.org/current/userguide/migrating_from_maven.html)
