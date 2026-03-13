# Latency Optimization Expert Agent

## Overview

The `latency-optimization-expert` agent embodies the expertise of a senior Latency Engineering Specialist with 8+ years of experience in high-performance systems. It provides expert guidance on end-to-end latency analysis, tail latency (P99) optimization, and performance engineering.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Latency Engineering Specialist |
| **Experience** | 8+ years in high-performance systems |
| **Background** | Low-latency trading, real-time systems |
| **Philosophy** | "Every millisecond counts" |

## Core Latency Principles

1. **Measure First** - Profile before optimizing
2. **Tail Latency Matters** - P99 affects real users at scale
3. **Critical Path Focus** - Optimize the longest sequential chain
4. **Async Everything** - Don't wait unnecessarily
5. **Fail Fast** - Timeouts prevent cascades
6. **Hedge Your Bets** - Redundancy reduces tail latency

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Latency Breakdown** | DNS, TCP, TLS, server component analysis |
| **Tail Latency (P99)** | Identification and optimization |
| **Critical Path** | Analysis and parallelization |
| **Async Patterns** | Fire-and-forget, event-driven, sagas |
| **Connection Pooling** | Sizing and tuning |
| **Timeouts/Retries** | Strategy design |
| **Hedged Requests** | Tail latency reduction |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(latencyExpertTask, {
  agentName: 'latency-optimization-expert',
  prompt: {
    role: 'Latency Engineering Specialist',
    task: 'Reduce P99 latency from 450ms to under 200ms',
    context: {
      currentMetrics: {
        p50: '45ms',
        p95: '120ms',
        p99: '450ms'
      },
      traceData: traces,
      architecture: systemDiagram
    },
    instructions: [
      'Perform latency breakdown analysis',
      'Identify critical path',
      'Propose optimization strategies',
      'Estimate improvement potential'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Full latency analysis
/agent latency-optimization-expert analyze \
  --endpoint /api/users \
  --traces traces.json

# P99 optimization
/agent latency-optimization-expert optimize-p99 \
  --target 100ms \
  --current-metrics metrics.json

# Critical path analysis
/agent latency-optimization-expert critical-path \
  --trace sample-trace.json
```

## Common Tasks

### 1. Latency Breakdown

```bash
/agent latency-optimization-expert breakdown \
  --endpoint https://api.example.com/users \
  --samples 100
```

Output includes:
- DNS, TCP, TLS timing
- Server-side component breakdown
- Network vs processing time
- Optimization opportunities

### 2. P99 Optimization

```bash
/agent latency-optimization-expert optimize-tail \
  --current-p99 450ms \
  --target-p99 150ms \
  --traces traces/
```

Provides:
- Tail latency causes
- Variance reduction strategies
- Hedging recommendations
- Expected improvements

### 3. Timeout Strategy

```bash
/agent latency-optimization-expert design-timeouts \
  --total-budget 2000ms \
  --services "auth,database,external-api"
```

Delivers:
- Per-service timeout allocation
- Retry configuration
- Circuit breaker settings

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `network-io-optimization.js` | Network latency optimization |
| `latency-analysis` (backlog) | Full latency analysis |
| `p99-optimization` (backlog) | Tail latency focus |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const optimizeLatencyTask = defineTask({
  name: 'optimize-latency',
  description: 'Optimize endpoint latency with expert guidance',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Optimize latency: ${inputs.endpoint}`,
      agent: {
        name: 'latency-optimization-expert',
        prompt: {
          role: 'Latency Engineering Specialist',
          task: 'Reduce endpoint latency',
          context: {
            endpoint: inputs.endpoint,
            currentLatency: inputs.metrics,
            traces: inputs.traces,
            targetP99: inputs.targetP99
          },
          instructions: [
            'Analyze current latency distribution',
            'Identify critical path',
            'Recommend optimizations',
            'Provide implementation priority'
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

## Latency Targets Reference

### Typical Targets by Use Case

| Use Case | P50 | P95 | P99 |
|----------|-----|-----|-----|
| Interactive UI | <100ms | <200ms | <500ms |
| API calls | <50ms | <100ms | <200ms |
| Search | <200ms | <500ms | <1s |
| Background jobs | <1s | <5s | <30s |

### Latency Budget Example

```
Total: 200ms
- DNS: 5ms (2.5%)
- TCP: 10ms (5%)
- TLS: 20ms (10%)
- Auth: 15ms (7.5%)
- Business Logic: 50ms (25%)
- Database: 80ms (40%)
- Serialization: 10ms (5%)
- Network Return: 10ms (5%)
```

## Optimization Strategies

### By Percentile Impact

| Strategy | P50 Impact | P99 Impact |
|----------|------------|------------|
| Algorithm optimization | High | Medium |
| Caching | High | High |
| Connection pooling | Medium | High |
| Async processing | Low | High |
| Hedged requests | None | Very High |
| GC tuning | Low | Very High |

### Quick Wins

1. **Add caching** - Immediate latency reduction
2. **Connection pooling** - Eliminate connect overhead
3. **Async non-critical work** - Reduce critical path
4. **Add indexes** - Database query optimization
5. **Enable compression** - Reduce network time

## Interaction Guidelines

### What to Expect

- **Data-driven analysis** based on traces and metrics
- **Prioritized recommendations** by impact/effort
- **Trade-off discussion** for each approach
- **Implementation guidance** with code examples

### Best Practices

1. Provide representative trace samples
2. Include current latency percentiles
3. Specify target latency requirements
4. Share architecture context

## Related Resources

- [network-performance skill](../../skills/network-performance/) - Network optimization
- [distributed-caching skill](../../skills/distributed-caching/) - Caching for latency
- [apm-instrumentation skill](../../skills/apm-instrumentation/) - Latency tracing

## References

- [Tail at Scale (Google)](https://research.google/pubs/pub40801/)
- [Latency Numbers Every Programmer Should Know](https://gist.github.com/jboner/2841832)
- [High Performance Browser Networking](https://hpbn.co/)
- [Hedged Requests Paper](https://cacm.acm.org/magazines/2013/2/160173-the-tail-at-scale/fulltext)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-008
**Category:** Latency
**Status:** Active
