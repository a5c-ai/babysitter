# Semver Analyzer Skill

## Overview

The `semver-analyzer` skill provides comprehensive semantic versioning analysis for SDK development. It enables automatic detection of breaking changes, suggests appropriate version bumps, generates changelogs, and validates version consistency across multi-language SDK implementations.

## Quick Start

### Prerequisites

1. **Git** - Version history access
2. **Conventional Commits** - Recommended commit format
3. **Package manifests** - package.json, pyproject.toml, etc.

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

Install semantic-release (optional):

```bash
npm install -D semantic-release @semantic-release/changelog @semantic-release/git
```

## Usage

### Basic Operations

```bash
# Analyze changes for version bump
/skill semver-analyzer analyze --from v1.0.0 --to HEAD

# Detect breaking changes
/skill semver-analyzer detect-breaking --from v1.0.0 --to HEAD

# Generate changelog
/skill semver-analyzer changelog --version 2.0.0 --from v1.0.0

# Validate version consistency
/skill semver-analyzer validate --sdks typescript,python,java

# Bump versions
/skill semver-analyzer bump --type minor --dry-run
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(semverAnalyzerTask, {
  operation: 'analyze',
  fromRef: 'v1.0.0',
  toRef: 'HEAD',
  sdkPaths: {
    typescript: './sdks/typescript',
    python: './sdks/python'
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Breaking Change Detection** | Identify removed/changed APIs |
| **Version Bump Suggestion** | Determine major/minor/patch |
| **Changelog Generation** | Create from commit history |
| **Version Consistency** | Validate across SDKs |
| **Conventional Commits** | Parse standard format |
| **Automated Releases** | semantic-release integration |
| **Multi-SDK Support** | Sync versions across languages |

## Examples

### Example 1: Analyze Changes

```bash
/skill semver-analyzer analyze --from v1.0.0 --to HEAD
```

Output:
```json
{
  "currentVersion": "1.0.0",
  "suggestedVersion": "2.0.0",
  "suggestedBump": "major",
  "hasBreakingChanges": true,
  "breakingChanges": [
    {
      "type": "removed",
      "location": "UsersApi.getUsers",
      "description": "Method removed"
    }
  ]
}
```

### Example 2: Conventional Commits

```
feat(users): add batch operations
^--^  ^---^  ^----------------^
|     |      |
|     |      +-> Description
|     +--------> Scope
+--------------> Type (feat = minor, fix = patch)
```

Breaking change:
```
feat(api)!: change authentication flow

BREAKING CHANGE: API key authentication removed
```

### Example 3: Semantic Release Config

```javascript
// release.config.js
module.exports = {
  branches: ['main', { name: 'beta', prerelease: true }],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/git',
    '@semantic-release/github'
  ]
};
```

### Example 4: Version Validation

```bash
/skill semver-analyzer validate --sdks typescript,python,java
```

Output:
```json
{
  "isConsistent": false,
  "versions": [
    { "language": "typescript", "version": "1.5.0" },
    { "language": "python", "version": "1.4.0" },
    { "language": "java", "version": "1.5.0" }
  ],
  "issues": [
    {
      "type": "version-mismatch",
      "message": "SDKs have different versions"
    }
  ]
}
```

## Configuration

### Conventional Commit Types

| Type | Release | Description |
|------|---------|-------------|
| `feat` | minor | New feature |
| `fix` | patch | Bug fix |
| `perf` | patch | Performance improvement |
| `refactor` | patch | Code refactoring |
| `docs` | - | Documentation only |
| `chore` | - | Maintenance |
| `!` suffix | major | Breaking change |

### Semantic Release Branches

| Branch | Type |
|--------|------|
| `main` | Production release |
| `beta` | Beta prerelease |
| `alpha` | Alpha prerelease |
| `next` | Next major version |

## Process Integration

### Processes Using This Skill

1. **sdk-versioning-release-management.js** - Release workflow
2. **backward-compatibility-management.js** - Breaking changes
3. **api-versioning-strategy.js** - API alignment
4. **package-distribution.js** - Publishing

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeVersionTask = defineTask({
  name: 'analyze-version',
  description: 'Analyze changes for version bump',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'Analyze Version Changes',
      skill: {
        name: 'semver-analyzer',
        context: {
          operation: 'analyze',
          fromRef: inputs.fromRef,
          toRef: inputs.toRef,
          detectBreaking: true
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

## Breaking Change Types

| Type | Description | Example |
|------|-------------|---------|
| `removed` | Export/method deleted | `getUsers()` removed |
| `signature-changed` | Parameters changed | New required param |
| `type-changed` | Return/field type changed | `string` to `number` |
| `behavior-changed` | Logic changed | Different response format |

## CI/CD Integration

### GitHub Actions

```yaml
name: Version Analysis

on: [pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Analyze version
        run: |
          npm run analyze-version
```

### PR Comment

The skill can add comments to PRs indicating:
- Suggested version bump
- Breaking changes detected
- Changelog preview

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `No commits found` | Ensure git history is available |
| `Invalid commit format` | Use conventional commits |
| `Version mismatch` | Run version sync |
| `Cannot determine bump` | Check commit types |

### Debug Mode

```bash
DEBUG=semver-analyzer node scripts/analyze.js
```

## Related Skills

- **api-diff-analyzer** - API spec comparison
- **contract-test-framework** - Contract testing
- **openapi-codegen-orchestrator** - SDK generation
- **cross-language-consistency-agent** - SDK alignment

## References

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [semantic-release](https://semantic-release.gitbook.io/)
- [Changesets](https://github.com/changesets/changesets)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SDK-004
**Category:** Versioning and Compatibility
**Status:** Active
