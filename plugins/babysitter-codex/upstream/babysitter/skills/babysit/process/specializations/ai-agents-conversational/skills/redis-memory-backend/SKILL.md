---
name: redis-memory-backend
description: Redis backend for conversation state persistence and caching
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Redis Memory Backend Skill

## Capabilities

- Configure Redis for conversation state storage
- Implement message history persistence
- Set up Redis caching for LLM responses
- Configure TTL-based memory expiration
- Implement Redis Pub/Sub for real-time updates
- Design efficient key schemas

## Target Processes

- conversational-memory-system
- chatbot-design-implementation

## Implementation Details

### Core Components

1. **Message Store**: RedisChatMessageHistory
2. **Cache**: LLM response caching
3. **State Store**: Conversation state persistence
4. **Pub/Sub**: Real-time updates

### Configuration Options

- Redis connection settings
- Key prefix configuration
- TTL settings
- Serialization format
- Cluster configuration

### Key Schema Patterns

- session:{session_id}:messages
- cache:llm:{prompt_hash}
- state:{user_id}:{key}

### Best Practices

- Use appropriate data structures
- Configure proper TTLs
- Implement connection pooling
- Monitor memory usage

### Dependencies

- redis
- langchain-community (RedisChatMessageHistory)
