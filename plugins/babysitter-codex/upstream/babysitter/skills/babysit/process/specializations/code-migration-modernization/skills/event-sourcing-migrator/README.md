# Event Sourcing Migrator Skill

## Overview

The Event Sourcing Migrator skill helps migrate to event-sourcing architecture. It extracts events from existing data, sets up event stores, and implements CQRS patterns.

## Quick Start

### Prerequisites

- Event store infrastructure
- Domain model understanding
- Migration strategy

### Basic Usage

1. **Analyze current state**
   - Map data models
   - Identify events
   - Plan projections

2. **Extract events**
   - Generate from current data
   - Create event streams
   - Verify completeness

3. **Set up CQRS**
   - Implement commands
   - Build projections
   - Test consistency

## Features

### Migration Approaches

| Approach | Description | Complexity |
|----------|-------------|------------|
| Big Bang | All at once | High |
| Incremental | Stream by stream | Medium |
| Parallel | Run both systems | High |
| Synthetic | Generate history | Medium |

### Components

- Event Store
- Command Handlers
- Event Handlers
- Projections
- Snapshots

## Configuration

```json
{
  "eventStore": {
    "type": "eventstoredb",
    "connection": "esdb://localhost:2113"
  },
  "migration": {
    "approach": "incremental",
    "generateHistory": true,
    "snapshotInterval": 100
  },
  "projections": {
    "rebuild": true,
    "parallel": 4
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
