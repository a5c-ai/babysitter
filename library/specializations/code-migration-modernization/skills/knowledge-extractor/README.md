# Knowledge Extractor Skill

## Overview

The Knowledge Extractor skill mines tribal knowledge from code, comments, and history. It preserves institutional memory that might otherwise be lost during migration.

## Quick Start

### Prerequisites

- Access to git history
- Codebase read access
- Optional: Documentation sources

### Basic Usage

1. **Extract comments**
   ```bash
   # Find TODO/FIXME comments
   grep -rn "TODO\|FIXME" ./src
   ```

2. **Mine commit history**
   ```bash
   # Search commit messages
   git log --grep="fix" --oneline
   ```

3. **Compile knowledge base**
   - Organize by topic
   - Link to source
   - Create glossary

## Features

### Knowledge Sources

| Source | Content Type | Value |
|--------|-------------|-------|
| Code comments | Explanations | High |
| Commit messages | Rationale | Medium |
| Documentation | Formal knowledge | High |
| Issue trackers | Bug context | Medium |

### Extraction Types

- **Explicit**: Direct comments and docs
- **Implicit**: Patterns and conventions
- **Historical**: Commit and issue context
- **Domain**: Business terminology

## Configuration

```json
{
  "sources": {
    "comments": true,
    "commits": true,
    "docs": true,
    "issues": false
  },
  "commentPatterns": ["TODO", "FIXME", "NOTE", "HACK", "XXX"],
  "commitDepth": "5-years",
  "outputFormat": "markdown"
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
