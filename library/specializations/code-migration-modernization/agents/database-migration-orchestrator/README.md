# Database Migration Orchestrator Agent

## Overview

The Database Migration Orchestrator agent manages complex database migrations. It ensures zero-downtime execution, data integrity, and comprehensive validation throughout the migration process.

## Quick Start

### Prerequisites

- Source and target database access
- Migration tooling configured
- Validation queries prepared

### Basic Usage

1. **Analyze schemas**
2. **Plan migration sequence**
3. **Execute with validation**
4. **Coordinate cutover**

## Features

### Migration Strategies

| Strategy | Downtime | Complexity |
|----------|----------|------------|
| Blue-Green | Zero | High |
| Shadow Write | Zero | High |
| Scheduled | Planned | Low |
| Online DDL | Minimal | Medium |

### Validation Types

- Row count verification
- Checksum comparison
- Sample data validation
- Referential integrity

## Related Documentation

- [AGENT.md](./AGENT.md) - Full agent specification
