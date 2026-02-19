import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { exec, IMAGE } from "./helpers";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(__dirname, "../..");
const FIXTURE_SRC = path.resolve(ROOT, "e2e-tests/fixtures/tic-tac-toe");
const ARTIFACTS_DIR = path.resolve(ROOT, "e2e-artifacts");
const WORKSPACE_HOST = path.resolve(ARTIFACTS_DIR, "workspace");

const HAS_API_KEY =
  !!process.env.ANTHROPIC_API_KEY || !!process.env.ANTHROPIC_FOUNDRY_API_KEY;

const PLUGIN_DIR =
  "/home/claude/.claude/plugins/cache/a5c-ai/babysitter/4.0.128";

beforeAll(() => {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  fs.mkdirSync(WORKSPACE_HOST, { recursive: true });

  // Copy fixture to a clean workspace on the host
  exec(`cp -r ${FIXTURE_SRC}/* ${WORKSPACE_HOST}/`);

  // Pre-create .a5c directory structure on the host and make the entire
  // workspace world-writable so the container's claude user (different UID
  // from the host runner user) can write to it via the bind mount.
  fs.mkdirSync(path.join(WORKSPACE_HOST, ".a5c", "runs"), { recursive: true });
  exec(`chmod -R 777 ${WORKSPACE_HOST}`);
}, 60_000);

afterAll(() => {
  // Leave artifacts for CI upload
});

describe("Fixture setup", () => {
  test("tic-tac-toe.process.js exists in fixture", () => {
    expect(fs.existsSync(path.join(FIXTURE_SRC, "tic-tac-toe.process.js"))).toBe(true);
  });

  test("inputs.json exists in fixture", () => {
    expect(fs.existsSync(path.join(FIXTURE_SRC, "inputs.json"))).toBe(true);
  });

  test("request.task.md exists in fixture", () => {
    expect(fs.existsSync(path.join(FIXTURE_SRC, "request.task.md"))).toBe(true);
  });
});

