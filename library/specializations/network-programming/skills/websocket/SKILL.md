---
name: websocket
description: Specialized skill for WebSocket protocol implementation and testing. Generate RFC 6455 compliant implementations, validate handshake and framing, test with Autobahn Test Suite, implement compression, and debug connection issues.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: real-time-communication
  backlog-id: SK-005
---

# websocket

You are **websocket** - a specialized skill for WebSocket protocol implementation and testing, providing deep expertise in RFC 6455 compliance, real-time messaging, and performance optimization.

## Overview

This skill enables AI-powered WebSocket operations including:
- Generating RFC 6455 compliant implementations
- Validating WebSocket handshake and framing
- Testing with Autobahn Test Suite
- Implementing permessage-deflate compression
- Debugging WebSocket connection issues
- Generating subprotocol handlers
- Analyzing WebSocket traffic

## Prerequisites

- WebSocket-capable runtime (Node.js, Python, Go, etc.)
- Optional: `wscat` or `websocat` for CLI testing
- Optional: Autobahn Test Suite for compliance testing

## Capabilities

### 1. WebSocket Handshake

Implement RFC 6455 compliant handshake:

```javascript
const crypto = require('crypto');
const http = require('http');

const WS_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function computeAcceptKey(secWebSocketKey) {
  return crypto
    .createHash('sha1')
    .update(secWebSocketKey + WS_MAGIC_STRING)
    .digest('base64');
}

function handleUpgrade(req, socket) {
  // Validate upgrade request
  if (req.headers['upgrade']?.toLowerCase() !== 'websocket') {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    return false;
  }

  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    return false;
  }

  // Validate key format (16 bytes base64 encoded)
  const keyBytes = Buffer.from(key, 'base64');
  if (keyBytes.length !== 16) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    return false;
  }

  const acceptKey = computeAcceptKey(key);

  // Optional: Handle subprotocol negotiation
  const requestedProtocols = req.headers['sec-websocket-protocol']?.split(',').map(p => p.trim()) || [];
  const selectedProtocol = negotiateProtocol(requestedProtocols);

  // Build response headers
  let response = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`
  ];

  if (selectedProtocol) {
    response.push(`Sec-WebSocket-Protocol: ${selectedProtocol}`);
  }

  // Optional: Handle extensions
  const extensions = negotiateExtensions(req.headers['sec-websocket-extensions']);
  if (extensions) {
    response.push(`Sec-WebSocket-Extensions: ${extensions}`);
  }

  socket.write(response.join('\r\n') + '\r\n\r\n');
  return true;
}

function negotiateProtocol(requested) {
  const supported = ['graphql-ws', 'wamp.2.json', 'mqtt'];
  return requested.find(p => supported.includes(p)) || null;
}

function negotiateExtensions(extensionHeader) {
  // Example: permessage-deflate negotiation
  if (extensionHeader?.includes('permessage-deflate')) {
    return 'permessage-deflate; server_no_context_takeover; client_no_context_takeover';
  }
  return null;
}
```

### 2. WebSocket Frame Parsing

Parse and create WebSocket frames:

```javascript
const OPCODES = {
  CONTINUATION: 0x0,
  TEXT: 0x1,
  BINARY: 0x2,
  CLOSE: 0x8,
  PING: 0x9,
  PONG: 0xA
};

class WebSocketFrame {
  constructor() {
    this.fin = true;
    this.rsv1 = false;
    this.rsv2 = false;
    this.rsv3 = false;
    this.opcode = OPCODES.TEXT;
    this.masked = false;
    this.maskingKey = null;
    this.payload = Buffer.alloc(0);
  }

