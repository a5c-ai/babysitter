import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getGlobalStateDir } from "../../config";
import { getSessionFilePath, writeSessionFile } from "../index";
import { runSessionCleanup } from "../cleanup";
import type { SessionState } from "../types";

let tmpDir: string;
let stateDir: string;
let savedGlobalStateDir: string | undefined;

function makeState(overrides: Partial<SessionState> = {}): SessionState {
  return {
    active: true,
    iteration: 1,
    maxIterations: 65_000,
    runId: "",
    runIds: [],
    startedAt: "2020-01-01T00:00:00.000Z",
    lastIterationAt: "2020-01-01T00:00:00.000Z",
    iterationTimes: [],
    ...overrides,
  };
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "session-cleanup-test-"));
  savedGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
  process.env.BABYSITTER_GLOBAL_STATE_DIR = tmpDir;
  stateDir = getGlobalStateDir();
  mkdirSync(stateDir, { recursive: true });
});

afterEach(async () => {
  if (savedGlobalStateDir === undefined) {
    delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
  } else {
    process.env.BABYSITTER_GLOBAL_STATE_DIR = savedGlobalStateDir;
  }
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors.
  }
});

async function seedFixtures(): Promise<void> {
  writeFileSync(
    path.join(stateDir, `current-session-claude-code-pid-${process.pid}`),
    "SESS-A\n",
  );
  writeFileSync(
    path.join(stateDir, "current-session-claude-code-pid-999999"),
    "SESS-B\n",
  );
  await writeSessionFile(
    getSessionFilePath(stateDir, "SESS-A"),
    makeState({ runId: "" }),
    "prompt-a",
  );
  await writeSessionFile(
    getSessionFilePath(stateDir, "SESS-B"),
    makeState({
      runId: "",
      lastIterationAt: "2020-01-01T00:00:00.000Z",
    }),
    "prompt-b",
  );
}

describe("runSessionCleanup", () => {
  it("removes dead markers and deactivates stale session files", async () => {
    await seedFixtures();

    const result = await runSessionCleanup({
      harness: "claude-code",
      dryRun: false,
      stateDir,
      runsDir: path.join(tmpDir, "nonexistent-runs"),
    });

    expect(result.dryRun).toBe(false);
    expect(result.markersRemoved).toContain("current-session-claude-code-pid-999999");
    expect(
      existsSync(path.join(stateDir, `current-session-claude-code-pid-${process.pid}`)),
    ).toBe(true);
    expect(
      existsSync(path.join(stateDir, "current-session-claude-code-pid-999999")),
    ).toBe(false);

    const activeContent = readFileSync(getSessionFilePath(stateDir, "SESS-A"), "utf8");
    expect(activeContent).toMatch(/active: true/);

    expect(result.statesDeactivated).toContain("SESS-B");
    const inactiveContent = readFileSync(getSessionFilePath(stateDir, "SESS-B"), "utf8");
    expect(inactiveContent).toMatch(/active: false/);
    expect(inactiveContent).toContain('metadata_sessionCleanupReason: "stale_session"');
    expect(inactiveContent).toContain('metadata_sessionCleanupSource: "session:cleanup"');
    expect(inactiveContent).toContain("prompt-b");
  });

  it("reports actions in dry-run mode without mutating files", async () => {
    await seedFixtures();

    const result = await runSessionCleanup({
      harness: "claude-code",
      dryRun: true,
      stateDir,
      runsDir: path.join(tmpDir, "nonexistent-runs"),
    });

    expect(result.dryRun).toBe(true);
    expect(result.markersRemoved).toContain("current-session-claude-code-pid-999999");
    expect(result.statesDeactivated).toContain("SESS-B");
    expect(
      existsSync(path.join(stateDir, "current-session-claude-code-pid-999999")),
    ).toBe(true);

    const content = readFileSync(getSessionFilePath(stateDir, "SESS-B"), "utf8");
    expect(content).toMatch(/active: true/);
  });
});

