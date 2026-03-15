---
name: distributed-caching
description: Expert skill for distributed cache design, implementation, and optimization using Redis and Memcached. Design cache architectures, configure eviction policies, implement caching patterns (cache-aside, write-through, write-behind), monitor cache performance, and optimize memory usage.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: caching
  backlog-id: SK-010
---

# distributed-caching

You are **distributed-caching** - a specialized skill for distributed cache architecture and optimization. This skill provides expert capabilities for designing, implementing, and maintaining high-performance caching layers using Redis, Memcached, and related technologies.

## Overview

This skill enables AI-powered caching operations including:
- Designing Redis data structures and access patterns
- Configuring Redis Cluster and Sentinel for high availability
- Implementing caching patterns (cache-aside, write-through, write-behind)
- Configuring eviction policies (LRU, LFU, TTL-based)
- Monitoring cache hit rates and memory usage
- Debugging cache invalidation issues
- Optimizing memory efficiency

## Prerequisites

- Redis 6.0+ (7.0+ recommended for advanced features)
- Or Memcached 1.6+
- redis-cli and memcached utilities
- Optional: Redis Stack for JSON, Search, and Time Series
- Optional: Redis Enterprise for production deployments

## Capabilities

### 1. Redis Data Structure Design

Design optimal data structures for use cases:

```redis
# String - Simple key-value caching
SET user:1001:profile '{"name":"John","email":"john@example.com"}' EX 3600
GET user:1001:profile

# Hash - Structured data with partial updates
HSET product:5001 name "Widget" price 29.99 stock 150
HGET product:5001 price
HINCRBY product:5001 stock -1

# Sorted Set - Leaderboards and ranking
ZADD leaderboard 1500 "player:1" 2200 "player:2" 1800 "player:3"
ZREVRANGE leaderboard 0 9 WITHSCORES  # Top 10
ZRANK leaderboard "player:1"

# List - Message queues and activity feeds
LPUSH notifications:user:1001 '{"type":"order","id":"ord-123"}'
LRANGE notifications:user:1001 0 19  # Latest 20
LTRIM notifications:user:1001 0 99   # Keep only 100

# Set - Tags, unique visitors, relationships
SADD product:5001:tags "electronics" "sale" "featured"
SINTER user:1001:interests product:5001:tags  # Common interests

# HyperLogLog - Cardinality estimation
PFADD daily:visitors:20260124 "user:1001" "user:1002" "guest:abc"
PFCOUNT daily:visitors:20260124

# Stream - Event sourcing and message streaming
XADD orders * action "created" order_id "ord-123" total "99.99"
XREAD COUNT 10 STREAMS orders 0
XGROUP CREATE orders order-processors $ MKSTREAM
XREADGROUP GROUP order-processors worker-1 COUNT 10 STREAMS orders >
```

### 2. Caching Patterns Implementation

Implement common caching patterns:

```python
import redis
import json
from functools import wraps

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Cache-Aside Pattern (Lazy Loading)
def get_user(user_id):
    cache_key = f"user:{user_id}"

    # Try cache first
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)

    # Cache miss - fetch from database
    user = database.get_user(user_id)

    # Populate cache with TTL
    r.setex(cache_key, 3600, json.dumps(user))
    return user

# Write-Through Pattern
def update_user(user_id, data):
    cache_key = f"user:{user_id}"

    # Update database first
    database.update_user(user_id, data)

    # Update cache immediately
    r.setex(cache_key, 3600, json.dumps(data))
    return data

# Write-Behind (Write-Back) Pattern
def update_user_async(user_id, data):
    cache_key = f"user:{user_id}"

    # Update cache immediately
    r.setex(cache_key, 3600, json.dumps(data))

    # Queue database write
    r.lpush("write_queue", json.dumps({
        "operation": "update_user",
        "user_id": user_id,
        "data": data,
        "timestamp": time.time()
    }))

# Read-Through with Cache-Aside decorator
def cached(ttl=3600, prefix="cache"):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function and arguments
            key = f"{prefix}:{func.__name__}:{hash(str(args) + str(kwargs))}"

            cached_value = r.get(key)
            if cached_value:
                return json.loads(cached_value)

            result = func(*args, **kwargs)
            r.setex(key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator

@cached(ttl=300, prefix="products")
def get_product_recommendations(user_id, category):
    return recommendation_service.get_recommendations(user_id, category)
```

### 3. Cache Invalidation Strategies

Implement robust cache invalidation:

```python
# Time-based invalidation (TTL)
r.setex("session:abc123", 1800, session_data)  # 30 minutes

# Event-driven invalidation
def on_user_updated(user_id):
    # Delete specific cache entries
    r.delete(f"user:{user_id}")
    r.delete(f"user:{user_id}:profile")

    # Delete pattern-matched keys (use with caution)
    keys = r.keys(f"user:{user_id}:*")
    if keys:
        r.delete(*keys)

# Tag-based invalidation
def set_with_tags(key, value, ttl, tags):
    pipe = r.pipeline()
    pipe.setex(key, ttl, value)
    for tag in tags:
        pipe.sadd(f"tag:{tag}", key)
    pipe.execute()

def invalidate_by_tag(tag):
    keys = r.smembers(f"tag:{tag}")
    if keys:
        pipe = r.pipeline()
        pipe.delete(*keys)
        pipe.delete(f"tag:{tag}")
        pipe.execute()

# Version-based invalidation
def get_with_version(key, version_key):
    version = r.get(version_key) or "1"
    versioned_key = f"{key}:v{version}"
    return r.get(versioned_key)

def invalidate_version(version_key):
    r.incr(version_key)  # Increment version, old keys expire naturally
```

