# Throughput Optimization Expert Agent

## Overview

The `throughput-optimization-expert` agent embodies the expertise of a senior Throughput Engineering Specialist with 8+ years of experience in high-throughput systems. It provides expert guidance on throughput bottleneck analysis, concurrency optimization, scaling strategies, and resource utilization.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Throughput Engineering Specialist |
| **Experience** | 8+ years in high-throughput systems |
| **Background** | Distributed systems, parallel computing |
| **Philosophy** | "Scale horizontally, optimize vertically" |

## Core Throughput Principles

1. **Identify Bottlenecks** - System is only as fast as slowest component
2. **Parallelize** - Use all available resources
3. **Batch Operations** - Amortize overhead
4. **Reduce Contention** - Locks hurt throughput
5. **Scale Horizontally** - Add capacity
6. **Measure Saturation** - Know your limits

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Bottleneck Analysis** | CPU, memory, I/O, contention identification |
| **Concurrency** | Thread pools, async patterns, work stealing |
| **Lock-Free** | CAS, concurrent collections, thread-local |
| **Batching** | Micro-batching, pipelining, database batching |
| **Scaling** | Partitioning, load balancing, auto-scaling |
| **Resource Utilization** | CPU affinity, memory pools, zero-copy |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(throughputExpertTask, {
  agentName: 'throughput-optimization-expert',
  prompt: {
    role: 'Throughput Engineering Specialist',
    task: 'Increase message processing from 10K to 50K msgs/sec',
    context: {
      currentThroughput: '10,000 msgs/sec',
      resourceUtilization: {
        cpu: '45%',
        memory: '60%',
        diskIO: '80%'
      },
      architecture: 'Single consumer, PostgreSQL sink'
    },
    instructions: [
      'Identify throughput bottlenecks',
      'Recommend parallelization strategy',
      'Design batching approach',
      'Estimate scaling requirements'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Full throughput analysis
/agent throughput-optimization-expert analyze \
  --metrics system-metrics.json \
  --current-rps 5000

# Bottleneck identification
/agent throughput-optimization-expert find-bottleneck \
  --profile cpu-profile.json \
  --utilization utilization.json

# Scaling recommendation
/agent throughput-optimization-expert scaling-plan \
  --target-rps 50000 \
  --current-architecture arch.yaml
```

## Common Tasks

### 1. Throughput Analysis

```bash
/agent throughput-optimization-expert analyze \
  --service order-processor \
  --metrics prometheus-data.json
```

Output includes:
- Current throughput measurement
- Resource utilization breakdown
- Bottleneck identification
- Scaling headroom analysis

### 2. Concurrency Optimization

```bash
/agent throughput-optimization-expert optimize-concurrency \
  --workload-type mixed \
  --current-thread-pool 10 \
  --cpu-cores 8
```

Provides:
- Optimal thread pool sizing
- Pool separation strategy
- Async pattern recommendations

### 3. Batching Strategy

```bash
/agent throughput-optimization-expert design-batching \
  --operation database-insert \
  --current-latency 5ms \
  --target-throughput 10000
```

Delivers:
- Batch size recommendations
- Flush interval tuning
- Expected throughput improvement

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `concurrency-optimization.js` | Thread pool and async tuning |
| `algorithm-optimization.js` | Data structure selection |
| `throughput-analysis` (backlog) | Full throughput workflow |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const optimizeThroughputTask = defineTask({
  name: 'optimize-throughput',
  description: 'Optimize system throughput with expert guidance',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Optimize throughput: ${inputs.service}`,
      agent: {
        name: 'throughput-optimization-expert',
        prompt: {
          role: 'Throughput Engineering Specialist',
          task: 'Maximize system throughput',
          context: {
            service: inputs.service,
            currentMetrics: inputs.metrics,
            architecture: inputs.architecture,
            targetThroughput: inputs.target
          },
          instructions: [
            'Analyze current throughput',
            'Identify bottlenecks',
            'Recommend optimizations',
            'Design scaling strategy'
          ],
          outputFormat: 'JSON'
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

## Throughput Benchmarks

### By System Type

| System Type | Good | Excellent |
|-------------|------|-----------|
| Web API (per core) | 1K RPS | 10K RPS |
| Message Processing | 10K msg/s | 100K msg/s |
| Database Writes | 1K TPS | 10K TPS |
| Stream Processing | 100K events/s | 1M events/s |

### Resource Saturation Targets

| Resource | Target Utilization | Reasoning |
|----------|-------------------|-----------|
| CPU | <70% | Headroom for spikes |
| Memory | <80% | GC and allocation buffer |
| Disk I/O | <70% | Queue buildup avoidance |
| Network | <60% | Burst capacity |

## Optimization Strategies

### By Bottleneck Type

| Bottleneck | Quick Wins | Long-term |
|------------|------------|-----------|
| CPU | Algorithm optimization | Horizontal scaling |
| Memory | Object pooling | Memory-efficient data structures |
| Disk I/O | Batching, async I/O | SSD, distributed storage |
| Network | Compression, pooling | CDN, edge processing |
| Contention | Lock-free structures | Partitioning |

### Scaling Strategies

| Strategy | Use When | Example |
|----------|----------|---------|
| Vertical | CPU/Memory bound, simple | Bigger instance |
| Horizontal | Stateless, partitionable | Add instances |
| Functional | Different workload types | Separate services |
| Data | Large datasets | Database sharding |

## Thread Pool Sizing

### CPU-Bound Work

```
threads = number_of_cores
```

Example: 8-core system = 8 threads

### I/O-Bound Work

```
threads = cores * (1 + wait_time / compute_time)
```

Example: 8 cores, 100ms I/O wait, 10ms compute
- threads = 8 * (1 + 100/10) = 88 threads

### Mixed Workload

Use separate pools:
- CPU pool: `cores` threads
- I/O pool: `cores * 10` threads

## Interaction Guidelines

### What to Expect

- **Metrics-driven analysis** based on utilization data
- **Bottleneck-first approach** focusing on constraints
- **Scalability considerations** for future growth
- **Implementation guidance** with code examples

### Best Practices

1. Provide current throughput measurements
2. Include resource utilization metrics
3. Describe workload characteristics (CPU vs I/O)
4. Share architecture and dependencies

## Related Resources

- [distributed-caching skill](../../skills/distributed-caching/) - Caching for throughput
- [network-performance skill](../../skills/network-performance/) - Network optimization
- [gatling-load-testing skill](../../skills/gatling-load-testing/) - Load testing

## References

- [Designing Data-Intensive Applications](https://dataintensive.net/)
- [Java Concurrency in Practice](https://jcip.net/)
- [Systems Performance (Brendan Gregg)](https://www.brendangregg.com/systems-performance-2nd-edition-book.html)
- [LMAX Disruptor](https://lmax-exchange.github.io/disruptor/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-009
**Category:** Throughput
**Status:** Active
