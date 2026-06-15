import { describe, expect, it } from "vitest";
import { validateInput, validateOutput, validateAgainstSchema } from "../validator";
import type { MicroagentManifest, JSONSchema } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeManifest(
  inputSchema: JSONSchema,
  outputSchema: JSONSchema,
): MicroagentManifest {
  return {
    name: "test-agent",
    version: "1.0.0",
    description: "test",
    inputSchema,
    outputSchema,
    isolation: "subprocess",
    runtime: { entrypoint: "test.js" },
    tags: [],
    builtIn: false,
  };
}

// ---------------------------------------------------------------------------
// validateAgainstSchema — basic type checks
// ---------------------------------------------------------------------------

describe("validateAgainstSchema — type checks", () => {
  it("accepts a value matching the schema type", () => {
    const result = validateAgainstSchema({ type: "string" }, "hello");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a value with the wrong type", () => {
    const result = validateAgainstSchema({ type: "number" }, "not a number");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('expected type "number"');
  });

  it("validates boolean type", () => {
    expect(validateAgainstSchema({ type: "boolean" }, true).valid).toBe(true);
    expect(validateAgainstSchema({ type: "boolean" }, "true").valid).toBe(false);
  });

  it("validates array type", () => {
    expect(validateAgainstSchema({ type: "array" }, [1, 2]).valid).toBe(true);
    expect(validateAgainstSchema({ type: "array" }, "not array").valid).toBe(false);
  });

  it("distinguishes array from object", () => {
    expect(validateAgainstSchema({ type: "object" }, []).valid).toBe(false);
    expect(validateAgainstSchema({ type: "array" }, {}).valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateAgainstSchema — required fields
// ---------------------------------------------------------------------------

describe("validateAgainstSchema — required fields", () => {
  const schema: JSONSchema = {
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "number" },
    },
    required: ["name", "age"],
  };

  it("passes when all required fields are present", () => {
    const result = validateAgainstSchema(schema, { name: "Alice", age: 30 });
    expect(result.valid).toBe(true);
  });

  it("fails when a required field is missing", () => {
    const result = validateAgainstSchema(schema, { name: "Alice" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('"age"');
  });

  it("fails when multiple required fields are missing", () => {
    const result = validateAgainstSchema(schema, {});
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// validateAgainstSchema — nested objects and arrays
// ---------------------------------------------------------------------------

describe("validateAgainstSchema — nested structures", () => {
  it("validates nested object properties", () => {
    const schema: JSONSchema = {
      type: "object",
      properties: {
        meta: {
          type: "object",
          properties: {
            version: { type: "number" },
          },
          required: ["version"],
        },
      },
      required: ["meta"],
    };

    expect(validateAgainstSchema(schema, { meta: { version: 1 } }).valid).toBe(true);
    expect(validateAgainstSchema(schema, { meta: {} }).valid).toBe(false);
    expect(validateAgainstSchema(schema, { meta: { version: "nope" } }).valid).toBe(false);
  });

  it("validates array items", () => {
    const schema: JSONSchema = {
      type: "array",
      items: { type: "number" },
    };

    expect(validateAgainstSchema(schema, [1, 2, 3]).valid).toBe(true);

    const result = validateAgainstSchema(schema, [1, "two", 3]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("[1]");
  });
});

// ---------------------------------------------------------------------------
// validateAgainstSchema — enum
// ---------------------------------------------------------------------------

describe("validateAgainstSchema — enum", () => {
  it("accepts a value in the enum set", () => {
    const schema: JSONSchema = { type: "string", enum: ["a", "b", "c"] };
    expect(validateAgainstSchema(schema, "b").valid).toBe(true);
  });

  it("rejects a value not in the enum set", () => {
    const schema: JSONSchema = { type: "string", enum: ["a", "b", "c"] };
    const result = validateAgainstSchema(schema, "z");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("not in enum");
  });
});

// ---------------------------------------------------------------------------
// validateInput / validateOutput
// ---------------------------------------------------------------------------

describe("validateInput", () => {
  it("passes valid input against the manifest's inputSchema", () => {
    const manifest = makeManifest(
      { type: "object", properties: { x: { type: "string" } }, required: ["x"] },
      { type: "object" },
    );

    const result = validateInput(manifest, { x: "hello" });
    expect(result.valid).toBe(true);
  });

  it("fails when input violates the inputSchema", () => {
    const manifest = makeManifest(
      { type: "object", properties: { x: { type: "string" } }, required: ["x"] },
      { type: "object" },
    );

    const result = validateInput(manifest, { x: 42 });
    expect(result.valid).toBe(false);
  });
});

describe("validateOutput", () => {
  it("passes valid output against the manifest's outputSchema", () => {
    const manifest = makeManifest(
      { type: "object" },
      { type: "object", properties: { y: { type: "number" } }, required: ["y"] },
    );

    const result = validateOutput(manifest, { y: 42 });
    expect(result.valid).toBe(true);
  });

  it("fails when output violates the outputSchema", () => {
    const manifest = makeManifest(
      { type: "object" },
      { type: "object", properties: { y: { type: "number" } }, required: ["y"] },
    );

    const result = validateOutput(manifest, {});
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('"y"');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("validateAgainstSchema — edge cases", () => {
  it("handles null when type is not null", () => {
    const result = validateAgainstSchema({ type: "string" }, null);
    expect(result.valid).toBe(false);
  });

  it("handles undefined when type is not null", () => {
    const result = validateAgainstSchema({ type: "object" }, undefined);
    expect(result.valid).toBe(false);
  });

  it("allows null when type is null", () => {
    const result = validateAgainstSchema({ type: "null" }, null);
    expect(result.valid).toBe(true);
  });

  it("allows extra properties not in schema", () => {
    const schema: JSONSchema = {
      type: "object",
      properties: { x: { type: "string" } },
      required: ["x"],
    };
    const result = validateAgainstSchema(schema, { x: "hi", extra: true });
    expect(result.valid).toBe(true);
  });
});
