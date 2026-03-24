import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  dockerExecSafe,
  startContainer,
  stopContainer,
} from "./helpers";
import {
  createMockHarness,
  cleanupMockHarnesses,
} from "./helpers-harness";
import path from "path";

/**
 * Extract the last JSON object from multi-line CLI output.
 */
function parseLastJsonObject(output: string): unknown {
  const trimmed = output.trim();
  const lastBrace = trimmed.lastIndexOf("}");
  if (lastBrace === -1) throw new SyntaxError("No JSON object found in output");
  let depth = 0;
  for (let i = lastBrace; i >= 0; i--) {
    if (trimmed[i] === "}") depth++;
    if (trimmed[i] === "{") depth--;
    if (depth === 0) {
      return JSON.parse(trimmed.slice(i, lastBrace + 1));
    }
  }
  throw new SyntaxError("Unmatched braces in output");
}

const ROOT = path.resolve(__dirname, "../..");
const MOCK_HARNESS_NAME = "mock-test-harness";

beforeAll(() => {
  buildImage(ROOT);
  startContainer();
  createMockHarness("", MOCK_HARNESS_NAME, "mock harness output", 0);
}, 300_000);

afterAll(() => {
  cleanupMockHarnesses("", MOCK_HARNESS_NAME);
  stopContainer();
});

// ============================================================================
// Harness invoke E2E tests
// ============================================================================

describe("Harness invoke", () => {
  test("invoke non-existent harness returns error JSON", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter harness:invoke nonexistent-harness-xyz --prompt \"test\" --json 2>&1",
    );
    expect(exitCode).not.toBe(0);

    // Output should contain error information (may be JSON or text)
    const combined = stdout.toLowerCase();
    expect(combined).toMatch(/error|unknown/i);
  });

  test("invoke without --prompt returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter harness:invoke some-harness --json 2>&1",
    );
    expect(exitCode).not.toBe(0);

    // Should indicate that --prompt is required
    expect(stdout.toLowerCase()).toContain("prompt");
  });

  test("invoke without harness name returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter harness:invoke --json 2>&1",
    );
    expect(exitCode).not.toBe(0);

    // Should indicate that a harness name or argument is required
    const combined = stdout.toLowerCase();
    expect(combined).toMatch(/harness|argument|require/i);
  });
});
