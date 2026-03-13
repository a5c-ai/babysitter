# GitBook/Notion Integration Skill

Integration with hosted documentation platforms.

## Overview

This skill provides integration with GitBook and Notion for hosted documentation management. It supports content synchronization with Git, bidirectional export/import, API management, webhooks, and analytics retrieval.

## When to Use

- Syncing documentation to GitBook or Notion
- Managing hosted documentation spaces
- Exporting content for migration
- Setting up Git-based publishing workflows
- Retrieving documentation analytics

## Quick Start

### Sync to GitBook

```json
{
  "platform": "gitbook",
  "action": "sync",
  "spaceId": "abc123",
  "sourcePath": "./docs"
}
```

### Export from Notion

```json
{
  "platform": "notion",
  "action": "export",
  "spaceId": "database123",
  "outputPath": "./exported"
}
```

## Key Features

### GitBook

| Feature | Support |
|---------|---------|
| Git Sync | Yes |
| API Management | Yes |
| Custom Domains | Yes |
| Analytics | Yes |
| Versioning | Yes |

### Notion

| Feature | Support |
|---------|---------|
| Database Integration | Yes |
| Block Conversion | Yes |
| Export to Markdown | Yes |
| Import from Markdown | Yes |
| Analytics | Limited |

## GitBook Configuration

### .gitbook.yaml

```yaml
root: ./docs
structure:
  readme: README.md
  summary: SUMMARY.md
```

### SUMMARY.md

```markdown
# Summary

* [Introduction](README.md)
* [Getting Started](getting-started/README.md)
  * [Installation](getting-started/installation.md)
```

## Notion Database

### Schema Properties

| Property | Type |
|----------|------|
| Title | Title |
| Slug | Rich text |
| Category | Select |
| Status | Status |
| Tags | Multi-select |

## CLI Commands

```bash
# GitBook sync
gitbook sync ./docs --space abc123

# Notion export
node scripts/notion-export.js --database abc123

# Notion import
node scripts/notion-import.js --input ./docs
```

## CI/CD Integration

```yaml
- name: Sync to GitBook
  uses: gitbook/github-action-sync@v1
  with:
    token: ${{ secrets.GITBOOK_TOKEN }}
    space: ${{ secrets.GITBOOK_SPACE_ID }}
```

## Process Integration

| Process | Usage |
|---------|-------|
| `knowledge-base-setup.js` | Platform setup |
| `docs-versioning.js` | Version management |
| `content-strategy.js` | Content organization |

## Dependencies

- @notionhq/client
- gitbook-api
- gray-matter

## References

- [GitBook API](https://developer.gitbook.com/)
- [Notion API](https://developers.notion.com/)
- [GitBook Git Sync](https://docs.gitbook.com/integrations/git-sync)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-011
**Category:** Documentation Platforms
**Status:** Active
