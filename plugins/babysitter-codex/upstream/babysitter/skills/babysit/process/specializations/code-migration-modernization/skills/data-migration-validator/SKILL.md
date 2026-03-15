---
name: data-migration-validator
description: Validate data integrity during and after migration with comprehensive verification checks
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Data Migration Validator Skill

Validates data integrity throughout the migration process with comprehensive verification checks and reconciliation reporting.

## Purpose

Enable data validation for:
- Row count validation
- Checksum verification
- Sample data comparison
- Referential integrity checking
- Business rule validation

## Capabilities

### 1. Row Count Validation
- Compare source/target counts
- Track by table/partition
- Identify discrepancies
- Generate count reports

### 2. Checksum Verification
- Calculate table checksums
- Compare hash values
- Identify data drift
- Verify data consistency

### 3. Sample Data Comparison
- Random sample selection
- Field-by-field comparison
- Statistical sampling
- Confidence scoring

### 4. Referential Integrity Checking
- Verify foreign keys
- Check orphaned records
- Validate relationships
- Report violations

### 5. Business Rule Validation
- Apply custom rules
- Check data constraints
- Verify transformations
- Validate calculations

### 6. Reconciliation Reporting
- Generate audit reports
- Track discrepancies
- Document exceptions
- Provide sign-off reports

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| Great Expectations | Data validation | Library |
| dbt tests | Transform validation | CLI |
| Custom SQL | Database checks | CLI |
| DataGrip | Manual verification | GUI |
| Apache Griffin | Data quality | API |

## Output Schema

```json
{
  "validationId": "string",
  "timestamp": "ISO8601",
  "results": {
    "rowCounts": {
      "tables": [
        {
          "name": "string",
          "source": "number",
          "target": "number",
          "match": "boolean"
        }
      ]
    },
    "checksums": {
      "tables": [],
      "overall": "string"
    },
    "samples": {
      "checked": "number",
      "matched": "number",
      "discrepancies": []
    },
    "referentialIntegrity": {
      "valid": "boolean",
      "violations": []
    },
    "businessRules": {
      "passed": "number",
      "failed": "number",
      "failures": []
    }
  },
  "summary": {
    "status": "passed|failed|warning",
    "score": "number"
  }
}
```

## Integration with Migration Processes

- **database-schema-migration**: Post-migration validation
- **cloud-migration**: Data validation

## Related Skills

- `schema-comparator`: Pre-migration comparison
- `etl-pipeline-builder`: Migration execution

## Related Agents

- `data-integrity-validator`: Orchestrates validation
- `database-migration-orchestrator`: Uses for verification
