# Socket.io Skill

Real-time bidirectional event-based communication with Socket.io.

## Overview

This skill provides expertise in Socket.io, a library enabling real-time, bidirectional communication.

## When to Use

- Chat applications
- Real-time collaboration
- Live notifications
- Gaming applications

## Quick Start

```typescript
const io = new Server(httpServer);

io.on('connection', (socket) => {
  socket.join('room1');
  socket.to('room1').emit('message', 'Hello!');
});
```

## Features

| Feature | Description |
|---------|-------------|
| Rooms | Group sockets |
| Namespaces | Separate concerns |
| Adapters | Scale horizontally |

## Integration

Works with redis-skill for scaling across instances.
