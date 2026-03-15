---
name: websocket
description: WebSocket implementation, connection management, scaling patterns, and real-time features.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# WebSocket Skill

Expert assistance for implementing WebSocket real-time communication.

## Capabilities

- Implement WebSocket servers
- Handle connection lifecycle
- Build pub/sub patterns
- Scale with Redis adapter
- Implement reconnection logic
- Handle authentication

## Usage

Invoke this skill when you need to:
- Add real-time features
- Build chat applications
- Implement live updates
- Handle bidirectional communication

## Server Implementation

```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ server });

const clients = new Map<string, WebSocket>();

wss.on('connection', (ws, req) => {
  const userId = authenticateConnection(req);
  clients.set(userId, ws);

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    handleMessage(userId, message);
  });

  ws.on('close', () => {
    clients.delete(userId);
  });
});

function broadcast(message: object) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
```

## Best Practices

- Implement heartbeat/ping-pong
- Handle reconnection gracefully
- Use message queues for scaling
- Authenticate connections

## Target Processes

- real-time-features
- chat-application
- live-updates
