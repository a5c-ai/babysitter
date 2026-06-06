/**
 * GAP-TOOLS-029: Structured Output Tool.
 *
 * Parse, validate, and format structured data in JSON, YAML, Markdown,
 * and ASCII table formats.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OutputSchemaType = 'json' | 'yaml' | 'markdown' | 'table';

export interface OutputSchema {
  /** The expected output format. */
  type: OutputSchemaType;
  /** Optional JSON Schema subset for validation (type, properties, required). */
  schema?: {
    type?: string;
    properties?: Record<string, { type: string }>;
    required?: string[];
  };
}

export interface StructuredOutputResult {
  /** The raw input string. */
  raw: string;
  /** The parsed data (or null if parsing failed). */
  parsed: unknown;
  /** Whether the output is valid against the schema. */
  valid: boolean;
  /** Validation error messages. */
  errors: string[];
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Parse raw string input and validate against an OutputSchema.
 */
export function parseStructuredOutput(raw: string, schema: OutputSchema): StructuredOutputResult {
  const errors: string[] = [];
  let parsed: unknown = null;

  if (schema.type === 'json') {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      errors.push(`JSON parse error: ${(e as Error).message}`);
      return { raw, parsed: null, valid: false, errors };
    }
  } else if (schema.type === 'yaml') {
    // Simple YAML-like key: value parser for foundational support
    try {
      parsed = parseSimpleYaml(raw);
    } catch (e) {
      errors.push(`YAML parse error: ${(e as Error).message}`);
      return { raw, parsed: null, valid: false, errors };
    }
  } else if (schema.type === 'markdown' || schema.type === 'table') {
    // Markdown and table pass through as-is
    parsed = raw;
  }

  // Validate against JSON Schema subset if provided
  if (schema.schema && parsed !== null && typeof parsed === 'object') {
    const schemaErrors = validateAgainstSchema(parsed as Record<string, unknown>, schema.schema);
    errors.push(...schemaErrors);
  }

  return { raw, parsed, valid: errors.length === 0, errors };
}

/**
 * Format an array of objects as an ASCII table.
 */
export function formatAsTable(
  data: Array<Record<string, unknown>>,
  columns?: string[],
): string {
  if (data.length === 0) return '(empty)';

  const cols = columns ?? Object.keys(data[0]);
  if (cols.length === 0) return '(empty)';

  // Calculate column widths
  const widths = cols.map((col) => {
    const values = data.map((row) => String(row[col] ?? ''));
    return Math.max(col.length, ...values.map((v) => v.length));
  });

  // Header
  const header = cols.map((col, i) => col.padEnd(widths[i])).join(' | ');
  const separator = widths.map((w) => '-'.repeat(w)).join('-+-');

  // Rows
  const rows = data.map((row) =>
    cols.map((col, i) => String(row[col] ?? '').padEnd(widths[i])).join(' | '),
  );

  return [header, separator, ...rows].join('\n');
}

/**
 * Format structured data as markdown.
 */
export function formatAsMarkdown(data: unknown): string {
  if (data === null || data === undefined) return '_null_';

  if (Array.isArray(data)) {
    return data.map((item, i) => `${i + 1}. ${formatValue(item)}`).join('\n');
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    return entries.map(([key, value]) => `- **${key}**: ${formatValue(value)}`).join('\n');
  }

  return String(data);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '_null_';
  if (typeof v === 'object') return `\`${JSON.stringify(v)}\``;
  return String(v);
}

/**
 * Very simple YAML-like parser for key: value pairs.
 */
function parseSimpleYaml(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    result[key] = value;
  }
  return result;
}

function validateAgainstSchema(
  data: Record<string, unknown>,
  schema: NonNullable<OutputSchema['schema']>,
): string[] {
  const errors: string[] = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push(`Missing required field: "${field}"`);
      }
    }
  }

  // Check property types
  if (schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in data) {
        const actualType = Array.isArray(data[key]) ? 'array' : typeof data[key];
        if (propSchema.type && actualType !== propSchema.type) {
          errors.push(`Field "${key}" expected type "${propSchema.type}" but got "${actualType}"`);
        }
      }
    }
  }

  return errors;
}
