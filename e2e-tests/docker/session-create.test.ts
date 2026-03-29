import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  dockerExec,
  dockerExecSafe,
  startContainer,
  stopContainer,
} from "./helpers";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildImage(ROOT);
  startContainer();
}, 300_000);

afterAll(() => {
  stopContainer();
});

// ============================================================================
// Session create E2E tests
// ============================================================================

describe("Session create CLI", () => {
  test("harness:create-run --help shows usage information", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter harness:create-run --help",
    );
    // --help may exit 0 or 1 depending on implementation; check output content
    expect(stdout).toContain("harness:create-run");
    expect(stdout).toContain("prompt");
  });

  test("harness:create-run without --prompt or --process returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter harness:create-run --json 2>&1",
    );
    expect(exitCode).not.toBe(0);

    // Should indicate that required arguments are missing
    expect(stdout.toLowerCase()).toMatch(/prompt|process|error|missing/i);
  });

  test("harness:create-run --help mentions agent or harness", () => {
    const { stdout } = dockerExecSafe(
      "babysitter harness:create-run --help",
    );
    // Help output should reference harness or agent concepts
    expect(stdout.toLowerCase()).toMatch(/agent|harness/i);
  });

  test("harness:create-run with nonexistent process file returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter harness:create-run --process ./nonexistent.js --json 2>&1",
    );
    expect(exitCode).not.toBe(0);

    // Should indicate the process file was not found or is invalid
    expect(stdout.toLowerCase()).toMatch(/not found|no such|error|missing|exist/i);
  });
});

// ============================================================================
// API-gated session create tests (require ANTHROPIC_API_KEY)
// ============================================================================

describe.skipIf(!process.env.ANTHROPIC_API_KEY)(
  "Session create with API key",
  () => {
    test("harness:create-run --prompt without --harness or --process returns error", () => {
      const { stdout, exitCode } = dockerExecSafe(
        'babysitter harness:create-run --prompt "test session" --json',
      );
      // Without a harness or process, it should fail
      expect(exitCode).not.toBe(0);
    });
  },
);
