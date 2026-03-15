---
name: sse
description: Server-Sent Events implementation, streaming patterns, and real-time updates.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# SSE Skill

Expert assistance for implementing Server-Sent Events for real-time streaming.

## Capabilities

- Implement SSE endpoints
- Handle streaming responses
- Manage client connections
- Build event-driven updates
- Implement reconnection

## Usage

Invoke this skill when you need to:
- Stream updates to clients
- Implement live feeds
- Build notification systems
- One-way real-time communication

## Implementation

```typescript
// Server
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event: string, data: object) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial data
  sendEvent('connected', { timestamp: Date.now() });

  // Subscribe to updates
  const unsubscribe = eventEmitter.on('update', (data) => {
    sendEvent('update', data);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// Client
const eventSource = new EventSource('/events');

eventSource.addEventListener('update', (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
});
```

## Best Practices

- Handle reconnection
- Use event types for routing
- Implement keep-alive
- Clean up on disconnect

## Target Processes

- real-time-updates
- live-feeds
- notification-systems
