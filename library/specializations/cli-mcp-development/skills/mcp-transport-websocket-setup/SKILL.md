---
name: mcp-transport-websocket-setup
description: Configure WebSocket transport for bidirectional MCP communication with connection management and reconnection handling.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# MCP Transport WebSocket Setup

Configure WebSocket transport for bidirectional MCP communication.

## Capabilities

- Configure WebSocket transport for MCP
- Implement connection lifecycle management
- Set up reconnection with backoff
- Handle message framing
- Implement heartbeat/ping-pong
- Configure secure WebSocket (WSS)

## Usage

Invoke this skill when you need to:
- Set up bidirectional MCP communication
- Implement WebSocket-based MCP transport
- Configure connection management
- Enable real-time bidirectional messaging

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language | string | Yes | Target language |
| server | boolean | No | Generate server code (default: true) |
| client | boolean | No | Generate client code (default: false) |
| secure | boolean | No | Use WSS (default: true) |

## Generated Patterns

### TypeScript WebSocket Server

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

interface Connection {
  ws: WebSocket;
  server: Server;
  lastPing: number;
}

const connections = new Map<string, Connection>();

const wss = new WebSocketServer({
  port: parseInt(process.env.WS_PORT || '8080'),
  path: '/mcp',
});

// Heartbeat interval
const HEARTBEAT_INTERVAL = 30000;

wss.on('connection', (ws, req) => {
  const connectionId = crypto.randomUUID();
  console.log(`New connection: ${connectionId}`);

  // Create MCP server for this connection
  const server = new Server(
    { name: 'my-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {} } }
  );

  // Register handlers
  registerToolHandlers(server);

  // Store connection
  connections.set(connectionId, {
    ws,
    server,
    lastPing: Date.now(),
  });

  // Handle messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      await handleMessage(connectionId, message);
    } catch (error) {
      console.error('Failed to process message:', error);
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
      }));
    }
  });

  // Handle close
  ws.on('close', () => {
    console.log(`Connection closed: ${connectionId}`);
    connections.delete(connectionId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`Connection error: ${connectionId}`, error);
  });

  // Respond to pings
  ws.on('pong', () => {
    const conn = connections.get(connectionId);
    if (conn) conn.lastPing = Date.now();
  });
});

// Heartbeat check
setInterval(() => {
  const now = Date.now();
  connections.forEach((conn, id) => {
    if (now - conn.lastPing > HEARTBEAT_INTERVAL * 2) {
      console.log(`Terminating stale connection: ${id}`);
      conn.ws.terminate();
      connections.delete(id);
    } else {
      conn.ws.ping();
    }
  });
}, HEARTBEAT_INTERVAL);

async function handleMessage(connectionId: string, message: any) {
  const conn = connections.get(connectionId);
  if (!conn) return;

  // Process MCP message and send response
  // Implementation depends on message type
}

console.log(`WebSocket MCP Server running on port ${process.env.WS_PORT || 8080}`);
```

### TypeScript WebSocket Client

```typescript
import WebSocket from 'ws';

interface MCPClientOptions {
  url: string;
  reconnect?: boolean;
  maxRetries?: number;
}

class MCPWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxRetries: number;
  private reconnectDelay = 1000;

  constructor(private options: MCPClientOptions) {
    this.maxRetries = options.maxRetries ?? 5;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.options.url);

      this.ws.on('open', () => {
        console.log('Connected to MCP server');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        resolve();
      });

      this.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      });

      this.ws.on('close', () => {
        console.log('Disconnected from MCP server');
        if (this.options.reconnect) {
          this.attemptReconnect();
        }
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxRetries) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(() => {
        // Will trigger another reconnect attempt
      });
    }, delay);
  }

  async send(message: any): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }
    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(message: any) {
    // Handle incoming MCP messages
    console.log('Received:', message);
  }

  close() {
    this.options.reconnect = false;
    this.ws?.close();
  }
}
```

## Workflow

1. **Configure server** - WebSocket server setup
2. **Add handlers** - Message processing
3. **Implement heartbeat** - Connection health
4. **Add reconnection** - Client reconnection
5. **Configure security** - WSS setup
6. **Add monitoring** - Connection metrics

## Target Processes

- mcp-transport-layer
- mcp-server-bootstrap
- mcp-client-implementation