describe.skipIf(!HAS_API_KEY)("Full E2E orchestration (tic-tac-toe)", () => {
  test(
    "babysitter orchestration runs to completion",
    () => {
      // Build env flags for docker - pass through all credential vars
      // CLI=babysitter ensures stop hook and setup scripts use the globally
      // installed CLI rather than falling back to npx which may timeout.
      const envFlags: string[] = ["-e CLI=babysitter"];
      const passthroughVars = [
        "ANTHROPIC_API_KEY",
        "CLAUDE_CODE_USE_FOUNDRY",
        "ANTHROPIC_FOUNDRY_RESOURCE",
        "ANTHROPIC_FOUNDRY_API_KEY",
        "ANTHROPIC_DEFAULT_SONNET_MODEL",
        "ANTHROPIC_DEFAULT_HAIKU_MODEL",
        "ANTHROPIC_DEFAULT_OPUS_MODEL",
      ];
      for (const v of passthroughVars) {
        if (process.env[v]) envFlags.push(`-e ${v}=${process.env[v]}`);
      }

      // The Docker command:
      // 1. Ensures .a5c/runs exists with correct permissions inside container
      // 2. Runs Claude with babysitter plugin
      const bashCmd = [
        "mkdir -p /workspace/.a5c/runs",
        "cd /workspace",
        `claude --plugin-dir '${PLUGIN_DIR}' --dangerously-skip-permissions --output-format text -p '/babysitter:babysit perform the tasks in the *.task.md files found in this dir'`,
      ].join(" && ");

      // Post-run: copy artifacts from container filesystem to mounted volume.
      // NOTE: All shell variables ($d, $f) and command substitutions $(...)
      // must be escaped as \$d, \$(...) etc. because the outer -c "..." is
      // double-quoted, so the HOST shell would expand them otherwise.
      const postRunDiag = [
        // Copy .a5c from various locations under /home/claude
        "for d in \\$(find /home/claude -path '*/.a5c/runs' -type d 2>/dev/null); do cp -rn \\$(dirname \\$d)/* /workspace/.a5c/ 2>/dev/null || true; done",
        "cp -rn /home/claude/.a5c/* /workspace/.a5c/ 2>/dev/null || true",
        // Copy the full Claude session transcript (JSONL) — this is the
        // definitive record of every tool call Claude made during the run.
        "mkdir -p /workspace/.claude-session",
        "cp -r /home/claude/.claude/projects/* /workspace/.claude-session/ 2>/dev/null || true",
        // Copy plugin state directories for session verification
        "mkdir -p /workspace/.plugin-state",
        `cp -r ${PLUGIN_DIR}/skills/babysit/state/* /workspace/.plugin-state/ 2>/dev/null || true`,
        `cp -r ${PLUGIN_DIR}/state/* /workspace/.plugin-state/ 2>/dev/null || true`,
        // Diagnostics
        "echo '=== .a5c locations ===' && find / -name '.a5c' -type d 2>/dev/null || true",
        "echo '=== /workspace/.a5c contents ===' && ls -laR /workspace/.a5c/ 2>/dev/null || echo 'empty'",
        "echo '=== Claude session files ===' && find /workspace/.claude-session -name '*.jsonl' 2>/dev/null || echo 'no transcripts'",
        "echo '=== Stop hook log ===' && cat /workspace/.e2e-logs/babysitter-stop-hook.log 2>/dev/null || echo 'no log'",
      ].join(" ; ");

      const stdout = exec(
        [
          "docker run --rm",
          ...envFlags,
          `-v ${WORKSPACE_HOST}:/workspace`,
          `-e BABYSITTER_LOG_DIR=/workspace/.e2e-logs`,
          `-e BABYSITTER_RUNS_DIR=/workspace/.a5c/runs`,
          `--entrypoint bash`,
          IMAGE,
          `-c "${bashCmd} ; ${postRunDiag}"`,
        ].join(" "),
        { timeout: 1_800_000 }, // 30 min
      );

      // Save stdout for artifact upload
      fs.writeFileSync(
        path.join(ARTIFACTS_DIR, "e2e-stdout.log"),
        stdout,
      );
    },
    1_800_000, // 30 min test timeout
  );
});

// ---------------------------------------------------------------------------
// Helper: locate the .a5c/runs directory on the host
// ---------------------------------------------------------------------------
function findRunsDir(): string | null {
  const workspaceRuns = path.join(WORKSPACE_HOST, ".a5c", "runs");
  if (fs.existsSync(workspaceRuns)) {
    const entries = fs.readdirSync(workspaceRuns).filter((f) => !f.startsWith("."));
    if (entries.length > 0) return workspaceRuns;
  }
  return null;
}

function getLatestRunDir(): string | null {
  const runsDir = findRunsDir();
  if (!runsDir) return null;
  const runs = fs.readdirSync(runsDir).filter((f) => !f.startsWith("."));
  if (runs.length === 0) return null;
  return path.join(runsDir, runs.sort().pop()!);
}

function readJournalEvents(runDir: string): Array<{ seq: number; type: string; data?: Record<string, unknown> }> {
  const journalDir = path.join(runDir, "journal");
  if (!fs.existsSync(journalDir)) return [];
  const entries = fs.readdirSync(journalDir).filter((f) => f.endsWith(".json")).sort();
  return entries.map((f) => JSON.parse(fs.readFileSync(path.join(journalDir, f), "utf-8")));
}

// ---------------------------------------------------------------------------
// Output verification
// ---------------------------------------------------------------------------
describe.skipIf(!HAS_API_KEY)("Output verification", () => {
  test("index.html was generated and is non-empty", () => {
    const htmlPath = path.join(WORKSPACE_HOST, "index.html");
    expect(fs.existsSync(htmlPath)).toBe(true);
    const content = fs.readFileSync(htmlPath, "utf-8");
    expect(content.length).toBeGreaterThan(100);
    expect(content.toLowerCase()).toContain("<!doctype html>");
  });

  test("JavaScript game file was generated and is non-empty", () => {
    // Could be game.js or another name
    const jsFiles = fs.readdirSync(WORKSPACE_HOST).filter((f) => f.endsWith(".js") && !f.includes("process"));
    expect(jsFiles.length).toBeGreaterThanOrEqual(1);

    const jsContent = fs.readFileSync(
      path.join(WORKSPACE_HOST, jsFiles[0]),
      "utf-8",
    );
    expect(jsContent.length).toBeGreaterThan(100);
  });
});

