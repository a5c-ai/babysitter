---
name: protobuf-grpc-designer
description: Protocol Buffers and gRPC service definition with backward compatibility checks
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Protocol Buffers and gRPC Designer Skill

## Overview

This skill specializes in designing Protocol Buffers schemas and gRPC service definitions with a focus on backward compatibility, performance, and cross-language interoperability.

## Capabilities

- Design .proto files following Google's style guide and best practices
- Implement gRPC service definitions with streaming support
- Validate wire format backward compatibility
- Generate language-specific stubs for multiple targets
- Configure proto linting and breaking change detection
- Design efficient message structures for performance
- Implement gRPC interceptors and middleware patterns

## Target Processes

- API Design Specification
- Backward Compatibility Management
- Multi-Language SDK Strategy

## Integration Points

- buf (schema registry, linting, breaking change detection)
- protoc (Protocol Buffer compiler)
- grpcurl (gRPC testing)
- gRPC-Gateway (REST transcoding)
- Connect (modern gRPC alternative)

## Input Requirements

- Service domain requirements
- Message structure definitions
- Streaming requirements (unary, server, client, bidirectional)
- Target languages for code generation
- Backward compatibility policy

## Output Artifacts

- .proto schema files
- buf.yaml configuration
- Generated language stubs
- Breaking change analysis report
- API documentation from proto comments

## Usage Example

```yaml
skill:
  name: protobuf-grpc-designer
  context:
    protoDirectory: ./proto
    targetLanguages:
      - go
      - python
      - typescript
    enableBufLint: true
    checkBreakingChanges: true
    streamingRequired: true
```

## Best Practices

1. Use package names that reflect domain boundaries
2. Reserve field numbers when removing fields
3. Use well-known types (Timestamp, Duration, etc.)
4. Document all messages and fields with comments
5. Version services through package names
6. Implement proper error handling with Status codes
