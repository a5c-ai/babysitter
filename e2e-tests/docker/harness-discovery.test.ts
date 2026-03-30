import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  dockerExec,
  startContainer,
  stopContainer,
} from "./helpers";
import path from "path";

/**
 * Extract the last JSON array from multi-line CLI output.
 * Finds the last `[...]` block across multiple lines.
 */
function parseLastJsonArray(output: string): unknown[] {
  const trimmed = output.trim();
  const lastBracket = trimmed.lastIndexOf("]");
  if (lastBracket === -1) throw new SyntaxError("No JSON array found in output");
  let depth = 0;
  for (let i = lastBracket; i >= 0; i--) {
    if (trimmed[i] === "]") depth++;
    if (trimmed[i] === "[") depth--;
    if (depth === 0) {
      return JSON.parse(trimmed.slice(i, lastBracket + 1)) as unknown[];
    }
  }
  throw new SyntaxError("Unmatched brackets in output");
}

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildImage(ROOT);
  startContainer();
}, 300_000);

afterAll(() => {
  stopContainer();
});

// ============================================================================
// Harness discovery E2E tests
// ============================================================================

describe("Harness discovery", () => {
  test("babysitter harness:discover --json returns valid JSON array", () => {
    const out = dockerExec("babysitter harness:discover --json").trim();
    const results = parseLastJsonArray(out);
    expect(Array.isArray(results)).toBe(true);
  });

  test("each discovered harness has required fields", () => {
    const out = dockerExec("babysitter harness:discover --json").trim();
    const results = parseLastJsonArray(out) as Array<Record<string, unknown>>;
    expect(results.length).toBeGreaterThan(0);

    for (const harness of results) {
      expect(harness).toHaveProperty("name");
      expect(typeof harness.name).toBe("string");
      expect(harness).toHaveProperty("installed");
      expect(typeof harness.installed).toBe("boolean");
      expect(harness).toHaveProperty("cliCommand");
      expect(typeof harness.cliCommand).toBe("string");
      expect(harness).toHaveProperty("capabilities");
      expect(typeof harness.capabilities).toBe("object");
    }
  });

  test("harness:list --json returns same structure as harness:discover", () => {
    const discoverOut = dockerExec("babysitter harness:discover --json").trim();
    const discoverResults = parseLastJsonArray(discoverOut) as Array<Record<string, unknown>>;

    const listOut = dockerExec("babysitter harness:list --json").trim();
    const listResults = parseLastJsonArray(listOut) as Array<Record<string, unknown>>;

    expect(Array.isArray(listResults)).toBe(true);
    expect(listResults.length).toBe(discoverResults.length);

    // Both should return harnesses with the same names
    const discoverNames = discoverResults.map((h) => h.name).sort();
    const listNames = listResults.map((h) => h.name).sort();
    expect(listNames).toEqual(discoverNames);
  });

  test("discovered harnesses include known built-in harnesses", () => {
    const out = dockerExec("babysitter harness:discover --json").trim();
    const results = parseLastJsonArray(out) as Array<Record<string, unknown>>;
    const names = results.map((h) => h.name);

    // At minimum, the pi harness should be present (verified in pi-harness tests)
    expect(names).toContain("pi");
  });

  test("discovery results include oh-my-pi harness", () => {
    const out = dockerExec("babysitter harness:discover --json").trim();
    const results = parseLastJsonArray(out) as Array<Record<string, unknown>>;
    const names = results.map((h) => h.name);

    // oh-my-pi should appear in results even if not installed
    expect(names).toContain("oh-my-pi");

    const omp = results.find((h) => h.name === "oh-my-pi");
    expect(omp).toBeDefined();
    expect(typeof omp!.installed).toBe("boolean");
  });

  test("each discovered harness has configFound field", () => {
    const out = dockerExec("babysitter harness:discover --json").trim();
    const results = parseLastJsonArray(out) as Array<Record<string, unknown>>;
    expect(results.length).toBeGreaterThan(0);

    for (const harness of results) {
      expect(harness).toHaveProperty("configFound");
      expect(typeof harness.configFound).toBe("boolean");
    }
  });
});
