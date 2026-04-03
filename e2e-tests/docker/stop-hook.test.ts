import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  dockerExec,
  dockerExecSafe,
  PLUGIN_DIR,
  startContainer,
  stopContainer,
} from "./helpers";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const HOOK = `${PLUGIN_DIR}/hooks/babysitter-stop-hook.sh`;
// Claude session state now lives in the global Babysitter state dir so all
// harness entrypoints (hooks, CLI, Bash tool calls) resolve the same files.
const STATE_DIR = "/home/claude/.a5c/state";
const LOG_DIR = "/tmp/hook-test-logs";
const HOOK_ENV = `CLAUDE_PLUGIN_ROOT=${PLUGIN_DIR} BABYSITTER_STATE_DIR=${STATE_DIR} BABYSITTER_LOG_DIR=${LOG_DIR} CLI=babysitter`;

beforeAll(() => {
  buildImage(ROOT);
  startContainer();
  dockerExec(`mkdir -p ${STATE_DIR} ${LOG_DIR}`);
}, 300_000);

afterAll(() => {
  stopContainer();
});

afterEach(() => {
  dockerExec(
    `rm -rf ${STATE_DIR}/* ${LOG_DIR}/* /tmp/hook-test-run-* /tmp/hook-transcript-* /tmp/hook-input-* 2>/dev/null || true`,
  );
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Write a hook input file and run the stop hook, reading from that file. */
function runHook(sessionId: string, transcriptPath: string): { stdout: string; exitCode: number } {
  const inputFile = `/tmp/hook-input-${Date.now()}.json`;
  const inputJson = JSON.stringify({ session_id: sessionId, transcript_path: transcriptPath });

  // Write input to file, pipe it to the hook, then clean up
  const cmd = [
    `printf '%s' '${inputJson.replace(/'/g, "'\\''")}' > ${inputFile}`,
    `${HOOK_ENV} bash ${HOOK} < ${inputFile}; echo "EXIT_CODE=$?"`,
    `rm -f ${inputFile}`,
  ].join(" ; ");

  const { stdout, exitCode: rawExitCode } = dockerExecSafe(cmd);

  // Extract the actual exit code from the output
  const lines = stdout.split("\n");
  const exitLine = lines.find((l) => l.startsWith("EXIT_CODE="));
  const exitCode = exitLine ? parseInt(exitLine.split("=")[1], 10) : rawExitCode;
  const output = lines.filter((l) => !l.startsWith("EXIT_CODE=")).join("\n").trim();

  return { stdout: output, exitCode };
}

/** Pipe arbitrary JSON to the stop hook (for testing with non-standard input shapes). */
function runHookRaw(jsonInput: string): { stdout: string; exitCode: number } {
  const inputFile = `/tmp/hook-input-raw-${Date.now()}.json`;
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
  const output = lines.filter((l) => !l.startsWith("EXIT_CODE=")).join("\n").trim();
  return { stdout: output, exitCode };
}

/** Extract a JSON object from multi-line hook output (jq pretty-prints). */
function parseJsonBlock(output: string): Record<string, unknown> | undefined {
  // Try parsing the entire output as JSON first
  try {
    return JSON.parse(output);
  } catch {
    // Fall back to extracting { ... } block from mixed output
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
  // Use printf to avoid echo interpretation issues
  dockerExec(`printf '%s\\n' '${line.replace(/'/g, "'\\''")}' > ${filePath}`);
}

/**
 * Create a mock run directory with journal events inside the container.
 * Returns the path to the run directory.
 *
 * Each event needs: { type, data }. seq/ulid/recordedAt are auto-generated.
 * For EFFECT_REQUESTED, data must include: effectId, invocationKey, stepId, taskId, taskDefRef.
 */
function createMockRun(
  runId: string,
  events: Array<{ type: string; data: Record<string, unknown> }>,
): string {
  const runDir = `/tmp/hook-test-run-${runId}-${Date.now()}`;
  dockerExec(`mkdir -p ${runDir}/journal ${runDir}/state ${runDir}/tasks`);

  const runJson = JSON.stringify({ runId, processId: "test-process" });
  dockerExec(`printf '%s' '${runJson.replace(/'/g, "'\\''")}' > ${runDir}/run.json`);

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const seq = i + 1;
    const seqStr = String(seq).padStart(6, "0");
    // ULID must be monotonically increasing and unique
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

describe("Stop hook core lifecycle", () => {
  test("exits 0 (allows exit) when no session state exists", () => {
    const { exitCode, stdout } = runHook(
      "nonexistent-session-" + Date.now(),
      "/dev/null",
    );
    expect(exitCode).toBe(0);
    // Hook outputs explicit allow decision (no block)
    const parsed = parseJsonBlock(stdout);
    if (parsed) {
      expect(parsed.decision).not.toBe("block");
    }
  });

  test("blocks exit when active session state exists with associated run", () => {
    const sid = "active-" + Date.now();
    const transcriptFile = "/tmp/hook-transcript-active.jsonl";

    // Create a mock run so the session has an associated run
    const runDir = createMockRun("active-run", [
      { type: "RUN_CREATED", data: { runId: "active-run", processId: "test" } },
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
    // reason wraps the original prompt with iteration context for Claude
    expect(output!.reason).toContain("test orchestration");
    expect(output!.reason).toContain("Babysitter iteration");
    expect(output!.systemMessage).toContain("iteration");
  });

  test("allows exit when session has no associated run", () => {
    const sid = "norun-" + Date.now();
    const transcriptFile = "/tmp/hook-transcript-norun.jsonl";

    // Init session WITHOUT --run-id
    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "no run test" --json`,
    );
    createTranscript(transcriptFile, "some assistant output here");

    const result = runHook(sid, transcriptFile);

    assertAllowsExit(result);
    assertSessionDeleted(sid);
  });

  test("increments iteration counter on each invocation", () => {
    const sid = "iter-" + Date.now();
    const transcriptFile = "/tmp/hook-transcript-iter.jsonl";

    // Create a mock run so the session has an associated run
    const runDir = createMockRun("iter-run", [
      { type: "RUN_CREATED", data: { runId: "iter-run", processId: "test" } },
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

  test("detects completion proof and allows exit", () => {
    const sid = "complete-" + Date.now();
    const runDir = "/tmp/hook-test-run-complete";
    const transcriptFile = "/tmp/hook-transcript-complete.jsonl";

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
    createTranscript(transcriptFile, `Done! <promise>${secret}</promise>`);

    const { exitCode, stdout } = runHook(sid, transcriptFile);

    expect(exitCode).toBe(0);
    const parsed = parseJsonBlock(stdout);
    expect(parsed?.decision).not.toBe("block");

    assertSessionDeleted(sid);
  });

  test("handles empty JSON input gracefully", () => {
    const { exitCode } = runHookRaw("{}");
    expect(exitCode).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Iteration safety limits
// ---------------------------------------------------------------------------

describe("Stop hook iteration safety limits", () => {
  test("allows exit when max iterations reached", () => {
    const sid = "maxiter-" + Date.now();
    const transcriptFile = "/tmp/hook-transcript-maxiter.jsonl";

    // Init session with max_iterations=3
    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --max-iterations 3 --prompt "maxiter test" --json`,
    );
    // Advance iteration to 3 (= max_iterations) so check-iteration returns shouldContinue=false
    dockerExec(
      `babysitter session:update --session-id ${sid} --state-dir ${STATE_DIR} --iteration 3 --json`,
    );
    createTranscript(transcriptFile, "some output");

    const result = runHook(sid, transcriptFile);

    assertAllowsExit(result);
    assertSessionDeleted(sid);
  });

  test("allows exit when iterations are too fast (runaway detection)", () => {
    const sid = "toofast-" + Date.now();
    const transcriptFile = "/tmp/hook-transcript-toofast.jsonl";

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "fast test" --json`,
    );

    // Runaway detection triggers after iteration >= 5 and when the average of
    // the last 10 iteration times is <= 15 seconds.
    // Set iteration=15 with 10 fast previous times and a very recent last-iteration-at.
    const recentTime = new Date(Date.now() - 2000).toISOString().replace(/\.\d{3}Z$/, "Z");
    dockerExec(
      `babysitter session:update --session-id ${sid} --state-dir ${STATE_DIR} --iteration 15 --iteration-times "1,1,1,1,1,1,1,1,1" --last-iteration-at "${recentTime}" --json`,
    );
    createTranscript(transcriptFile, "fast output");

    const result = runHook(sid, transcriptFile);

    assertAllowsExit(result);
    assertSessionDeleted(sid);
  });
});

// ---------------------------------------------------------------------------
// Transcript parsing errors
// ---------------------------------------------------------------------------

describe("Stop hook transcript parsing", () => {
  test("handles missing transcript gracefully", () => {
    const sid = "missing-" + Date.now();

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "test" --json`,
    );

    const result = runHook(sid, "/nonexistent/path/transcript.jsonl");
    expect(result.exitCode).toBe(0);
    assertSessionDeleted(sid);
  });

  test("allows exit when transcript has no assistant messages", () => {
    const sid = "noasst-" + Date.now();
    const transcriptFile = "/tmp/hook-transcript-noasst.jsonl";

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "no assistant test" --json`,
    );

    // Create transcript with only user messages — no assistant role at all
    const userLine = JSON.stringify({
      role: "user",
      message: { content: [{ type: "text", text: "hello" }] },
    });
    dockerExec(`printf '%s\\n' '${userLine.replace(/'/g, "'\\''")}' > ${transcriptFile}`);

    const result = runHook(sid, transcriptFile);

    assertAllowsExit(result);
    assertSessionDeleted(sid);
  });

  test("allows exit when assistant message has only non-text content", () => {
    const sid = "emptymsg-" + Date.now();
    const transcriptFile = "/tmp/hook-transcript-emptymsg.jsonl";

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "empty msg test" --json`,
    );

    // Create transcript with an assistant message that has only tool_use blocks (no text)
    const line = JSON.stringify({
      role: "assistant",
      message: { content: [{ type: "tool_use", id: "t1", name: "bash", input: {} }] },
    });
    dockerExec(`printf '%s\\n' '${line.replace(/'/g, "'\\''")}' > ${transcriptFile}`);

    const result = runHook(sid, transcriptFile);

    assertAllowsExit(result);
    assertSessionDeleted(sid);
  });
});

