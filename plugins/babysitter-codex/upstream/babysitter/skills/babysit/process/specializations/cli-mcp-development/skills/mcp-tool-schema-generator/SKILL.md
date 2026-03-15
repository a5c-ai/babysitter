---
name: mcp-tool-schema-generator
description: Generate JSON Schema definitions for MCP tool input parameters. Creates well-documented, AI-consumable schemas with proper types, descriptions, and validation rules.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# MCP Tool Schema Generator

Generate comprehensive JSON Schema definitions for MCP tools that are optimized for AI consumption, with clear descriptions, type constraints, and validation rules.

## Capabilities

- Generate JSON Schema for tool inputs
- Create TypeScript types from schemas
- Generate Zod validation schemas
- Produce AI-optimized descriptions
- Support complex nested structures
- Handle enums, unions, and constraints

## Usage

Invoke this skill when you need to:
- Define input schemas for MCP tools
- Create type-safe tool parameter definitions
- Generate validation logic for tool inputs
- Document tool parameters for AI consumption

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| toolName | string | Yes | Name of the MCP tool |
| description | string | Yes | Tool description |
| parameters | array | Yes | List of parameter definitions |
| outputFormat | string | No | json-schema, zod, or typescript (default: all) |
| examples | array | No | Example inputs for documentation |

### Parameter Definition Structure

```json
{
  "parameters": [
    {
      "name": "path",
      "type": "string",
      "description": "File path to read",
      "required": true,
      "constraints": {
        "pattern": "^[a-zA-Z0-9_/.-]+$",
        "maxLength": 255
      }
    },
    {
      "name": "encoding",
      "type": "string",
      "description": "File encoding",
      "required": false,
      "default": "utf-8",
      "enum": ["utf-8", "ascii", "base64"]
    },
    {
      "name": "options",
      "type": "object",
      "description": "Read options",
      "required": false,
      "properties": [
        { "name": "maxSize", "type": "number", "description": "Max bytes to read" },
        { "name": "follow", "type": "boolean", "description": "Follow symlinks" }
      ]
    }
  ]
}
```

## Output Structure

```
schemas/
├── <toolName>/
│   ├── schema.json           # JSON Schema definition
│   ├── schema.ts             # TypeScript types
│   ├── validation.ts         # Zod validation schema
│   ├── examples.json         # Example inputs
│   └── README.md             # Schema documentation
```

## Generated Code Patterns

### JSON Schema Output

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "mcp://tools/read_file/input",
  "title": "read_file Input Schema",
  "description": "Read contents of a file from the filesystem",
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "File path to read. Must be a valid filesystem path.",
      "pattern": "^[a-zA-Z0-9_/.-]+$",
      "maxLength": 255,
      "examples": ["/home/user/document.txt", "./config.json"]
    },
    "encoding": {
      "type": "string",
      "description": "File encoding. Defaults to UTF-8 for text files.",
      "enum": ["utf-8", "ascii", "base64"],
      "default": "utf-8"
    },
    "options": {
      "type": "object",
      "description": "Additional read options",
      "properties": {
        "maxSize": {
          "type": "integer",
          "description": "Maximum bytes to read. Use for large files.",
          "minimum": 1,
          "maximum": 10485760
        },
        "follow": {
          "type": "boolean",
          "description": "Whether to follow symbolic links",
          "default": true
        }
      }
    }
  },
  "required": ["path"],
  "additionalProperties": false
}
```

### TypeScript Types Output

```typescript
/**
 * Input parameters for the read_file tool
 * @description Read contents of a file from the filesystem
 */
export interface ReadFileInput {
  /**
   * File path to read. Must be a valid filesystem path.
   * @pattern ^[a-zA-Z0-9_/.-]+$
   * @maxLength 255
   * @example "/home/user/document.txt"
   */
  path: string;

  /**
   * File encoding. Defaults to UTF-8 for text files.
   * @default "utf-8"
   */
  encoding?: 'utf-8' | 'ascii' | 'base64';

  /**
   * Additional read options
   */
  options?: {
    /**
     * Maximum bytes to read. Use for large files.
     * @minimum 1
     * @maximum 10485760
     */
    maxSize?: number;

    /**
     * Whether to follow symbolic links
     * @default true
     */
    follow?: boolean;
  };
}
```

### Zod Validation Output

```typescript
import { z } from 'zod';

/**
 * Zod schema for read_file tool input validation
 */
export const ReadFileInputSchema = z.object({
  path: z
    .string()
    .regex(/^[a-zA-Z0-9_/.-]+$/, 'Invalid path characters')
    .max(255, 'Path too long')
    .describe('File path to read. Must be a valid filesystem path.'),

  encoding: z
    .enum(['utf-8', 'ascii', 'base64'])
    .optional()
    .default('utf-8')
    .describe('File encoding. Defaults to UTF-8 for text files.'),

  options: z
    .object({
      maxSize: z
        .number()
        .int()
        .min(1)
        .max(10485760)
        .optional()
        .describe('Maximum bytes to read. Use for large files.'),

      follow: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether to follow symbolic links'),
    })
    .optional()
    .describe('Additional read options'),
}).strict();

export type ReadFileInput = z.infer<typeof ReadFileInputSchema>;
```

## Supported Types

| Type | JSON Schema | TypeScript | Zod |
|------|-------------|------------|-----|
| string | string | string | z.string() |
| number | number | number | z.number() |
| integer | integer | number | z.number().int() |
| boolean | boolean | boolean | z.boolean() |
| array | array | T[] | z.array() |
| object | object | interface | z.object() |
| enum | enum | union | z.enum() |
| null | null | null | z.null() |
| union | oneOf | union | z.union() |

## Constraint Support

| Constraint | Types | JSON Schema | Zod |
|------------|-------|-------------|-----|
| minLength | string | minLength | .min() |
| maxLength | string | maxLength | .max() |
| pattern | string | pattern | .regex() |
| format | string | format | .email()/.url() |
| minimum | number | minimum | .min() |
| maximum | number | maximum | .max() |
| multipleOf | number | multipleOf | .multipleOf() |
| minItems | array | minItems | .min() |
| maxItems | array | maxItems | .max() |
| uniqueItems | array | uniqueItems | custom |

## AI-Optimized Descriptions

The skill generates descriptions optimized for AI consumption:

1. **Clear Purpose**: What the parameter does
2. **Valid Values**: Acceptable inputs
3. **Examples**: Concrete usage examples
4. **Constraints**: Limits and validation rules
5. **Defaults**: What happens if omitted

Example:
```
"File path to read. Must be an absolute or relative path to an existing file.
Supports Unix and Windows path formats. Maximum length: 255 characters.
Example: '/home/user/config.json'"
```

## Workflow

1. **Parse parameters** - Validate parameter definitions
2. **Infer types** - Determine TypeScript/Zod types
3. **Generate JSON Schema** - Create draft 2020-12 schema
4. **Generate TypeScript** - Create interface definitions
5. **Generate Zod schema** - Create validation code
6. **Create examples** - Generate valid example inputs
7. **Document schema** - Create README with usage

## Best Practices Applied

- JSON Schema draft 2020-12 compliance
- Strict mode (additionalProperties: false)
- Comprehensive descriptions for AI
- Type-safe TypeScript interfaces
- Runtime validation with Zod
- Example inputs for each parameter

## References

- JSON Schema Specification: https://json-schema.org/
- MCP Tool Documentation: https://modelcontextprotocol.io/docs/tools
- Zod Documentation: https://zod.dev/

## Target Processes

- mcp-tool-implementation
- mcp-tool-documentation
- argument-parser-setup
