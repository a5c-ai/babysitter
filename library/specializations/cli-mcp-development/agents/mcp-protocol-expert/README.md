# MCP Protocol Expert Agent

Deep expertise in MCP (Model Context Protocol) specification, implementation patterns, and best practices.

## Overview

The MCP Protocol Expert agent provides comprehensive guidance on building MCP servers and clients. It interprets the specification, advises on implementation patterns, and helps troubleshoot issues.

## When to Use

- Designing MCP server architecture
- Implementing tools and resources
- Configuring transport layers
- Reviewing security implementations
- Debugging MCP communication issues
- Optimizing server performance

## Expertise Areas

### Specification Knowledge

The agent has comprehensive knowledge of:
- Protocol message formats and lifecycle
- Capability negotiation
- Tool and resource contracts
- Error handling requirements
- Transport specifications

### Implementation Guidance

Expertise in:
- TypeScript, Python, Go SDK usage
- Server structure patterns
- State management
- Async handling
- Error propagation

### Security

Focus on:
- Input validation strategies
- Access control patterns
- Sandboxing techniques
- Audit logging

## Interaction Examples

### Architecture Review

**Input:**
```
I'm building an MCP server for file operations. What's the recommended structure?
```

**Agent Response:**
```
Recommended MCP file server architecture:

src/
├── index.ts           # Entry point
├── server.ts          # Server configuration
├── transport/
│   └── stdio.ts       # Transport setup
├── tools/
│   ├── read-file.ts   # Read operations
│   ├── write-file.ts  # Write operations (if allowed)
│   └── list-dir.ts    # Directory listing
├── resources/
│   └── file.ts        # File resources (file:///{path})
└── utils/
    ├── validation.ts  # Path validation, sanitization
    ├── errors.ts      # MCP error helpers
    └── sandbox.ts     # Path restriction logic

Key considerations:
1. Restrict paths to allowed directories
2. Validate all paths for traversal attacks
3. Use read-only mode by default
4. Implement size limits for reads
5. Log all file access for audit
```

### Tool Design Review

**Input:**
```json
{
  "name": "query",
  "description": "Run a database query",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sql": { "type": "string" }
    }
  }
}
```

**Agent Response:**
```
Tool schema improvements needed:

1. Make description AI-friendly:
   "Execute a read-only SQL query against the PostgreSQL database.
    Returns results as JSON array. Only SELECT statements are allowed.
    Maximum 1000 rows returned."

2. Add constraints to schema:
   "sql": {
     "type": "string",
     "description": "SQL SELECT query to execute",
     "minLength": 1,
     "maxLength": 10000
   }

3. Add parameters:
   "database": {
     "type": "string",
     "description": "Database name (optional, uses default)",
     "enum": ["main", "analytics", "logs"]
   },
   "limit": {
     "type": "integer",
     "description": "Max rows to return",
     "default": 100,
     "maximum": 1000
   }

4. Mark required fields:
   "required": ["sql"]

5. Security: Ensure handler validates SQL is read-only
```

### Debugging Assistance

**Input:**
```
My MCP server isn't responding to tool calls. Claude says "tool not found".
```

**Agent Response:**
```
Troubleshooting steps for "tool not found":

1. Verify tool registration:
   - Check tool is registered before transport connect
   - Ensure no errors during registration

2. Check tools/list response:
   Use MCP Inspector to call tools/list and verify
   your tool appears in the response

3. Verify tool name matches:
   - Tool names are case-sensitive
   - Check for typos in registration vs call

4. Check capability negotiation:
   - Verify server declares tools capability
   - Check initialize response includes tools

5. Debug with logging:
   ```typescript
   server.tool('my_tool', ..., async (args) => {
     console.error('[DEBUG] my_tool called with:', args);
     // ...
   });
   ```

6. Test with MCP Inspector:
   npx @modelcontextprotocol/inspector node dist/index.js

Common causes:
- Tool registered after server.connect()
- Typo in tool name
- Tool registration threw error (silently)
```

## Common Patterns

### Tool Registration

```typescript
// Good: Clear descriptions, validated input
server.tool(
  'search_files',
  'Search for files matching a glob pattern in the project directory. ' +
  'Returns file paths relative to project root. Max 100 results.',
  {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Glob pattern (e.g., "**/*.ts", "src/*.json")',
      },
      directory: {
        type: 'string',
        description: 'Subdirectory to search (optional)',
      },
    },
    required: ['pattern'],
  },
  async (args) => {
    const validated = SearchSchema.parse(args);
    const results = await searchFiles(validated);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2),
      }],
    };
  }
);
```

### Resource Registration

```typescript
// Good: Clear URI pattern, proper content type
server.resource(
  'config:///{key}',
  'Configuration Value',
  'Read configuration values by key. Available keys: ' +
  'database_url, api_key, log_level, max_connections',
  async (uri) => {
    const key = uri.pathname.slice(1);
    const value = await getConfig(key);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify({ key, value }),
      }],
    };
  }
);
```

### Error Handling

```typescript
// Good: Appropriate error codes, safe messages
try {
  const result = await performOperation(args);
  return { content: [{ type: 'text', text: result }] };
} catch (error) {
  if (error instanceof ValidationError) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid input: ${error.message}`
    );
  }
  if (error instanceof NotFoundError) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Resource not found: ${error.path}`
    );
  }
  // Log full error, return safe message
  console.error('Internal error:', error);
  throw new McpError(
    ErrorCode.InternalError,
    'Operation failed. See server logs for details.'
  );
}
```

## Integration

The MCP Protocol Expert agent integrates with:

| Process | Role |
|---------|------|
| mcp-server-bootstrap | Architecture guidance |
| mcp-tool-implementation | Tool design review |
| mcp-resource-provider | Resource pattern advice |
| mcp-transport-layer | Transport configuration |
| mcp-server-security-hardening | Security review |
| mcp-server-testing-suite | Test strategy guidance |

## References

- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- [Reference Servers](https://github.com/modelcontextprotocol/servers)
