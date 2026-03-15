# Confluence Integration Skill

Atlassian Confluence integration for enterprise documentation.

## Overview

This skill provides integration with Atlassian Confluence for enterprise documentation management. It supports page creation and updates via API, content migration between Markdown and Confluence, space management, and bidirectional sync workflows.

## When to Use

- Syncing documentation to Confluence
- Migrating content between Markdown and Confluence
- Managing Confluence spaces programmatically
- Automating page updates from CI/CD
- Exporting Confluence content to Markdown

## Quick Start

### Sync to Confluence

```json
{
  "action": "migrate",
  "baseUrl": "https://company.atlassian.net/wiki",
  "spaceKey": "DOCS",
  "sourcePath": "./docs"
}
```

### Export from Confluence

```json
{
  "action": "export",
  "baseUrl": "https://company.atlassian.net/wiki",
  "spaceKey": "DOCS",
  "outputPath": "./exported"
}
```

## Key Features

### 1. Page Management
- Create and update pages
- Manage hierarchy
- Handle attachments

### 2. Content Migration
- Markdown to Confluence
- Confluence to Markdown
- Macro conversion

### 3. Space Management
- Create spaces
- Set permissions
- Configure templates

### 4. Sync Workflow
- Bidirectional sync
- Conflict resolution
- CI/CD integration

## Configuration

```json
{
  "baseUrl": "https://company.atlassian.net/wiki",
  "auth": {
    "email": "${CONFLUENCE_EMAIL}",
    "token": "${CONFLUENCE_TOKEN}"
  },
  "space": {
    "key": "DOCS"
  }
}
```

## Conversion Features

| Markdown | Confluence |
|----------|------------|
| Code blocks | Code macro |
| Notes/warnings | Info/Warning macros |
| Images | Attachments |
| Tables | Wrapped tables |

## CLI Commands

```bash
# Sync to Confluence
node scripts/confluence-sync.js --config config.json

# Export from Confluence
node scripts/confluence-export.js --space DOCS

# Create space
node scripts/confluence-space.js create --key NEWDOCS
```

## CI/CD Integration

```yaml
- name: Sync to Confluence
  run: node scripts/confluence-sync.js
  env:
    CONFLUENCE_EMAIL: ${{ secrets.CONFLUENCE_EMAIL }}
    CONFLUENCE_TOKEN: ${{ secrets.CONFLUENCE_TOKEN }}
```

## Process Integration

| Process | Usage |
|---------|-------|
| `knowledge-base-setup.js` | Space setup |
| `docs-pr-workflow.js` | Auto-sync on merge |
| `content-strategy.js` | Content organization |

## Dependencies

- confluence-api
- marked
- gray-matter

## References

- [Confluence REST API](https://developer.atlassian.com/cloud/confluence/rest/)
- [Storage Format](https://confluence.atlassian.com/doc/confluence-storage-format-790796544.html)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-013
**Category:** Enterprise Documentation
**Status:** Active