  static parse(buffer) {
    if (buffer.length < 2) return { frame: null, consumed: 0 };

    const frame = new WebSocketFrame();
    let offset = 0;

    // First byte: FIN, RSV1-3, Opcode
    const byte0 = buffer[offset++];
    frame.fin = (byte0 & 0x80) !== 0;
    frame.rsv1 = (byte0 & 0x40) !== 0;
    frame.rsv2 = (byte0 & 0x20) !== 0;
    frame.rsv3 = (byte0 & 0x10) !== 0;
    frame.opcode = byte0 & 0x0F;

    // Second byte: MASK, Payload length
    const byte1 = buffer[offset++];
    frame.masked = (byte1 & 0x80) !== 0;
    let payloadLength = byte1 & 0x7F;

    // Extended payload length
    if (payloadLength === 126) {
      if (buffer.length < offset + 2) return { frame: null, consumed: 0 };
      payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      if (buffer.length < offset + 8) return { frame: null, consumed: 0 };
      // JavaScript can't handle 64-bit integers precisely
      const high = buffer.readUInt32BE(offset);
      const low = buffer.readUInt32BE(offset + 4);
      payloadLength = high * 0x100000000 + low;
      offset += 8;
    }

    // Masking key (if masked)
    if (frame.masked) {
      if (buffer.length < offset + 4) return { frame: null, consumed: 0 };
      frame.maskingKey = buffer.slice(offset, offset + 4);
      offset += 4;
    }

    // Payload
    if (buffer.length < offset + payloadLength) {
      return { frame: null, consumed: 0 };
    }

    frame.payload = buffer.slice(offset, offset + payloadLength);
    offset += payloadLength;

    // Unmask payload if needed
    if (frame.masked) {
      frame.payload = Buffer.from(frame.payload); // Create copy
      for (let i = 0; i < frame.payload.length; i++) {
        frame.payload[i] ^= frame.maskingKey[i % 4];
      }
    }

    return { frame, consumed: offset };
  }

  serialize(mask = false) {
    const payloadLength = this.payload.length;
    let headerLength = 2;

    if (payloadLength > 65535) headerLength += 8;
    else if (payloadLength > 125) headerLength += 2;

    if (mask) headerLength += 4;

    const buffer = Buffer.alloc(headerLength + payloadLength);
    let offset = 0;

    // First byte
    buffer[offset++] = (this.fin ? 0x80 : 0) |
                       (this.rsv1 ? 0x40 : 0) |
                       (this.rsv2 ? 0x20 : 0) |
                       (this.rsv3 ? 0x10 : 0) |
                       this.opcode;

    // Second byte and extended length
    let lengthByte = mask ? 0x80 : 0;

    if (payloadLength > 65535) {
      lengthByte |= 127;
      buffer[offset++] = lengthByte;
      buffer.writeUInt32BE(Math.floor(payloadLength / 0x100000000), offset);
      buffer.writeUInt32BE(payloadLength % 0x100000000, offset + 4);
      offset += 8;
    } else if (payloadLength > 125) {
      lengthByte |= 126;
      buffer[offset++] = lengthByte;
      buffer.writeUInt16BE(payloadLength, offset);
      offset += 2;
    } else {
      lengthByte |= payloadLength;
      buffer[offset++] = lengthByte;
    }

    // Masking key
    if (mask) {
      const maskingKey = crypto.randomBytes(4);
      maskingKey.copy(buffer, offset);
      offset += 4;

      // Copy and mask payload
      for (let i = 0; i < payloadLength; i++) {
        buffer[offset + i] = this.payload[i] ^ maskingKey[i % 4];
      }
    } else {
      this.payload.copy(buffer, offset);
    }

    return buffer;
  }
}
```

### 3. WebSocket Server Implementation

Complete WebSocket server:

```javascript
const http = require('http');
const crypto = require('crypto');
const EventEmitter = require('events');

class WebSocketServer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.port = options.port || 8080;
    this.maxPayload = options.maxPayload || 100 * 1024 * 1024; // 100MB
    this.clients = new Set();

    this.server = http.createServer((req, res) => {
      res.writeHead(426, { 'Content-Type': 'text/plain' });
      res.end('WebSocket server - upgrade required');
    });

    this.server.on('upgrade', (req, socket, head) => {
      this.handleUpgrade(req, socket, head);
    });
  }

  handleUpgrade(req, socket, head) {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    socket.write([
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '',
      ''
    ].join('\r\n'));

    const client = new WebSocketConnection(socket, this);
    this.clients.add(client);

    client.on('close', () => {
      this.clients.delete(client);
    });

    this.emit('connection', client, req);
  }

  broadcast(message, excludeClient = null) {
    for (const client of this.clients) {
      if (client !== excludeClient && client.readyState === 'OPEN') {
        client.send(message);
      }
    }
  }

  listen(callback) {
    this.server.listen(this.port, callback);
  }

  close(callback) {
    for (const client of this.clients) {
      client.close(1001, 'Server shutting down');
    }
    this.server.close(callback);
  }
}

