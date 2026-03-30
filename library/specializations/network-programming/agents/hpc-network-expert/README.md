# High-Performance Networking Expert Agent

## Overview

The `hpc-network-expert` agent is a specialized AI agent embodying the expertise of a High-Performance Systems Engineer. It provides deep knowledge for building extremely scalable, low-latency network systems including event-driven architectures, kernel bypass, and lock-free programming.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | High-Performance Systems Engineer |
| **Experience** | 7+ years performance-critical systems |
| **Background** | HFT, game servers, CDN infrastructure |
| **Expertise** | Event loops, zero-copy, DPDK, lock-free |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **C10K/C10M** | Massive concurrency solutions |
| **Event Loops** | epoll, kqueue, IOCP, io_uring |
| **Zero-Copy** | sendfile, splice, mmap |
| **Kernel Bypass** | DPDK, io_uring, AF_XDP |
| **Lock-Free** | CAS, SPSC/MPMC queues |
| **Profiling** | perf, flame graphs, benchmarking |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(hpcNetworkTask, {
  agentName: 'hpc-network-expert',
  prompt: {
    role: 'High-Performance Systems Engineer',
    task: 'Optimize TCP server for 1M concurrent connections',
    context: {
      current: {
        connections: 100000,
        throughput: '50k req/s',
        latency_p99: '15ms'
      },
      target: {
        connections: 1000000,
        throughput: '500k req/s',
        latency_p99: '5ms'
      },
      constraints: {
        platform: 'Linux 5.15',
        language: 'C',
        memory: '64GB'
      }
    },
    instructions: [
      'Analyze current bottlenecks',
      'Propose optimization strategy',
      'Provide implementation code',
      'Include benchmark methodology'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Optimize event loop
/agent hpc-network-expert optimize \
  --component event-loop \
  --current epoll \
  --target "100k+ connections"

# Design kernel bypass solution
/agent hpc-network-expert design \
  --type kernel-bypass \
  --requirements "1M pps, <1us latency"

# Profile and analyze
/agent hpc-network-expert profile \
  --binary ./server \
  --workload "high-throughput"
```

## Common Tasks

### 1. Performance Optimization

Optimize existing network code:

```bash
/agent hpc-network-expert optimize \
  --code server.c \
  --profile perf.data \
  --target "2x throughput"
```

Output includes:
- Bottleneck analysis
- Optimization recommendations
- Code changes
- Expected improvements

### 2. Event Loop Design

Design high-performance event loops:

```bash
/agent hpc-network-expert design-event-loop \
  --platform linux \
  --connections 100000 \
  --io-model "io_uring" \
  --output event_loop.c
```

Provides:
- Complete implementation
- Configuration guidance
- Benchmarking code
- Tuning parameters

### 3. Lock-Free Data Structure

Implement lock-free structures:

```bash
/agent hpc-network-expert lock-free \
  --structure "mpmc-queue" \
  --producers 4 \
  --consumers 8 \
  --output mpmc_queue.c
```

Delivers:
- Complete implementation
- Memory ordering explanation
- Test cases
- Performance characteristics

### 4. Kernel Bypass Setup

Configure kernel bypass networking:

```bash
/agent hpc-network-expert kernel-bypass \
  --technology dpdk \
  --nic "Intel X710" \
  --target "10M pps"
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `event-driven-socket-handler.js` | Event loop design |
| `tcp-socket-server.js` | Performance optimization |
| `layer4-load-balancer.js` | High-throughput design |
| `connection-pool.js` | Pool optimization |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const performanceOptTask = defineTask({
  name: 'optimize-network-performance',
  description: 'Optimize network server performance',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Network Performance Optimization',
      agent: {
        name: 'hpc-network-expert',
        prompt: {
          role: 'High-Performance Systems Engineer',
          task: 'Optimize network performance',
          context: {
            currentMetrics: inputs.metrics,
            targetMetrics: inputs.targets,
            code: inputs.codeFiles,
            profile: inputs.profileData
          },
          instructions: [
            'Analyze profiling data for bottlenecks',
            'Identify optimization opportunities',
            'Prioritize by impact vs effort',
            'Provide implementation code',
            'Include verification benchmarks'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['analysis', 'optimizations', 'implementation'],
          properties: {
            analysis: { type: 'object' },
            optimizations: { type: 'array' },
            implementation: { type: 'object' }
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

## Performance Reference

### Event Loop Comparison

| Technology | Connections | Syscalls | Best For |
|------------|-------------|----------|----------|
| select | ~1,000 | O(n) | Legacy, portable |
| poll | ~10,000 | O(n) | Medium scale |
| epoll | ~100,000 | O(1) | Linux standard |
| kqueue | ~100,000 | O(1) | BSD/macOS |
| io_uring | ~1,000,000 | Batched | Modern Linux |
| DPDK | ~10,000,000 | Zero | Kernel bypass |

### Memory Overhead

| Model | Per-Connection | 100K Connections |
|-------|---------------|-----------------|
| Thread-per-conn | ~1MB | 100GB |
| Traditional buffers | ~16KB | 1.6GB |
| Optimized | ~256B | 25MB |
| DPDK/zero-copy | ~64B | 6.4MB |

## Interaction Guidelines

### What to Expect

- **Quantified recommendations** with benchmark data
- **Working code** ready for integration
- **Performance trade-offs** explained
- **Platform-specific** optimizations

### Best Practices

1. Provide current performance metrics
2. Specify target platform and constraints
3. Include profiling data if available
4. Define success criteria (throughput, latency, etc.)

## Related Resources

- [socket-programming skill](../../skills/socket-programming/) - Socket APIs
- [network-architect agent](../network-architect/) - Architecture design
- [protocol-expert agent](../protocol-expert/) - Protocol optimization

## References

- [The C10K Problem](http://www.kegel.com/c10k.html)
- [io_uring Documentation](https://kernel.dk/io_uring.pdf)
- [DPDK Programmer's Guide](https://doc.dpdk.org/guides/)
- [Linux Kernel Networking](https://www.kernel.org/doc/html/latest/networking/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-004
**Category:** Performance
**Status:** Active
