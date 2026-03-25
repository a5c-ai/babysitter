# MCP Tool Schema Generator Skill

Generate comprehensive JSON Schema definitions for MCP tool inputs that are optimized for AI consumption.

## Overview

MCP tools require well-defined input schemas that AI models can understand and use correctly. This skill generates JSON Schema, TypeScript types, and Zod validation schemas from parameter definitions, with descriptions optimized for AI comprehension.

## When to Use

- Defining new MCP tool input schemas
- Documenting existing tool parameters
- Creating type-safe tool implementations
- Generating validation logic for inputs

## Quick Start

### Basic Schema

```json
{
  "toolName": "search_files",
  "description": "Search for files matching a pattern",
  "parameters": [
    {
      "name": "pattern",
      "type": "string",
      "description": "Glob pattern to match files",
      "required": true
    },
    {
      "name": "directory",
      "type": "string",
      "description": "Directory to search in",
      "required": false,
      "default": "."
    }
  ]
}
```

### Complex Schema

```json
{
  "toolName": "execute_query",
  "description": "Execute a database query with parameters",
  "parameters": [
    {
      "name": "query",
      "type": "string",
      "description": "SQL query to execute",
      "required": true,
      "constraints": {
        "minLength": 1,
        "maxLength": 10000
      }
    },
    {
      "name": "database",
      "type": "string",
      "description": "Target database",
      "required": false,
      "enum": ["postgres", "mysql", "sqlite"]
    },
    {
      "name": "params",
      "type": "array",
      "description": "Query parameters for prepared statements",
      "required": false,
      "items": {
        "type": "union",
        "types": ["string", "number", "boolean", "null"]
      }
    },
    {
      "name": "options",
      "type": "object",
      "description": "Query execution options",
      "required": false,
      "properties": [
        {
          "name": "timeout",
          "type": "integer",
          "description": "Query timeout in milliseconds",
          "constraints": { "minimum": 100, "maximum": 30000 },
          "default": 5000
        },
        {
          "name": "readOnly",
          "type": "boolean",
          "description": "Enforce read-only mode",
          "default": true
        }
      ]
    }
  ],
  "examples": [
    {
      "query": "SELECT * FROM users WHERE id = $1",
      "params": [123],
      "options": { "timeout": 5000, "readOnly": true }
    }
  ]
}
```

## Generated Outputs

### JSON Schema

Standard JSON Schema (draft 2020-12) for protocol compliance:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "mcp://tools/execute_query/input",
  "title": "execute_query Input Schema",
  "description": "Execute a database query with parameters",
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "SQL query to execute. Use $1, $2 for parameters.",
      "minLength": 1,
      "maxLength": 10000
    },
    "database": {
      "type": "string",
      "description": "Target database engine",
      "enum": ["postgres", "mysql", "sqlite"]
    },
    "params": {
      "type": "array",
      "description": "Query parameters for prepared statements",
      "items": {
        "oneOf": [
          { "type": "string" },
          { "type": "number" },
          { "type": "boolean" },
          { "type": "null" }
        ]
      }
    },
    "options": {
      "type": "object",
      "properties": {
        "timeout": {
          "type": "integer",
          "minimum": 100,
          "maximum": 30000,
          "default": 5000
        },
        "readOnly": {
          "type": "boolean",
          "default": true
        }
      }
    }
  },
  "required": ["query"],
  "additionalProperties": false
}
```

### TypeScript Types

Type-safe interfaces with JSDoc:

```typescript
export interface ExecuteQueryInput {
  /** SQL query to execute. Use $1, $2 for parameters. */
  query: string;

  /** Target database engine */
  database?: 'postgres' | 'mysql' | 'sqlite';

  /** Query parameters for prepared statements */
  params?: (string | number | boolean | null)[];

  /** Query execution options */
  options?: {
    /** Query timeout in milliseconds (100-30000) */
    timeout?: number;
    /** Enforce read-only mode */
    readOnly?: boolean;
  };
}
```

### Zod Schema

Runtime validation with detailed errors:

```typescript
import { z } from 'zod';

export const ExecuteQueryInputSchema = z.object({
  query: z.string()
    .min(1, 'Query cannot be empty')
    .max(10000, 'Query too long'),

  database: z.enum(['postgres', 'mysql', 'sqlite']).optional(),

  params: z.array(
    z.union([z.string(), z.number(), z.boolean(), z.null()])
  ).optional(),

  options: z.object({
    timeout: z.number().int().min(100).max(30000).default(5000),
    readOnly: z.boolean().default(true),
  }).optional(),
}).strict();
```

## AI-Optimized Descriptions

Descriptions are crafted for AI understanding:

| Aspect | Example |
|--------|---------|
| Purpose | "SQL query to execute" |
| Format | "Use $1, $2 for parameters" |
| Constraints | "Maximum 10000 characters" |
| Default | "Defaults to 5000ms" |
| Example | "SELECT * FROM users WHERE id = $1" |

### Bad vs Good Descriptions

| Bad | Good |
|-----|------|
| "The path" | "File path to read. Absolute or relative path supported." |
| "Timeout value" | "Query timeout in milliseconds. Range: 100-30000. Default: 5000." |
| "Options" | "Query options. Set readOnly: true to prevent modifications." |

## Supported Parameter Types

| Type | Description | Example |
|------|-------------|---------|
| string | Text values | file paths, queries |
| number | Floating point | scores, ratios |
| integer | Whole numbers | counts, timeouts |
| boolean | True/false | flags, toggles |
| array | Lists | parameters, tags |
| object | Nested structures | options, config |
| enum | Fixed values | databases, formats |
| union | Multiple types | mixed arrays |

## Validation Constraints

### String Constraints
- minLength / maxLength
- pattern (regex)
- format (email, uri, date-time, etc.)

### Number Constraints
- minimum / maximum
- exclusiveMinimum / exclusiveMaximum
- multipleOf

### Array Constraints
- minItems / maxItems
- uniqueItems
- items (schema for elements)

### Object Constraints
- required properties
- additionalProperties
- nested property schemas

## Integration with Processes

| Process | Usage |
|---------|-------|
| mcp-tool-implementation | Generate input schemas for tools |
| mcp-tool-documentation | Create AI-readable documentation |
| argument-parser-setup | Validate CLI arguments |

## Best Practices

1. **Clear Names**: Use descriptive parameter names
2. **Rich Descriptions**: Explain purpose, format, examples
3. **Appropriate Constraints**: Validate early, fail fast
4. **Sensible Defaults**: Reduce required parameters
5. **Examples**: Provide concrete usage examples

## References

- [JSON Schema Specification](https://json-schema.org/)
- [MCP Tool Schema Documentation](https://modelcontextprotocol.io/docs/tools)
- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
