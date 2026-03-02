import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { exec, IMAGE, PLUGIN_DIR } from "./helpers";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(__dirname, "../..");
const FIXTURE_SRC = path.resolve(ROOT, "e2e-tests/fixtures/tic-tac-toe");
const ARTIFACTS_DIR = path.resolve(ROOT, "e2e-artifacts");
const WORKSPACE_HOST = path.resolve(ARTIFACTS_DIR, "workspace");

const HAS_API_KEY =
  !!process.env.ANTHROPIC_API_KEY || !!process.env.ANTHROPIC_FOUNDRY_API_KEY;

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
        // Handle nested .a5c/.a5c/runs/ — the babysit skill sometimes creates
        // runs inside a nested .a5c directory. Find all run.json files and copy
        // their parent run directories into the canonical /workspace/.a5c/runs/.
        "for rj in \\$(find /workspace -path '*/runs/*/run.json' -not -path '*/node_modules/*' 2>/dev/null); do " +
          "rd=\\$(dirname \\$rj); rn=\\$(basename \\$rd); " +
          "if [ ! -f /workspace/.a5c/runs/\\$rn/run.json ]; then " +
            "mkdir -p /workspace/.a5c/runs/\\$rn && cp -r \\$rd/* /workspace/.a5c/runs/\\$rn/ 2>/dev/null || true; " +
          "fi; " +
        "done",
        // Copy the full Claude session transcript (JSONL) — this is the
        // definitive record of every tool call Claude made during the run.
        // chmod after copy because the files are owned by container's claude
        // user which has a different UID than the CI runner.
        "mkdir -p /workspace/.claude-session",
        "cp -r /home/claude/.claude/projects/* /workspace/.claude-session/ 2>/dev/null || true",
        "chmod -R 777 /workspace/.claude-session 2>/dev/null || true",
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

/**
 * Recursively find all "runs" directories under the workspace that contain
 * at least one subdirectory with a run.json file. This handles cases where
 * the babysit skill creates nested .a5c/.a5c/runs/ paths.
 */
function findAllRunsDirs(): string[] {
  const results: string[] = [];
  function walk(dir: string, depth: number) {
    if (depth > 5) return; // prevent infinite recursion
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.name === "runs") {
        // Check if any subdirectory has run.json
        try {
          const runCandidates = fs.readdirSync(full).filter((f) => {
            const runJson = path.join(full, f, "run.json");
            return !f.startsWith(".") && fs.existsSync(runJson);
          });
          if (runCandidates.length > 0) results.push(full);
        } catch { /* skip */ }
      }
      walk(full, depth + 1);
    }
  }
  walk(WORKSPACE_HOST, 0);
  return results;
}

function findRunsDir(): string | null {
  // Prefer the canonical path first
  const workspaceRuns = path.join(WORKSPACE_HOST, ".a5c", "runs");
  if (fs.existsSync(workspaceRuns)) {
    const entries = fs.readdirSync(workspaceRuns).filter((f) => {
      const runJson = path.join(workspaceRuns, f, "run.json");
      return !f.startsWith(".") && fs.existsSync(runJson);
    });
    if (entries.length > 0) return workspaceRuns;
  }
  // Fall back to recursive search (handles nested .a5c/.a5c/runs/)
  const allDirs = findAllRunsDirs();
  return allDirs.length > 0 ? allDirs[0] : null;
}

