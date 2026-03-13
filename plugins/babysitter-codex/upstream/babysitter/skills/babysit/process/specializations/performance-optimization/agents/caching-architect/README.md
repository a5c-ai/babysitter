# Caching Architect Agent

## Overview

The `caching-architect` agent embodies the expertise of a senior Caching Infrastructure Architect with 8+ years of experience. It provides expert guidance on multi-layer cache design, invalidation strategies, consistency patterns, and cache optimization.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Caching Infrastructure Architect |
| **Experience** | 8+ years in distributed systems |
| **Background** | High-scale web systems, distributed caching |
| **Philosophy** | "Cache the right data at the right layer" |

## Core Caching Principles

1. **Cache Placement** - Put data close to consumers
2. **Cache Coherence** - Maintain consistency across layers
3. **Cache Efficiency** - Maximize hit rates
4. **Cache Resilience** - Handle failures gracefully
5. **Cache Observability** - Measure everything
6. **Cache Economics** - Balance cost vs performance

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Multi-Layer Architecture** | L1/L2/CDN design |
| **Invalidation Strategies** | TTL, event-driven, versioned |
| **Consistency Patterns** | Eventual, read-your-writes, strong |
| **Redis/Memcached** | Optimization and tuning |
| **CDN Caching** | Edge caching strategies |
| **Hit Rate Optimization** | Analysis and improvement |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(cachingArchitectTask, {
  agentName: 'caching-architect',
  prompt: {
    role: 'Caching Architect',
    task: 'Design caching architecture for e-commerce API',
    context: {
      endpoints: ['/products', '/cart', '/user'],
      currentMetrics: {
        p99Latency: '450ms',
        rps: 10000,
        cacheHitRate: '65%'
      },
      constraints: {
        budget: 'moderate',
        consistencyRequirements: 'user cart must be consistent'
      }
    },
    instructions: [
      'Recommend cache layer structure',
      'Define invalidation strategy per data type',
      'Estimate expected improvements',
      'Provide implementation plan'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Design cache architecture
/agent caching-architect design-architecture \
  --service e-commerce-api \
  --target-hit-rate 95%

# Analyze cache performance
/agent caching-architect analyze \
  --metrics cache-metrics.json

# Optimize existing cache
/agent caching-architect optimize \
  --current-config redis-config.yaml
```

## Common Tasks

### 1. Cache Architecture Design

```bash
/agent caching-architect design \
  --service payment-api \
  --data-types "sessions,transactions,rates" \
  --consistency-requirements "transactions:strong,rates:eventual"
```

Output includes:
- Multi-layer architecture recommendation
- Technology selection per layer
- Data placement strategy
- Estimated hit rates

### 2. Hit Rate Analysis

```bash
/agent caching-architect analyze-hit-rate \
  --metrics redis-info.json \
  --access-patterns access-log.json
```

Provides:
- Current hit rate breakdown by key prefix
- Miss pattern analysis
- TTL optimization recommendations
- Expected improvement

### 3. Invalidation Strategy

```bash
/agent caching-architect design-invalidation \
  --data-model schema.json \
  --consistency-requirements requirements.yaml
```

Delivers:
- Invalidation pattern per entity
- Event-driven vs TTL recommendations
- Implementation approach

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `caching-strategy-design.js` | Architecture design, pattern selection |
| `performance-tuning.js` | Cache optimization recommendations |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const designCacheTask = defineTask({
  name: 'design-cache-architecture',
  description: 'Design caching architecture with expert guidance',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Cache design for ${inputs.serviceName}`,
      agent: {
        name: 'caching-architect',
        prompt: {
          role: 'Caching Infrastructure Architect',
          task: 'Design comprehensive caching architecture',
          context: {
            service: inputs.serviceName,
            dataTypes: inputs.dataTypes,
            currentPerformance: inputs.metrics,
            requirements: inputs.requirements
          },
          instructions: [
            'Analyze current state and requirements',
            'Recommend cache layer architecture',
            'Design invalidation strategy per data type',
            'Estimate capacity requirements',
            'Provide phased implementation plan'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['architecture', 'invalidation', 'implementation'],
          properties: {
            architecture: { type: 'object' },
            invalidation: { type: 'object' },
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

## Cache Layer Reference

### Layer Comparison

| Layer | Latency | Capacity | Consistency | Use Case |
|-------|---------|----------|-------------|----------|
| L1 (In-Process) | <1ms | MB | Per-instance | Hot config |
| L2 (Distributed) | 1-5ms | GB-TB | Eventual | Sessions, API |
| CDN Edge | 5-50ms | Distributed | TTL-based | Static, public |
| Origin Cache | 1-10ms | GB | Per-origin | Backend proxy |

### Technology Selection

| Technology | Best For | Not For |
|------------|----------|---------|
| Redis | Complex data, Lua, pub/sub | Simple K/V only |
| Memcached | Simple K/V, multi-thread | Complex queries |
| Caffeine | JVM in-process | Cross-instance |
| Varnish | HTTP caching | Non-HTTP |
| CloudFront/Cloudflare | Edge, global | Dynamic, personalized |

## Invalidation Strategy Selection

| Pattern | Consistency | Complexity | Best For |
|---------|-------------|------------|----------|
| TTL-only | Eventual | Low | Semi-static data |
| Event-driven | Near real-time | High | User data, inventory |
| Version-based | Instant | Medium | Schema changes |
| Tag-based | Flexible | Medium | Related entities |

## Hit Rate Benchmarks

| Data Type | Target Hit Rate |
|-----------|-----------------|
| Static config | 99%+ |
| User sessions | 95%+ |
| Product catalog | 90%+ |
| Search results | 80%+ |
| Personalized | 70%+ |

## Interaction Guidelines

### What to Expect

- **Pattern-based recommendations** using proven caching patterns
- **Trade-off analysis** between consistency and performance
- **Metrics-driven** suggestions based on access patterns
- **Layered approach** with clear responsibilities

### Best Practices

1. Provide current metrics and access patterns
2. Specify consistency requirements clearly
3. Include infrastructure constraints (budget, team skills)
4. Share data model and relationships

## Related Resources

- [distributed-caching skill](../../skills/distributed-caching/) - Redis/Memcached operations
- [prometheus-grafana skill](../../skills/prometheus-grafana/) - Cache metrics

## References

- [Caching Strategies](https://aws.amazon.com/caching/best-practices/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [CDN Caching Guide](https://developers.cloudflare.com/cache/)
- [Cache-Aside Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-006
**Category:** Caching
**Status:** Active
