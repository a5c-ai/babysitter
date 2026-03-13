---
name: grpc-protocol
description: Expert skill for gRPC protocol implementation, debugging, and performance optimization
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# gRPC Protocol Skill

Expert skill for gRPC protocol implementation, service definition, and debugging across multiple languages.

## Capabilities

- **Service Definition**: Generate gRPC service definitions and Protocol Buffer schemas
- **Code Generation**: Generate client and server stubs for multiple languages
- **Streaming Debugging**: Debug unary, client-streaming, server-streaming, and bidirectional streaming
- **gRPC-Web Compatibility**: Analyze and configure gRPC-web for browser clients
- **Load Balancing**: Configure gRPC-specific load balancing strategies
- **Interceptors**: Implement client and server interceptors for cross-cutting concerns
- **Testing**: Test gRPC services with grpcurl and other debugging tools
- **Performance Optimization**: Optimize gRPC performance including connection pooling and compression

## Tools and Dependencies

- `protoc` - Protocol Buffer compiler
- `grpcurl` - Command-line gRPC client
- `grpc-web` - gRPC for browser clients
- `buf` - Modern Protocol Buffer tooling
- `evans` - Interactive gRPC client

## Target Processes

- realtime-messaging-system.js (gRPC streaming)
- custom-protocol-design.js (gRPC-based protocols)
- layer7-load-balancer.js (gRPC routing)

## Usage Examples

### Service Definition
```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc SayHelloStream (HelloRequest) returns (stream HelloReply);
}
```

### Testing with grpcurl
```bash
grpcurl -plaintext localhost:50051 list
grpcurl -plaintext -d '{"name": "World"}' localhost:50051 greeter.Greeter/SayHello
```

### Reflection Debugging
```bash
grpcurl -plaintext localhost:50051 describe greeter.Greeter
```

## Quality Gates

- Protocol Buffer schema validation
- Service reflection verification
- Streaming flow control testing
- Error handling validation
- Performance benchmarking