// ---------------------------------------------------------------------------
// Run state handling — verifies the hook produces the correct systemMessage
// for different run states (waiting, failed, completed-without-promise).
// ---------------------------------------------------------------------------

describe("Stop hook run state handling", () => {
  test("blocks exit and tells agent to extract proof when run is completed but no promise tag", () => {
    const sid = "nopromise-" + Date.now();
    const transcriptFile = "/tmp/hook-transcript-nopromise.jsonl";
    const runDir = createMockRun("nopromise", [
      { type: "RUN_CREATED", data: {} },
      { type: "RUN_COMPLETED", data: { outputRef: "state/output.json" } },
    ]);

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "promise test" --run-id ${runDir} --json`,
    );
    createTranscript(transcriptFile, "I think I am done, no proof though!");

    const { exitCode, stdout } = runHook(sid, transcriptFile);

    expect(exitCode).toBe(0);
    const parsed = parseJsonBlock(stdout);
    expect(parsed).toBeDefined();
    expect(parsed!.decision).toBe("block");
    // The hook should tell the agent the run is completed and they need to extract the proof
    expect(String(parsed!.systemMessage)).toContain("Run completed!");
    expect(String(parsed!.systemMessage)).toMatch(/promise/i);
  });

  test("blocks exit when completed run has wrong promise value", () => {
    const sid = "wrongpromise-" + Date.now();
    const transcriptFile = "/tmp/hook-transcript-wrongpromise.jsonl";
    const runDir = createMockRun("wrongpromise", [
      { type: "RUN_CREATED", data: {} },
      { type: "RUN_COMPLETED", data: { outputRef: "state/output.json" } },
    ]);

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "wrong promise test" --run-id ${runDir} --json`,
    );
    createTranscript(transcriptFile, "Done! <promise>wrong-secret-value</promise>");

    const { exitCode, stdout } = runHook(sid, transcriptFile);

    expect(exitCode).toBe(0);
    const parsed = parseJsonBlock(stdout);
    expect(parsed).toBeDefined();
    expect(parsed!.decision).toBe("block");
  });

  test("blocks exit and reports waiting effects when run has pending tasks", () => {
    const sid = "waiting-" + Date.now();
    const transcriptFile = "/tmp/hook-transcript-waiting.jsonl";
    const runDir = createMockRun("waiting", [
      { type: "RUN_CREATED", data: {} },
      {
        type: "EFFECT_REQUESTED",
        data: {
          effectId: "ef-test",
          invocationKey: "ef-test:inv",
          stepId: "step-1",
          taskId: "node-task",
          kind: "node",
          label: "build",
          taskDefRef: "tasks/ef-test/task.json",
        },
      },
    ]);

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "waiting test" --run-id ${runDir} --json`,
    );
    createTranscript(transcriptFile, "working on the task");

    const { exitCode, stdout } = runHook(sid, transcriptFile);

    expect(exitCode).toBe(0);
    const parsed = parseJsonBlock(stdout);
    expect(parsed).toBeDefined();
    expect(parsed!.decision).toBe("block");
    expect(String(parsed!.systemMessage)).toContain("Waiting on");
    expect(String(parsed!.systemMessage)).toContain("node");
  });

  test("blocks exit and reports failure when run is failed", () => {
    const sid = "failed-" + Date.now();
    const transcriptFile = "/tmp/hook-transcript-failed.jsonl";
    const runDir = createMockRun("failed", [
      { type: "RUN_CREATED", data: {} },
      { type: "RUN_FAILED", data: { reason: "process crashed" } },
    ]);

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "failed test" --run-id ${runDir} --json`,
    );
    createTranscript(transcriptFile, "something went wrong");

    const { exitCode, stdout } = runHook(sid, transcriptFile);

    expect(exitCode).toBe(0);
    const parsed = parseJsonBlock(stdout);
    expect(parsed).toBeDefined();
    expect(parsed!.decision).toBe("block");
    expect(String(parsed!.systemMessage)).toContain("Failed");
  });

  test("allows exit when run directory is misconfigured (empty state) but preserves session file for recovery", () => {
    const sid = "badrun-" + Date.now();
    const transcriptFile = "/tmp/hook-transcript-badrun.jsonl";

    dockerExec(
      `babysitter session:init --session-id ${sid} --state-dir ${STATE_DIR} --prompt "bad run test" --run-id /nonexistent/run/dir --json`,
    );
    createTranscript(transcriptFile, "some output");

    const result = runHook(sid, transcriptFile);

    assertAllowsExit(result);
    // Session file is intentionally preserved when run state is unknown
    // so that doctor/session:associate can re-bind and recover.
    const stateOut = dockerExec(
      `babysitter session:state --session-id ${sid} --state-dir ${STATE_DIR} --json`,
    ).trim();
    expect(JSON.parse(stateOut).found).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// run:create --harness session binding (integration with stop hook)
// ---------------------------------------------------------------------------

describe("run:create --harness session binding triggers stop hook", () => {
  test("run:create --harness claude-code creates session state file", () => {
    const sid = "harness-" + Date.now();
    const processDir = `/tmp/hook-test-harness-process-${sid}`;

    // Create a minimal process file for run:create
    dockerExec(`mkdir -p ${processDir}`);
    dockerExec(
      `printf '%s' 'export async function process(inputs, ctx) { return { done: true }; }' > ${processDir}/proc.js`,
    );

    // Run run:create with --harness --session-id --plugin-root
    const createOut = dockerExec(
      `BABYSITTER_SESSION_ID=${sid} babysitter run:create --process-id test-harness --entry ${processDir}/proc.js#process --prompt "harness test" --harness claude-code --plugin-root ${PLUGIN_DIR} --json`,
    ).trim();

    const createResult = JSON.parse(createOut);
    expect(createResult.runId).toBeTruthy();
    expect(createResult.session).toBeDefined();
    expect(createResult.session.harness).toBe("claude-code");
    expect(createResult.session.sessionId).toBe(sid);
    expect(createResult.session.stateFile).toBeTruthy();
    expect(createResult.session.error).toBeUndefined();

    // Verify the session state file was actually created
    const stateOut = dockerExec(
      `babysitter session:state --session-id ${sid} --state-dir ${STATE_DIR} --json`,
    ).trim();
    const state = JSON.parse(stateOut);
    expect(state.found).toBe(true);
    expect(state.state.runId).toBe(createResult.runId);
    expect(state.state.active).toBe(true);
  });

  test("stop hook blocks exit after run:create --harness binds session", () => {
    const sid = "harness-block-" + Date.now();
    const processDir = `/tmp/hook-test-harness-block-${sid}`;
    const transcriptFile = `/tmp/hook-transcript-harness-block-${sid}.jsonl`;

    // Create a minimal process file
    dockerExec(`mkdir -p ${processDir}`);
    dockerExec(
      `printf '%s' 'export async function process(inputs, ctx) { return { done: true }; }' > ${processDir}/proc.js`,
    );

    // Create run with harness binding
    const createOut = dockerExec(
      `BABYSITTER_SESSION_ID=${sid} babysitter run:create --process-id test-harness-block --entry ${processDir}/proc.js#process --prompt "block test" --harness claude-code --plugin-root ${PLUGIN_DIR} --json`,
    ).trim();
    const createResult = JSON.parse(createOut);
    expect(createResult.session?.error).toBeUndefined();

    // Create a transcript for the stop hook
    createTranscript(transcriptFile, "I am working on the task");

    // Now run the stop hook — it should block because session is bound to a run
    const { exitCode, stdout } = runHook(sid, transcriptFile);

    expect(exitCode).toBe(0);
    const parsed = parseJsonBlock(stdout);
    expect(parsed).toBeDefined();
    expect(parsed!.decision).toBe("block");
    expect(parsed!.systemMessage).toContain("iteration");
  });

  test("run:create --harness without --session-id reports error in JSON", () => {
    const processDir = `/tmp/hook-test-harness-nosid-${Date.now()}`;

    dockerExec(`mkdir -p ${processDir}`);
    dockerExec(
      `printf '%s' 'export async function process(inputs, ctx) { return { done: true }; }' > ${processDir}/proc.js`,
    );

    // Run with --harness but no --session-id and no BABYSITTER_SESSION_ID env var
    const createOut = dockerExec(
      `babysitter run:create --process-id test-harness-nosid --entry ${processDir}/proc.js#process --prompt "no sid" --harness claude-code --plugin-root ${PLUGIN_DIR} --json`,
    ).trim();

    const createResult = JSON.parse(createOut);
    // The run should still be created
    expect(createResult.runId).toBeTruthy();
    // But session binding should report an error
    expect(createResult.session).toBeDefined();
    expect(createResult.session.error).toBeTruthy();
    expect(createResult.session.error).toContain("session ID");
  });
});