### 4. Redis Cluster Configuration

Configure Redis Cluster for scalability:

```conf
# redis-cluster.conf
port 7000
cluster-enabled yes
cluster-config-file nodes-7000.conf
cluster-node-timeout 5000
appendonly yes
appendfsync everysec

# Memory management
maxmemory 4gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Replication
replica-read-only yes
min-replicas-to-write 1
min-replicas-max-lag 10
```

```bash
# Create cluster
redis-cli --cluster create \
  127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
  127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
  --cluster-replicas 1

# Check cluster status
redis-cli -c -p 7000 cluster info
redis-cli -c -p 7000 cluster nodes

# Rebalance slots
redis-cli --cluster rebalance 127.0.0.1:7000
```

### 5. Redis Sentinel for High Availability

Configure Sentinel for automatic failover:

```conf
# sentinel.conf
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel auth-pass mymaster <password>
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1

# Notification scripts
sentinel notification-script mymaster /opt/redis/notify.sh
sentinel client-reconfig-script mymaster /opt/redis/reconfig.sh
```

```python
# Python client with Sentinel
from redis.sentinel import Sentinel

sentinel = Sentinel([
    ('sentinel1.example.com', 26379),
    ('sentinel2.example.com', 26379),
    ('sentinel3.example.com', 26379)
], socket_timeout=0.1)

# Get master
master = sentinel.master_for('mymaster', socket_timeout=0.1)
master.set('key', 'value')

# Get replica for reads
replica = sentinel.slave_for('mymaster', socket_timeout=0.1)
value = replica.get('key')
```

### 6. Eviction Policy Configuration

Configure optimal eviction policies:

```conf
# LRU - Least Recently Used (general purpose)
maxmemory-policy allkeys-lru

# LFU - Least Frequently Used (hot data scenarios)
maxmemory-policy allkeys-lfu
lfu-log-factor 10
lfu-decay-time 1

# Volatile - Only evict keys with TTL
maxmemory-policy volatile-lru
maxmemory-policy volatile-lfu
maxmemory-policy volatile-ttl

# No eviction - Return errors when full
maxmemory-policy noeviction
```

### 7. Cache Performance Monitoring

Monitor cache health and performance:

```bash
# Redis INFO command
redis-cli INFO stats
redis-cli INFO memory
redis-cli INFO replication
redis-cli INFO clients

# Key metrics to monitor
# - hit_rate: keyspace_hits / (keyspace_hits + keyspace_misses)
# - memory_usage: used_memory / maxmemory
# - evicted_keys: Number of keys evicted
# - connected_clients: Current client connections
# - blocked_clients: Clients waiting on blocking operations
```

```python
# Calculate cache hit rate
info = r.info('stats')
hits = info['keyspace_hits']
misses = info['keyspace_misses']
hit_rate = hits / (hits + misses) * 100 if (hits + misses) > 0 else 0
print(f"Cache hit rate: {hit_rate:.2f}%")

# Memory analysis
memory_info = r.info('memory')
print(f"Used memory: {memory_info['used_memory_human']}")
print(f"Peak memory: {memory_info['used_memory_peak_human']}")
print(f"Fragmentation ratio: {memory_info['mem_fragmentation_ratio']}")
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| mcp-redis (Official) | Redis data management | [GitHub](https://github.com/redis/mcp-redis) |
| Redis Cloud Admin API | Cloud Redis management | See Redis documentation |

## Best Practices

### Cache Design

1. **Key naming conventions** - Use consistent, hierarchical naming (e.g., `entity:id:attribute`)
2. **TTL strategy** - Always set TTLs to prevent unbounded growth
3. **Serialization** - Use efficient formats (MessagePack, Protocol Buffers)
4. **Hot key handling** - Shard hot keys or use local caching

### Data Consistency

1. **Cache-aside for reads** - Safest pattern for most use cases
2. **Write-through for consistency** - When consistency is critical
3. **Eventual consistency** - Accept staleness for performance
4. **Version tagging** - Track data versions for invalidation

### Performance

1. **Pipeline commands** - Batch multiple operations
2. **Connection pooling** - Reuse connections
3. **Avoid large keys** - Keep values under 100KB
4. **Use appropriate data structures** - Hashes over JSON strings for partial updates

## Process Integration

This skill integrates with the following processes:
- `caching-strategy-design.js` - Cache architecture planning
- Application-level cache optimization workflows
- Performance tuning recommendations

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "analyze-cache",
  "status": "success",
  "metrics": {
    "hitRate": 94.5,
    "missRate": 5.5,
    "evictionRate": 0.02,
    "memoryUsage": {
      "used": "3.2GB",
      "peak": "3.8GB",
      "maxmemory": "4GB",
      "utilizationPercent": 80
    },
    "connections": {
      "current": 45,
      "blocked": 0,
      "maxClients": 10000
    }
  },
  "recommendations": [
    {
      "category": "memory",
      "issue": "High memory utilization",
      "action": "Consider increasing maxmemory or enabling LFU eviction",
      "priority": "medium"
    }
  ]
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `OOM command not allowed` | Memory limit reached | Increase maxmemory or enable eviction |
| `CLUSTERDOWN` | Cluster not available | Check cluster health, majority nodes |
| `MOVED` | Key on different node | Use cluster-aware client |
| `BUSY` | Lua script running | Wait or kill script with SCRIPT KILL |
| `LOADING` | Redis loading from disk | Wait for load to complete |

## Constraints

- Monitor memory usage to prevent OOM conditions
- Use connection pooling in applications
- Implement circuit breakers for cache unavailability
- Test cache invalidation thoroughly
- Consider cache stampede prevention
