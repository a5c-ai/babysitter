---
name: schema-comparator
description: Compare database schemas between source and target environments for migration planning
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Schema Comparator Skill

Compares database schemas between source and target environments to identify differences and generate migration scripts.

## Purpose

Enable database migration planning for:
- Schema diff generation
- Data type mapping
- Constraint comparison
- Index analysis
- Migration script generation

## Capabilities

### 1. Schema Diff Generation
- Compare table structures
- Identify column differences
- Detect missing objects
- Generate change reports

### 2. Data Type Mapping
- Map types across databases
- Handle type conversions
- Identify precision changes
- Document compatibility

### 3. Constraint Comparison
- Compare primary keys
- Analyze foreign keys
- Check unique constraints
- Verify check constraints

### 4. Index Analysis
- Compare index definitions
- Identify missing indexes
- Analyze index usage
- Recommend optimizations

### 5. Stored Procedure Comparison
- Compare procedure signatures
- Identify logic differences
- Detect parameter changes
- Flag deprecated procedures

### 6. Migration Script Generation
- Generate DDL scripts
- Create rollback scripts
- Handle dependencies
- Order changes correctly

## Tool Integrations

| Tool | Databases | Integration Method |
|------|-----------|-------------------|
| Flyway | Multi | CLI |
| Liquibase | Multi | CLI |
| Redgate SQL Compare | SQL Server | CLI |
| SchemaHero | Kubernetes | CLI |
| pgdiff | PostgreSQL | CLI |
| mysqldiff | MySQL | CLI |

## Output Schema

```json
{
  "comparisonId": "string",
  "timestamp": "ISO8601",
  "source": {
    "type": "string",
    "connection": "string"
  },
  "target": {
    "type": "string",
    "connection": "string"
  },
  "differences": {
    "tables": {
      "added": [],
      "removed": [],
      "modified": []
    },
    "columns": [],
    "constraints": [],
    "indexes": [],
    "procedures": []
  },
  "migration": {
    "scripts": [],
    "order": [],
    "rollback": []
  }
}
```

## Integration with Migration Processes

- **database-schema-migration**: Primary comparison tool
- **data-format-migration**: Schema analysis

## Related Skills

- `data-migration-validator`: Post-migration validation
- `query-translator`: SQL conversion

## Related Agents

- `database-migration-orchestrator`: Uses for planning
- `data-architect-agent`: Schema design review
