# MCP SDK TypeScript Bootstrapper Skill

Create production-ready MCP (Model Context Protocol) servers using the official TypeScript SDK.

## Overview

The Model Context Protocol (MCP) enables AI applications to securely connect to external data sources and tools. This skill bootstraps complete MCP server implementations with proper structure, transport configuration, and security best practices.

## When to Use

- Building AI integrations that need tool/resource access
- Creating MCP servers for Claude Desktop or other MCP clients
- Adding MCP capabilities to existing Node.js applications
- Implementing custom tools for AI assistants

## Quick Start

### Basic Server

```json
{
  "serverName": "my-mcp-server",
  "description": "Custom MCP server for data access",
  "transport": "stdio"
}
```

### With Tools and Resources

```json
{
  "serverName": "database-mcp",
  "description": "MCP server for database operations",
  "transport": "stdio",
  "tools": [
    {
      "name": "query",
      "description": "Execute a read-only SQL query",
      "inputSchema": {
        "type": "object",
        "properties": {
          "sql": { "type": "string", "description": "SQL query to execute" },
          "database": { "type": "string", "description": "Database name" }
        },
        "required": ["sql"]
      }
    },
    {
      "name": "list_tables",
      "description": "List all tables in a database",
      "inputSchema": {
        "type": "object",
        "properties": {
          "database": { "type": "string", "description": "Database name" }
        }
      }
    }
  ],
  "resources": [
    {
      "uriTemplate": "db://{database}/schema",
      "name": "Database Schema",
      "description": "Get schema for a database",
      "mimeType": "application/json"
    }
  ]
}
```

## Generated Structure

```
my-mcp-server/
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config
├── .gitignore
├── README.md              # Server documentation
├── mcp.json               # MCP manifest
├── src/
│   ├── index.ts           # Entry point
│   ├── server.ts          # Server configuration
│   ├── transport/
│   │   └── stdio.ts       # Transport implementation
│   ├── tools/
│   │   ├── index.ts       # Tool registry
│   │   ├── query.ts       # Query tool
│   │   └── list-tables.ts # List tables tool
│   ├── resources/
│   │   ├── index.ts       # Resource registry
│   │   └── schema.ts      # Schema resource
│   └── utils/
│       ├── validation.ts  # Input validation
│       ├── errors.ts      # Error handling
│       └── logging.ts     # Logging utilities
└── tests/
    ├── tools/
    │   └── query.test.ts
    └── resources/
        └── schema.test.ts
```

## MCP Concepts

### Tools
Functions that the AI can invoke to perform actions:
- Execute queries
- Create/modify resources
- Interact with external services

### Resources
Data sources the AI can read:
- Files and directories
- Database schemas
- API endpoints

### Prompts
Reusable prompt templates:
- Common query patterns
- Workflow templates
- Context enrichment

## Example Generated Tool

```typescript
// src/tools/query.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { executeQuery } from '../utils/database';

const QueryInput = z.object({
  sql: z.string().describe('SQL query to execute'),
  database: z.string().optional().describe('Database name'),
});

export function registerQueryTool(server: McpServer) {
  server.tool(
    'query',
    'Execute a read-only SQL query',
    QueryInput.shape,
    async (args) => {
      const input = QueryInput.parse(args);

      // Validate read-only
      if (!isReadOnlyQuery(input.sql)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Only SELECT queries are allowed'
        );
      }

      try {
        const results = await executeQuery(input.sql, input.database);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2),
          }],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Query failed: ${error.message}`
        );
      }
    }
  );
}
```

## Transport Options

| Transport | Use Case | Configuration |
|-----------|----------|---------------|
| stdio | Claude Desktop, CLI tools | Default, simplest setup |
| SSE | Web applications | HTTP server required |
| WebSocket | Real-time applications | WebSocket server required |

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://..."
      }
    }
  }
}
```

## Error Handling

The skill generates proper MCP error handling:

```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Invalid parameters
throw new McpError(ErrorCode.InvalidParams, 'Missing required field: path');

// Resource not found
throw new McpError(ErrorCode.InvalidRequest, 'File not found');

// Internal error
throw new McpError(ErrorCode.InternalError, 'Database connection failed');

// Method not found
throw new McpError(ErrorCode.MethodNotFound, 'Unknown tool');
```

## Security Best Practices

The generated server includes:

1. **Input Validation**: Zod schemas for all tool inputs
2. **Path Sanitization**: Prevent directory traversal
3. **Query Validation**: Read-only SQL enforcement
4. **Error Masking**: Don't leak internal details
5. **Logging**: Structured stderr logging

## Testing

```typescript
// tests/tools/query.test.ts
import { describe, it, expect } from 'vitest';
import { createTestServer } from '../setup';

describe('query tool', () => {
  it('executes valid SELECT query', async () => {
    const server = await createTestServer();
    const result = await server.callTool('query', {
      sql: 'SELECT * FROM users LIMIT 10',
    });
    expect(result.content[0].text).toContain('users');
  });

  it('rejects non-SELECT queries', async () => {
    const server = await createTestServer();
    await expect(
      server.callTool('query', { sql: 'DELETE FROM users' })
    ).rejects.toThrow('Only SELECT queries are allowed');
  });
});
```

## Integration with Processes

| Process | Integration |
|---------|-------------|
| mcp-server-bootstrap | Primary scaffolding for MCP servers |
| mcp-tool-implementation | Generates tool handlers |
| mcp-resource-provider | Creates resource providers |
| mcp-transport-layer | Configures transport setup |
| mcp-server-security-hardening | Security patterns |

## References

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
