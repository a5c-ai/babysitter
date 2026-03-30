# SSE Skill

Server-Sent Events for one-way real-time streaming from server to client.

## Overview

This skill provides expertise in SSE, a standard for pushing updates from server to browser.

## When to Use

- Live feeds
- Notifications
- Progress updates
- When WebSocket is overkill

## Quick Start

```typescript
// Server
res.setHeader('Content-Type', 'text/event-stream');
res.write(`data: ${JSON.stringify({ message: 'Hello' })}\n\n`);

// Client
const es = new EventSource('/events');
es.onmessage = (e) => console.log(e.data);
```

## Integration

Simpler alternative to websocket-skill for one-way communication.