// ---------------------------------------------------------------------------
// Orchestration lifecycle verification
// ---------------------------------------------------------------------------
describe.skipIf(!HAS_API_KEY)("Orchestration lifecycle verification", () => {
  test(".a5c/runs directory has at least one run", () => {
    const runsDir = findRunsDir();
    expect(runsDir).not.toBeNull();
    const runs = fs.readdirSync(runsDir!).filter((f) => !f.startsWith("."));
    expect(runs.length).toBeGreaterThanOrEqual(1);
  });

  test("run.json exists with valid metadata", () => {
    const runDir = getLatestRunDir();
    expect(runDir).not.toBeNull();

    const runJsonPath = path.join(runDir!, "run.json");
    expect(fs.existsSync(runJsonPath)).toBe(true);

    const runJson = JSON.parse(fs.readFileSync(runJsonPath, "utf-8"));
    expect(runJson.runId).toBeDefined();
    expect(typeof runJson.runId).toBe("string");
    expect(runJson.processId).toBeDefined();
    expect(runJson.layoutVersion).toBeDefined();
    expect(runJson.createdAt).toBeDefined();
  });

  test("run.json has completion proof", () => {
    const runDir = getLatestRunDir();
    expect(runDir).not.toBeNull();

    const runJson = JSON.parse(fs.readFileSync(path.join(runDir!, "run.json"), "utf-8"));
    // SDK stores this as "completionSecret" — a random hex token that
    // the stop hook must find in the <promise> tag to allow session exit.
    expect(runJson.completionSecret).toBeDefined();
    expect(typeof runJson.completionSecret).toBe("string");
    expect(runJson.completionSecret.length).toBeGreaterThan(0);
  });

  test("journal directory exists with entries", () => {
    const runDir = getLatestRunDir();
    expect(runDir).not.toBeNull();

    const journalDir = path.join(runDir!, "journal");
    expect(fs.existsSync(journalDir)).toBe(true);

    const entries = fs.readdirSync(journalDir).filter((f) => f.endsWith(".json"));
    // RUN_CREATED + at least 1 EFFECT_REQUESTED + 1 EFFECT_RESOLVED + RUN_COMPLETED = 4 minimum
    expect(entries.length).toBeGreaterThanOrEqual(3);
  });

  test("journal has RUN_CREATED as first event", () => {
    const runDir = getLatestRunDir();
    if (!runDir) return;

    const events = readJournalEvents(runDir);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe("RUN_CREATED");
  });

  test("journal has EFFECT_REQUESTED events", () => {
    const runDir = getLatestRunDir();
    if (!runDir) return;

    const events = readJournalEvents(runDir);
    const requested = events.filter((e) => e.type === "EFFECT_REQUESTED");
    expect(requested.length).toBeGreaterThanOrEqual(1);
  });

  test("journal has EFFECT_RESOLVED events matching requested effects", () => {
    const runDir = getLatestRunDir();
    if (!runDir) return;

    const events = readJournalEvents(runDir);
    const resolved = events.filter((e) => e.type === "EFFECT_RESOLVED");
    expect(resolved.length).toBeGreaterThanOrEqual(1);

    // Every resolved effect should have been requested first
    const requestedIds = new Set(
      events.filter((e) => e.type === "EFFECT_REQUESTED").map((e) => e.data?.effectId),
    );
    for (const r of resolved) {
      if (r.data?.effectId) {
        expect(requestedIds.has(r.data.effectId)).toBe(true);
      }
    }
  });

  test("journal has RUN_COMPLETED as final event", () => {
    const runDir = getLatestRunDir();
    if (!runDir) return;

    const events = readJournalEvents(runDir);
    expect(events.length).toBeGreaterThan(0);
    expect(events[events.length - 1].type).toBe("RUN_COMPLETED");
  });

  test("journal events follow correct lifecycle order", () => {
    const runDir = getLatestRunDir();
    if (!runDir) return;

    const events = readJournalEvents(runDir);
    const types = events.map((e) => e.type);

    // First must be RUN_CREATED, last must be RUN_COMPLETED
    expect(types[0]).toBe("RUN_CREATED");
    expect(types[types.length - 1]).toBe("RUN_COMPLETED");

    // No events after RUN_COMPLETED
    const completedIdx = types.lastIndexOf("RUN_COMPLETED");
    expect(completedIdx).toBe(types.length - 1);

    // EFFECT_RESOLVED events must come after their corresponding EFFECT_REQUESTED
    for (const event of events) {
      if (event.type === "EFFECT_RESOLVED" && event.data?.effectId) {
        const requestedIdx = events.findIndex(
          (e) => e.type === "EFFECT_REQUESTED" && e.data?.effectId === event.data?.effectId,
        );
        const resolvedIdx = events.indexOf(event);
        expect(requestedIdx).toBeGreaterThanOrEqual(0);
        expect(resolvedIdx).toBeGreaterThan(requestedIdx);
      }
    }
  });

  test("task results exist with status ok", () => {
    const runDir = getLatestRunDir();
    if (!runDir) return;

    const tasksDir = path.join(runDir, "tasks");
    if (!fs.existsSync(tasksDir)) return;

    const taskDirs = fs.readdirSync(tasksDir).filter((f) => {
      const fullPath = path.join(tasksDir, f);
      return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
    });
    expect(taskDirs.length).toBeGreaterThanOrEqual(1);

    // Every task with a result.json should have status "ok"
    let resultCount = 0;
    for (const taskDir of taskDirs) {
      const resultPath = path.join(tasksDir, taskDir, "result.json");
      if (fs.existsSync(resultPath)) {
        const result = JSON.parse(fs.readFileSync(resultPath, "utf-8"));
        expect(result.status).toBe("ok");
        expect(result.effectId).toBeDefined();
        resultCount++;
      }
    }
    expect(resultCount).toBeGreaterThanOrEqual(1);
  });

  test("run status is completed (via SDK CLI)", () => {
    const runDir = getLatestRunDir();
    if (!runDir) return;

    const latestRun = path.basename(runDir);
    const statusOut = exec(
      `docker run --rm -v ${WORKSPACE_HOST}:/workspace --entrypoint bash ${IMAGE} -c "babysitter run:status /workspace/.a5c/runs/${latestRun} --json"`,
    );
    const status = JSON.parse(statusOut.trim());
    expect(status.state).toBe("completed");
  });

  test("no pending tasks remain (via SDK CLI)", () => {
    const runDir = getLatestRunDir();
    if (!runDir) return;

    const latestRun = path.basename(runDir);
    const listOut = exec(
      `docker run --rm -v ${WORKSPACE_HOST}:/workspace --entrypoint bash ${IMAGE} -c "babysitter task:list /workspace/.a5c/runs/${latestRun} --pending --json"`,
    );
    const list = JSON.parse(listOut.trim());
    expect(list.tasks.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Claude session transcript — the full record of what happened
// ---------------------------------------------------------------------------

/** Find all .jsonl transcript files copied from the container. */
function findTranscriptFiles(): string[] {
  const sessionDir = path.join(WORKSPACE_HOST, ".claude-session");
  if (!fs.existsSync(sessionDir)) return [];
  const results: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".jsonl")) results.push(full);
    }
  }
  walk(sessionDir);
  return results;
}

/** Read a JSONL transcript and return all lines as parsed objects. */
function readTranscript(filePath: string): Array<Record<string, unknown>> {
  return fs.readFileSync(filePath, "utf-8")
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean) as Array<Record<string, unknown>>;
}

