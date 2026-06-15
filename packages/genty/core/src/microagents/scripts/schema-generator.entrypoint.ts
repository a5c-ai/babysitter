#!/usr/bin/env node

/**
 * Entrypoint script for the schema-generator microagent.
 *
 * Performs pure-logic JSON Schema inference from example data without
 * delegating to the babysitter process. Reads JSON input from stdin,
 * writes JSON output to stdout.
 *
 * Supports output formats: json-schema, typebox, zod, yup.
 * For json-schema the output is a schema object; for others it is a code string.
 */

import * as fs from 'node:fs';

interface GenerateInput {
  examples: unknown[];
  description: string;
  format: 'json-schema' | 'typebox' | 'zod' | 'yup';
}

interface GenerateOutput {
  schema: unknown;
  format: string;
}

interface InferredSchema {
  type: string;
  properties?: Record<string, InferredSchema>;
  required?: string[];
  items?: InferredSchema;
  enum?: unknown[];
  description?: string;
}

function main(): void {
  const raw = fs.readFileSync(0, 'utf-8');
  const input: GenerateInput = JSON.parse(raw);

  const inferred = inferSchema(input.examples);
  inferred.description = input.description;

  let schema: unknown;
  switch (input.format) {
    case 'json-schema':
      schema = toJsonSchema(inferred);
      break;
    case 'typebox':
      schema = toTypeBox(inferred);
      break;
    case 'zod':
      schema = toZod(inferred);
      break;
    case 'yup':
      schema = toYup(inferred);
      break;
    default:
      schema = toJsonSchema(inferred);
  }

  const output: GenerateOutput = { schema, format: input.format };
  process.stdout.write(JSON.stringify(output));
}

// ---------------------------------------------------------------------------
// Inference
// ---------------------------------------------------------------------------

function inferSchema(examples: unknown[]): InferredSchema {
  if (examples.length === 0) {
    return { type: 'object' };
  }

  const types = examples.map(detectType);
  const uniqueTypes = [...new Set(types)];

  // All examples share the same type
  if (uniqueTypes.length === 1) {
    const t = uniqueTypes[0];

    if (t === 'object') {
      return inferObjectSchema(examples as Record<string, unknown>[]);
    }
    if (t === 'array') {
      return inferArraySchema(examples as unknown[][]);
    }
    // Scalar — check for enum
    if (examples.length >= 2) {
      const unique = [...new Set(examples.map((e) => JSON.stringify(e)))];
      if (unique.length <= 10 && unique.length < examples.length) {
        return { type: t, enum: unique.map((u) => JSON.parse(u)) };
      }
    }
    return { type: t };
  }

  // Mixed types — pick the most common
  const counts = new Map<string, number>();
  for (const t of types) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  let bestType = 'string';
  let bestCount = 0;
  for (const [t, c] of counts) {
    if (c > bestCount) {
      bestType = t;
      bestCount = c;
    }
  }
  return { type: bestType };
}

function inferObjectSchema(examples: Record<string, unknown>[]): InferredSchema {
  // Collect all keys and their value sets
  const keyValues = new Map<string, unknown[]>();
  const keyCounts = new Map<string, number>();

  for (const obj of examples) {
    for (const [key, value] of Object.entries(obj)) {
      if (!keyValues.has(key)) keyValues.set(key, []);
      keyValues.get(key)!.push(value);
      keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    }
  }

  const properties: Record<string, InferredSchema> = {};
  const required: string[] = [];

  for (const [key, values] of keyValues) {
    properties[key] = inferSchema(values);
    // Required if present in every example
    if (keyCounts.get(key) === examples.length) {
      required.push(key);
    }
  }

  required.sort();

  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

function inferArraySchema(examples: unknown[][]): InferredSchema {
  const allItems = examples.flat();
  if (allItems.length === 0) {
    return { type: 'array', items: { type: 'string' } };
  }
  return { type: 'array', items: inferSchema(allItems) };
}

function detectType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value; // 'string' | 'number' | 'boolean' | 'object'
}

