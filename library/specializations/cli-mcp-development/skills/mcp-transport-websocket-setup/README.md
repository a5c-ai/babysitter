# MCP Transport WebSocket Setup Skill

Configure WebSocket transport for bidirectional MCP communication with connection management.

## Overview

This skill sets up WebSocket transport for MCP servers and clients, enabling real-time bidirectional communication with proper connection lifecycle management.

## When to Use

- Setting up bidirectional MCP communication
- Implementing real-time MCP messaging
- Configuring connection management
- Building MCP WebSocket clients

## Quick Start

```json
{
  "language": "typescript",
  "server": true,
  "client": true,
  "secure": true
}
```

## Features

- WebSocket server setup
- Client with auto-reconnect
- Heartbeat/ping-pong
- Connection lifecycle management
- WSS support

## Integration with Processes

| Process | Integration |
|---------|-------------|
| mcp-transport-layer | WebSocket transport |
| mcp-server-bootstrap | Server configuration |
| mcp-client-implementation | Client setup |
