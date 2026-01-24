---
name: mcp-resource-uri-designer
description: Design and implement MCP resource URI schemes and templates with proper naming, hierarchy, and documentation.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# MCP Resource URI Designer

Design and implement resource URI schemes for MCP servers.

## Capabilities

- Design URI schemes for resources
- Create URI template patterns
- Generate URI parsing utilities
- Document resource hierarchies
- Implement content type mapping
- Create resource discovery

## Usage

Invoke this skill when you need to:
- Design URI schemes for MCP resources
- Create URI template patterns
- Implement resource hierarchies
- Document resource APIs

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| domain | string | Yes | Resource domain (e.g., files, database) |
| resources | array | Yes | Resource definitions |
| language | string | No | Implementation language (default: typescript) |

### Resource Structure

```json
{
  "domain": "database",
  "resources": [
    {
      "pattern": "db://{database}/tables/{table}",
      "name": "Database Table",
      "description": "Access database table schema and data",
      "mimeType": "application/json",
      "parameters": {
        "database": { "description": "Database name" },
        "table": { "description": "Table name" }
      }
    }
  ]
}
```

## Generated Patterns

### TypeScript URI Handler

```typescript
import { Resource, ResourceTemplate } from '@modelcontextprotocol/sdk/types.js';

// URI Templates
const URI_TEMPLATES = {
  table: 'db://{database}/tables/{table}',
  schema: 'db://{database}/schema',
  query: 'db://{database}/query/{queryId}',
} as const;

// Parse URI to extract parameters
export function parseResourceUri(uri: string): {
  type: keyof typeof URI_TEMPLATES;
  params: Record<string, string>;
} | null {
  const patterns = [
    { type: 'table' as const, regex: /^db:\/\/([^/]+)\/tables\/([^/]+)$/ },
    { type: 'schema' as const, regex: /^db:\/\/([^/]+)\/schema$/ },
    { type: 'query' as const, regex: /^db:\/\/([^/]+)\/query\/([^/]+)$/ },
  ];

  for (const { type, regex } of patterns) {
    const match = uri.match(regex);
    if (match) {
      if (type === 'table') {
        return { type, params: { database: match[1], table: match[2] } };
      } else if (type === 'schema') {
        return { type, params: { database: match[1] } };
      } else if (type === 'query') {
        return { type, params: { database: match[1], queryId: match[2] } };
      }
    }
  }
  return null;
}

// Build URI from parameters
export function buildResourceUri(
  type: keyof typeof URI_TEMPLATES,
  params: Record<string, string>
): string {
  let uri = URI_TEMPLATES[type];
  for (const [key, value] of Object.entries(params)) {
    uri = uri.replace(`{${key}}`, encodeURIComponent(value));
  }
  return uri;
}

// List available resource templates
export function listResourceTemplates(): ResourceTemplate[] {
  return [
    {
      uriTemplate: URI_TEMPLATES.table,
      name: 'Database Table',
      description: 'Access database table schema and data',
      mimeType: 'application/json',
    },
    {
      uriTemplate: URI_TEMPLATES.schema,
      name: 'Database Schema',
      description: 'Full database schema information',
      mimeType: 'application/json',
    },
  ];
}
```

## URI Design Guidelines

### Scheme Selection
- `file://` - File system resources
- `db://` - Database resources
- `http://`, `https://` - Web resources
- `git://` - Git repository resources
- Custom schemes for domain-specific resources

### Hierarchy Patterns
```
db://{database}/tables/{table}
db://{database}/tables/{table}/rows/{rowId}
db://{database}/views/{view}
db://{database}/functions/{function}

file:///{path}
file:///projects/{project}/src/{file}

git://{repo}/branches/{branch}/files/{path}
```

## Workflow

1. **Analyze domain** - Understand resource types
2. **Design scheme** - Choose URI scheme
3. **Define templates** - Create URI patterns
4. **Generate parser** - URI parsing utilities
5. **Create builder** - URI construction helpers
6. **Document resources** - API documentation

## Target Processes

- mcp-resource-provider
- mcp-server-bootstrap
- mcp-tool-documentation