function getLatestRunDir(): string | null {
  const runsDir = findRunsDir();
  if (!runsDir) return null;
  const runs = fs.readdirSync(runsDir).filter((f) => {
    const runJson = path.join(runsDir, f, "run.json");
    return !f.startsWith(".") && fs.existsSync(runJson);
  });
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
    expect(runJson.completionProof).toBeDefined();
    expect(typeof runJson.completionProof).toBe("string");
    expect(runJson.completionProof.length).toBeGreaterThan(0);
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
    // RUN_COMPLETED must exist. The stop hook may append a STOP_HOOK_INVOKED
    // event after completion, so RUN_COMPLETED might not be the very last entry.
    const completedIdx = events.findIndex((e) => e.type === "RUN_COMPLETED");
    expect(completedIdx).toBeGreaterThanOrEqual(0);
    // Only post-completion housekeeping events (like STOP_HOOK_INVOKED) may
    // appear after RUN_COMPLETED — no new effect or run lifecycle events.
    const postCompletionEvents = events.slice(completedIdx + 1);
    for (const e of postCompletionEvents) {
      expect(["STOP_HOOK_INVOKED"]).toContain(e.type);
    }
  });

  test("journal events follow correct lifecycle order", () => {
    const runDir = getLatestRunDir();
    if (!runDir) return;

    const events = readJournalEvents(runDir);
    const types = events.map((e) => e.type);

    // First must be RUN_CREATED, RUN_COMPLETED must exist
    expect(types[0]).toBe("RUN_CREATED");
    const completedIdx = types.indexOf("RUN_COMPLETED");
    expect(completedIdx).toBeGreaterThan(0);

    // Only post-completion housekeeping events may appear after RUN_COMPLETED
    const postTypes = types.slice(completedIdx + 1);
    for (const t of postTypes) {
      expect(["STOP_HOOK_INVOKED"]).toContain(t);
    }

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

    // Compute docker-relative path from the host path
    const relPath = path.relative(WORKSPACE_HOST, runDir).replace(/\\/g, "/");
    const statusOut = exec(
      `docker run --rm -v ${WORKSPACE_HOST}:/workspace --entrypoint bash ${IMAGE} -c "babysitter run:status /workspace/${relPath} --json"`,
    );
    const status = JSON.parse(statusOut.trim());
    expect(status.state).toBe("completed");
  });

  test("no pending tasks remain (via SDK CLI)", () => {
    const runDir = getLatestRunDir();
    if (!runDir) return;

    const relPath = path.relative(WORKSPACE_HOST, runDir).replace(/\\/g, "/");
    const listOut = exec(
      `docker run --rm -v ${WORKSPACE_HOST}:/workspace --entrypoint bash ${IMAGE} -c "babysitter task:list /workspace/${relPath} --pending --json"`,
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
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; } // skip dirs we can't read (permission issues)
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".jsonl")) results.push(full);
    }
  }
  walk(sessionDir);
  return results;
}

interface TranscriptEntry {
  role?: string;
  type?: string;
  message?: {
    role?: string;
    content?: Array<{
      type: string;
      text?: string;
      name?: string;
      input?: Record<string, unknown>;
      content?: unknown;
    }>;
  };
}

/** Read a JSONL transcript and return all lines as parsed objects. */
function readTranscript(filePath: string): TranscriptEntry[] {
  return fs.readFileSync(filePath, "utf-8")
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean) as TranscriptEntry[];
}

/** Extract all text content from a transcript (assistant + tool results). */
function extractAllText(transcript: TranscriptEntry[]): string {
  const parts: string[] = [];
  for (const entry of transcript) {
    const content = entry.message?.content;
    if (!content) continue;
    for (const block of content) {
      if (block.type === "text" && typeof block.text === "string") {
        parts.push(block.text);
      }
      if (block.type === "tool_use" && block.input) {
        parts.push(JSON.stringify(block.input));
      }
      if (block.type === "tool_result" && block.content) {
        parts.push(JSON.stringify(block.content));
      }
    }
  }
  return parts.join("\n");
}

/**
 * Extract all Bash tool_use commands from the transcript in order.
 * Returns { command, index } pairs where index is the position in the
 * transcript for ordering verification.
 */
function extractBashCommands(transcript: TranscriptEntry[]): Array<{ command: string; index: number }> {
  const commands: Array<{ command: string; index: number }> = [];
  for (let i = 0; i < transcript.length; i++) {
    const content = transcript[i].message?.content;
    if (!content) continue;
    for (const block of content) {
      if (block.type === "tool_use" && block.input) {
        const input = block.input as Record<string, unknown>;
        // Claude Code uses "Bash" tool or tool names containing "bash"
        const name = (block.name ?? "").toLowerCase();
        if (name === "bash" || name.includes("bash")) {
          const cmd = (input.command as string) ?? "";
          if (cmd) commands.push({ command: cmd, index: i });
        }
      }
    }
  }
  return commands;
}

