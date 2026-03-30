# Socket Programming Skill

## Overview

The `socket-programming` skill provides deep integration with socket APIs for TCP/UDP programming across platforms. It enables AI-powered socket operations, debugging, and code generation for high-performance network applications.

## Quick Start

### Prerequisites

1. **Development Environment** - C/C++, Python, Node.js, or Rust toolchain
2. **System Tools** - `ss` or `netstat` for socket analysis
3. **Permissions** - Root/admin for raw sockets (optional)

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

## Usage

### Basic Operations

```bash
# Analyze socket states on a port
/skill socket-programming analyze --port 8080

# Generate TCP server code
/skill socket-programming generate-tcp-server \
  --port 8080 \
  --language c \
  --non-blocking

# Debug connection issues
/skill socket-programming debug-connections \
  --address 192.168.1.100:443
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(socketProgrammingTask, {
  operation: 'generate',
  type: 'tcp-server',
  config: {
    port: 8080,
    backlog: 128,
    nonBlocking: true,
    tcpNodelay: true
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Socket Operations** | Execute and interpret socket API calls |
| **State Analysis** | Debug ESTABLISHED, TIME_WAIT, CLOSE_WAIT states |
| **Buffer Config** | Analyze and optimize SO_SNDBUF/SO_RCVBUF |
| **Code Generation** | Generate optimized socket code (C, Python, Node.js) |
| **Platform Support** | Handle BSD sockets and Winsock differences |
| **Error Handling** | Interpret errno/WSAGetLastError codes |

## Examples

### Example 1: Analyze Connection States

```bash
# Analyze all connections on port 8080
/skill socket-programming analyze-states --port 8080

# Output:
# ESTABLISHED: 45 connections
# TIME_WAIT: 12 connections
# CLOSE_WAIT: 0 connections
# Recommendation: TIME_WAIT count is normal
```

### Example 2: Generate High-Performance Server

```bash
# Generate an optimized TCP server
/skill socket-programming generate-server \
  --type tcp \
  --language c \
  --io-model epoll \
  --buffer-size 65536 \
  --backlog 1024 \
  --output server.c
```

### Example 3: Debug Socket Options

```bash
# Inspect socket options
/skill socket-programming inspect-options \
  --socket-fd 5 \
  --options SO_SNDBUF,SO_RCVBUF,TCP_NODELAY,SO_KEEPALIVE
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SOCKET_DEBUG` | Enable verbose socket debugging | `false` |
| `DEFAULT_BUFFER_SIZE` | Default buffer size for generation | `65536` |

### Skill Configuration

```yaml
# .babysitter/skills/socket-programming.yaml
socket-programming:
  defaultLanguage: c
  defaultIoModel: epoll
  bufferSize: 65536
  generateComments: true
```

## Process Integration

### Processes Using This Skill

1. **tcp-socket-server.js** - TCP server implementation
2. **udp-socket-server.js** - UDP datagram handling
3. **event-driven-socket-handler.js** - Event loop integration
4. **connection-pool.js** - Connection pool management

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const socketServerTask = defineTask({
  name: 'create-socket-server',
  description: 'Create a high-performance socket server',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Create ${inputs.type} server on port ${inputs.port}`,
      skill: {
        name: 'socket-programming',
        context: {
          operation: 'generate-server',
          type: inputs.type,
          port: inputs.port,
          language: inputs.language,
          ioModel: inputs.ioModel || 'epoll',
          bufferSize: inputs.bufferSize || 65536
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

## Socket Options Reference

### Common Options

| Option | Level | Description |
|--------|-------|-------------|
| `SO_REUSEADDR` | SOL_SOCKET | Allow reuse of local addresses |
| `SO_REUSEPORT` | SOL_SOCKET | Allow multiple sockets on same port |
| `SO_KEEPALIVE` | SOL_SOCKET | Enable TCP keepalive |
| `SO_SNDBUF` | SOL_SOCKET | Send buffer size |
| `SO_RCVBUF` | SOL_SOCKET | Receive buffer size |
| `TCP_NODELAY` | IPPROTO_TCP | Disable Nagle's algorithm |
| `TCP_CORK` | IPPROTO_TCP | Delay sending until full packet |

### Performance Tuning

```c
// High-throughput configuration
setsockopt(fd, SOL_SOCKET, SO_SNDBUF, &(int){1048576}, sizeof(int));
setsockopt(fd, SOL_SOCKET, SO_RCVBUF, &(int){1048576}, sizeof(int));
setsockopt(fd, IPPROTO_TCP, TCP_NODELAY, &(int){1}, sizeof(int));

// Low-latency configuration
setsockopt(fd, IPPROTO_TCP, TCP_NODELAY, &(int){1}, sizeof(int));
setsockopt(fd, IPPROTO_TCP, TCP_QUICKACK, &(int){1}, sizeof(int));
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Address already in use` | Use SO_REUSEADDR, wait for TIME_WAIT to expire |
| `Connection refused` | Server not running, firewall blocking |
| `Connection reset` | Peer closed unexpectedly, check logs |
| `Operation would block` | Non-blocking socket, use poll/epoll |
| `Too many open files` | Increase ulimit, close unused sockets |

### Debug Mode

Enable verbose socket debugging:

```bash
SOCKET_DEBUG=true /skill socket-programming analyze --port 8080
```

## Related Skills

- **event-loop** - High-performance event-driven I/O
- **protocol-parser** - Binary protocol parsing
- **tls-security** - TLS/SSL socket wrapping

## References

- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/)
- [Linux Socket Programming](https://man7.org/linux/man-pages/man7/socket.7.html)
- [Winsock Documentation](https://docs.microsoft.com/en-us/windows/win32/winsock/)
- [The C10K Problem](http://www.kegel.com/c10k.html)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-001
**Category:** Low-Level Networking
**Status:** Active
