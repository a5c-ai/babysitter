# Schema Comparator Skill

## Overview

The Schema Comparator skill compares database schemas between environments. It generates detailed diffs and migration scripts for database migrations.

## Quick Start

### Prerequisites

- Database connection credentials
- Schema access permissions
- Comparison tool installed

### Basic Usage

1. **Compare schemas**
   ```bash
   # Using Liquibase
   liquibase diff --url=source --referenceUrl=target
   ```

2. **Review differences**
   - Analyze table changes
   - Check constraint impacts
   - Review index changes

3. **Generate scripts**
   - Create migration DDL
   - Generate rollback
   - Order dependencies

## Features

### Comparison Types

| Type | Description | Impact |
|------|-------------|--------|
| Tables | Structure changes | High |
| Columns | Data type/size | Medium |
| Constraints | Keys, checks | High |
| Indexes | Performance | Medium |

### Output Formats

- SQL migration scripts
- Liquibase changesets
- Flyway migrations
- JSON diff reports

## Configuration

```json
{
  "source": {
    "type": "postgresql",
    "host": "source-db",
    "database": "myapp",
    "schema": "public"
  },
  "target": {
    "type": "postgresql",
    "host": "target-db",
    "database": "myapp",
    "schema": "public"
  },
  "options": {
    "includeData": false,
    "generateRollback": true
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Liquibase](https://liquibase.org/)
- [Flyway](https://flywaydb.org/)
