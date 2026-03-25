---
name: http-protocol
description: Deep HTTP/1.1, HTTP/2, and HTTP/3 protocol expertise for web protocol implementation and compliance
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
---

# HTTP Protocol Skill

Expert skill for HTTP protocol implementation, testing, and compliance validation across HTTP/1.1, HTTP/2, and HTTP/3 versions.

## Capabilities

- **RFC Compliance Validation**: Validate HTTP implementations against RFC 7230-7235 (HTTP/1.1), RFC 7540 (HTTP/2), and RFC 9114 (HTTP/3)
- **HTTP/2 Frame Analysis**: Analyze and debug HTTP/2 frame streams, HPACK header compression, and stream multiplexing
- **HTTP/3 and QUIC Support**: Work with HTTP/3 implementations and QUIC transport layer
- **Server Configuration**: Generate optimal HTTP server configurations for various platforms
- **Performance Testing**: Test HTTP performance characteristics including keep-alive, pipelining, and multiplexing
- **Chunked Encoding**: Debug and implement chunked transfer encoding
- **Header Analysis**: Analyze and validate HTTP headers for security and compliance

## Tools and Dependencies

- `curl` - HTTP client with extensive protocol support
- `h2spec` - HTTP/2 conformance testing tool
- `nghttp2` - HTTP/2 library and tools
- `quiche` - HTTP/3 and QUIC implementation
- `httpie` - User-friendly HTTP client

## Target Processes

- http-server.js
- http2-server.js
- http-client-library.js
- rest-api-client-generator.js

## Usage Examples

### HTTP/2 Conformance Testing
```bash
h2spec -h localhost -p 8443 --tls --insecure
```

### HTTP Header Analysis
```bash
curl -v -I https://example.com
```

### HTTP/2 Frame Inspection
```bash
nghttp -v https://example.com
```

## Quality Gates

- RFC compliance verification
- HTTP/2 h2spec test passage
- Performance benchmarking with standard tools
- Header security validation
- Connection handling verification
