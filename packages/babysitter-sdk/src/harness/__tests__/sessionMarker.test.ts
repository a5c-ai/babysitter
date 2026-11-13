import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  getSessionMarkerPath,
  writeSessionMarker,
  readSessionMarker,
  findHarnessAncestorPid,
  isSessionPidMarkerEnabled,
  __resetCacheForTests,
  __setAncestorResolverForTests,
} from "../../utils/sessionMarker";

let tmpDir: string;
let savedGlobalStateDir: string | undefined;
let savedPidMarkerFlag: string | undefined;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "session-marker-test-"));
  savedGlobalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
  savedPidMarkerFlag = process.env.AGENT_ENABLE_SESSION_PID_MARKERS;
  process.env.BABYSITTER_GLOBAL_STATE_DIR = tmpDir;
  delete process.env.AGENT_ENABLE_SESSION_PID_MARKERS;
  delete process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS;
  __resetCacheForTests();
});

afterEach(async () => {
  if (savedGlobalStateDir === undefined) {
    delete process.env.BABYSITTER_GLOBAL_STATE_DIR;
  } else {
    process.env.BABYSITTER_GLOBAL_STATE_DIR = savedGlobalStateDir;
  }
  if (savedPidMarkerFlag === undefined) {
    delete process.env.AGENT_ENABLE_SESSION_PID_MARKERS;
  } else {
    process.env.AGENT_ENABLE_SESSION_PID_MARKERS = savedPidMarkerFlag;
  }
  delete process.env.BABYSITTER_ENABLE_SESSION_PID_MARKERS;
  __resetCacheForTests();
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

describe("getSessionMarkerPath", () => {
  it("returns a deterministic, harness-slug-keyed path", () => {
    const a = getSessionMarkerPath("claude-code", 1234);
    const b = getSessionMarkerPath("claude-code", 1234);
    expect(a).toBe(b);
    expect(a).toBe(path.join(tmpDir, "state", "current-session-claude-code-pid-1234"));
  });

  it("slugifies non-kebab harness names", () => {
    const p = getSessionMarkerPath("Claude Code!", 5);
    expect(p).toBe(path.join(tmpDir, "state", "current-session-claude-code-pid-5"));
  });

  it("keeps different harnesses in different files", () => {
    const a = getSessionMarkerPath("claude-code", 1);
    const b = getSessionMarkerPath("codex", 1);
    expect(a).not.toBe(b);
  });
});

describe("write/read round-trip with injected ancestor", () => {
  it("enables pid markers by default and permits an explicit opt-out", () => {
    __setAncestorResolverForTests(() => ({ pid: process.pid }));

    expect(isSessionPidMarkerEnabled()).toBe(true);
    expect(writeSessionMarker("claude-code", "sess-default")).toBe(
      getSessionMarkerPath("claude-code", process.pid),
    );
    expect(readSessionMarker("claude-code")).toBe("sess-default");

    process.env.AGENT_ENABLE_SESSION_PID_MARKERS = "0";
    expect(isSessionPidMarkerEnabled()).toBe(false);
    expect(writeSessionMarker("claude-code", "sess-disabled")).toBeUndefined();
    expect(readSessionMarker("claude-code")).toBeUndefined();
  });

  it("round-trips a session id when ancestor resolver returns self", () => {
    process.env.AGENT_ENABLE_SESSION_PID_MARKERS = "1";
    __setAncestorResolverForTests(() => ({ pid: process.pid }));

    const written = writeSessionMarker("claude-code", "sess-123");
    expect(written).toBe(
      path.join(tmpDir, "state", `current-session-claude-code-pid-${process.pid}`),
    );
    expect(readSessionMarker("claude-code")).toBe("sess-123");
  });

  it("writeSessionMarker returns undefined when ancestor cannot be found", () => {
    process.env.AGENT_ENABLE_SESSION_PID_MARKERS = "1";
    __setAncestorResolverForTests(() => undefined);
    expect(writeSessionMarker("claude-code", "ignored")).toBeUndefined();
    expect(readSessionMarker("claude-code")).toBeUndefined();
  });

  it("readSessionMarker returns undefined when ancestor is dead", () => {
    // 999999 is almost certainly not a live process.
    __setAncestorResolverForTests(() => ({ pid: 999999 }));
    writeSessionMarker("claude-code", "stale-session");
    expect(readSessionMarker("claude-code")).toBeUndefined();
  });

  it("rejects markers from a prior process that reused a PID", async () => {
    __setAncestorResolverForTests(() => ({ pid: process.pid }));
    const markerPath = writeSessionMarker("claude-code", "old-session")!;
    const marker = JSON.parse(await fs.readFile(markerPath, "utf8"));
    marker.processStartIdentity = "prior-process-start";
    await fs.writeFile(markerPath, JSON.stringify(marker));
    expect(readSessionMarker("claude-code")).toBeUndefined();
  });

  it("ignores legacy PID-only markers because PID reuse cannot be ruled out", async () => {
    __setAncestorResolverForTests(() => ({ pid: process.pid }));
    const markerPath = getSessionMarkerPath("claude-code", process.pid);
    await fs.mkdir(path.dirname(markerPath), { recursive: true });
    await fs.writeFile(markerPath, "old-session\n");
    expect(readSessionMarker("claude-code")).toBeUndefined();
  });

  it("returns no marker when the state directory is unwritable", async () => {
    const blockedRoot = path.join(tmpDir, "blocked-root");
    await fs.writeFile(blockedRoot, "file, not a directory");
    process.env.BABYSITTER_GLOBAL_STATE_DIR = blockedRoot;
    __setAncestorResolverForTests(() => ({ pid: process.pid }));
    expect(writeSessionMarker("claude-code", "session")).toBeUndefined();
  });

  it("two different harnesses produce two different marker files", () => {
    process.env.AGENT_ENABLE_SESSION_PID_MARKERS = "1";
    __setAncestorResolverForTests(() => ({ pid: process.pid }));
    writeSessionMarker("claude-code", "claude-session");
    writeSessionMarker("codex", "codex-session");
    expect(readSessionMarker("claude-code")).toBe("claude-session");
    expect(readSessionMarker("codex")).toBe("codex-session");
  });

  it("keeps concurrent Claude sessions scoped to their ancestor PID", () => {
    let activePid = process.pid;
    const otherPid = process.ppid;
    __setAncestorResolverForTests(() => ({ pid: activePid }));

    writeSessionMarker("claude-code", "session-a");
    activePid = otherPid;
    writeSessionMarker("claude-code", "session-b");

    expect(readSessionMarker("claude-code")).toBe("session-b");
    activePid = process.pid;
    expect(readSessionMarker("claude-code")).toBe("session-a");
    expect(getSessionMarkerPath("claude-code", otherPid)).not.toBe(
      getSessionMarkerPath("claude-code", process.pid),
    );
  });
});

describe("findHarnessAncestorPid (real walk)", () => {
  it(
    "returns undefined cleanly when no target name matches",
    async () => {
      const first = findHarnessAncestorPid(["__no_such_process_name_xyz__"]);
      expect(first).toBeUndefined();
      // Second call hits the cache path.
      const second = findHarnessAncestorPid(["__no_such_process_name_xyz__"]);
      expect(second).toBeUndefined();
    },
    30_000,
  );
});
