# Query Translator Skill

## Overview

The Query Translator skill converts SQL queries between database dialects. It handles function mapping, syntax differences, and provides optimization suggestions.

## Quick Start

### Prerequisites

- Source queries to translate
- Target database type
- SQLGlot or similar tool

### Basic Usage

1. **Parse source query**
   ```python
   import sqlglot
   ast = sqlglot.parse("SELECT * FROM t", read="oracle")
   ```

2. **Translate**
   ```python
   translated = sqlglot.transpile(
       "SELECT * FROM t",
       read="oracle",
       write="postgres"
   )[0]
   ```

3. **Verify and optimize**
   - Test on target database
   - Review execution plan
   - Apply optimizations

## Features

### Dialect Support

| From | To | Support Level |
|------|-----|--------------|
| Oracle | PostgreSQL | High |
| SQL Server | MySQL | High |
| MySQL | PostgreSQL | High |
| Snowflake | BigQuery | Medium |

### Translation Types

- Function mapping
- Syntax adaptation
- Data type conversion
- Performance hints

## Configuration

```json
{
  "source": {
    "dialect": "oracle",
    "version": "19c"
  },
  "target": {
    "dialect": "postgresql",
    "version": "15"
  },
  "options": {
    "preserveComments": true,
    "suggestOptimizations": true
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [SQLGlot](https://github.com/tobymao/sqlglot)
