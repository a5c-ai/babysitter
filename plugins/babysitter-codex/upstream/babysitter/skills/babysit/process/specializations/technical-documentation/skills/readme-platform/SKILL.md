---
name: readme-platform
description: ReadMe.com platform integration for API documentation. Sync OpenAPI specs, manage versions, configure API reference settings, automate changelogs, and integrate with metrics dashboards.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-012
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# ReadMe Platform Skill

ReadMe.com platform integration for API documentation.

## Capabilities

- Sync OpenAPI specs to ReadMe
- Manage documentation versions
- Configure API reference settings
- Custom page management
- Changelog automation
- API metrics dashboard integration
- Recipe/tutorial creation
- Webhook and automation setup

## Usage

Invoke this skill when you need to:
- Deploy API documentation to ReadMe
- Sync OpenAPI specifications
- Manage versioned documentation
- Configure API Explorer settings
- Set up changelog automation

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | Yes | sync, version, page, changelog, metrics |
| apiKey | string | Yes | ReadMe API key |
| specPath | string | No | Path to OpenAPI spec |
| version | string | No | Documentation version |
| projectId | string | No | ReadMe project ID |

### Input Example

```json
{
  "action": "sync",
  "apiKey": "${README_API_KEY}",
  "specPath": "./api/openapi.yaml",
  "version": "1.0"
}
```

## ReadMe CLI Configuration

### .readme.yml

```yaml
# ReadMe CLI configuration
version: "1.0"
api:
  definition: ./api/openapi.yaml
  name: My API

changelogs:
  directory: ./changelogs

docs:
  directory: ./docs

categories:
  - slug: getting-started
    title: Getting Started
  - slug: api-reference
    title: API Reference
  - slug: guides
    title: Guides
```

## Sync OpenAPI Spec

### Using rdme CLI

```bash
# Login to ReadMe
rdme login

# Sync OpenAPI spec
rdme openapi ./api/openapi.yaml --version=1.0

# Sync with specific ID
rdme openapi ./api/openapi.yaml --id=abc123

# Validate before syncing
rdme openapi:validate ./api/openapi.yaml
```

### CI/CD Integration

```yaml
# .github/workflows/docs.yml
name: Sync API Docs

on:
  push:
    branches: [main]
    paths:
      - 'api/openapi.yaml'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Sync to ReadMe
        uses: readmeio/rdme@v8
        with:
          rdme: openapi ./api/openapi.yaml --key=${{ secrets.README_API_KEY }} --version=1.0
```

## Version Management

### Create Version

```bash
# Create new version
rdme versions:create 2.0 --fork=1.0

# Update version
rdme versions:update 2.0 --main=true

# List versions
rdme versions
```

### Version Configuration

```json
{
  "version": "2.0",
  "from": "1.0",
  "codename": "Major Release",
  "is_stable": true,
  "is_beta": false,
  "is_hidden": false,
  "is_deprecated": false
}
```

## Custom Pages

### Page Creation

```bash
# Create documentation page
rdme docs ./docs --version=1.0

# Create single page
rdme docs:single ./docs/getting-started.md --version=1.0
```

### Page Frontmatter

```markdown
---
title: Getting Started
slug: getting-started
category: 6123abc456def789
order: 1
hidden: false
---

# Getting Started

Welcome to our API documentation.

## Prerequisites

- API Key (get one from [dashboard](https://app.example.com))
- Node.js 18+ or Python 3.9+

## Installation

[block:code]
{
  "codes": [
    {
      "code": "npm install @example/sdk",
      "language": "bash",
      "name": "npm"
    },
    {
      "code": "pip install example-sdk",
      "language": "bash",
      "name": "pip"
    }
  ]
}
[/block]
```

## Changelog Management

### Changelog Entry

```markdown
---
title: Version 2.0 Release
type: added
hidden: false
createdAt: 2026-01-24
---

## New Features

### OAuth 2.0 Support
We now support OAuth 2.0 authentication in addition to API keys.

### Batch Operations
New batch endpoints for processing multiple items in a single request.

## Improvements

- Improved rate limiting with better error messages
- Enhanced webhook reliability

## Bug Fixes

- Fixed pagination issue in list endpoints
- Resolved timezone handling in date filters
```

### Sync Changelogs

