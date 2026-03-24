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
  test("session:create --help shows usage information", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter session:create --help",
    );
    // --help may exit 0 or 1 depending on implementation; check output content
    expect(stdout).toContain("session:create");
    expect(stdout).toContain("prompt");
  });

  test("session:create without --prompt or --process returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter session:create --json 2>&1",
    );
    expect(exitCode).not.toBe(0);

    // Should indicate that required arguments are missing
    expect(stdout.toLowerCase()).toMatch(/prompt|process|error|missing/i);
  });

  test("session:create --help mentions agent or harness", () => {
    const { stdout } = dockerExecSafe(
      "babysitter session:create --help",
    );
    // Help output should reference harness or agent concepts
    expect(stdout.toLowerCase()).toMatch(/agent|harness/i);
  });

  test("session:create with nonexistent process file returns error", () => {
    const { stdout, exitCode } = dockerExecSafe(
      "babysitter session:create --process ./nonexistent.js --json 2>&1",
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
    test("session:create --prompt without --harness or --process returns error", () => {
      const { stdout, exitCode } = dockerExecSafe(
        'babysitter session:create --prompt "test session" --json',
      );
      // Without a harness or process, it should fail
      expect(exitCode).not.toBe(0);
    });
  },
);