class WebSocketConnection extends EventEmitter {
  constructor(socket, server) {
    super();
    this.socket = socket;
    this.server = server;
    this.readyState = 'OPEN';
    this.buffer = Buffer.alloc(0);
    this.fragments = [];

    socket.on('data', (data) => this.handleData(data));
    socket.on('close', () => this.handleClose());
    socket.on('error', (err) => this.emit('error', err));
  }

  handleData(data) {
    this.buffer = Buffer.concat([this.buffer, data]);

    while (this.buffer.length > 0) {
      const { frame, consumed } = WebSocketFrame.parse(this.buffer);
      if (!frame) break;

      this.buffer = this.buffer.slice(consumed);
      this.handleFrame(frame);
    }
  }

  handleFrame(frame) {
    switch (frame.opcode) {
      case OPCODES.TEXT:
      case OPCODES.BINARY:
        if (frame.fin) {
          const data = frame.opcode === OPCODES.TEXT
            ? frame.payload.toString('utf8')
            : frame.payload;
          this.emit('message', data);
        } else {
          this.fragments.push(frame);
        }
        break;

      case OPCODES.CONTINUATION:
        this.fragments.push(frame);
        if (frame.fin) {
          const firstFrame = this.fragments[0];
          const payload = Buffer.concat(this.fragments.map(f => f.payload));
          const data = firstFrame.opcode === OPCODES.TEXT
            ? payload.toString('utf8')
            : payload;
          this.emit('message', data);
          this.fragments = [];
        }
        break;

      case OPCODES.PING:
        this.pong(frame.payload);
        break;

      case OPCODES.PONG:
        this.emit('pong', frame.payload);
        break;

      case OPCODES.CLOSE:
        let code = 1005;
        let reason = '';
        if (frame.payload.length >= 2) {
          code = frame.payload.readUInt16BE(0);
          reason = frame.payload.slice(2).toString('utf8');
        }
        this.close(code, reason);
        break;
    }
  }

  send(data) {
    if (this.readyState !== 'OPEN') return;

    const frame = new WebSocketFrame();
    if (typeof data === 'string') {
      frame.opcode = OPCODES.TEXT;
      frame.payload = Buffer.from(data, 'utf8');
    } else {
      frame.opcode = OPCODES.BINARY;
      frame.payload = data;
    }

    this.socket.write(frame.serialize(false)); // Server doesn't mask
  }

  ping(data = Buffer.alloc(0)) {
    const frame = new WebSocketFrame();
    frame.opcode = OPCODES.PING;
    frame.payload = Buffer.isBuffer(data) ? data : Buffer.from(data);
    this.socket.write(frame.serialize(false));
  }

  pong(data = Buffer.alloc(0)) {
    const frame = new WebSocketFrame();
    frame.opcode = OPCODES.PONG;
    frame.payload = Buffer.isBuffer(data) ? data : Buffer.from(data);
    this.socket.write(frame.serialize(false));
  }

  close(code = 1000, reason = '') {
    if (this.readyState === 'CLOSED') return;

    this.readyState = 'CLOSING';

    const frame = new WebSocketFrame();
    frame.opcode = OPCODES.CLOSE;

    const codeBuffer = Buffer.alloc(2);
    codeBuffer.writeUInt16BE(code, 0);
    const reasonBuffer = Buffer.from(reason, 'utf8');
    frame.payload = Buffer.concat([codeBuffer, reasonBuffer]);

    this.socket.write(frame.serialize(false));
    this.socket.end();
  }

  handleClose() {
    this.readyState = 'CLOSED';
    this.emit('close');
  }
}
```

### 4. permessage-deflate Compression

Implement WebSocket compression:

```javascript
const zlib = require('zlib');