// ---------------------------------------------------------------------------
// JSON Schema output
// ---------------------------------------------------------------------------

function toJsonSchema(inferred: InferredSchema): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...inferred,
  };
  return schema;
}

// ---------------------------------------------------------------------------
// TypeBox output
// ---------------------------------------------------------------------------

function toTypeBox(inferred: InferredSchema): string {
  return `import { Type } from '@sinclair/typebox';\n\nconst Schema = ${typeBoxNode(inferred)};`;
}

function typeBoxNode(s: InferredSchema): string {
  if (s.enum) {
    const literals = s.enum.map((v) => `Type.Literal(${JSON.stringify(v)})`);
    return `Type.Union([${literals.join(', ')}])`;
  }

  switch (s.type) {
    case 'string':
      return 'Type.String()';
    case 'number':
      return 'Type.Number()';
    case 'boolean':
      return 'Type.Boolean()';
    case 'null':
      return 'Type.Null()';
    case 'array':
      return `Type.Array(${typeBoxNode(s.items ?? { type: 'string' })})`;
    case 'object': {
      if (!s.properties) return 'Type.Object({})';
      const entries = Object.entries(s.properties)
        .map(([k, v]) => `  ${k}: ${typeBoxNode(v)}`)
        .join(',\n');
      return `Type.Object({\n${entries}\n})`;
    }
    default:
      return 'Type.Unknown()';
  }
}

// ---------------------------------------------------------------------------
// Zod output
// ---------------------------------------------------------------------------

function toZod(inferred: InferredSchema): string {
  return `import { z } from 'zod';\n\nconst Schema = ${zodNode(inferred)};`;
}

function zodNode(s: InferredSchema): string {
  if (s.enum) {
    const literals = s.enum.map((v) => `z.literal(${JSON.stringify(v)})`);
    return `z.union([${literals.join(', ')}])`;
  }

  switch (s.type) {
    case 'string':
      return 'z.string()';
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'null':
      return 'z.null()';
    case 'array':
      return `z.array(${zodNode(s.items ?? { type: 'string' })})`;
    case 'object': {
      if (!s.properties) return 'z.object({})';
      const required = new Set(s.required ?? []);
      const entries = Object.entries(s.properties)
        .map(([k, v]) => {
          const base = zodNode(v);
          return `  ${k}: ${required.has(k) ? base : `${base}.optional()`}`;
        })
        .join(',\n');
      return `z.object({\n${entries}\n})`;
    }
    default:
      return 'z.unknown()';
  }
}

// ---------------------------------------------------------------------------
// Yup output
// ---------------------------------------------------------------------------

function toYup(inferred: InferredSchema): string {
  return `import * as yup from 'yup';\n\nconst Schema = ${yupNode(inferred)};`;
}

function yupNode(s: InferredSchema): string {
  if (s.enum) {
    return `yup.mixed().oneOf([${s.enum.map((v) => JSON.stringify(v)).join(', ')}])`;
  }

  switch (s.type) {
    case 'string':
      return 'yup.string()';
    case 'number':
      return 'yup.number()';
    case 'boolean':
      return 'yup.boolean()';
    case 'null':
      return 'yup.mixed().nullable()';
    case 'array':
      return `yup.array().of(${yupNode(s.items ?? { type: 'string' })})`;
    case 'object': {
      if (!s.properties) return 'yup.object({})';
      const required = new Set(s.required ?? []);
      const entries = Object.entries(s.properties)
        .map(([k, v]) => {
          const base = yupNode(v);
          return `  ${k}: ${required.has(k) ? `${base}.required()` : base}`;
        })
        .join(',\n');
      return `yup.object({\n${entries}\n})`;
    }
    default:
      return 'yup.mixed()';
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

main();
