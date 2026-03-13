# Distributed Caching Skill

## Overview

The `distributed-caching` skill provides expert capabilities for distributed cache architecture using Redis and Memcached. It enables AI-powered caching operations including cache design, pattern implementation, eviction policy configuration, and performance optimization.

## Quick Start

### Prerequisites

1. **Redis 6.0+** - Recommended 7.0+ for latest features
2. **redis-cli** - Command-line interface for Redis
3. **Optional** - Redis Stack, Memcached, Redis Enterprise

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

For MCP server integration:

```bash
# Install Redis MCP server
claude mcp add redis

# Or manually
npm install -g @redis/mcp-redis
```

## Usage

### Basic Operations

```bash
# Design cache schema for use case
/skill distributed-caching design-schema \
  --use-case "user-sessions" \
  --expected-size "1M keys" \
  --access-pattern "read-heavy"

# Analyze cache performance
/skill distributed-caching analyze \
  --host redis.example.com \
  --port 6379

# Generate caching code
/skill distributed-caching generate-code \
  --language python \
  --pattern cache-aside \
  --entity User
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(cachingTask, {
  operation: 'design-caching-layer',
  requirements: {
    dataTypes: ['users', 'products', 'sessions'],
    consistency: 'eventual',
    evictionPolicy: 'lru',
    targetHitRate: 95
  },
  outputFile: 'cache-design.md'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Schema Design** | Design Redis data structures for use cases |
| **Pattern Implementation** | Cache-aside, write-through, write-behind |
| **Cluster Configuration** | Redis Cluster and Sentinel setup |
| **Eviction Policies** | LRU, LFU, TTL-based configuration |
| **Performance Analysis** | Hit rate, memory usage, latency analysis |
| **Invalidation Strategies** | Event-driven, tag-based, version-based |

## Examples

### Example 1: Session Caching Design

```bash
# Design session caching architecture
/skill distributed-caching design \
  --use-case "user-sessions" \
  --requirements '{"ttl": "30m", "size": "10KB avg", "users": "100K concurrent"}'
```

Output includes:
- Data structure recommendation (Hash vs String)
- Key naming convention
- TTL and eviction strategy
- Memory estimation
- High availability configuration

### Example 2: Cache Pattern Implementation

```bash
# Generate cache-aside pattern code
/skill distributed-caching generate-pattern \
  --pattern cache-aside \
  --language typescript \
  --entity Product \
  --ttl 3600
```

### Example 3: Performance Analysis

```bash
# Analyze cache performance
/skill distributed-caching analyze \
  --host localhost:6379 \
  --include hit-rate,memory,slow-log
```

Output:
- Cache hit rate percentage
- Memory utilization breakdown
- Slow query analysis
- Optimization recommendations

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `REDIS_PASSWORD` | Redis authentication | - |
| `REDIS_TLS` | Enable TLS connection | `false` |
| `REDIS_CLUSTER` | Use cluster mode | `false` |

### Skill Configuration

```yaml
# .babysitter/skills/distributed-caching.yaml
distributed-caching:
  redis:
    url: redis://redis.example.com:6379
    password: ${REDIS_PASSWORD}
    tls: true
  defaults:
    defaultTtl: 3600
    maxMemory: 4gb
    evictionPolicy: allkeys-lru
  monitoring:
    hitRateThreshold: 90
    memoryThreshold: 80
```

## Caching Pattern Reference

### Cache-Aside (Lazy Loading)

Best for: Read-heavy workloads, tolerance for stale data

```python
def get_user(user_id):
    # 1. Check cache
    cached = cache.get(f"user:{user_id}")
    if cached:
        return cached

    # 2. On miss, fetch from DB
    user = db.get_user(user_id)

    # 3. Populate cache
    cache.setex(f"user:{user_id}", 3600, user)
    return user
```

### Write-Through

Best for: Strong consistency requirements

```python
def update_user(user_id, data):
    # 1. Update DB
    db.update_user(user_id, data)

    # 2. Update cache immediately
    cache.setex(f"user:{user_id}", 3600, data)
```

### Write-Behind (Write-Back)

Best for: Write-heavy workloads, eventual consistency acceptable

```python
def update_user(user_id, data):
    # 1. Update cache immediately
    cache.setex(f"user:{user_id}", 3600, data)

    # 2. Queue async DB write
    queue.push({"op": "update_user", "id": user_id, "data": data})
```

## Data Structure Selection

| Use Case | Data Structure | Example |
|----------|---------------|---------|
| Simple K/V | String | `SET user:1 '{"name":"John"}'` |
| Structured data | Hash | `HSET user:1 name "John" email "j@e.com"` |
| Rankings | Sorted Set | `ZADD leaderboard 100 "player1"` |
| Queues | List | `LPUSH queue "task1"` |
| Tags/Sets | Set | `SADD tags:post:1 "tech" "redis"` |
| Unique counts | HyperLogLog | `PFADD visitors "user1"` |
| Event streams | Stream | `XADD orders * item "product1"` |

## Process Integration

### Processes Using This Skill

1. **caching-strategy-design.js** - Cache architecture planning
2. **performance-tuning-recommendations.js** - Cache optimization
3. **memory-allocation-optimization.js** - Memory efficiency

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const designCacheTask = defineTask({
  name: 'design-cache-layer',
  description: 'Design distributed caching layer for service',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Design cache for ${inputs.serviceName}`,
      skill: {
        name: 'distributed-caching',
        context: {
          operation: 'design-architecture',
          service: inputs.serviceName,
          requirements: {
            dataTypes: inputs.dataTypes,
            consistency: inputs.consistency,
            expectedLoad: inputs.expectedLoad
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

## MCP Server Reference

### mcp-redis (Official)

Official Redis MCP server for natural language cache interaction.

**Features:**
- Key-value operations
- Data structure manipulation
- Cluster management
- Performance monitoring

**GitHub:** https://github.com/redis/mcp-redis

### Redis Cloud Admin API

Manage Redis Cloud deployments through conversational interface.

**Features:**
- Subscription management
- Database provisioning
- Scaling operations

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Low hit rate | Review key design, check TTLs, analyze access patterns |
| High memory usage | Enable eviction, reduce value sizes, add TTLs |
| Connection issues | Check connection pooling, verify network access |
| Slow operations | Use pipelining, check for large keys, analyze slow log |
| Cache stampede | Implement locking, use probabilistic early expiration |

### Debug Commands

```bash
# Check cache hit rate
/skill distributed-caching analyze-hit-rate --host localhost:6379

# Find large keys
/skill distributed-caching find-large-keys --threshold 1MB

# Analyze memory fragmentation
/skill distributed-caching memory-analysis --detailed
```

## Related Skills

- **prometheus-grafana** - Cache metrics visualization
- **database-query-analysis** - Query optimization before caching
- **apm-instrumentation** - Cache latency tracing

## References

- [Redis Documentation](https://redis.io/docs/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Redis MCP Server](https://github.com/redis/mcp-redis)
- [Memcached Documentation](https://memcached.org/)
- [Caching Patterns](https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-010
**Category:** Caching
**Status:** Active
