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

beforeAll(() => {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  fs.mkdirSync(WORKSPACE_HOST, { recursive: true });

  // Copy fixture to a clean workspace on the host
  exec(`cp -r ${FIXTURE_SRC}/* ${WORKSPACE_HOST}/`);
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
  const PLUGIN_DIR =
    "/home/claude/.claude/plugins/cache/a5c-ai/babysitter/4.0.128";

  test(
    "babysitter orchestration runs to completion",
    () => {
      // Build env flags for docker - pass through all credential vars
      const envFlags: string[] = [];
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

      const stdout = exec(
        [
          "docker run --rm",
          ...envFlags,
          `-v ${WORKSPACE_HOST}:/workspace`,
          `-e BABYSITTER_LOG_DIR=/workspace/.e2e-logs`,
          `-e BABYSITTER_RUNS_DIR=/workspace/.a5c/runs`,
          `--entrypoint bash`,
          IMAGE,
          `-c "cd /workspace && claude --plugin-dir '${PLUGIN_DIR}' --dangerously-skip-permissions --output-format text -p '/babysitter:babysit perform the tasks in the *.task.md files found in this dir' ; cp -r /home/claude/.a5c /workspace/.a5c 2>/dev/null || true"`,
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

  test(".a5c/runs directory has at least one run", () => {
    const runsDir = path.join(WORKSPACE_HOST, ".a5c", "runs");
    expect(fs.existsSync(runsDir)).toBe(true);

    const runs = fs.readdirSync(runsDir).filter((f) => !f.startsWith("."));
    expect(runs.length).toBeGreaterThanOrEqual(1);
  });

  test("most recent run has journal entries", () => {
    const runsDir = path.join(WORKSPACE_HOST, ".a5c", "runs");
    const runs = fs.readdirSync(runsDir).filter((f) => !f.startsWith("."));
    const latestRun = runs.sort().pop()!;

    const journalDir = path.join(runsDir, latestRun, "journal");
    expect(fs.existsSync(journalDir)).toBe(true);

    const entries = fs.readdirSync(journalDir).filter((f) => f.endsWith(".json"));
    expect(entries.length).toBeGreaterThanOrEqual(3); // RUN_CREATED + at least 2 effects
  });

  test("run status is completed", () => {
    const runsDir = path.join(WORKSPACE_HOST, ".a5c", "runs");
    const runs = fs.readdirSync(runsDir).filter((f) => !f.startsWith("."));
    const latestRun = runs.sort().pop()!;
    const runPath = path.join(runsDir, latestRun);

    const statusOut = exec(
      `docker run --rm -v ${WORKSPACE_HOST}:/workspace --entrypoint bash ${IMAGE} -c "babysitter run:status /workspace/.a5c/runs/${latestRun} --json"`,
    );
    const status = JSON.parse(statusOut.trim());
    expect(status.state).toBe("completed");
  });

  test("no pending tasks remain", () => {
    const runsDir = path.join(WORKSPACE_HOST, ".a5c", "runs");
    const runs = fs.readdirSync(runsDir).filter((f) => !f.startsWith("."));
    const latestRun = runs.sort().pop()!;

    const listOut = exec(
      `docker run --rm -v ${WORKSPACE_HOST}:/workspace --entrypoint bash ${IMAGE} -c "babysitter task:list /workspace/.a5c/runs/${latestRun} --pending --json"`,
    );
    const list = JSON.parse(listOut.trim());
    expect(list.tasks.length).toBe(0);
  });

  test("stop hook log has execution entries", () => {
    const logDir = path.join(WORKSPACE_HOST, ".e2e-logs");
    if (!fs.existsSync(logDir)) return; // Log dir may not exist if hook didn't fire

    const logFile = path.join(logDir, "babysitter-stop-hook.log");
    if (!fs.existsSync(logFile)) return;

    const logContent = fs.readFileSync(logFile, "utf-8");
    expect(logContent).toContain("Hook execution successful");
  });

  test("stop hook log shows iteration increments", () => {
    const logFile = path.join(WORKSPACE_HOST, ".e2e-logs", "babysitter-stop-hook.log");
    if (!fs.existsSync(logFile)) return;

    const logContent = fs.readFileSync(logFile, "utf-8");
    expect(logContent).toContain("Updated iteration to");
  });
});
