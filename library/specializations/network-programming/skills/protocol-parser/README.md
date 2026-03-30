# Protocol Parser Skill

## Overview

The `protocol-parser` skill provides specialized capabilities for binary and text protocol parsing and serialization. It enables AI-powered protocol design, parser generation, and state machine implementation for network applications.

## Quick Start

### Prerequisites

1. **Build Tools** - Compiler for target language (gcc, clang, rustc)
2. **Protocol Buffers** - `protoc` compiler (optional)
3. **Testing Tools** - Test framework for validation

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

For Protocol Buffers support:

```bash
# Install protoc
apt-get install -y protobuf-compiler  # Linux
brew install protobuf                  # macOS
```

## Usage

### Basic Operations

```bash
# Design a new protocol format
/skill protocol-parser design \
  --name my-protocol \
  --fields "magic:u8,version:u8,type:u8,length:u32,payload:bytes"

# Generate parser code
/skill protocol-parser generate \
  --spec protocol.spec \
  --language c \
  --output parser.c

# Generate test vectors
/skill protocol-parser test-vectors \
  --spec protocol.spec \
  --count 100
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(protocolParserTask, {
  operation: 'generate-parser',
  specification: {
    name: 'my-protocol',
    version: 1,
    endianness: 'big',
    fields: [
      { name: 'magic', type: 'u8', value: 0xAB },
      { name: 'version', type: 'u8' },
      { name: 'type', type: 'u8' },
      { name: 'flags', type: 'u8' },
      { name: 'length', type: 'u32' },
      { name: 'payload', type: 'bytes', lengthField: 'length' },
      { name: 'crc', type: 'u32', computed: 'crc32' }
    ]
  },
  language: 'c'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Format Design** | Design protocol message formats |
| **Parser Generation** | Generate parser code from specs |
| **State Machines** | Implement streaming parsers |
| **Endianness** | Handle byte order correctly |
| **Checksums** | CRC32, CRC16, checksums |
| **Test Vectors** | Generate comprehensive tests |

## Examples

### Example 1: Simple Binary Protocol

```bash
# Define a simple request-response protocol
/skill protocol-parser design \
  --name simple-rpc \
  --messages '
    Request: magic(0xAB), version(u8), id(u32), method(u16), payload_len(u32), payload(bytes)
    Response: magic(0xAB), version(u8), id(u32), status(u16), payload_len(u32), payload(bytes)
  '
```

### Example 2: Protocol Buffers Schema

```bash
# Generate protobuf schema from description
/skill protocol-parser protobuf \
  --name messaging \
  --messages '
    Envelope: version(int), timestamp(int64), correlation_id(string), payload(oneof)
    DataMessage: sequence(int64), data(bytes), compressed(bool)
    Ack: sequence(int64), success(bool)
  ' \
  --output messaging.proto
```

### Example 3: State Machine Parser

```bash
# Generate streaming parser with state machine
/skill protocol-parser generate \
  --spec protocol.spec \
  --language rust \
  --streaming \
  --output parser.rs
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PROTOCOL_MAX_SIZE` | Maximum message size | `16777216` |
| `PARSER_DEBUG` | Enable parser debugging | `false` |

### Skill Configuration

```yaml
# .babysitter/skills/protocol-parser.yaml
protocol-parser:
  defaultEndianness: big
  maxPayloadSize: 16777216
  generateTests: true
  checksumType: crc32
```

## Process Integration

### Processes Using This Skill

1. **binary-protocol-parser.js** - Binary protocol parsing
2. **custom-protocol-design.js** - New protocol design
3. **protocol-state-machine.js** - State machine implementation
4. **message-framing.js** - Message framing strategies

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const generateParserTask = defineTask({
  name: 'generate-protocol-parser',
  description: 'Generate a protocol parser',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Generate ${inputs.language} parser for ${inputs.protocol}`,
      skill: {
        name: 'protocol-parser',
        context: {
          operation: 'generate',
          specification: inputs.spec,
          language: inputs.language,
          streaming: inputs.streaming || false,
          options: {
            generateTests: true,
            maxPayloadSize: inputs.maxPayloadSize || 16777216
          }
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

### protoc-gen-go-mcp (Redpanda)

Protocol Buffers compiler plugin for MCP.

**Features:**
- Generate MCP servers from gRPC APIs
- Protocol buffer to MCP translation
- Apache 2.0 licensed

**Reference:** https://www.redpanda.com/blog/turn-grpc-api-into-mcp-server

### gRPC-to-MCP Proxy (Adiom)

Lightweight proxy for MCP to gRPC translation.

**Features:**
- MCP to gRPC translation
- Enterprise service connectivity

**Reference:** https://medium.com/@adkomyagin/how-to-connect-claude-ai-to-enterprise-services-with-mcp

## Protocol Design Patterns

### Length-Prefixed Messages

```
+--------+--------+--------+--------+--------+...
| Length (4 bytes, big-endian)      | Payload
+--------+--------+--------+--------+--------+...
```

### Magic + Header + Payload + CRC

```
+--------+--------+--------+--------+--------+--------+...+--------+
| Magic  | Header Fields           | Payload         | CRC32    |
+--------+--------+--------+--------+--------+--------+...+--------+
```

### Type-Length-Value (TLV)

```
+--------+--------+--------+--------+...
| Type   | Length          | Value
+--------+--------+--------+--------+...
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Endianness mismatch | Verify byte order in spec |
| Alignment issues | Use packed structs or manual parsing |
| CRC mismatch | Check polynomial and initial value |
| Buffer overflow | Validate lengths before copying |

### Debug Mode

Enable verbose parser debugging:

```bash
PARSER_DEBUG=true /skill protocol-parser parse --input message.bin
```

## Related Skills

- **socket-programming** - Socket I/O for transport
- **serialization** - High-level serialization formats
- **packet-capture** - Capture and analyze protocol traffic

## References

- [Protocol Buffers Documentation](https://protobuf.dev/)
- [FlatBuffers Documentation](https://google.github.io/flatbuffers/)
- [MessagePack Specification](https://msgpack.org/)
- [RFC 791 - IP Protocol](https://tools.ietf.org/html/rfc791)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-002
**Category:** Protocol Implementation
**Status:** Active
