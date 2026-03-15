# WebSocket Skill

## Overview

The `websocket` skill provides specialized capabilities for WebSocket protocol implementation and testing. It enables AI-powered development of RFC 6455 compliant WebSocket servers and clients with real-time messaging support.

## Quick Start

### Prerequisites

1. **Node.js/Python/Go** - Runtime for WebSocket implementation
2. **wscat** - CLI WebSocket client for testing
3. **Optional: Autobahn Test Suite** - For compliance testing

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

```bash
# Install testing tools
npm install -g wscat
cargo install websocat
```

## Usage

### Basic Operations

```bash
# Generate WebSocket server
/skill websocket generate-server \
  --language nodejs \
  --port 8080 \
  --compression permessage-deflate

# Test WebSocket endpoint
/skill websocket test \
  --url ws://localhost:8080 \
  --messages 100

# Run Autobahn compliance tests
/skill websocket autobahn-test \
  --url ws://localhost:8080
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(websocketTask, {
  operation: 'generate-server',
  config: {
    language: 'nodejs',
    port: 8080,
    subprotocols: ['graphql-ws', 'wamp.2.json'],
    compression: true,
    maxPayload: 104857600
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **RFC 6455 Compliance** | Generate fully compliant implementations |
| **Handshake Validation** | Validate upgrade requests and responses |
| **Frame Parsing** | Parse and create WebSocket frames |
| **Compression** | permessage-deflate support |
| **Subprotocols** | Negotiate application subprotocols |
| **Testing** | Integration with Autobahn Test Suite |

## Examples

### Example 1: Simple Echo Server

```bash
# Generate a simple echo server
/skill websocket generate-server \
  --language nodejs \
  --type echo \
  --port 8080 \
  --output echo-server.js
```

### Example 2: Chat Server

```bash
# Generate a multi-room chat server
/skill websocket generate-server \
  --language nodejs \
  --type chat \
  --features "rooms,presence,history" \
  --port 8080 \
  --output chat-server/
```

### Example 3: Performance Test

```bash
# Run performance benchmark
/skill websocket benchmark \
  --url ws://localhost:8080 \
  --connections 1000 \
  --messages-per-second 100 \
  --duration 60s
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `WS_MAX_PAYLOAD` | Maximum message size | `104857600` |
| `WS_PING_INTERVAL` | Heartbeat interval (ms) | `30000` |
| `WS_COMPRESSION` | Enable compression | `true` |

### Skill Configuration

```yaml
# .babysitter/skills/websocket.yaml
websocket:
  defaultPort: 8080
  maxPayload: 104857600
  pingInterval: 30000
  compression:
    enabled: true
    serverNoContextTakeover: true
  subprotocols:
    - graphql-ws
    - wamp.2.json
```

## Process Integration

### Processes Using This Skill

1. **websocket-server.js** - Server implementation
2. **websocket-client.js** - Client implementation
3. **realtime-messaging-system.js** - Real-time messaging

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const wsServerTask = defineTask({
  name: 'create-websocket-server',
  description: 'Create a WebSocket server',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Create WebSocket server on port ${inputs.port}`,
      skill: {
        name: 'websocket',
        context: {
          operation: 'generate-server',
          language: inputs.language || 'nodejs',
          port: inputs.port,
          features: inputs.features || ['ping-pong', 'compression'],
          subprotocols: inputs.subprotocols || []
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Reference

### MCP-WebSocket Architecture

WebSocket transport with MCP data layer.

**Features:**
- WebSocket transport with JSON-RPC 2.0
- Interoperability with MCP primitives
- Bridge tools for stdio to WebSocket

**Reference:** https://skywork.ai/skypage/en/A-Comprehensive-Guide-to-MCP-WebSocket-Servers

### claude-agent-server

WebSocket server wrapping Claude Agent SDK.

**Features:**
- Real-time bidirectional communication
- E2B sandbox deployment
- TypeScript client library

**GitHub:** https://github.com/dzhng/claude-agent-server

### Claude-Flow

Multi-agent orchestration platform.

**Features:**
- Multi-agent swarms
- Real-time communication between instances
- Context sharing and task handoffs

**GitHub:** https://github.com/ruvnet/claude-flow

## WebSocket Close Codes

| Code | Name | Description |
|------|------|-------------|
| 1000 | Normal Closure | Normal close |
| 1001 | Going Away | Server shutting down or client navigating |
| 1002 | Protocol Error | Protocol violation |
| 1003 | Unsupported Data | Received data type not supported |
| 1007 | Invalid Payload | Invalid UTF-8 in text frame |
| 1008 | Policy Violation | Message violates policy |
| 1009 | Message Too Big | Message exceeds size limit |
| 1011 | Internal Error | Server encountered error |
| 3000-4999 | Application | Available for applications |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Check server is running and port is correct |
| Handshake failed | Verify Sec-WebSocket-Key and Accept |
| Messages not received | Check frame parsing, especially masking |
| Connection drops | Implement ping/pong heartbeat |
| Compression errors | Verify permessage-deflate negotiation |

### Debug Commands

```bash
# Test with wscat
wscat -c ws://localhost:8080

# Verbose connection
wscat -c ws://localhost:8080 --show-ping-pong

# Test with custom headers
wscat -c ws://localhost:8080 \
  -H "Sec-WebSocket-Protocol: graphql-ws"
```

## Related Skills

- **socket-programming** - Underlying TCP sockets
- **tls-security** - WSS (WebSocket over TLS)
- **http-protocol** - HTTP upgrade mechanism

## References

- [RFC 6455 - WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [RFC 7692 - Compression Extensions](https://tools.ietf.org/html/rfc7692)
- [Autobahn Test Suite](https://github.com/crossbario/autobahn-testsuite)
- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-005
**Category:** Real-Time Communication
**Status:** Active
