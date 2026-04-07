/**
 * Lightweight JSON Schema validator for process input/output schemas.
 * Supports a subset of JSON Schema draft-07: type checks (string, number,
 * boolean, array, object), required fields, and nested object properties.
 * No external dependencies.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate data against a JSON Schema (subset).
 * If schema is undefined/null, returns valid (no constraints).
 */
export function validateAgainstSchema(
  data: unknown,
  schema: Record<string, unknown> | undefined | null,
  _path = "",
): ValidationResult {
  const errors: string[] = [];

  // No schema = no constraints (backward compat)
  if (!schema) {
    return { valid: true, errors: [] };
  }

  const schemaType = schema.type as string | undefined;

  // Type check at current level
  if (schemaType) {
    const typeError = checkType(data, schemaType, _path);
    if (typeError) {
      errors.push(typeError);
      return { valid: false, errors };
    }
  }

  // Array items validation
  if (schemaType === "array" && Array.isArray(data) && schema.items) {
    const itemSchema = schema.items as Record<string, unknown>;
    for (let i = 0; i < (data as unknown[]).length; i++) {
      const itemPath = _path ? `${_path}[${i}]` : `[${i}]`;
      const nested = validateAgainstSchema((data as unknown[])[i], itemSchema, itemPath);
      errors.push(...nested.errors);
    }
  }

  // Object-level validation: required fields and properties
  if (schemaType === "object" && typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    const required = (schema.required as string[]) ?? [];
    const properties = (schema.properties as Record<string, Record<string, unknown>>) ?? {};

    // Check required fields
    for (const field of required) {
      if (!(field in obj)) {
        const fieldPath = _path ? `${_path}.${field}` : field;
        errors.push(`Missing required field: ${fieldPath}`);
      }
    }

    // Validate property types for present fields
    for (const [key, propSchema] of Object.entries(properties)) {
      if (key in obj) {
        const fieldPath = _path ? `${_path}.${key}` : key;
        const nested = validateAgainstSchema(obj[key], propSchema, fieldPath);
        errors.push(...nested.errors);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function checkType(
  value: unknown,
  expectedType: string,
  path: string,
): string | null {
  const label = path || "root";
  switch (expectedType) {
    case "string":
      if (typeof value !== "string")
        return `Expected ${label} to be string, got ${typeof value}`;
      break;
    case "number":
      if (typeof value !== "number")
        return `Expected ${label} to be number, got ${typeof value}`;
      break;
    case "integer":
      if (typeof value !== "number" || !Number.isInteger(value))
        return `Expected ${label} to be integer, got ${typeof value === "number" ? "float" : typeof value}`;
      break;
    case "boolean":
      if (typeof value !== "boolean")
        return `Expected ${label} to be boolean, got ${typeof value}`;
      break;
    case "array":
      if (!Array.isArray(value))
        return `Expected ${label} to be array, got ${typeof value}`;
      break;
    case "object":
      if (typeof value !== "object" || value === null || Array.isArray(value))
        return `Expected ${label} to be object, got ${Array.isArray(value) ? "array" : typeof value}`;
      break;
    default:
      return `Unknown schema type "${expectedType}" at ${label}`;
  }
  return null;
}
