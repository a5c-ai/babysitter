import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import {
  buildCursorImage,
  CURSOR_PLUGIN_DIR,
  dockerExec,
  dockerExecSafe,
  startCursorContainer,
  stopCursorContainer,
} from "./helpers-cursor";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const HOOK = `${CURSOR_PLUGIN_DIR}/hooks/stop-hook.sh`;
// The stop hook resolves STATE_DIR from BABYSITTER_STATE_DIR or PWD/.a5c
const STATE_DIR = "/tmp/cursor-hook-test-state";
const LOG_DIR = "/tmp/cursor-hook-test-logs";
const HOOK_ENV = `CURSOR_PLUGIN_ROOT=${CURSOR_PLUGIN_DIR} BABYSITTER_STATE_DIR=${STATE_DIR} BABYSITTER_LOG_DIR=${LOG_DIR} CLI=babysitter`;

beforeAll(() => {
  buildCursorImage(ROOT);
  startCursorContainer();
  dockerExec(`mkdir -p ${STATE_DIR} ${LOG_DIR}`);
}, 300_000);

afterAll(() => {
  stopCursorContainer();
});

afterEach(() => {
  dockerExec(
    `rm -rf ${STATE_DIR}/* ${LOG_DIR}/* /tmp/cursor-hook-test-run-* /tmp/cursor-hook-transcript-* /tmp/cursor-hook-input-* 2>/dev/null || true`,
  );
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Write a hook input file and run the stop hook, reading from that file. */
function runHook(
  sessionId: string,
  transcriptPath: string,
): { stdout: string; exitCode: number } {
  const inputFile = `/tmp/cursor-hook-input-${Date.now()}.json`;
  const inputJson = JSON.stringify({
    session_id: sessionId,
    transcript_path: transcriptPath,
  });

  const cmd = [
    `printf '%s' '${inputJson.replace(/'/g, "'\\''")}' > ${inputFile}`,
    `${HOOK_ENV} bash ${HOOK} < ${inputFile}; echo "EXIT_CODE=$?"`,
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

/** Pipe arbitrary JSON to the stop hook. */
function runHookRaw(jsonInput: string): { stdout: string; exitCode: number } {
  const inputFile = `/tmp/cursor-hook-input-raw-${Date.now()}.json`;
  const escaped = jsonInput.replace(/'/g, "'\\''");
  const cmd = [
    `printf '%s' '${escaped}' > ${inputFile}`,
    `${HOOK_ENV} bash ${HOOK} < ${inputFile}; echo "EXIT_CODE=$?"`,
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

/** Extract a JSON object from multi-line hook output. */
function parseJsonBlock(
  output: string,
): Record<string, unknown> | undefined {
  try {
    return JSON.parse(output);
  } catch {
    const match = output.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

/** Create a mock JSONL transcript file inside the container. */
function createTranscript(filePath: string, text: string): void {
  const line = JSON.stringify({
    role: "assistant",
    message: { content: [{ type: "text", text }] },
  });
  dockerExec(
    `printf '%s\\n' '${line.replace(/'/g, "'\\''")}' > ${filePath}`,
  );
}

/**
 * Create a mock run directory with journal events inside the container.
 * Returns the path to the run directory.
 */
function createMockRun(
  runId: string,
  events: Array<{ type: string; data: Record<string, unknown> }>,
): string {
  const runDir = `/tmp/cursor-hook-test-run-${runId}-${Date.now()}`;
  dockerExec(`mkdir -p ${runDir}/journal ${runDir}/state ${runDir}/tasks`);

  const runJson = JSON.stringify({ runId, processId: "test-process" });
  dockerExec(
    `printf '%s' '${runJson.replace(/'/g, "'\\''")}' > ${runDir}/run.json`,
  );

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const seq = i + 1;
    const seqStr = String(seq).padStart(6, "0");
    const ulid = `01TEST${String(seq).padStart(20, "0")}`;
    const journalEvent = JSON.stringify({
      seq,
      ulid,
      type: event.type,
      recordedAt: `2026-01-01T00:${String(seq).padStart(2, "0")}:00Z`,
      data: event.data,
    });
    const escaped = journalEvent.replace(/'/g, "'\\''");
    dockerExec(
      `printf '%s' '${escaped}' > ${runDir}/journal/${seqStr}.${ulid}.json`,
    );
  }

  return runDir;
}

/** Assert the hook allowed exit (exit 0, no "block" decision). */
function assertAllowsExit(result: { stdout: string; exitCode: number }): void {
  expect(result.exitCode).toBe(0);
  const parsed = parseJsonBlock(result.stdout);
  if (parsed) {
    expect(parsed.decision).not.toBe("block");
  }
}

/** Assert session state was cleaned up (deleted). */
function assertSessionDeleted(sid: string): void {
  const stateOut = dockerExec(
    `babysitter session:state --session-id ${sid} --state-dir ${STATE_DIR} --json`,
  ).trim();
  expect(JSON.parse(stateOut).found).toBe(false);
}

// ---------------------------------------------------------------------------
// Core lifecycle tests
// ---------------------------------------------------------------------------

describe("Cursor stop hook core lifecycle", () => {
  test("exits 0 (allows exit) when no session state exists", () => {
    const { exitCode, stdout } = runHook(
      "nonexistent-session-" + Date.now(),
      "/dev/null",
    );
    expect(exitCode).toBe(0);
    const parsed = parseJsonBlock(stdout);
    if (parsed) {
      expect(parsed.decision).not.toBe("block");
    }
  });

  test("handles empty JSON {} input gracefully", () => {
    const { exitCode } = runHookRaw("{}");
    expect(exitCode).toBe(0);
  });

  test("session:init creates state file with active: true", () => {
    const sid = "init-" + Date.now();

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "cursor init test" --json`,
    );

    const stateOut = dockerExec(
      `babysitter session:state --session-id ${sid} --state-dir ${STATE_DIR} --json`,
    ).trim();
    const state = JSON.parse(stateOut);
    expect(state.found).toBe(true);
    expect(state.state.active).toBe(true);
  });

  test("blocks exit when active session with associated run", () => {
    const sid = "active-" + Date.now();
    const transcriptFile = `/tmp/cursor-hook-transcript-active-${sid}.jsonl`;

    const runDir = createMockRun("active-run", [
      {
        type: "RUN_CREATED",
        data: { runId: "active-run", processId: "test" },
      },
    ]);

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "test orchestration" --run-id ${runDir} --json`,
    );
    createTranscript(transcriptFile, "some assistant output here");

    const { exitCode, stdout } = runHook(sid, transcriptFile);

    expect(exitCode).toBe(0);
    const output = parseJsonBlock(stdout);
    expect(output).toBeDefined();
    expect(output!.decision).toBe("block");
    expect(output!.reason).toContain("test orchestration");
  });

  test("increments iteration counter on each invocation", () => {
    const sid = "iter-" + Date.now();
    const transcriptFile = `/tmp/cursor-hook-transcript-iter-${sid}.jsonl`;

    const runDir = createMockRun("iter-run", [
      {
        type: "RUN_CREATED",
        data: { runId: "iter-run", processId: "test" },
      },
    ]);

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "counting test" --run-id ${runDir} --json`,
    );
    createTranscript(transcriptFile, "iteration output");

    // First invocation
    const first = runHook(sid, transcriptFile);
    const firstOut = parseJsonBlock(first.stdout);
    expect(firstOut).toBeDefined();
    expect(firstOut!.systemMessage).toContain("iteration 2");

    // Second invocation
    const second = runHook(sid, transcriptFile);
    const secondOut = parseJsonBlock(second.stdout);
    expect(secondOut).toBeDefined();
    expect(secondOut!.systemMessage).toContain("iteration 3");

    // Verify state
    const stateOut = dockerExec(
      `babysitter session:state --session-id ${sid} --state-dir ${STATE_DIR} --json`,
    ).trim();
    const state = JSON.parse(stateOut);
    expect(state.state.iteration).toBe(3);
  });

  test("detects completion proof tag and allows exit", () => {
    const sid = "complete-" + Date.now();
    const runDir = `/tmp/cursor-hook-test-run-complete-${sid}`;
    const transcriptFile = `/tmp/cursor-hook-transcript-complete-${sid}.jsonl`;

    // sha256("test-run:babysitter-completion-secret-v1")
    const secret =
      "db5801f37401e3b014de18ccd168d317c96e3c4154702cfd5ab38d507608da17";

    dockerExec(`mkdir -p ${runDir}/journal ${runDir}/state`);
    dockerExec(
      `printf '%s' '{"runId":"test-run","processId":"test"}' > ${runDir}/run.json`,
    );
    dockerExec(
      `printf '%s' '{"seq":1,"ulid":"01TEST1","type":"RUN_CREATED","recordedAt":"2026-01-01T00:00:00Z","data":{}}' > ${runDir}/journal/000001.01TEST1.json`,
    );
    dockerExec(
      `printf '%s' '{"seq":2,"ulid":"01TEST2","type":"RUN_COMPLETED","recordedAt":"2026-01-01T00:01:00Z","data":{"outputRef":"state/output.json"}}' > ${runDir}/journal/000002.01TEST2.json`,
    );

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "complete test" --run-id ${runDir} --json`,
    );
    createTranscript(
      transcriptFile,
      `Done! <promise>${secret}</promise>`,
    );

    const { exitCode, stdout } = runHook(sid, transcriptFile);

    expect(exitCode).toBe(0);
    const parsed = parseJsonBlock(stdout);
    expect(parsed?.decision).not.toBe("block");

    assertSessionDeleted(sid);
  });

  test("allows exit at max iterations", () => {
    const sid = "maxiter-" + Date.now();
    const transcriptFile = `/tmp/cursor-hook-transcript-maxiter-${sid}.jsonl`;

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --max-iterations 3 --prompt "maxiter test" --json`,
    );
    dockerExec(
      `babysitter session:update --session-id ${sid} --state-dir ${STATE_DIR} --iteration 3 --json`,
    );
    createTranscript(transcriptFile, "some output");

    const result = runHook(sid, transcriptFile);

    assertAllowsExit(result);
    assertSessionDeleted(sid);
  });
});