class PerMessageDeflate {
  constructor(options = {}) {
    this.serverNoContextTakeover = options.serverNoContextTakeover || false;
    this.clientNoContextTakeover = options.clientNoContextTakeover || false;
    this.serverMaxWindowBits = options.serverMaxWindowBits || 15;
    this.clientMaxWindowBits = options.clientMaxWindowBits || 15;

    this.inflateContext = null;
    this.deflateContext = null;
  }

  compress(data, callback) {
    if (!this.deflateContext || this.serverNoContextTakeover) {
      this.deflateContext = zlib.createDeflateRaw({
        windowBits: this.serverMaxWindowBits
      });
    }

    const chunks = [];
    this.deflateContext.on('data', (chunk) => chunks.push(chunk));
    this.deflateContext.on('end', () => {
      let result = Buffer.concat(chunks);
      // Remove trailing 0x00 0x00 0xFF 0xFF
      if (result.length >= 4 &&
          result[result.length - 4] === 0x00 &&
          result[result.length - 3] === 0x00 &&
          result[result.length - 2] === 0xFF &&
          result[result.length - 1] === 0xFF) {
        result = result.slice(0, -4);
      }
      callback(null, result);
    });

    this.deflateContext.write(data);
    this.deflateContext.flush(zlib.Z_SYNC_FLUSH);
  }

  decompress(data, callback) {
    if (!this.inflateContext || this.clientNoContextTakeover) {
      this.inflateContext = zlib.createInflateRaw({
        windowBits: this.clientMaxWindowBits
      });
    }

    // Add trailing bytes for decompression
    const trailer = Buffer.from([0x00, 0x00, 0xFF, 0xFF]);
    const input = Buffer.concat([data, trailer]);

    const chunks = [];
    this.inflateContext.on('data', (chunk) => chunks.push(chunk));
    this.inflateContext.on('end', () => {
      callback(null, Buffer.concat(chunks));
    });
    this.inflateContext.on('error', (err) => callback(err));

    this.inflateContext.write(input);
    this.inflateContext.flush();
  }
}
```

### 5. WebSocket Testing

Test WebSocket implementations:

```bash
# Using wscat
wscat -c ws://localhost:8080

# Using websocat
websocat ws://localhost:8080

# Autobahn Test Suite (fuzzing)
docker run -it --rm \
  -v "${PWD}/reports:/reports" \
  -p 9001:9001 \
  crossbario/autobahn-testsuite \
  wstest --mode fuzzingclient --spec /config/fuzzingclient.json
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Integration |
|--------|-------------|-------------|
| MCP-WebSocket Architecture | WebSocket transport with MCP | Real-time AI integration |
| claude-agent-server | WebSocket server for Claude Agent SDK | Agent orchestration |
| Claude-Flow | Multi-agent communication via WebSocket | Distributed agents |

## Best Practices

1. **Handle fragmented messages** - Large messages may be split across frames
2. **Implement heartbeat** - Use ping/pong for connection health
3. **Set payload limits** - Prevent memory exhaustion attacks
4. **Close gracefully** - Send close frame before disconnecting
5. **Validate UTF-8** - Text frames must be valid UTF-8
6. **Handle backpressure** - Don't overwhelm slow clients

## Process Integration

This skill integrates with the following processes:
- `websocket-server.js` - WebSocket server implementation
- `websocket-client.js` - WebSocket client implementation
- `realtime-messaging-system.js` - Real-time messaging architecture

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "test",
  "target": "ws://localhost:8080",
  "status": "success",
  "handshake": {
    "protocol": "graphql-ws",
    "extensions": ["permessage-deflate"]
  },
  "metrics": {
    "messagesReceived": 1000,
    "messagesSent": 1000,
    "avgLatencyMs": 2.5,
    "compressionRatio": 0.65
  },
  "compliance": {
    "rfc6455": true,
    "autobahnPassed": 512,
    "autobahnFailed": 0
  }
}
```

## Constraints

- Follow RFC 6455 strictly for interoperability
- Server must not mask frames (clients must)
- Validate close codes (1000-1015, 3000-4999)
- Handle UTF-8 validation for text frames
- Limit concurrent connections per client
