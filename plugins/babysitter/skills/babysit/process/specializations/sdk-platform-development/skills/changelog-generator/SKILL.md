---
name: changelog-generator
description: Automated changelog generation from commits and PRs
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Changelog Generator Skill

## Overview

This skill automates changelog generation from conventional commits and pull requests, producing well-formatted release notes for SDK versions.

## Capabilities

- Parse conventional commits for changelog entries
- Generate release notes from PR descriptions
- Categorize changes (features, fixes, breaking)
- Support multiple output formats (Markdown, JSON)
- Link to issues and PRs automatically
- Generate upgrade guides for breaking changes
- Support changelog templates
- Integrate with release automation

## Target Processes

- SDK Versioning and Release Management
- API Versioning Strategy
- Backward Compatibility Management

## Integration Points

- semantic-release for automation
- conventional-changelog
- GitHub/GitLab releases
- Release note platforms
- Documentation sites

## Input Requirements

- Commit convention (conventional commits)
- Change categories
- Output format preferences
- Template requirements
- Link generation rules

## Output Artifacts

- CHANGELOG.md file
- Release notes per version
- Upgrade guides
- Breaking change documentation
- Automated release integration

## Usage Example

```yaml
skill:
  name: changelog-generator
  context:
    convention: conventional-commits
    categories:
      - type: feat
        title: Features
      - type: fix
        title: Bug Fixes
      - type: breaking
        title: BREAKING CHANGES
    output:
      format: markdown
      file: CHANGELOG.md
    linkTemplates:
      commit: "https://github.com/org/repo/commit/{hash}"
      issue: "https://github.com/org/repo/issues/{id}"
    includeUpgradeGuide: true
```

## Best Practices

1. Enforce conventional commit messages
2. Generate changelogs on every release
3. Highlight breaking changes prominently
4. Link to relevant issues and PRs
5. Include upgrade guides
6. Support multiple formats