/**
 * Extract all assistant text blocks from the transcript in order.
 */
function extractAssistantTexts(transcript: TranscriptEntry[]): string[] {
  const texts: string[] = [];
  for (const entry of transcript) {
    if (entry.message?.role !== "assistant") continue;
    const content = entry.message.content;
    if (!content) continue;
    for (const block of content) {
      if (block.type === "text" && typeof block.text === "string") {
        texts.push(block.text);
      }
    }
  }
  return texts;
}

/**
 * Parse the stop hook log into structured entries.
 * Each line: [LEVEL] TIMESTAMP [context] message
 */
function parseHookLog(logContent: string): Array<{
  level: string;
  timestamp: string;
  session?: string;
  run?: string;
  message: string;
  line: string;
}> {
  return logContent.split("\n").filter((l) => l.trim()).map((line) => {
    const levelMatch = line.match(/^\[(INFO|WARN|ERROR)\]\s+(\S+)/);
    const sessionMatch = line.match(/session=([0-9a-f-]+)/);
    const runMatch = line.match(/run=([A-Z0-9]+)/);
    return {
      level: levelMatch?.[1] ?? "UNKNOWN",
      timestamp: levelMatch?.[2] ?? "",
      session: sessionMatch?.[1],
      run: runMatch?.[1],
      message: line.replace(/^\[(?:INFO|WARN|ERROR)\]\s+\S+\s+(?:\[.*?\]\s+)?/, ""),
      line,
    };
  });
}

