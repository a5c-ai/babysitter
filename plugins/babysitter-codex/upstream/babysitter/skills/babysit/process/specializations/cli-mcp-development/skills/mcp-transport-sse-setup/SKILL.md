---
name: mcp-transport-sse-setup
description: Configure HTTP/SSE transport for web-based MCP servers with proper endpoints, authentication, and CORS.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# MCP Transport SSE Setup

Configure HTTP/SSE transport for web-based MCP servers.

## Capabilities

- Configure SSE transport for MCP servers
- Set up HTTP endpoints for MCP communication
- Implement authentication middleware
- Configure CORS for browser clients
- Set up health check endpoints
- Implement connection management

## Usage

Invoke this skill when you need to:
- Set up web-based MCP server transport
- Configure SSE for real-time communication
- Implement authentication for MCP endpoints
- Enable CORS for browser-based clients

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language | string | Yes | Target language (typescript, python) |
| framework | string | No | Web framework (express, fastify, fastapi) |
| auth | object | No | Authentication configuration |
| cors | object | No | CORS configuration |

## Generated Patterns

### TypeScript Express SSE Transport

```typescript
import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

app.use(express.json());

// Store active connections
const connections = new Map<string, SSEServerTransport>();

// SSE endpoint
app.get('/sse', async (req, res) => {
  const connectionId = req.query.connectionId as string || crypto.randomUUID();

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Create transport
  const transport = new SSEServerTransport('/message', res);
  connections.set(connectionId, transport);

  // Create server instance for this connection
  const server = new Server(
    { name: 'my-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {} } }
  );

  // Register handlers...
  registerToolHandlers(server);

  // Handle connection close
  req.on('close', () => {
    connections.delete(connectionId);
    transport.close();
  });

  // Connect transport
  await server.connect(transport);
});

// Message endpoint
app.post('/message', async (req, res) => {
  const connectionId = req.query.connectionId as string;
  const transport = connections.get(connectionId);

  if (!transport) {
    res.status(404).json({ error: 'Connection not found' });
    return;
  }

  try {
    await transport.handlePostMessage(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    connections: connections.size,
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Server listening on port ${PORT}`);
});
```

### Python FastAPI SSE Transport

```python
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from mcp.server import Server
from mcp.server.sse import SseServerTransport
import uuid
import asyncio

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store connections
connections: dict[str, SseServerTransport] = {}

@app.get("/sse")
async def sse_endpoint(request: Request):
    connection_id = request.query_params.get("connectionId") or str(uuid.uuid4())

    async def event_generator():
        transport = SseServerTransport("/message")
        connections[connection_id] = transport

        server = Server("my-mcp-server")
        register_handlers(server)

        try:
            async for event in transport.events():
                yield event
        finally:
            connections.pop(connection_id, None)

    return EventSourceResponse(event_generator())

@app.post("/message")
async def message_endpoint(request: Request):
    connection_id = request.query_params.get("connectionId")
    transport = connections.get(connection_id)

    if not transport:
        return Response(status_code=404, content="Connection not found")

    body = await request.json()
    await transport.handle_message(body)
    return Response(status_code=200)

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "connections": len(connections),
    }
```

## Workflow

1. **Configure framework** - Set up web framework
2. **Add CORS** - Configure cross-origin requests
3. **Create SSE endpoint** - Set up event stream
4. **Add message handler** - POST endpoint for messages
5. **Implement auth** - Optional authentication
6. **Add health check** - Monitoring endpoint

## Target Processes

- mcp-transport-layer
- mcp-server-bootstrap
- mcp-server-monitoring-debugging
