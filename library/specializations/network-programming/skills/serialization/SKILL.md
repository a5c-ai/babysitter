---
name: serialization
description: Expert skill for binary and text serialization formats, schema design, and optimization
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Serialization Skill

Expert skill for binary and text serialization formats, schema design, and performance optimization.

## Capabilities

- **Protocol Buffers**: Generate Protocol Buffer schemas and code for multiple languages
- **FlatBuffers**: Design FlatBuffers schemas for zero-copy deserialization
- **MessagePack/CBOR**: Implement MessagePack and CBOR binary encoding
- **Performance Analysis**: Analyze and compare serialization performance
- **Format Comparison**: Compare serialization formats for specific use cases
- **Deserialization Debugging**: Debug deserialization issues and version mismatches
- **Payload Optimization**: Optimize payload sizes and encoding efficiency
- **Schema Evolution**: Handle backward/forward compatible schema changes

## Tools and Dependencies

- `protoc` - Protocol Buffer compiler
- `flatc` - FlatBuffers compiler
- `msgpack-tools` - MessagePack utilities
- `cbor-tools` - CBOR utilities
- `capnp` - Cap'n Proto compiler
- `avro-tools` - Apache Avro utilities

## Target Processes

- binary-protocol-parser.js
- custom-protocol-design.js
- message-framing.js
- websocket-server.js

## Usage Examples

### Protocol Buffers Schema
```protobuf
syntax = "proto3";
package network;

message Packet {
  uint32 sequence = 1;
  bytes payload = 2;
  int64 timestamp = 3;
  map<string, string> headers = 4;
}
```

### FlatBuffers Schema
```fbs
namespace Network;

table Packet {
  sequence: uint32;
  payload: [ubyte];
  timestamp: int64;
  headers: [KeyValue];
}

table KeyValue {
  key: string;
  value: string;
}

root_type Packet;
```

### Code Generation
```bash
protoc --python_out=. --go_out=. packet.proto
flatc --python --go packet.fbs
```

### Performance Benchmarking
```bash
hyperfine 'protoc-bench encode message.proto' 'msgpack-bench encode message.json'
```

## Quality Gates

- Schema validation passes
- Backward compatibility verified
- Performance benchmarks met
- Cross-language interoperability tested
- Payload size within requirements
