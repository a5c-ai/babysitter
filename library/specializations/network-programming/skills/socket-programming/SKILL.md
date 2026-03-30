---
name: socket-programming
description: Deep integration with socket APIs for TCP/UDP programming across platforms. Execute socket operations, analyze socket options and buffer configurations, debug connection states, and generate optimized socket code for different I/O models.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: low-level-networking
  backlog-id: SK-001
---

# socket-programming

You are **socket-programming** - a specialized skill for low-level socket programming, providing deep integration with TCP/UDP socket APIs across platforms (BSD sockets, Winsock).

## Overview

This skill enables AI-powered socket programming operations including:
- Executing socket operations and interpreting errors
- Analyzing socket options and buffer configurations
- Debugging connection states (ESTABLISHED, TIME_WAIT, CLOSE_WAIT)
- Generating optimized socket code for different I/O models
- Interpreting netstat/ss output for socket analysis
- Configuring non-blocking I/O and event handling
- Handling platform differences (BSD sockets, Winsock)

## Prerequisites

- Development environment with socket library access
- `netstat` or `ss` CLI tools for socket analysis
- Appropriate permissions for raw socket operations (if needed)

## Capabilities

### 1. Socket API Operations

Execute and analyze socket operations across platforms:

```c
// TCP Socket Server Pattern (POSIX)
int server_fd = socket(AF_INET, SOCK_STREAM, 0);

// Socket options
int opt = 1;
setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
setsockopt(server_fd, SOL_SOCKET, SO_REUSEPORT, &opt, sizeof(opt));

// Buffer configuration
int send_buf = 65536;
int recv_buf = 65536;
setsockopt(server_fd, SOL_SOCKET, SO_SNDBUF, &send_buf, sizeof(send_buf));
setsockopt(server_fd, SOL_SOCKET, SO_RCVBUF, &recv_buf, sizeof(recv_buf));

// TCP options
int nodelay = 1;
setsockopt(server_fd, IPPROTO_TCP, TCP_NODELAY, &nodelay, sizeof(nodelay));
```

### 2. Connection State Analysis

Debug connection states using system tools:

```bash
# Linux - ss command (preferred)
ss -tnp state established '( sport = :8080 )'
ss -tnp state time-wait
ss -s  # Summary statistics

# Cross-platform - netstat
netstat -an | grep :8080
netstat -an | grep ESTABLISHED
netstat -an | grep TIME_WAIT

# Socket buffer analysis
ss -tnpm  # Show memory usage
cat /proc/net/sockstat  # Socket statistics
```

### 3. Non-blocking I/O Configuration

Configure non-blocking sockets for high-performance:

```c
// Set non-blocking mode (POSIX)
int flags = fcntl(sockfd, F_GETFL, 0);
fcntl(sockfd, F_SETFL, flags | O_NONBLOCK);

// Windows equivalent
u_long mode = 1;
ioctlsocket(sockfd, FIONBIO, &mode);
```

### 4. Error Handling Patterns

Interpret and handle socket errors:

```c
// Common socket errors and handling
switch (errno) {
    case EAGAIN:      // Would block (non-blocking)
    case EWOULDBLOCK: // Same as EAGAIN on most systems
        // Retry later or wait for event
        break;
    case EINTR:       // Interrupted by signal
        // Retry the operation
        break;
    case ECONNRESET:  // Connection reset by peer
        // Close and cleanup
        break;
    case ETIMEDOUT:   // Connection timed out
        // Reconnect logic
        break;
    case EADDRINUSE:  // Address already in use
        // Use SO_REUSEADDR or wait
        break;
}
```

### 5. Socket Code Generation

Generate optimized socket implementations:

#### TCP Server Template
```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <fcntl.h>

typedef struct {
    int port;
    int backlog;
    int recv_buffer_size;
    int send_buffer_size;
    bool tcp_nodelay;
    bool non_blocking;
} server_config_t;

int create_tcp_server(server_config_t *config) {
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) return -1;

    // Reuse address
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    // Buffer sizes
    if (config->recv_buffer_size > 0) {
        setsockopt(server_fd, SOL_SOCKET, SO_RCVBUF,
                   &config->recv_buffer_size, sizeof(int));
    }
    if (config->send_buffer_size > 0) {
        setsockopt(server_fd, SOL_SOCKET, SO_SNDBUF,
                   &config->send_buffer_size, sizeof(int));
    }

    // TCP_NODELAY (disable Nagle's algorithm)
    if (config->tcp_nodelay) {
        int nodelay = 1;
        setsockopt(server_fd, IPPROTO_TCP, TCP_NODELAY,
                   &nodelay, sizeof(nodelay));
    }

    // Non-blocking mode
    if (config->non_blocking) {
        int flags = fcntl(server_fd, F_GETFL, 0);
        fcntl(server_fd, F_SETFL, flags | O_NONBLOCK);
    }

    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_addr.s_addr = INADDR_ANY,
        .sin_port = htons(config->port)
    };

    if (bind(server_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        close(server_fd);
        return -1;
    }

    if (listen(server_fd, config->backlog) < 0) {
        close(server_fd);
        return -1;
    }

    return server_fd;
}
```

#### UDP Socket Template
```c
int create_udp_socket(int port, bool non_blocking) {
    int sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0) return -1;

    // Allow multiple sockets to bind to same port
    int opt = 1;
    setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    // Non-blocking mode
    if (non_blocking) {
        int flags = fcntl(sockfd, F_GETFL, 0);
        fcntl(sockfd, F_SETFL, flags | O_NONBLOCK);
    }

    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_addr.s_addr = INADDR_ANY,
        .sin_port = htons(port)
    };

    if (bind(sockfd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        close(sockfd);
        return -1;
    }

    return sockfd;
}
```

### 6. Platform Differences

Handle cross-platform socket programming:

| Feature | POSIX (Linux/macOS) | Windows (Winsock) |
|---------|---------------------|-------------------|
| Header | `<sys/socket.h>` | `<winsock2.h>` |
| Init | Not required | `WSAStartup()` |
| Close | `close(fd)` | `closesocket(sock)` |
| Error | `errno` | `WSAGetLastError()` |
| Non-block | `fcntl(O_NONBLOCK)` | `ioctlsocket(FIONBIO)` |
| Poll | `poll()` / `epoll()` | `WSAPoll()` / IOCP |

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Integration |
|--------|-------------|-------------|
| Claude-Flow | Agent orchestration with real-time communication | Real-time socket testing |
| Docker MCP Toolkit | Container isolation for socket testing | Safe network experimentation |

## Best Practices

1. **Always check return values** - Socket operations can fail at any point
2. **Use SO_REUSEADDR** - Avoid "Address already in use" errors during development
3. **Set appropriate timeouts** - Prevent indefinite blocking
4. **Handle partial reads/writes** - Network I/O may not complete in one call
5. **Close sockets properly** - Use shutdown() before close() for graceful termination
6. **Buffer sizing** - Match buffer sizes to application throughput needs

## Process Integration

This skill integrates with the following processes:
- `tcp-socket-server.js` - TCP server implementation
- `udp-socket-server.js` - UDP server implementation
- `event-driven-socket-handler.js` - Event-based socket handling
- `connection-pool.js` - Connection pool management

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "analyze",
  "target": "socket",
  "address": "0.0.0.0:8080",
  "status": "success",
  "findings": [
    "Socket is in ESTABLISHED state",
    "Send buffer: 65536 bytes",
    "Recv buffer: 65536 bytes",
    "TCP_NODELAY enabled"
  ],
  "recommendations": [
    "Consider increasing buffer size for high-throughput"
  ],
  "artifacts": ["socket_config.c"]
}
```

## Error Handling

- Capture full error codes and messages
- Provide platform-specific troubleshooting
- Suggest alternative approaches when operations fail
- Link to relevant socket programming documentation

## Constraints

- Do not create raw sockets without explicit approval
- Verify port availability before binding
- Respect firewall rules and network policies
- Log all socket operations for debugging