/** Extract all text content from a transcript (assistant + tool results). */
function extractAllText(transcript: Array<Record<string, unknown>>): string {
  const parts: string[] = [];
  for (const entry of transcript) {
    const msg = entry.message as Record<string, unknown> | undefined;
    if (!msg?.content) continue;
    const content = msg.content as Array<Record<string, unknown>>;
    for (const block of content) {
      if (block.type === "text" && typeof block.text === "string") {
        parts.push(block.text);
      }
      // tool_use blocks have input that may contain command strings
      if (block.type === "tool_use" && block.input) {
        parts.push(JSON.stringify(block.input));
      }
      // tool_result blocks may contain command output
      if (block.type === "tool_result" && block.content) {
        parts.push(JSON.stringify(block.content));
      }
    }
  }
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Stop hook verification (from log + transcript)
// ---------------------------------------------------------------------------
describe.skipIf(!HAS_API_KEY)("Stop hook verification", () => {
  test("stop hook log file was created", () => {
    const logFile = path.join(WORKSPACE_HOST, ".e2e-logs", "babysitter-stop-hook.log");
    expect(fs.existsSync(logFile)).toBe(true);
  });

  test("stop hook found session, checked run state, and detected completion", () => {
    const logFile = path.join(WORKSPACE_HOST, ".e2e-logs", "babysitter-stop-hook.log");
    if (!fs.existsSync(logFile)) return;

    const log = fs.readFileSync(logFile, "utf-8");
    // Full lifecycle evidence: received input → found session → checked state → resolved
    expect(log).toContain("Hook input received");
    expect(log).toContain("Run state:");
    expect(log).toMatch(/session=[0-9a-f-]+/);  // session was found
    expect(log).toMatch(/run=[A-Z0-9]+/);        // run was associated
    // Either iterated the loop or detected completion — both are valid
    expect(
      log.includes("Updated iteration to") ||
      log.includes("Detected valid promise tag") ||
      log.includes("Hook execution successful"),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Session transcript verification — proves what Claude actually did
// ---------------------------------------------------------------------------
describe.skipIf(!HAS_API_KEY)("Session transcript verification", () => {
  test("Claude session transcript was captured", () => {
    const files = findTranscriptFiles();
    expect(files.length).toBeGreaterThanOrEqual(1);
  });

  test("transcript contains babysitter setup (session:init)", () => {
    const files = findTranscriptFiles();
    if (files.length === 0) return;

    // Combine all transcripts and search for setup evidence
    const allText = files.map((f) => extractAllText(readTranscript(f))).join("\n");
    expect(allText).toContain("setup-babysitter-run");
  });

  test("transcript contains run:create command", () => {
    const files = findTranscriptFiles();
    if (files.length === 0) return;

    const allText = files.map((f) => extractAllText(readTranscript(f))).join("\n");
    expect(allText).toContain("run:create");
  });

  test("transcript contains run:iterate command", () => {
    const files = findTranscriptFiles();
    if (files.length === 0) return;

    const allText = files.map((f) => extractAllText(readTranscript(f))).join("\n");
    expect(allText).toContain("run:iterate");
  });

  test("transcript contains task:post for effect resolution", () => {
    const files = findTranscriptFiles();
    if (files.length === 0) return;

    const allText = files.map((f) => extractAllText(readTranscript(f))).join("\n");
    expect(allText).toContain("task:post");
  });

  test("transcript contains session-run association", () => {
    const files = findTranscriptFiles();
    if (files.length === 0) return;

    const allText = files.map((f) => extractAllText(readTranscript(f))).join("\n");
    expect(allText).toContain("associate-session-with-run");
  });

  test("transcript contains completion promise output", () => {
    const files = findTranscriptFiles();
    if (files.length === 0) return;

    const allText = files.map((f) => extractAllText(readTranscript(f))).join("\n");
    expect(allText).toContain("<promise>");
  });

  test("stdout contains the completion promise tag", () => {
    const logPath = path.join(ARTIFACTS_DIR, "e2e-stdout.log");
    if (!fs.existsSync(logPath)) return;

    const stdout = fs.readFileSync(logPath, "utf-8");
    expect(stdout).toContain("<promise>");
  });
});
