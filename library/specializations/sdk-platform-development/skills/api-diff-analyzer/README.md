# API Diff Analyzer Skill

## Overview

The `api-diff-analyzer` skill provides comprehensive API specification comparison capabilities. It detects breaking changes between API versions, categorizes changes by severity, generates migration guides, and integrates with CI/CD to block breaking changes.

## Quick Start

### Prerequisites

1. **OpenAPI specs** - Version 3.x specifications
2. **oasdiff** - CLI tool for OpenAPI diff
3. **Git** - Version control access

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

Install oasdiff:

```bash
# macOS
brew install oasdiff

# Linux/Windows
curl -fsSL https://raw.githubusercontent.com/oasdiff/oasdiff/main/install.sh | sh

# Docker
docker pull tufin/oasdiff
```

## Usage

### Basic Operations

```bash
# Compare OpenAPI specs
/skill api-diff-analyzer diff --old v1.yaml --new v2.yaml

# Detect breaking changes only
/skill api-diff-analyzer breaking --old v1.yaml --new v2.yaml

# Generate migration guide
/skill api-diff-analyzer migrate --old v1.yaml --new v2.yaml

# Summary of changes
/skill api-diff-analyzer summary --old v1.yaml --new v2.yaml
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(apiDiffTask, {
  operation: 'diff',
  oldSpec: './specs/v1/openapi.yaml',
  newSpec: './specs/v2/openapi.yaml',
  failOnBreaking: true
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Breaking Change Detection** | Identify incompatible changes |
| **Change Categorization** | Group by severity |
| **Migration Guides** | Generate upgrade docs |
| **CI/CD Integration** | Block breaking changes |
| **Multi-Format Support** | OpenAPI, GraphQL, gRPC |
| **Detailed Reports** | Comprehensive change logs |

## Examples

### Example 1: Basic Diff

```bash
oasdiff diff old-api.yaml new-api.yaml
```

Output:
```
Endpoints added: 2
Endpoints removed: 1
Endpoints modified: 3

Breaking changes: 2
- POST /users: new required parameter 'email'
- DELETE /legacy: endpoint removed
```

### Example 2: Breaking Changes Check

```bash
oasdiff breaking old-api.yaml new-api.yaml --fail-on ERR
```

### Example 3: CI/CD Pipeline

```yaml
name: API Compatibility

on:
  pull_request:
    paths: ['openapi/**']

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check breaking changes
        run: |
          git show origin/main:openapi/api.yaml > old.yaml
          oasdiff breaking old.yaml openapi/api.yaml --fail-on ERR
```

### Example 4: Migration Guide

```markdown
# Migration Guide: v1 to v2

## Breaking Changes

### POST /users
New required parameter 'email' added.

**Before:**
```typescript
await sdk.users.create({ name: 'John' });
```

**After:**
```typescript
await sdk.users.create({ name: 'John', email: 'john@example.com' });
```
```

## Configuration

### oasdiff Options

| Option | Description |
|--------|-------------|
| `--fail-on ERR` | Fail on breaking changes |
| `--format json` | Output as JSON |
| `--format markdown` | Output as Markdown |
| `--include-path-params` | Include path parameter changes |

### Change Categories

| Category | Severity | Description |
|----------|----------|-------------|
| `endpoint-removed` | Major | Endpoint deleted |
| `required-parameter-added` | Major | New required param |
| `parameter-type-changed` | Major | Type incompatibility |
| `response-changed` | Major | Response structure changed |
| `endpoint-added` | Minor | New endpoint |
| `optional-parameter-added` | Minor | New optional param |

## Process Integration

### Processes Using This Skill

1. **api-versioning-strategy.js** - Version management
2. **backward-compatibility-management.js** - Breaking changes
3. **sdk-versioning-release-management.js** - Release gates
4. **api-design-specification.js** - Spec review

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const checkApiCompatibilityTask = defineTask({
  name: 'check-api-compatibility',
  description: 'Check API for breaking changes',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'Check API Compatibility',
      skill: {
        name: 'api-diff-analyzer',
        context: {
          operation: 'breaking',
          oldSpec: inputs.oldSpec,
          newSpec: inputs.newSpec,
          failOnBreaking: true
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Breaking Change Rules

### Always Breaking

- Removing endpoint
- Removing required field
- Changing field type
- Adding required parameter
- Removing enum value

### Potentially Breaking

- Changing response structure
- Modifying authentication
- Changing error codes

### Never Breaking

- Adding optional parameter
- Adding new endpoint
- Adding optional field
- Adding enum value

## MCP Server Reference

### Specmatic MCP Server

Contract testing with breaking change detection.

**Features:**
- OpenAPI comparison
- Mock server generation
- Contract validation

**Documentation:** https://github.com/specmatic/specmatic-mcp-server

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Invalid spec` | Validate with spectral |
| `False positive` | Review change context |
| `Missing changes` | Check spec completeness |
| `Parse error` | Check YAML/JSON format |

### Debug Mode

```bash
oasdiff diff old.yaml new.yaml --debug
```

## Related Skills

- **semver-analyzer** - Version management
- **contract-test-framework** - Contract testing
- **openapi-codegen-orchestrator** - SDK generation
- **compatibility-auditor** - Manual review

## References

- [oasdiff Documentation](https://github.com/oasdiff/oasdiff)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [API Evolution Best Practices](https://google.aip.dev/general)
- [Specmatic](https://specmatic.in/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SDK-005
**Category:** Versioning and Compatibility
**Status:** Active
