---
name: dependency-updater
description: Automated dependency update execution with breaking change detection and rollback capability
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Dependency Updater Skill

Executes automated dependency updates safely with breaking change detection, rollback capability, and intelligent update batching.

## Purpose

Enable safe, automated dependency updates for:
- Security patch application
- Version upgrades
- Breaking change management
- Update batching and sequencing
- Rollback coordination

## Capabilities

### 1. Safe Update Execution
- Execute updates with validation
- Run tests after updates
- Verify build success
- Check runtime compatibility

### 2. Breaking Change Detection
- Analyze changelogs for breaking changes
- Detect API modifications
- Identify behavioral changes
- Flag deprecation impacts

### 3. Rollback Capability
- Create pre-update snapshots
- Enable quick rollback
- Preserve lockfile history
- Document rollback procedures

### 4. Update Batching
- Group compatible updates
- Prioritize security updates
- Sequence breaking changes
- Minimize update iterations

### 5. Lock File Management
- Update lockfiles consistently
- Handle peer dependencies
- Resolve version conflicts
- Maintain reproducibility

### 6. Changelog Parsing
- Extract version changes
- Identify migration guides
- Document upgrade steps
- Link to release notes

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| Dependabot | GitHub automation | API |
| Renovate | Multi-platform updates | CLI / Config |
| npm-check-updates | npm updates | CLI |
| pyup | Python updates | CLI |
| bundler-audit | Ruby updates | CLI |
| go get -u | Go updates | CLI |

## Output Schema

```json
{
  "updateId": "string",
  "timestamp": "ISO8601",
  "updates": [
    {
      "package": "string",
      "from": "string",
      "to": "string",
      "type": "major|minor|patch|security",
      "breakingChanges": "boolean",
      "status": "applied|failed|skipped",
      "rollbackAvailable": "boolean"
    }
  ],
  "validation": {
    "testsPass": "boolean",
    "buildSuccess": "boolean",
    "runtimeChecks": "boolean"
  },
  "rollback": {
    "snapshotId": "string",
    "lockfileBackup": "string"
  }
}
```

## Integration with Migration Processes

- **dependency-analysis-updates**: Update execution
- **framework-upgrade**: Coordinated upgrades

## Related Skills

- `dependency-scanner`: Pre-update analysis
- `vulnerability-scanner`: Security prioritization

## Related Agents

- `dependency-modernization-agent`: Update orchestration
- `framework-upgrade-specialist`: Framework updates
