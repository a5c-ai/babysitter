# WebSocket Skill

Real-time bidirectional communication with WebSockets.

## Overview

This skill provides expertise in WebSocket implementation for real-time features.

## When to Use

- Real-time notifications
- Chat applications
- Live dashboards
- Collaborative features

## Quick Start

```typescript
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    ws.send(`Received: ${data}`);
  });
});
```

## Integration

Works with socketio-skill for higher-level abstractions.
