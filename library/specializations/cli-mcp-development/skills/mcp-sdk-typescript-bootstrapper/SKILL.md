---
name: mcp-sdk-typescript-bootstrapper
description: Bootstrap MCP (Model Context Protocol) servers with the official TypeScript SDK. Creates complete server implementations with transport layer, tools, resources, and proper error handling.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# MCP SDK TypeScript Bootstrapper

Bootstrap production-ready MCP servers using the official TypeScript SDK with proper transport configuration, tool/resource handlers, and security best practices.

## Capabilities

- Generate MCP server projects with TypeScript SDK
- Configure stdio, SSE, or WebSocket transports
- Scaffold tool and resource handlers
- Set up proper error handling and validation
- Configure capability declarations
- Implement security best practices

## Usage

Invoke this skill when you need to:
- Create a new MCP server from scratch
- Add MCP capabilities to existing projects
- Scaffold tool and resource implementations
- Configure MCP transport layers

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| serverName | string | Yes | Name of the MCP server (kebab-case) |
| description | string | Yes | Server description for clients |
| transport | string | No | stdio, sse, or websocket (default: stdio) |
| tools | array | No | List of tools to scaffold |
| resources | array | No | List of resources to provide |
| capabilities | object | No | Server capability declarations |

### Tool Definition Structure

```json
{
  "tools": [
    {
      "name": "read_file",
      "description": "Read contents of a file",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": { "type": "string", "description": "File path to read" }
        },
        "required": ["path"]
      }
    }
  ]
}
```

### Resource Definition Structure

```json
{
  "resources": [
    {
      "uriTemplate": "file:///{path}",
      "name": "File Resource",
      "description": "Access file contents",
      "mimeType": "text/plain"
    }
  ]
}
```

## Output Structure

```
<serverName>/
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
├── src/
│   ├── index.ts              # Server entry point
│   ├── server.ts             # MCP server setup
│   ├── transport/
│   │   ├── stdio.ts          # Stdio transport
│   │   ├── sse.ts            # SSE transport (if selected)
│   │   └── websocket.ts      # WebSocket transport (if selected)
│   ├── tools/
│   │   ├── index.ts          # Tool registry
│   │   └── <tool>.ts         # Individual tool handlers
│   ├── resources/
│   │   ├── index.ts          # Resource registry
│   │   └── <resource>.ts     # Resource providers
│   ├── prompts/
│   │   └── index.ts          # Prompt templates (optional)
│   └── utils/
│       ├── validation.ts     # Input validation helpers
│       ├── errors.ts         # MCP error handling
│       └── logging.ts        # Structured logging
├── tests/
│   ├── tools/
│   └── resources/
└── mcp.json                  # MCP server manifest
```

## Generated Code Patterns

### Server Setup (src/server.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools';
import { registerResources } from './resources';

export async function createServer() {
  const server = new McpServer({
    name: '<serverName>',
    version: '1.0.0',
  });

  // Register capabilities
  registerTools(server);
  registerResources(server);

  return server;
}

export async function startServer() {
  const server = await createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error('[MCP] Server started on stdio');
}
```

### Tool Handler (src/tools/<name>.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

const inputSchema = z.object({
  path: z.string().describe('File path to read'),
});

export function registerReadFileTool(server: McpServer) {
  server.tool(
    'read_file',
    'Read contents of a file',
    inputSchema.shape,
    async (args) => {
      const { path } = inputSchema.parse(args);

      try {
        // Implementation
        const content = await readFile(path, 'utf-8');
        return {
          content: [{ type: 'text', text: content }],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to read file: ${error.message}`
        );
      }
    }
  );
}
```

### Resource Provider (src/resources/<name>.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerFileResource(server: McpServer) {
  server.resource(
    'file:///{path}',
    'File Resource',
    'Access file contents by path',
    async (uri) => {
      const path = uri.pathname;

      const content = await readFile(path, 'utf-8');

      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/plain',
          text: content,
        }],
      };
    }
  );
}
```

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## Transport Configurations

### Stdio (Default)
```typescript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
const transport = new StdioServerTransport();
```

### SSE (HTTP Server-Sent Events)
```typescript
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();
app.get('/sse', (req, res) => {
  const transport = new SSEServerTransport('/message', res);
  server.connect(transport);
});
```

### WebSocket
```typescript
import { WebSocketServerTransport } from '@modelcontextprotocol/sdk/server/websocket.js';
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });
wss.on('connection', (ws) => {
  const transport = new WebSocketServerTransport(ws);
  server.connect(transport);
});
```

## Workflow

1. **Validate inputs** - Check server name, tool/resource definitions
2. **Create project structure** - Set up folders and base files
3. **Generate package.json** - Configure dependencies
4. **Generate tsconfig.json** - TypeScript configuration
5. **Create server entry** - Main server setup
6. **Generate transport layer** - Selected transport implementation
7. **Scaffold tools** - Tool handlers with schemas
8. **Scaffold resources** - Resource providers
9. **Create utilities** - Validation, errors, logging
10. **Set up tests** - Test structure for tools/resources

## Best Practices Applied

- Zod schema validation for all inputs
- Proper MCP error codes and messages
- Structured logging to stderr
- Clean separation of tools/resources
- TypeScript strict mode
- Comprehensive error handling
- Input sanitization

## References

- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP Specification: https://modelcontextprotocol.io/
- MCP Server Examples: https://github.com/modelcontextprotocol/servers

## Target Processes

- mcp-server-bootstrap
- mcp-tool-implementation
- mcp-resource-provider
- mcp-transport-layer
