---
name: query-translator
description: Translate SQL queries between different database dialects with function mapping and optimization
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Query Translator Skill

Translates SQL queries between different database dialects, handling function mapping, syntax differences, and performance optimization.

## Purpose

Enable SQL migration for:
- Dialect conversion
- Function mapping
- Syntax translation
- Performance hint conversion
- Query optimization suggestions

## Capabilities

### 1. Dialect Conversion
- Oracle to PostgreSQL
- SQL Server to MySQL
- MySQL to PostgreSQL
- And more combinations

### 2. Function Mapping
- Date/time functions
- String functions
- Math functions
- Custom function equivalents

### 3. Syntax Translation
- Pagination (LIMIT/OFFSET/ROWNUM)
- String concatenation
- NULL handling
- Boolean expressions

### 4. Performance Hint Conversion
- Index hints
- Join hints
- Optimizer directives
- Execution plan guidance

### 5. Query Optimization Suggestions
- Index recommendations
- Query restructuring
- Join optimization
- Subquery refactoring

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| SQLGlot | Universal SQL parser | Library |
| AWS SCT | Schema conversion | CLI |
| ora2pg | Oracle to PostgreSQL | CLI |
| pgLoader | MySQL to PostgreSQL | CLI |
| SSMA | SQL Server migration | CLI |

## Output Schema

```json
{
  "translationId": "string",
  "timestamp": "ISO8601",
  "source": {
    "dialect": "string",
    "query": "string"
  },
  "target": {
    "dialect": "string",
    "query": "string"
  },
  "transformations": [
    {
      "type": "function|syntax|hint",
      "original": "string",
      "translated": "string",
      "notes": "string"
    }
  ],
  "optimizations": [],
  "warnings": [],
  "manualReviewNeeded": []
}
```

## Integration with Migration Processes

- **database-schema-migration**: Query migration
- **cloud-migration**: Cloud database adaptation

## Related Skills

- `schema-comparator`: Schema analysis
- `data-migration-validator`: Validation queries

## Related Agents

- `database-migration-orchestrator`: Uses for migration
