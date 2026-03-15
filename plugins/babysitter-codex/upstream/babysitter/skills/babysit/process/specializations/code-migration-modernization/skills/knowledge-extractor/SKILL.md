---
name: knowledge-extractor
description: Extract tribal knowledge from code, documentation, and commit history to preserve institutional memory
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Knowledge Extractor Skill

Extracts tribal knowledge from code comments, commit messages, documentation, and other sources to preserve institutional memory during migration.

## Purpose

Enable knowledge preservation for:
- Comment analysis and extraction
- Commit message mining
- Documentation parsing
- Pattern recognition
- Business rule discovery

## Capabilities

### 1. Comment Analysis
- Extract TODO/FIXME comments
- Parse documentation comments
- Identify explanatory notes
- Find warning comments

### 2. Commit Message Mining
- Extract rationale from commits
- Identify bug fix context
- Find feature explanations
- Track decision history

### 3. Documentation Parsing
- Parse markdown documentation
- Extract from wikis
- Process README files
- Catalog API docs

### 4. Pattern Recognition
- Identify coding patterns
- Recognize idioms
- Detect conventions
- Map architectural patterns

### 5. Business Rule Extraction
- Find business logic comments
- Extract validation rules
- Identify calculation explanations
- Document edge cases

### 6. Glossary Generation
- Build domain vocabulary
- Define abbreviations
- Map term usage
- Create terminology guide

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| Sourcegraph | Code search | API |
| GitHub API | Commit history | API |
| grep/ripgrep | Pattern search | CLI |
| Custom NLP | Text analysis | Library |
| Confluence API | Wiki extraction | API |

## Output Schema

```json
{
  "extractionId": "string",
  "timestamp": "ISO8601",
  "knowledge": {
    "comments": [
      {
        "type": "todo|fixme|note|warning|explanation",
        "file": "string",
        "line": "number",
        "content": "string",
        "context": "string"
      }
    ],
    "commits": [
      {
        "hash": "string",
        "message": "string",
        "author": "string",
        "context": "string",
        "relatedFiles": []
      }
    ],
    "documentation": [],
    "businessRules": [],
    "glossary": {}
  }
}
```

## Integration with Migration Processes

- **legacy-codebase-assessment**: Knowledge discovery
- **documentation-migration**: Source material

## Related Skills

- `legacy-code-interpreter`: Code understanding
- `documentation-generator`: Doc creation

## Related Agents

- `legacy-system-archaeologist`: Uses for excavation
- `documentation-migration-agent`: Uses for doc creation
