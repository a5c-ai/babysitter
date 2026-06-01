import { describe, expect, test } from "vitest";
import {
  normalizeForwardFixMetadata,
  collectForwardFixDiagnostics,
} from "../forwardFixStrikes";

describe("forward-fix metadata contract", () => {
  test("normalizes explicit bugClass, attempt status, and instrumentation_only without dropping arbitrary metadata", () => {
    const metadata = normalizeForwardFixMetadata({
      bugClass: "scheduler-precedence",
      attemptStatus: "failed",
      instrumentation_only: true,
      arbitrary: { keep: true },
    });

    expect(metadata).toEqual({
      bugClass: "scheduler-precedence",
      attemptStatus: "failed",
      instrumentation_only: true,
      arbitrary: { keep: true },
    });
  });

  test("accepts nested forwardFix metadata while preserving top-level arbitrary metadata", () => {
    const metadata = normalizeForwardFixMetadata({
      owner: "runtime",
      forwardFix: {
        bugClass: "mcp-g3",
        attemptStatus: "succeeded",
        instrumentation_only: false,
      },
    });

    expect(metadata).toEqual({
      owner: "runtime",
      forwardFix: {
        bugClass: "mcp-g3",
        attemptStatus: "succeeded",
        instrumentation_only: false,
      },
      bugClass: "mcp-g3",
      attemptStatus: "succeeded",
      instrumentation_only: false,
    });
  });

  test("leaves unrelated metadata and absent forward-fix metadata compatible", () => {
    expect(normalizeForwardFixMetadata({ arbitrary: "value" })).toEqual({ arbitrary: "value" });
    expect(normalizeForwardFixMetadata(undefined)).toBeUndefined();
  });

  test("diagnoses intended forward-fix metadata that omits bugClass", () => {
    const diagnostics = collectForwardFixDiagnostics({
      forwardFix: {
        attemptStatus: "failed",
        instrumentation_only: false,
      },
    });

    expect(diagnostics).toContainEqual({
      code: "missing_bugClass",
      message: expect.stringContaining("bugClass"),
    });
  });
});
