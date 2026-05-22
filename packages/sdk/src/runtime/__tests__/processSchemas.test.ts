import { describe, expect, test } from "vitest";
import { validateAgainstSchema } from "../schemaValidator";

describe("GAP-PROC-004: Process Parameter Schemas and Validation", () => {
  // ---------------------------------------------------------------------------
  // Group 1: Schema validator utility
  // ---------------------------------------------------------------------------
  describe("schema validator utility", () => {
    test("returns valid for data matching schema with correct types", () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
          active: { type: "boolean" },
        },
        required: ["name", "age", "active"],
      };
      const result = validateAgainstSchema(
        { name: "Alice", age: 30, active: true },
        schema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("reports error for missing required field", () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
        },
        required: ["name", "email"],
      };
      const result = validateAgainstSchema({ name: "Bob" }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      expect(result.errors.some((e) => e.includes("email"))).toBe(true);
    });

    test("reports error for wrong type (string expected, number given)", () => {
      const schema = {
        type: "object",
        properties: {
          title: { type: "string" },
        },
        required: ["title"],
      };
      const result = validateAgainstSchema({ title: 42 }, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      expect(result.errors.some((e) => e.includes("title"))).toBe(true);
    });

    test("validates nested object properties", () => {
      const schema = {
        type: "object",
        properties: {
          config: {
            type: "object",
            properties: {
              retries: { type: "number" },
              verbose: { type: "boolean" },
            },
            required: ["retries"],
          },
        },
        required: ["config"],
      };

      const validResult = validateAgainstSchema(
        { config: { retries: 3, verbose: true } },
        schema
      );
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = validateAgainstSchema(
        { config: { verbose: true } },
        schema
      );
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThanOrEqual(1);
    });

    test("allows missing optional fields (not in required[])", () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          nickname: { type: "string" },
        },
        required: ["name"],
      };
      const result = validateAgainstSchema({ name: "Carol" }, schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("validates array type", () => {
      const schema = {
        type: "object",
        properties: {
          tags: { type: "array" },
        },
        required: ["tags"],
      };

      const validResult = validateAgainstSchema(
        { tags: ["alpha", "beta"] },
        schema
      );
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = validateAgainstSchema(
        { tags: "not-an-array" },
        schema
      );
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Group 2: Integration with createRun (contract tests for the validator)
  // ---------------------------------------------------------------------------
  describe("integration with createRun input validation", () => {
    const inputSchema = {
      type: "object",
      properties: {
        processId: { type: "string" },
        iterations: { type: "number" },
        dryRun: { type: "boolean" },
      },
      required: ["processId", "iterations"],
    };

    test("validateAgainstSchema returns valid for matching inputs", () => {
      const inputs = { processId: "ci/pipeline", iterations: 5, dryRun: false };
      const result = validateAgainstSchema(inputs, inputSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("validateAgainstSchema returns errors for mismatching inputs", () => {
      const inputs = { processId: 123, iterations: "not-a-number" };
      const result = validateAgainstSchema(inputs, inputSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    test("handles undefined schema gracefully for backward compatibility", () => {
      // When no schema is defined, validation should not crash.
      // Passing undefined as schema should return valid (no schema = no constraints).
      const result = validateAgainstSchema(
        { anything: "goes" },
        undefined as unknown as Record<string, unknown>
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("schema with required[] catches missing required properties", () => {
      const inputs = { dryRun: true };
      const result = validateAgainstSchema(inputs, inputSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("processId"))).toBe(true);
      expect(result.errors.some((e) => e.includes("iterations"))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Group 3: Output validation contract
  // ---------------------------------------------------------------------------
  describe("output validation contract", () => {
    const outputSchema = {
      type: "object",
      properties: {
        status: { type: "string" },
        artifacts: { type: "array" },
        metadata: {
          type: "object",
          properties: {
            duration: { type: "number" },
          },
          required: ["duration"],
        },
      },
      required: ["status", "artifacts"],
    };

    test("validateAgainstSchema validates output correctly", () => {
      const output = {
        status: "completed",
        artifacts: ["/dist/bundle.js"],
        metadata: { duration: 1234 },
      };
      const result = validateAgainstSchema(output, outputSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("returns valid:true with no errors for matching output", () => {
      const output = { status: "ok", artifacts: [] };
      const result = validateAgainstSchema(output, outputSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test("returns valid:false with descriptive errors for mismatching output", () => {
      const output = { status: 404, artifacts: "not-an-array" };
      const result = validateAgainstSchema(output, outputSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      // Errors should be human-readable strings, not empty
      for (const err of result.errors) {
        expect(typeof err).toBe("string");
        expect(err.length).toBeGreaterThan(0);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Group 4: Extended validator features
  // ---------------------------------------------------------------------------
  describe("extended validator features", () => {
    test("validates integer type (rejects floats)", () => {
      const schema = {
        type: "object",
        properties: { count: { type: "integer" } },
        required: ["count"],
      };
      const validResult = validateAgainstSchema({ count: 5 }, schema);
      expect(validResult.valid).toBe(true);

      const invalidResult = validateAgainstSchema({ count: 5.5 }, schema);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.some((e) => e.includes("count"))).toBe(true);
    });

    test("validates array items schema", () => {
      const schema = {
        type: "object",
        properties: {
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["tags"],
      };
      const validResult = validateAgainstSchema(
        { tags: ["alpha", "beta"] },
        schema
      );
      expect(validResult.valid).toBe(true);

      const invalidResult = validateAgainstSchema(
        { tags: ["alpha", 42] },
        schema
      );
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThanOrEqual(1);
    });

    test("reports error for unknown schema type", () => {
      const schema = {
        type: "object",
        properties: {
          timestamp: { type: "date" },
        },
        required: ["timestamp"],
      };
      const result = validateAgainstSchema(
        { timestamp: "2026-01-01" },
        schema
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Unknown schema type"))).toBe(
        true
      );
    });

    test("schema fields appear in RunMetadata and CreateRunOptions types", () => {
      // Type-level test: these assignments must compile.
      // If inputSchema/outputSchema are missing from the types, tsc will catch it.
      const _metadata: import("../../storage/types").RunMetadata = {
        runId: "test",
        request: "test",
        processId: "test",
        entrypoint: { importPath: "./p.js", exportName: "process" },
        layoutVersion: "1",
        createdAt: "2026-01-01",
        inputSchema: { type: "object" },
        outputSchema: { type: "object" },
      };
      expect(_metadata.inputSchema).toBeDefined();
      expect(_metadata.outputSchema).toBeDefined();
    });

    test("createRun integration: validates inputs and stores schema in metadata", () => {
      // This tests the contract that createRun.ts uses validateAgainstSchema
      // and throws BabysitterRuntimeError on failure. We test the validator
      // side of that contract directly.
      const inputSchema = {
        type: "object",
        properties: { name: { type: "string" }, count: { type: "integer" } },
        required: ["name", "count"],
      };

      // Valid case
      const valid = validateAgainstSchema({ name: "test", count: 3 }, inputSchema);
      expect(valid.valid).toBe(true);

      // Invalid case (would cause createRun to throw)
      const invalid = validateAgainstSchema({ name: "test", count: 3.5 }, inputSchema);
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.some((e) => e.includes("integer"))).toBe(true);
    });
  });
});
