import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  dockerExec,
  dockerExecSafe,
  PLUGIN_DIR,
  startContainer,
  stopContainer,
} from "./helpers-github";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const LOG_DIR = "/tmp/github-hook-test-logs";

// GitHub Copilot hooks use COPILOT_PLUGIN_DIR to locate the plugin root
const HOOK_ENV = `COPILOT_PLUGIN_DIR=${PLUGIN_DIR} BABYSITTER_LOG_DIR=${LOG_DIR} CLI=babysitter`;

beforeAll(() => {
  buildImage(ROOT);
  startContainer();
  dockerExec(`mkdir -p ${LOG_DIR}`);
}, 300_000);

afterAll(() => {
  stopContainer();
});

afterEach(() => {
  dockerExec(
    `rm -rf ${LOG_DIR}/* /tmp/github-hook-test-* 2>/dev/null || true`,
  );
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run a hook script with JSON input piped via stdin. */
function runHook(
  hookName: string,
  jsonInput: string,
): { stdout: string; exitCode: number } {
  const inputFile = `/tmp/github-hook-test-input-${Date.now()}.json`;
  const escaped = jsonInput.replace(/'/g, "'\\''");
  const hookPath = `${PLUGIN_DIR}/hooks/${hookName}`;
  const cmd = [
    `printf '%s' '${escaped}' > ${inputFile}`,
    `${HOOK_ENV} bash ${hookPath} < ${inputFile}; echo "EXIT_CODE=$?"`,
    `rm -f ${inputFile}`,
  ].join(" ; ");

  const { stdout, exitCode: rawExitCode } = dockerExecSafe(cmd);
  const lines = stdout.split("\n");
  const exitLine = lines.find((l) => l.startsWith("EXIT_CODE="));
  const exitCode = exitLine ? parseInt(exitLine.split("=")[1], 10) : rawExitCode;
  const output = lines
    .filter((l) => !l.startsWith("EXIT_CODE="))
    .join("\n")
    .trim();

  return { stdout: output, exitCode };
}

// ---------------------------------------------------------------------------
// sessionStart hook
// ---------------------------------------------------------------------------

describe("sessionStart hook (GitHub)", () => {
  test("runs without error given valid JSON input", () => {
    const input = JSON.stringify({
      session_id: `test-session-${Date.now()}`,
      cwd: "/workspace",
    });
    const { exitCode } = runHook("session-start.sh", input);
    expect(exitCode).toBe(0);
  });

  test("creates log output", () => {
    const input = JSON.stringify({
      session_id: `test-session-log-${Date.now()}`,
      cwd: "/workspace",
    });
    runHook("session-start.sh", input);

    // Check that a log file was created
    const { exitCode } = dockerExecSafe(
      `test -f ${LOG_DIR}/babysitter-session-start-hook.log`,
    );
    expect(exitCode).toBe(0);
  });

  test("handles empty JSON input", () => {
    const { exitCode } = runHook("session-start.sh", "{}");
    // Should not crash; exit code 0 means success
    expect(exitCode).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// sessionEnd hook
// ---------------------------------------------------------------------------

describe("sessionEnd hook (GitHub)", () => {
  test("runs without error (output ignored by Copilot)", () => {
    const input = JSON.stringify({
      session_id: `test-session-end-${Date.now()}`,
    });
    const { exitCode } = runHook("session-end.sh", input);
    // sessionEnd always exits 0 (output is ignored by Copilot CLI)
    expect(exitCode).toBe(0);
  });

  test("handles empty JSON input", () => {
    const { exitCode } = runHook("session-end.sh", "{}");
    expect(exitCode).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// userPromptSubmitted hook
// ---------------------------------------------------------------------------

describe("userPromptSubmitted hook (GitHub)", () => {
  test("runs without error (output ignored by Copilot)", () => {
    const input = JSON.stringify({
      session_id: `test-prompt-${Date.now()}`,
      prompt: "test user prompt",
    });
    const { exitCode } = runHook("user-prompt-submitted.sh", input);
    // userPromptSubmitted always exits 0 (output is ignored by Copilot CLI)
    expect(exitCode).toBe(0);
  });

  test("handles empty JSON input", () => {
    const { exitCode } = runHook("user-prompt-submitted.sh", "{}");
    expect(exitCode).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Cross-hook integration
// ---------------------------------------------------------------------------

describe("Hook integration (GitHub)", () => {
  test("session lifecycle: start then end runs cleanly", () => {
    const sessionId = `lifecycle-${Date.now()}`;
    const startInput = JSON.stringify({
      session_id: sessionId,
      cwd: "/workspace",
    });
    const endInput = JSON.stringify({
      session_id: sessionId,
    });

    const startResult = runHook("session-start.sh", startInput);
    expect(startResult.exitCode).toBe(0);

    const endResult = runHook("session-end.sh", endInput);
    expect(endResult.exitCode).toBe(0);
  });

  test("all hooks handle missing fields gracefully", () => {
    // Minimal JSON with no recognized fields
    const minimalInput = JSON.stringify({ _test: true });

    const startResult = runHook("session-start.sh", minimalInput);
    expect(startResult.exitCode).toBe(0);

    const endResult = runHook("session-end.sh", minimalInput);
    expect(endResult.exitCode).toBe(0);

    const promptResult = runHook("user-prompt-submitted.sh", minimalInput);
    expect(promptResult.exitCode).toBe(0);
  });
});
