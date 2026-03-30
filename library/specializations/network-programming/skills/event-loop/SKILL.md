---
name: event-loop
description: Expert skill for high-performance event-driven I/O programming and optimization
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Event Loop Skill

Expert skill for high-performance event-driven I/O programming across platforms and runtime environments.

## Capabilities

- **Platform Multiplexers**: Configure epoll (Linux), kqueue (BSD/macOS), IOCP (Windows)
- **Performance Analysis**: Analyze event loop performance and identify bottlenecks
- **Event Debugging**: Debug event handling issues and callback delays
- **Framework Code Generation**: Generate code for libuv, Boost.Asio, Tokio, and mio
- **C10K+ Optimization**: Optimize for massive concurrent connection handling
- **Profiling**: Profile event loop performance with system tools
- **io_uring Integration**: Implement Linux io_uring for high-performance I/O
- **Timer Management**: Efficient timer wheel and hierarchical timing implementations

## Tools and Dependencies

- `strace/dtrace` - System call tracing
- `perf` - Linux performance analysis
- `libuv` - Cross-platform async I/O
- `io_uring` - Linux async I/O interface
- `Tokio` - Rust async runtime
- `Boost.Asio` - C++ async I/O

## Target Processes

- event-driven-socket-handler.js
- tcp-socket-server.js
- websocket-server.js
- layer4-load-balancer.js

## Usage Examples

### epoll Event Loop (C)
```c
int epfd = epoll_create1(0);
struct epoll_event ev, events[MAX_EVENTS];
ev.events = EPOLLIN | EPOLLET;  // Edge-triggered
ev.data.fd = listen_fd;
epoll_ctl(epfd, EPOLL_CTL_ADD, listen_fd, &ev);

while (1) {
    int n = epoll_wait(epfd, events, MAX_EVENTS, -1);
    for (int i = 0; i < n; i++) {
        handle_event(&events[i]);
    }
}
```

### io_uring Setup
```c
struct io_uring ring;
io_uring_queue_init(256, &ring, 0);
// Submit and complete I/O operations
```

### Performance Profiling
```bash
perf record -g ./server
perf report --stdio
strace -c -f ./server
```

## Quality Gates

- Event handling latency within threshold
- No callback starvation
- Memory usage stable under load
- CPU utilization optimized
- C10K+ connection handling verified
