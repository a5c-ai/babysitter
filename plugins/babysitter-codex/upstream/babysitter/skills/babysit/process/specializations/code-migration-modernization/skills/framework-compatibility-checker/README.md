# Framework Compatibility Checker Skill

## Overview

The Framework Compatibility Checker skill assesses codebase compatibility with target framework versions. It identifies breaking changes and recommends safe migration paths.

## Quick Start

### Prerequisites

- Current framework version info
- Target version requirements
- Codebase access

### Basic Usage

1. **Identify current state**
   ```bash
   # Check current versions
   npm list react
   ```

2. **Check compatibility**
   - Review upgrade guides
   - Scan for deprecated APIs
   - Identify breaking changes

3. **Plan migration**
   - Map upgrade path
   - Estimate effort
   - Plan testing

## Features

### Compatibility Analysis

| Check | Description | Output |
|-------|-------------|--------|
| API Deprecation | Deprecated method usage | Replacement map |
| Breaking Changes | Incompatible changes | Migration steps |
| Version Conflicts | Peer dependency issues | Resolution plan |
| Polyfill Needs | Missing features | Polyfill list |

### Supported Frameworks

- React (all major versions)
- Angular (upgrade guide integration)
- Vue (migration tools)
- Next.js (codemods)
- Spring Boot
- .NET Core/5/6/7/8

## Configuration

```json
{
  "currentVersion": "17.0.0",
  "targetVersion": "18.0.0",
  "framework": "react",
  "includeDeprecations": true,
  "checkDependencies": true
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [React Upgrade Guide](https://react.dev/blog)
- [Angular Update Guide](https://update.angular.io/)
