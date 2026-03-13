---
name: event-sourcing-migrator
description: Migrate to event-sourcing architecture with event extraction, store setup, and CQRS implementation
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Event Sourcing Migrator Skill

Migrates applications to event-sourcing architecture, handling event extraction from existing data, event store setup, and CQRS implementation.

## Purpose

Enable event sourcing migration for:
- Event extraction from existing data
- Event store setup
- Projection generation
- CQRS implementation
- Snapshot management

## Capabilities

### 1. Event Extraction from Existing Data
- Analyze current state
- Derive historical events
- Generate event streams
- Handle data gaps

### 2. Event Store Setup
- Configure event store
- Set up partitioning
- Define retention
- Implement subscriptions

### 3. Projection Generation
- Create read models
- Build projections
- Handle updates
- Manage consistency

### 4. CQRS Implementation
- Separate read/write
- Implement commands
- Handle queries
- Manage eventual consistency

### 5. Snapshot Management
- Define snapshot strategy
- Generate snapshots
- Handle restoration
- Optimize performance

### 6. Event Replay
- Replay events
- Rebuild projections
- Handle migrations
- Test consistency

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| EventStore | Event database | CLI/API |
| Axon Framework | Java event sourcing | Library |
| Marten | .NET event store | Library |
| EventStoreDB | Event store | CLI |
| Custom stores | PostgreSQL/Kafka | Library |

## Output Schema

```json
{
  "migrationId": "string",
  "timestamp": "ISO8601",
  "eventStore": {
    "type": "string",
    "streams": "number",
    "events": "number"
  },
  "projections": [
    {
      "name": "string",
      "status": "string",
      "lastPosition": "number"
    }
  ],
  "snapshots": {
    "enabled": "boolean",
    "count": "number"
  }
}
```

## Integration with Migration Processes

- **monolith-to-microservices**: Event-driven architecture
- **database-schema-migration**: Data transformation

## Related Skills

- `domain-model-extractor`: Event discovery

## Related Agents

- `data-architect-agent`: Event architecture
