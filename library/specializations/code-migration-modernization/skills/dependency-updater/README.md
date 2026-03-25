# Dependency Updater Skill

## Overview

The Dependency Updater skill executes automated dependency updates safely. It handles breaking change detection, update batching, and provides rollback capabilities.

## Quick Start

### Prerequisites

- Package manager (npm, pip, maven, etc.)
- Test suite for validation
- Version control for rollback

### Basic Usage

1. **Create backup**
   ```bash
   cp package-lock.json package-lock.json.bak
   ```

2. **Run updates**
   ```bash
   # Check available updates
   npx npm-check-updates

   # Apply updates
   npx npm-check-updates -u
   npm install
   ```

3. **Validate**
   ```bash
   npm test
   npm run build
   ```

## Features

### Update Types

| Type | Risk | Approach |
|------|------|----------|
| Patch | Low | Auto-apply |
| Minor | Medium | Batch apply |
| Major | High | Individual review |
| Security | Critical | Immediate |

### Rollback Strategy

- Lockfile snapshots
- Git commit history
- Quick restore capability

## Configuration

```json
{
  "autoUpdate": {
    "patch": true,
    "minor": false,
    "major": false
  },
  "securityUpdates": "immediate",
  "testAfterUpdate": true,
  "createPullRequest": true
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
