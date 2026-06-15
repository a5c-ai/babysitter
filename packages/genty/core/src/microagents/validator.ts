/**
 * Lightweight JSON Schema validator for microagent I/O.
 *
 * Validates required fields and basic type matching without pulling
 * in any external schema validation library.
 */

import type { JSONSchema, MicroagentManifest, ValidationResult } from "./types";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Validate an input payload against a manifest's inputSchema. */
export function validateInput(
  manifest: MicroagentManifest,
  input: unknown,
): ValidationResult {
  return validateAgainstSchema(manifest.inputSchema, input, "input");
}

/** Validate an output payload against a manifest's outputSchema. */
export function validateOutput(
  manifest: MicroagentManifest,
  output: unknown,
): ValidationResult {
  return validateAgainstSchema(manifest.outputSchema, output, "output");
}

/** Validate an arbitrary value against a JSONSchema. */
export function validateAgainstSchema(
  schema: JSONSchema,
  value: unknown,
  path: string = "$",
): ValidationResult {
  const errors: string[] = [];
  validate(schema, value, path, errors);
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Internal recursive validator
// ---------------------------------------------------------------------------

function validate(
  schema: JSONSchema,
  value: unknown,
  path: string,
  errors: string[],
): void {
  // --- null / undefined ---
  if (value === undefined || value === null) {
    // null/undefined can only satisfy type "null" (or if the schema has no
    // type constraint at all, which we allow).
    if (schema.type && schema.type !== "null") {
      errors.push(`${path}: expected type "${schema.type}" but got ${value === null ? "null" : "undefined"}`);
    }
    return;
  }

  // --- type check ---
  if (schema.type) {
    if (!typeMatches(schema.type, value)) {
      errors.push(`${path}: expected type "${schema.type}" but got "${actualType(value)}"`);
      return; // no point checking deeper
    }
  }

  // --- enum ---
  if (schema.enum) {
    if (!schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
      errors.push(`${path}: value ${JSON.stringify(value)} is not in enum ${JSON.stringify(schema.enum)}`);
    }
  }

  // --- object properties & required ---
  if (schema.type === "object" && schema.properties && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;

    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in obj)) {
          errors.push(`${path}: missing required property "${key}"`);
        }
      }
    }

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in obj) {
        validate(propSchema, obj[key], `${path}.${key}`, errors);
      }
    }
  }

  // --- array items ---
  if (schema.type === "array" && schema.items && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      validate(schema.items, value[i], `${path}[${i}]`, errors);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function typeMatches(schemaType: string, value: unknown): boolean {
  switch (schemaType) {
    case "string":
      return typeof value === "string";
    case "number":
    case "integer":
      return typeof value === "number";
    case "boolean":
      return typeof value === "boolean";
    case "object":
      return typeof value === "object" && !Array.isArray(value) && value !== null;
    case "array":
      return Array.isArray(value);
    case "null":
      return value === null;
    default:
      // Unknown type — allow through
      return true;
  }
}

function actualType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}
