/**
 * Tests for the harness discovery module.
 *
 * Covers:
 *   - KNOWN_HARNESSES constant completeness
 *   - discoverHarnesses() — installed CLI detection (PATH + config, no env vars)
 *   - checkCliAvailable() — happy path, CLI not found, timeout, version parsing
 *   - detectCallerHarness() — env-var-based caller detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execFile } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { promises as fsPromises } from "node:fs";

// Mock child_process before importing the module under test.
vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

// Mock node:fs to control detectConfig behaviour.
vi.mock("node:fs", () => ({
  promises: {
    access: vi.fn().mockRejectedValue(new Error("ENOENT")),
  },
}));

import {
  KNOWN_HARNESSES,
  discoverHarnesses,
  detectCallerHarness,
  checkCliAvailable,
} from "../discovery";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockedExecFile = vi.mocked(execFile);
const mockedFsAccess = vi.mocked(fsPromises.access);

type ExecFileCallback = (error: Error | null, stdout: string | Buffer) => void;

/**
 * Configures the execFile mock to resolve or reject per-command.
 *
 * @param responses - Map of command strings to their mock behaviour. When the
 *   value is a string it's treated as stdout; when it's an Error the callback
 *   receives an error.
 */
function stubExecFile(
  responses: Record<string, string | Error>,
): void {
  mockedExecFile.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((...args: unknown[]): ChildProcess => {
      const command = args[0] as string;
      const cmdArgs = args[1] as string[];
      const callback = args[args.length - 1] as ExecFileCallback;

      // Build a lookup key. For `which`/`where` calls the first arg is the CLI
      // name; for version calls it's `<cli> --version`.
      const key = command === "which" || command === "where"
        ? `locate:${cmdArgs[0]}`
        : `${command} ${cmdArgs.join(" ")}`;

      const response = responses[key];

      if (response instanceof Error) {
        callback(response, "");
      } else if (typeof response === "string") {
        callback(null, response);
      } else {
        // Default: command not found.
        callback(new Error(`${command}: not found`), "");
      }

      // Return a minimal ChildProcess-like object.
      const fakeChild = {
        on: vi.fn().mockReturnThis(),
        stdout: null,
        stderr: null,
        pid: 0,
      };
      return fakeChild as unknown as ChildProcess;
    }) as typeof execFile,
  );
}

// ---------------------------------------------------------------------------
// Env cleanup — all env vars used by callerEnvVars across all harnesses
// ---------------------------------------------------------------------------

const CALLER_ENV_KEYS = [
  "BABYSITTER_SESSION_ID",
  "CLAUDE_ENV_FILE",
  "CODEX_THREAD_ID",
  "CODEX_SESSION_ID",
  "CODEX_PLUGIN_ROOT",
  "OMP_SESSION_ID",
  "PI_SESSION_ID",
  "OMP_PLUGIN_ROOT",
  "PI_PLUGIN_ROOT",
  "GEMINI_SESSION_ID",
  "GEMINI_PROJECT_DIR",
  "GEMINI_CWD",
  "CURSOR_PROJECT_DIR",
  "CURSOR_VERSION",
];

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const key of CALLER_ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  vi.clearAllMocks();
  mockedFsAccess.mockRejectedValue(new Error("ENOENT"));
});

afterEach(() => {
  for (const key of CALLER_ENV_KEYS) {
    if (savedEnv[key] !== undefined) {
      process.env[key] = savedEnv[key];
    } else {
      delete process.env[key];
    }
  }
});

// ---------------------------------------------------------------------------
// KNOWN_HARNESSES
// ---------------------------------------------------------------------------

describe("KNOWN_HARNESSES", () => {
  it("contains exactly 9 harness specs", () => {
    expect(KNOWN_HARNESSES).toHaveLength(9);
  });

  it("includes all expected harness names", () => {
    const names = KNOWN_HARNESSES.map((h) => h.name);
    expect(names).toContain("claude-code");
    expect(names).toContain("codex");
    expect(names).toContain("pi");
    expect(names).toContain("oh-my-pi");
    expect(names).toContain("gemini-cli");
    expect(names).toContain("cursor");
    expect(names).toContain("opencode");
    expect(names).toContain("github-copilot");
    expect(names).toContain("internal");
  });
});

