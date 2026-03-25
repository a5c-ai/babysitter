---
name: socketio
description: Socket.io rooms, namespaces, adapters, middleware, and real-time patterns.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Socket.io Skill

Expert assistance for building real-time applications with Socket.io.

## Capabilities

- Configure Socket.io server
- Implement rooms and namespaces
- Use Redis adapter for scaling
- Handle authentication middleware
- Build event-driven patterns
- Implement acknowledgements

## Usage

Invoke this skill when you need to:
- Build real-time applications
- Implement chat rooms
- Scale WebSocket servers
- Handle complex event patterns

## Server Setup

```typescript
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// Redis adapter for scaling
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    socket.user = verifyToken(token);
    next();
  } catch {
    next(new Error('Authentication failed'));
  }
});

// Namespaces
const chatNamespace = io.of('/chat');

chatNamespace.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.user);
  });

  socket.on('message', ({ roomId, content }) => {
    io.to(roomId).emit('message', {
      user: socket.user,
      content,
      timestamp: Date.now(),
    });
  });
});
```

## Best Practices

- Use namespaces for separation
- Implement rooms for grouping
- Scale with Redis adapter
- Handle disconnection gracefully

## Target Processes

- real-time-application
- chat-implementation
- collaborative-features
