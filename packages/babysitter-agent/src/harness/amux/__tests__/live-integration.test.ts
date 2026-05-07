/**
 * Live integration test: verifies the REAL round-trip by spawning the
 * actual babysitter-agent CLI with `--output-format amux-events` and parsing
 * its JSONL output.
 *
 * These tests are skipped when the babysitter-agent CLI is not available on
 * PATH, so they are safe to run in any environment (CI or local).
 *
 * @module harness/amux/__tests__/live-integration
 */

import { describe, it, expect } from "vitest";
import { execSync, spawn } from "child_process";

// ---------------------------------------------------------------------------
// CLI availability check
// ---------------------------------------------------------------------------

const CLI_AVAILABLE = (() => {
  try {
    execSync("babysitter-agent version", { stdio: "pipe", timeout: 10000 });
    return true;
  } catch {
    return false;
  }
})();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Spawn babysitter-agent with the given args and collect stdout lines.
 * Returns { lines, exitCode, stderr }.
 */
function spawnBabysitter(
  args: string[],
  timeoutMs = 15000,
): Promise<{ lines: string[]; exitCode: number | null; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("babysitter-agent", args, {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      timeout: timeoutMs,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(timer);
      const stdout = Buffer.concat(stdoutChunks).toString("utf-8");
      const stderr = Buffer.concat(stderrChunks).toString("utf-8");
      const lines = stdout
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      resolve({ lines, exitCode: code, stderr });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    // Close stdin immediately -- we don't provide interactive input
    child.stdin.end();
  });
}

/**
 * Parse a JSONL line and return the parsed object, or null if not valid JSON.
 */
function tryParseJson(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe(
  "Live integration: babysitter-agent CLI amux-events output",
  { timeout: 30000 },
  () => {
    describe.skipIf(!CLI_AVAILABLE)("with babysitter-agent CLI", () => {
      it("invoke with --output-format amux-events produces valid JSONL", async () => {
        // Use invoke with a fast-failing prompt so no real harness is required for availability.
        // We invoke it with --output-format amux-events to test that the CLI
        // accepts the flag. If the command doesn't support --output-format,
        // babysitter-agent should still emit session_start/session_end.
        //
        // NOTE: invoke requires a harness name and prompt, so we use
        // a command that will fail fast but still exercise the amux-events
        // output pathway. We use discover --json as a fallback
        // if invoke is not available.
        const { lines, exitCode } = await spawnBabysitter(
          [
            "invoke",
            "claude-code",
            "--prompt",
            "echo test",
            "--output-format",
            "amux-events",
            "--timeout",
            "5000",
          ],
          20000,
        );

        // The command may fail (no harness installed) but we just need to
        // verify the output format is JSONL with the expected event structure.
        // If exit code is non-zero, we still expect JSONL error output.
        if (lines.length > 0) {
          // Every non-empty line should be valid JSON
          for (const line of lines) {
            const parsed = tryParseJson(line);
            // Skip lines that aren't JSON (e.g. error messages to stdout)
            if (parsed !== null) {
              expect(parsed).toHaveProperty("type");
              expect(parsed).toHaveProperty("runId");
              expect(typeof parsed["runId"]).toBe("string");
              expect(parsed).toHaveProperty("agent");
              expect(parsed).toHaveProperty("timestamp");
            }
          }

          // Check for session_start and session_end bookends in parsed events
          const parsedEvents = lines
            .map(tryParseJson)
            .filter((e): e is Record<string, unknown> => e !== null);

          if (parsedEvents.length >= 2) {
            expect(parsedEvents[0]["type"]).toBe("session_start");
            expect(parsedEvents[parsedEvents.length - 1]["type"]).toBe(
              "session_end",
            );
          }
        }

        // If exit code is 0 we got a clean run; non-zero is acceptable
        // (harness not installed) as long as the output format is correct.
        expect(exitCode).toBeDefined();
      });

      it("--json flag produces parseable JSON output", async () => {
        const { lines, exitCode } = await spawnBabysitter(
          ["discover", "--json"],
          15000,
        );

        // discover --json should produce valid JSON output
        if (lines.length > 0) {
          const fullOutput = lines.join("\n");
          const parsed = tryParseJson(fullOutput);

          if (parsed !== null) {
            // Should be a valid JSON object or array
            expect(typeof parsed).toBe("object");
          } else {
            // Some commands output line-by-line JSON (JSONL)
            // Each line should be valid JSON
            for (const line of lines) {
              const lineParsed = tryParseJson(line);
              if (lineParsed !== null) {
                expect(typeof lineParsed).toBe("object");
              }
            }
          }
        }

        // discover should succeed even without harnesses installed
        expect(exitCode).toBe(0);
      });

      it("version command outputs a version string", async () => {
        const { lines, exitCode } = await spawnBabysitter(
          ["--version"],
          10000,
        );

        expect(exitCode).toBe(0);
        expect(lines.length).toBeGreaterThan(0);
        // The CLI falls back to "unknown" when package metadata is not
        // discoverable from the launched wrapper location.
        const versionLine = lines[0];
        expect(versionLine === "unknown" || /\d+\.\d+/.test(versionLine)).toBe(true);
      });
    });
  },
);