// ---------------------------------------------------------------------------
// checkCliAvailable
// ---------------------------------------------------------------------------

describe("checkCliAvailable", () => {
  it("returns available=true with path and version when CLI is found", async () => {
    stubExecFile({
      "locate:claude": "/usr/local/bin/claude",
      "claude --version": "claude v1.2.3\n",
    });

    const result = await checkCliAvailable("claude");

    expect(result.available).toBe(true);
    expect(result.path).toBe("/usr/local/bin/claude");
    expect(result.version).toBe("1.2.3");
  });

  it("returns available=false when CLI is not found", async () => {
    stubExecFile({});

    const result = await checkCliAvailable("nonexistent-cli");

    expect(result.available).toBe(false);
    expect(result.path).toBeUndefined();
    expect(result.version).toBeUndefined();
  });

  it("returns available=true without version when --version fails", async () => {
    stubExecFile({
      "locate:codex": "/usr/bin/codex\n",
      "codex --version": new Error("no version flag"),
    });

    const result = await checkCliAvailable("codex");

    expect(result.available).toBe(true);
    expect(result.path).toBe("/usr/bin/codex");
    expect(result.version).toBeUndefined();
  });

  it("returns available=false when locate command times out", async () => {
    stubExecFile({
      "locate:slowcli": new Error("Command timed out"),
    });

    const result = await checkCliAvailable("slowcli");

    expect(result.available).toBe(false);
  });

  it("parses semver from verbose --version output", async () => {
    stubExecFile({
      "locate:gemini": "/opt/bin/gemini",
      "gemini --version": "Google Gemini CLI version 0.5.1-beta.2 (build abc123)",
    });

    const result = await checkCliAvailable("gemini");

    expect(result.available).toBe(true);
    expect(result.version).toBe("0.5.1-beta.2");
  });

  it("handles version string with v prefix", async () => {
    stubExecFile({
      "locate:pi": "/usr/local/bin/pi",
      "pi --version": "v3.0.0",
    });

    const result = await checkCliAvailable("pi");

    expect(result.version).toBe("3.0.0");
  });

  it("returns available=false when locate returns empty output", async () => {
    stubExecFile({
      "locate:empty": "",
    });

    const result = await checkCliAvailable("empty");

    expect(result.available).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// discoverHarnesses (installed discovery — no env var checks)
// ---------------------------------------------------------------------------

describe("discoverHarnesses", () => {
  it("returns results for all 9 known harnesses", async () => {
    stubExecFile({});

    const results = await discoverHarnesses();

    expect(results).toHaveLength(9);
    const names = results.map((r) => r.name);
    expect(names).toContain("claude-code");
    expect(names).toContain("codex");
    expect(names).toContain("pi");
    expect(names).toContain("oh-my-pi");
    expect(names).toContain("gemini-cli");
    expect(names).toContain("cursor");
    expect(names).toContain("opencode");
    expect(names).toContain("internal");
  });

  it("returns results sorted alphabetically by name", async () => {
    stubExecFile({});

    const results = await discoverHarnesses();
    const names = results.map((r) => r.name);

    expect(names).toEqual([...names].sort());
  });

  it("marks harness as installed when CLI is found", async () => {
    stubExecFile({
      "locate:claude": "/usr/local/bin/claude",
      "claude --version": "1.0.0",
    });

    const results = await discoverHarnesses();
    const claude = results.find((r) => r.name === "claude-code");

    expect(claude?.installed).toBe(true);
    expect(claude?.cliPath).toBe("/usr/local/bin/claude");
    expect(claude?.version).toBe("1.0.0");
  });

  it("marks harness as not installed when CLI is not found", async () => {
    stubExecFile({});

    const results = await discoverHarnesses();
    const cursor = results.find((r) => r.name === "cursor");

    expect(cursor?.installed).toBe(false);
    expect(cursor?.cliPath).toBeUndefined();
  });

  it("populates platform on every result", async () => {
    stubExecFile({});

    const results = await discoverHarnesses();

    for (const result of results) {
      expect(result.platform).toBe(process.platform);
    }
  });

  it("populates capabilities from the spec", async () => {
    stubExecFile({});

    const results = await discoverHarnesses();
    const pi = results.find((r) => r.name === "pi");

    expect(pi?.capabilities).toContain("programmatic");
    expect(pi?.capabilities).toContain("session-binding");
    expect(pi?.capabilities).toContain("headless-prompt");
    expect(pi?.capabilities).not.toContain("stop-hook");

    const internal = results.find((r) => r.name === "internal");
    expect(internal?.capabilities).toContain("programmatic");
    expect(internal?.capabilities).toContain("session-binding");
    expect(internal?.installed).toBe(true);
  });

  it("sets cliCommand from the spec", async () => {
    stubExecFile({});

    const results = await discoverHarnesses();
    const gemini = results.find((r) => r.name === "gemini-cli");

    expect(gemini?.cliCommand).toBe("gemini");
  });

  it("does not include activeSession in results", async () => {
    process.env.CLAUDE_ENV_FILE = "/tmp/.claude-env";
    stubExecFile({});

    const results = await discoverHarnesses();
    const claude = results.find((r) => r.name === "claude-code");

    // activeSession is not part of the installed-discovery result
    expect(claude).not.toHaveProperty("activeSession");
  });

  it("detects oh-my-pi config from .omp instead of .pi", async () => {
    stubExecFile({});
    mockedFsAccess.mockImplementation(async (targetPath) => {
      if (String(targetPath).includes(".omp")) {
        return;
      }
      throw new Error("ENOENT");
    });

    const results = await discoverHarnesses();
    const ohMyPi = results.find((r) => r.name === "oh-my-pi");
    const pi = results.find((r) => r.name === "pi");

    expect(ohMyPi?.configFound).toBe(true);
    expect(pi?.configFound).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectCallerHarness (caller detection — env var based)
// ---------------------------------------------------------------------------

describe("detectCallerHarness", () => {
  it("returns null when no caller env vars are set", () => {
    const caller = detectCallerHarness();
    expect(caller).toBeNull();
  });

  it("detects claude-code via CLAUDE_ENV_FILE", () => {
    process.env.CLAUDE_ENV_FILE = "/tmp/.claude-env";

    const caller = detectCallerHarness();

    expect(caller).not.toBeNull();
    expect(caller!.name).toBe("claude-code");
    expect(caller!.matchedEnvVars).toContain("CLAUDE_ENV_FILE");
  });

  it("does not detect a harness from BABYSITTER_SESSION_ID alone", () => {
    // BABYSITTER_SESSION_ID is cross-harness and should not identify any specific harness
    process.env.BABYSITTER_SESSION_ID = "session-abc";

    const caller = detectCallerHarness();
    expect(caller).toBeNull();
  });

  it("detects codex via CODEX_THREAD_ID", () => {
    process.env.CODEX_THREAD_ID = "thread-123";

    const caller = detectCallerHarness();

    expect(caller).not.toBeNull();
    expect(caller!.name).toBe("codex");
    expect(caller!.matchedEnvVars).toContain("CODEX_THREAD_ID");
  });

  it("detects codex via CODEX_SESSION_ID", () => {
    process.env.CODEX_SESSION_ID = "codex-sess-1";

    const caller = detectCallerHarness();

    expect(caller).not.toBeNull();
    expect(caller!.name).toBe("codex");
  });

  it("detects codex via CODEX_PLUGIN_ROOT", () => {
    process.env.CODEX_PLUGIN_ROOT = "/home/user/.codex/plugins/babysitter";

    const caller = detectCallerHarness();

    expect(caller).not.toBeNull();
    expect(caller!.name).toBe("codex");
    expect(caller!.matchedEnvVars).toContain("CODEX_PLUGIN_ROOT");
  });

  it("detects gemini-cli via GEMINI_SESSION_ID", () => {
    process.env.GEMINI_SESSION_ID = "gemini-sess-1";

    const caller = detectCallerHarness();

    expect(caller).not.toBeNull();
    expect(caller!.name).toBe("gemini-cli");
    expect(caller!.matchedEnvVars).toContain("GEMINI_SESSION_ID");
  });

  it("detects gemini-cli via GEMINI_CWD", () => {
    process.env.GEMINI_CWD = "/home/user/project";

    const caller = detectCallerHarness();

    expect(caller).not.toBeNull();
    expect(caller!.name).toBe("gemini-cli");
    expect(caller!.matchedEnvVars).toContain("GEMINI_CWD");
  });

  it("detects pi via PI_SESSION_ID", () => {
    process.env.PI_SESSION_ID = "pi-sess-1";

    const caller = detectCallerHarness();

    expect(caller).not.toBeNull();
    expect(caller!.name).toBe("pi");
    expect(caller!.matchedEnvVars).toContain("PI_SESSION_ID");
  });

  it("detects oh-my-pi via OMP_SESSION_ID", () => {
    process.env.OMP_SESSION_ID = "omp-sess-1";

    const caller = detectCallerHarness();

    expect(caller).not.toBeNull();
    expect(caller!.name).toBe("oh-my-pi");
  });

  it("returns only the first matching harness", () => {
    // Set env vars for multiple harnesses
    process.env.CLAUDE_ENV_FILE = "/tmp/.claude-env";
    process.env.CODEX_SESSION_ID = "codex-456";

    const caller = detectCallerHarness();

    // claude-code is first in KNOWN_HARNESSES, so it wins
    expect(caller).not.toBeNull();
    expect(caller!.name).toBe("claude-code");
  });

  it("reports all matched env vars for the winning harness", () => {
    process.env.CODEX_THREAD_ID = "thread-1";
    process.env.CODEX_SESSION_ID = "sess-1";
    process.env.CODEX_PLUGIN_ROOT = "/plugins/babysitter";

    const caller = detectCallerHarness();

    expect(caller).not.toBeNull();
    expect(caller!.name).toBe("codex");
    expect(caller!.matchedEnvVars).toContain("CODEX_THREAD_ID");
    expect(caller!.matchedEnvVars).toContain("CODEX_SESSION_ID");
    expect(caller!.matchedEnvVars).toContain("CODEX_PLUGIN_ROOT");
    expect(caller!.matchedEnvVars).toHaveLength(3);
  });

  it("includes capabilities of the detected caller", () => {
    process.env.CLAUDE_ENV_FILE = "/tmp/.claude-env";

    const caller = detectCallerHarness();

    expect(caller).not.toBeNull();
    expect(caller!.capabilities).toContain("session-binding");
    expect(caller!.capabilities).toContain("stop-hook");
    expect(caller!.capabilities).toContain("mcp");
    expect(caller!.capabilities).toContain("headless-prompt");
  });

  it("detects cursor via CURSOR_PROJECT_DIR", () => {
    process.env.CURSOR_PROJECT_DIR = "/home/user/project";

    const caller = detectCallerHarness();

    expect(caller).not.toBeNull();
    expect(caller!.name).toBe("cursor");
    expect(caller!.matchedEnvVars).toContain("CURSOR_PROJECT_DIR");
  });

  it("detects cursor via CURSOR_VERSION", () => {
    process.env.CURSOR_VERSION = "1.7.0";

    const caller = detectCallerHarness();

    expect(caller).not.toBeNull();
    expect(caller!.name).toBe("cursor");
    expect(caller!.matchedEnvVars).toContain("CURSOR_VERSION");
  });

  it("does not detect cursor from unrelated CURSOR_SESSION_ID env var", () => {
    // CURSOR_SESSION_ID is not in callerEnvVars — only CURSOR_PROJECT_DIR
    // and CURSOR_VERSION are used for detection
    process.env.CURSOR_SESSION_ID = "cursor-123";

    const caller = detectCallerHarness();
    expect(caller).toBeNull();

    delete process.env.CURSOR_SESSION_ID;
  });
});