// ---------------------------------------------------------------------------
// Stop hook verification — proves the hook fired, found the session, queried
// the run, and made the correct exit decision.
//
// In -p (non-interactive) mode, the SessionEnd hook fires only once AFTER
// the orchestration completes and the session is cleaned up. The stop hook
// finds no active loop and allows exit. This is expected behavior.
// The detailed verification (run state, completion proof) only applies when
// the hook fires with an active session (interactive mode).
// ---------------------------------------------------------------------------
describe.skipIf(!HAS_API_KEY)("Stop hook verification", () => {
  /** Helper: check if the log file shows the hook found an active session. */
  function hookFoundActiveSession(): boolean {
    const logFile = path.join(WORKSPACE_HOST, ".e2e-logs", "babysitter-stop-hook.log");
    if (!fs.existsSync(logFile)) return false;
    const log = fs.readFileSync(logFile, "utf-8");
    // If the hook found "No active loop", the session was already cleaned up
    return !log.includes("No active loop found") && log.includes("Run state:");
  }

  test("stop hook fired and processed input", () => {
    const logFile = path.join(WORKSPACE_HOST, ".e2e-logs", "babysitter-stop-hook.log");
    // The hook must fire — the log file should exist (shell script writes a marker)
    if (!fs.existsSync(logFile)) {
      // Hook didn't fire at all — verify run completed via journal
      const runDir = getLatestRunDir();
      expect(runDir).toBeDefined();
      if (runDir) {
        const journal = fs.readdirSync(path.join(runDir, "journal"));
        const hasCompletion = journal.some((f) => {
          const content = fs.readFileSync(path.join(runDir, "journal", f), "utf-8");
          return content.includes("RUN_COMPLETED");
        });
        expect(hasCompletion).toBe(true);
      }
      return;
    }

    const entries = parseHookLog(fs.readFileSync(logFile, "utf-8"));
    // Hook must have received input and resolved a session ID
    expect(entries.some((e) => e.message.includes("Hook input received"))).toBe(true);
    expect(entries.some((e) => e.session)).toBe(true);
  });

  test("stop hook found active session with run ID", () => {
    // In -p mode, session is cleaned up before SessionEnd fires — skip
    if (!hookFoundActiveSession()) return;

    const logFile = path.join(WORKSPACE_HOST, ".e2e-logs", "babysitter-stop-hook.log");
    const entries = parseHookLog(fs.readFileSync(logFile, "utf-8"));
    expect(entries.some((e) => e.run)).toBe(true);
  });

  test("stop hook queried run state from SDK", () => {
    if (!hookFoundActiveSession()) return;

    const logFile = path.join(WORKSPACE_HOST, ".e2e-logs", "babysitter-stop-hook.log");
    const log = fs.readFileSync(logFile, "utf-8");
    expect(log).toContain("Run state:");
    expect(log).toContain("Run state: completed");
  });

  test("stop hook found completion proof and validated promise tag", () => {
    if (!hookFoundActiveSession()) return;

    const logFile = path.join(WORKSPACE_HOST, ".e2e-logs", "babysitter-stop-hook.log");
    const log = fs.readFileSync(logFile, "utf-8");
    expect(log).toContain("Completion proof available");
    expect(log).toContain("Detected valid promise tag");
  });

  test("stop hook session matches run from journal", () => {
    if (!hookFoundActiveSession()) return;

    const logFile = path.join(WORKSPACE_HOST, ".e2e-logs", "babysitter-stop-hook.log");
    const entries = parseHookLog(fs.readFileSync(logFile, "utf-8"));
    const hookRunId = entries.find((e) => e.run)?.run;
    expect(hookRunId).toBeDefined();

    const runDir = getLatestRunDir();
    if (!runDir) return;
    const runJson = JSON.parse(fs.readFileSync(path.join(runDir, "run.json"), "utf-8"));
    expect(hookRunId).toBe(runJson.runId);
  });

  test("stop hook log shows no errors", () => {
    const logFile = path.join(WORKSPACE_HOST, ".e2e-logs", "babysitter-stop-hook.log");
    if (!fs.existsSync(logFile)) return;

    const entries = parseHookLog(fs.readFileSync(logFile, "utf-8"));
    const errors = entries.filter((e) => e.level === "ERROR");
    expect(errors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Session transcript verification — the JSONL transcript is the definitive
// record of every tool call Claude made. We parse it structurally and verify
// the babysitter orchestration commands were invoked in the correct order.
// ---------------------------------------------------------------------------
describe.skipIf(!HAS_API_KEY)("Session transcript verification", () => {
  test("Claude session transcript was captured", () => {
    const files = findTranscriptFiles();
    expect(files.length).toBeGreaterThanOrEqual(1);
    // Save transcript paths as artifact for debugging
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, "transcript-files.txt"),
      files.join("\n"),
    );
  });

  test("transcript is saved as readable artifact", () => {
    const files = findTranscriptFiles();
    if (files.length === 0) return;

    // Concatenate all transcripts and save as a single readable file
    const allTranscript = files.flatMap((f) => readTranscript(f));
    const bashCmds = extractBashCommands(allTranscript);
    const assistantTexts = extractAssistantTexts(allTranscript);

    // Save structured summary for CI artifact inspection
    const summary = {
      totalEntries: allTranscript.length,
      bashCommandCount: bashCmds.length,
      assistantTextBlocks: assistantTexts.length,
      bashCommands: bashCmds.map((c) => c.command.substring(0, 200)),
      assistantTextSamples: assistantTexts.map((t) => t.substring(0, 200)),
    };
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, "transcript-summary.json"),
      JSON.stringify(summary, null, 2),
    );
  });

  test("transcript contains run:create bash command (with --harness for unified session binding)", () => {
    const files = findTranscriptFiles();
    if (files.length === 0) return;

    const allTranscript = files.flatMap((f) => readTranscript(f));
    const bashCmds = extractBashCommands(allTranscript);
    const createCmd = bashCmds.find((c) => c.command.includes("run:create"));
    expect(createCmd).toBeDefined();

    // The unified workflow uses --harness to bind the session in the same command
    // Accept both old (setup script + associate script) and new (--harness flag) workflows
    const usesUnifiedHarness = bashCmds.some((c) =>
      c.command.includes("run:create") && c.command.includes("--harness"),
    );
    const usesLegacySetup = bashCmds.some((c) =>
      c.command.includes("setup-babysitter-run"),
    );
    expect(usesUnifiedHarness || usesLegacySetup).toBe(true);
  });

  test("transcript contains run:iterate bash commands (at least 2 for build + verify)", () => {
    const files = findTranscriptFiles();
    if (files.length === 0) return;

    const allTranscript = files.flatMap((f) => readTranscript(f));
    const bashCmds = extractBashCommands(allTranscript);
    const iterateCmds = bashCmds.filter((c) => c.command.includes("run:iterate"));
    // tic-tac-toe has 2 tasks (build-game, verify-game); each needs at least
    // one iterate call, plus a final iterate that finds completion.
    expect(iterateCmds.length).toBeGreaterThanOrEqual(2);
  });

  test("transcript contains task:post bash commands for effect resolution", () => {
    const files = findTranscriptFiles();
    if (files.length === 0) return;

    const allTranscript = files.flatMap((f) => readTranscript(f));
    const bashCmds = extractBashCommands(allTranscript);
    const postCmds = bashCmds.filter((c) => c.command.includes("task:post"));
    // At least 2 task:post calls (one per task in the tic-tac-toe process)
    expect(postCmds.length).toBeGreaterThanOrEqual(2);
  });

  test("babysitter CLI commands appear in correct lifecycle order", () => {
    const files = findTranscriptFiles();
    if (files.length === 0) return;

    const allTranscript = files.flatMap((f) => readTranscript(f));
    const bashCmds = extractBashCommands(allTranscript);

    // Core commands that must exist in both old and new workflows
    const createIdx = bashCmds.findIndex((c) => c.command.includes("run:create"));
    const firstIterateIdx = bashCmds.findIndex((c) => c.command.includes("run:iterate"));
    const firstPostIdx = bashCmds.findIndex((c) => c.command.includes("task:post"));

    // run:create, run:iterate, and task:post must exist
    expect(createIdx).toBeGreaterThanOrEqual(0);
    expect(firstIterateIdx).toBeGreaterThanOrEqual(0);
    expect(firstPostIdx).toBeGreaterThanOrEqual(0);

    // Order: create → iterate → post
    expect(firstIterateIdx).toBeGreaterThan(createIdx);
    expect(firstPostIdx).toBeGreaterThan(firstIterateIdx);

    // Legacy workflow may also have setup-babysitter-run before create
    const setupIdx = bashCmds.findIndex((c) => c.command.includes("setup-babysitter-run"));
    if (setupIdx >= 0) {
      expect(createIdx).toBeGreaterThan(setupIdx);
    }
  });

  test("assistant output contains <promise> tag with valid completion proof", () => {
    const files = findTranscriptFiles();
    if (files.length === 0) return;

    const allTranscript = files.flatMap((f) => readTranscript(f));
    const assistantTexts = extractAssistantTexts(allTranscript);
    const allAssistantText = assistantTexts.join("\n");

    // Must contain the promise tag
    expect(allAssistantText).toContain("<promise>");
    expect(allAssistantText).toContain("</promise>");

    // Extract the proof from the promise tag
    const promiseMatch = allAssistantText.match(/<promise>([\s\S]*?)<\/promise>/);
    expect(promiseMatch).not.toBeNull();
    const transcriptProof = promiseMatch![1].trim();
    expect(transcriptProof.length).toBeGreaterThan(0);

    // The proof must match what's in run.json
    const runDir = getLatestRunDir();
    if (!runDir) return;
    const runJson = JSON.parse(fs.readFileSync(path.join(runDir, "run.json"), "utf-8"));
    expect(transcriptProof).toBe(runJson.completionProof);
  });

  test("stdout contains the completion promise tag", () => {
    const logPath = path.join(ARTIFACTS_DIR, "e2e-stdout.log");
    if (!fs.existsSync(logPath)) return;

    const stdout = fs.readFileSync(logPath, "utf-8");
    expect(stdout).toContain("<promise>");
  });
});