```bash
# Sync all changelogs
rdme changelogs ./changelogs

# Sync single changelog
rdme changelogs:single ./changelogs/2.0-release.md
```

## API Explorer Configuration

### openapi.yaml Enhancements

```yaml
openapi: 3.1.0
info:
  title: My API
  version: 1.0.0
  x-readme:
    explorer-enabled: true
    proxy-enabled: true
    samples-enabled: true
    samples-languages:
      - curl
      - node
      - python
      - ruby

servers:
  - url: https://api.example.com/v1
    description: Production
    x-readme:
      explorer-default: true

paths:
  /users:
    get:
      x-readme:
        code-samples:
          - language: javascript
            name: Node.js
            code: |
              const response = await fetch('https://api.example.com/v1/users', {
                headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
              });
        explorer-enabled: true
```

## Metrics Dashboard

### API Metrics Query

```bash
# Get API metrics via API
curl -X GET 'https://dash.readme.com/api/v1/api-metrics' \
  -H 'Authorization: Basic YOUR_API_KEY' \
  -H 'Content-Type: application/json'
```

### Metrics Response

```json
{
  "data": [
    {
      "endpoint": "GET /users",
      "requests": 15234,
      "success_rate": 99.2,
      "avg_latency": 145,
      "error_breakdown": {
        "400": 52,
        "401": 23,
        "500": 3
      }
    }
  ],
  "period": {
    "start": "2026-01-01",
    "end": "2026-01-24"
  }
}
```

## Webhooks

### Webhook Configuration

```json
{
  "url": "https://api.example.com/readme-webhook",
  "events": [
    "doc.created",
    "doc.updated",
    "changelog.created",
    "api_spec.uploaded"
  ],
  "secret": "your-webhook-secret"
}
```

### Webhook Handler

```javascript
app.post('/readme-webhook', (req, res) => {
  const signature = req.headers['x-readme-signature'];

  // Verify signature
  if (!verifySignature(req.body, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  const { event, doc, project } = req.body;

  switch (event) {
    case 'doc.updated':
      console.log(`Doc updated: ${doc.title}`);
      break;
    case 'api_spec.uploaded':
      console.log('API spec updated');
      break;
  }

  res.status(200).send('OK');
});
```

## Custom Blocks

### Interactive Code Sample

```markdown
[block:code]
{
  "codes": [
    {
      "code": "const client = new Client({ apiKey: 'YOUR_KEY' });\nconst users = await client.users.list();",
      "language": "javascript",
      "name": "JavaScript"
    },
    {
      "code": "client = Client(api_key='YOUR_KEY')\nusers = client.users.list()",
      "language": "python",
      "name": "Python"
    }
  ]
}
[/block]
```

### Callout Blocks

```markdown
[block:callout]
{
  "type": "info",
  "title": "Rate Limiting",
  "body": "This endpoint is limited to 100 requests per minute."
}
[/block]

[block:callout]
{
  "type": "warning",
  "title": "Deprecation Notice",
  "body": "This endpoint will be removed in version 3.0."
}
[/block]
```

## Workflow

1. **Configure project** - Set up ReadMe project settings
2. **Sync OpenAPI** - Upload/update API specification
3. **Create pages** - Write custom documentation
4. **Configure explorer** - Set up API Explorer
5. **Add changelogs** - Document version changes
6. **Set up webhooks** - Enable automation

## Dependencies

```json
{
  "devDependencies": {
    "rdme": "^9.0.0"
  }
}
```

## CLI Commands

```bash
# Install CLI
npm install -g rdme

# Login
rdme login

# Sync OpenAPI spec
rdme openapi ./api/openapi.yaml --version=1.0

# Sync docs
rdme docs ./docs --version=1.0

# Create version
rdme versions:create 2.0 --fork=1.0

# Sync changelogs
rdme changelogs ./changelogs
```

## Best Practices Applied

- Version documentation with releases
- Use changelogs for release notes
- Configure code samples for all endpoints
- Enable API Explorer for testing
- Set up webhooks for automation
- Use custom blocks for rich content

## References

- ReadMe: https://readme.com/
- rdme CLI: https://github.com/readmeio/rdme
- ReadMe API: https://docs.readme.com/reference
- OpenAPI Extensions: https://docs.readme.com/docs/openapi-extensions

## Target Processes

- api-doc-generation.js
- api-reference-docs.js
- docs-versioning.js
