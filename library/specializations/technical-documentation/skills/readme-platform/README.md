# ReadMe Platform Skill

ReadMe.com platform integration for API documentation.

## Overview

This skill provides integration with ReadMe.com for hosting API documentation. It covers OpenAPI synchronization, version management, custom pages, changelogs, and API metrics integration.

## When to Use

- Deploying API documentation to ReadMe
- Syncing OpenAPI specifications
- Managing documentation versions
- Creating changelog entries
- Configuring API Explorer

## Quick Start

### Install CLI

```bash
npm install -g rdme
rdme login
```

### Sync OpenAPI Spec

```bash
rdme openapi ./api/openapi.yaml --version=1.0
```

### Create Documentation Pages

```bash
rdme docs ./docs --version=1.0
```

## Key Features

### 1. OpenAPI Sync
- Automatic spec uploads
- CI/CD integration
- Validation before sync

### 2. Version Management
- Semantic versioning
- Version forking
- Deprecation support

### 3. Custom Pages
- Markdown authoring
- Rich block syntax
- Category organization

### 4. API Explorer
- Interactive testing
- Code samples
- Authentication testing

### 5. Metrics
- Request analytics
- Error tracking
- Latency monitoring

## Configuration Example

```yaml
# .readme.yml
version: "1.0"
api:
  definition: ./api/openapi.yaml
changelogs:
  directory: ./changelogs
docs:
  directory: ./docs
```

## Page Frontmatter

```markdown
---
title: Getting Started
slug: getting-started
category: 6123abc456def789
order: 1
---

# Getting Started

Your content here...
```

## CLI Commands

```bash
# Sync OpenAPI
rdme openapi ./api/openapi.yaml --version=1.0

# Sync docs
rdme docs ./docs --version=1.0

# Create version
rdme versions:create 2.0 --fork=1.0

# Sync changelogs
rdme changelogs ./changelogs
```

## CI/CD Integration

```yaml
# GitHub Actions
- uses: readmeio/rdme@v8
  with:
    rdme: openapi ./api/openapi.yaml --key=${{ secrets.README_API_KEY }}
```

## Process Integration

| Process | Usage |
|---------|-------|
| `api-doc-generation.js` | API reference docs |
| `api-reference-docs.js` | OpenAPI sync |
| `docs-versioning.js` | Version management |

## Dependencies

- rdme CLI

## References

- [ReadMe](https://readme.com/)
- [rdme CLI](https://github.com/readmeio/rdme)
- [ReadMe API](https://docs.readme.com/reference)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-012
**Category:** API Documentation Platforms
**Status:** Active
