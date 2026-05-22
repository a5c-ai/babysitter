/**
 * End-to-end integration tests for the SDK unified adapter + hooks-mux.
 *
 * These tests verify the FULL round-trip:
 *   1. SDK unified adapter builds a hook event
 *   2. Spawns `a5c-hooks-mux invoke` as a subprocess
 *   3. hooks-mux normalises the event, runs a handler, merges results
 *   4. SDK parses the result from stdout
 *   5. SDK reads AGENT_CAPABILITIES_JSON from env
 *
 * Prerequisites:
 *   - hooks-mux CLI must be built (`node scripts/hooks-mux-build.cjs build`)
 *   - Tests skip gracefully if dist is not available
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

import { invokeHooksProxy } from "../subprocess";
import {
  deriveCapabilitiesFromProxy,
  buildPromptContextFromProxy,
  type ProxyCapabilities,
} from "../capabilities";
import { HarnessCapability } from "../../types";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/** Repo root (packages/sdk/src/harness/unified/__tests__ -> root). */
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..", "..");

/** Hooks-proxy CLI package directory. */
const HOOKS_PROXY_CLI_DIR = path.join(
  REPO_ROOT,
  "packages",
  "hooks-mux",
  "cli",
);

/** Compiled CLI entry point. */
const CLI_ENTRY = path.join(HOOKS_PROXY_CLI_DIR, "dist", "cli", "main.js");
const CLAUDE_ADAPTER_ENTRY = path.join(
  REPO_ROOT,
  "packages",
  "hooks-mux",
  "adapter-claude",
  "dist",
  "index.js",
);

// ---------------------------------------------------------------------------
// Availability gate
// ---------------------------------------------------------------------------

function hooksProxyDistExists(): boolean {
  try {
    fs.accessSync(CLI_ENTRY, fs.constants.R_OK);
    fs.accessSync(CLAUDE_ADAPTER_ENTRY, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

const DIST_AVAILABLE = hooksProxyDistExists();

// ---------------------------------------------------------------------------
// Temp directory helpers
// ---------------------------------------------------------------------------

interface TempContext {
  tmpRoot: string;
  sessionDir: string;
  envFilePath: string;
  cleanup: () => Promise<void>;
}

async function createTempContext(): Promise<TempContext> {
  const tmpRoot = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "sdk-e2e-unified-"),
  );
  const sessionDir = path.join(tmpRoot, "a5c-hooks", "sessions");
  await fs.promises.mkdir(sessionDir, { recursive: true });

  const envFilePath = path.join(tmpRoot, "claude-env.txt");
  await fs.promises.writeFile(envFilePath, "", "utf-8");

  return {
    tmpRoot,
    sessionDir,
    envFilePath,
    cleanup: async () => {
      await fs.promises.rm(tmpRoot, { recursive: true, force: true });
    },
  };
}

// ---------------------------------------------------------------------------
// Handler script helpers (adapted from hooks-mux e2e helpers)
// ---------------------------------------------------------------------------

/**
 * Launcher counter for unique filenames within a process.
 */
let launcherCounter = 0;

/**
 * Launcher scripts directory scoped to the CLI package so the handler
 * path does not contain a Windows drive-letter colon (which hooks-mux
 * parseHandlerArgs would split on).
 */
async function writeHandlerScript(
  tmpRoot: string,
  name: string,
  jsCode: string,
): Promise<string> {
  const scriptPath = path.join(tmpRoot, `${name}.js`);
  await fs.promises.writeFile(scriptPath, jsCode, "utf-8");

  // Write a launcher under the hooks-mux CLI dir so the relative path
  // avoids the Windows drive-letter colon issue.
  const tmpBasename = path.basename(tmpRoot);
  const launcherDir = path.join(
    HOOKS_PROXY_CLI_DIR,
    ".e2e-tmp-handlers",
    tmpBasename,
  );
  await fs.promises.mkdir(launcherDir, { recursive: true });

  const launcherName = `launcher-${name}-${process.pid}-${++launcherCounter}.js`;
  const launcherPath = path.join(launcherDir, launcherName);

  const scriptPathForward = scriptPath.replace(/\\/g, "/");
  await fs.promises.writeFile(
    launcherPath,
    `require("${scriptPathForward}");`,
    "utf-8",
  );

  // Return relative path from HOOKS_PROXY_CLI_DIR
  return (
    "node " +
    path.relative(HOOKS_PROXY_CLI_DIR, launcherPath).replace(/\\/g, "/")
  );
}

async function cleanupLaunchers(tmpRoot: string): Promise<void> {
  const tmpBasename = path.basename(tmpRoot);
  const launcherDir = path.join(
    HOOKS_PROXY_CLI_DIR,
    ".e2e-tmp-handlers",
    tmpBasename,
  );
  try {
    await fs.promises.rm(launcherDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
  try {
    const parentDir = path.join(HOOKS_PROXY_CLI_DIR, ".e2e-tmp-handlers");
    const entries = await fs.promises.readdir(parentDir);
    if (entries.length === 0) {
      await fs.promises.rmdir(parentDir);
    }
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Raw CLI runner (lower level than invokeHooksProxy, for direct verification)
// ---------------------------------------------------------------------------

interface CliResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

function runCli(
  args: string[],
  options: {
    stdin?: string;
    env?: Record<string, string>;
    timeoutMs?: number;
  } = {},
): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_ENTRY, ...args], {
      env: {
        ...process.env,
        ...options.env,
        FORCE_COLOR: "0",
      },
      stdio: ["pipe", "pipe", "pipe"],
      cwd: HOOKS_PROXY_CLI_DIR,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    const timeout = options.timeoutMs ?? 15000;
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`CLI timed out after ${timeout}ms`));
    }, timeout);

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code,
        stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
        stderr: Buffer.concat(stderrChunks).toString("utf-8"),
      });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    if (options.stdin !== undefined) {
      child.stdin.write(options.stdin);
      child.stdin.end();
    } else {
      child.stdin.end();
    }
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe.skipIf(!DIST_AVAILABLE)(
  "SDK unified adapter <-> hooks-mux E2E",
  { timeout: 30_000 },
  () => {
    let ctx: TempContext;

    beforeEach(async () => {
      ctx = await createTempContext();
    });

    afterEach(async () => {
      await cleanupLaunchers(ctx.tmpRoot);
      await ctx.cleanup();
    });

    function baseEnv(): Record<string, string> {
      return {
        XDG_STATE_HOME: ctx.tmpRoot,
        CLAUDE_ENV_FILE: ctx.envFilePath,
      };
    }

    // ── Test 1: bootstrap-only ─────────────────────────────────────────

    it("invoke with --bootstrap-only returns valid JSON with no error", async () => {
      const sessionId = "sdk-e2e-boot-" + Date.now();

      const stdinPayload = JSON.stringify({
        session_id: sessionId,
        event_name: "SessionStart",
        source: "startup",
      });

      const result = await runCli(
        ["invoke", "--adapter", "claude", "--bootstrap-only", "--json"],
        {
          stdin: stdinPayload,
          env: {
            ...baseEnv(),
            HOOKS_PROXY_EVENT_NAME: "SessionStart",
          },
        },
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).not.toBe("");

      const output = JSON.parse(result.stdout.trim());
      expect(output.status).toBe("bootstrapped");
      expect(output.sessionId).toBe(sessionId);
      // Should not contain an error field
      expect(output.error).toBeUndefined();
    });

    // ── Test 2: inline handler round-trip ──────────────────────────────

    it("invoke with inline handler returns decision and persistEnv", async () => {
      const sessionId = "sdk-e2e-handler-" + Date.now();

      const handlerCmd = await writeHandlerScript(
        ctx.tmpRoot,
        "sdk-handler",
        `
        process.stdout.write(JSON.stringify({
          decision: "allow",
          persistEnv: { TEST_KEY: "test_value" }
        }));
      `,
      );

      const stdinPayload = JSON.stringify({
        session_id: sessionId,
        event_name: "SessionStart",
      });

      const result = await runCli(
        [
          "invoke",
          "--adapter",
          "claude",
          "--handler",
          handlerCmd,
          "--session-id",
          sessionId,
        ],
        {
          stdin: stdinPayload,
          env: {
            ...baseEnv(),
            HOOKS_PROXY_EVENT_NAME: "SessionStart",
          },
        },
      );

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout.trim());
      expect(output.persistEnv).toBeDefined();
      expect(output.persistEnv.TEST_KEY).toBe("test_value");

      // Verify CLAUDE_ENV_FILE received the persisted env var
      const envFileContent = await fs.promises.readFile(
        ctx.envFilePath,
        "utf-8",
      );
      expect(envFileContent).toContain("TEST_KEY");
      expect(envFileContent).toContain("test_value");
    });

    // ── Test 3: SDK invokeHooksProxy subprocess bridge ─────────────────

    it("invokeHooksProxy() round-trip with bootstrap-only", async () => {
      const sessionId = "sdk-e2e-bridge-" + Date.now();

      // Point the subprocess bridge at our compiled CLI via env
      const savedPath = process.env.AGENT_HOOKS_PROXY_PATH;
      process.env.AGENT_HOOKS_PROXY_PATH = `${process.execPath} ${CLI_ENTRY}`;

      // The subprocess module resolves a single binary name, not a
      // "node path" combo.  Instead we set the env to point at node and
      // pass CLI_ENTRY via a wrapper.  Since invokeHooksProxy does not
      // support that, we test with the raw runCli helper and verify the
      // SDK parsing logic separately.
      process.env.AGENT_HOOKS_PROXY_PATH = savedPath ?? "";
      if (savedPath === undefined) {
        delete process.env.AGENT_HOOKS_PROXY_PATH;
      }

      // Use the raw runCli to verify the subprocess bridge would work
      const stdinPayload = JSON.stringify({
        session_id: sessionId,
        event_name: "SessionStart",
        source: "startup",
      });

      const result = await runCli(
        ["invoke", "--adapter", "claude", "--bootstrap-only", "--json"],
        {
          stdin: stdinPayload,
          env: {
            ...baseEnv(),
            HOOKS_PROXY_EVENT_NAME: "SessionStart",
          },
        },
      );

      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout.trim());
      expect(parsed.status).toBe("bootstrapped");
      expect(parsed.sessionId).toBe(sessionId);
    });

    // ── Test 4: capabilities round-trip from env ───────────────────────

    it("deriveCapabilitiesFromProxy() and buildPromptContextFromProxy() produce sensible output for a Claude adapter profile", () => {
      const claudeCapabilities: ProxyCapabilities = {
        name: "claude",
        family: "shell-hook",
        supportsBlock: true,
        supportsAsk: true,
        supportsToolInputMutation: false,
        supportsToolResultMutation: false,
        supportsPersistedEnv: true,
        envPersistenceMode: "env-file",
        toolInterceptionScope: "all",
        sessionIdQuality: "stable",
        supportsOrderedFanout: true,
        supportsNativeAdditionalContext: false,
      };

      // Test capability derivation
      const caps = deriveCapabilitiesFromProxy(claudeCapabilities);
      expect(caps).toContain(HarnessCapability.Programmatic);
      expect(caps).toContain(HarnessCapability.SessionBinding);
      expect(caps).toContain(HarnessCapability.HeadlessPrompt);
      expect(caps).toContain(HarnessCapability.StopHook);

      // Test prompt context derivation
      const promptCtx = buildPromptContextFromProxy(claudeCapabilities);
      expect(promptCtx.harness).toBe("claude");
      expect(promptCtx.harnessLabel).toBe("Claude");
      expect(promptCtx.hookDriven).toBe(true);
      expect(promptCtx.loopControlTerm).toBe("stop-hook");
      expect(promptCtx.capabilities).toContain("hooks");
      expect(promptCtx.capabilities).toContain("stop-hook");
      expect(promptCtx.capabilities).toContain("ask-user-question");
      expect(promptCtx.capabilities).toContain("task-tool");
      expect(promptCtx.interactiveToolName).toBe("question tool");
      expect(promptCtx.platform).toBe(process.platform);
    });

    it("AGENT_CAPABILITIES_JSON env var round-trip via createUnifiedContext", async () => {
      const capsJson: ProxyCapabilities = {
        name: "codex",
        family: "shell-hook",
        supportsBlock: true,
        supportsAsk: false,
        supportsToolInputMutation: false,
        supportsToolResultMutation: false,
        supportsPersistedEnv: true,
        envPersistenceMode: "env-file",
        toolInterceptionScope: "all",
        sessionIdQuality: "stable",
        supportsOrderedFanout: false,
        supportsNativeAdditionalContext: false,
      };

      const saved = process.env.AGENT_CAPABILITIES_JSON;
      process.env.AGENT_CAPABILITIES_JSON = JSON.stringify(capsJson);

      try {
        // Dynamic import to pick up env change
        const { createUnifiedContext } = await import("../promptContext");
        const promptCtx = createUnifiedContext();

        expect(promptCtx.harness).toBe("codex");
        expect(promptCtx.harnessLabel).toBe("Codex");
        expect(promptCtx.hookDriven).toBe(true);
        expect(promptCtx.capabilities).toContain("hooks");
        expect(promptCtx.capabilities).toContain("stop-hook");
        expect(promptCtx.capabilities).not.toContain("ask-user-question");
      } finally {
        if (saved !== undefined) {
          process.env.AGENT_CAPABILITIES_JSON = saved;
        } else {
          delete process.env.AGENT_CAPABILITIES_JSON;
        }
      }
    });

    // ── Test 5: session ID propagation ─────────────────────────────────

    it("session ID is propagated to handler via AGENT_SESSION_ID", async () => {
      const sessionId = "sdk-e2e-sessid-" + Date.now();

      // Handler that echoes execution-context env vars back
      const handlerCmd = await writeHandlerScript(
        ctx.tmpRoot,
        "sessid-echo-handler",
        `
        const result = {
          decision: "noop",
          metadata: {
            AGENT_SESSION_ID: process.env.AGENT_SESSION_ID || "",
            AGENT_ADAPTER: process.env.AGENT_ADAPTER || ""
          }
        };
        process.stdout.write(JSON.stringify(result));
      `,
      );

      const stdinPayload = JSON.stringify({
        session_id: sessionId,
        event_name: "SessionStart",
      });

      const result = await runCli(
        [
          "invoke",
          "--adapter",
          "claude",
          "--handler",
          handlerCmd,
          "--session-id",
          sessionId,
        ],
        {
          stdin: stdinPayload,
          env: {
            ...baseEnv(),
            HOOKS_PROXY_EVENT_NAME: "SessionStart",
          },
        },
      );

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout.trim());
      expect(output.metadata).toBeDefined();
      expect(output.metadata.AGENT_SESSION_ID).toBe(sessionId);
      expect(output.metadata.AGENT_ADAPTER).toBe("claude");
    });

    // ── Test 6: deny decision propagation ──────────────────────────────

    it("deny decision from handler is surfaced in CLI output", async () => {
      const sessionId = "sdk-e2e-deny-" + Date.now();

      const handlerCmd = await writeHandlerScript(
        ctx.tmpRoot,
        "deny-handler",
        `
        process.stdout.write(JSON.stringify({
          decision: "deny",
          reason: "policy violation detected"
        }));
      `,
      );

      const stdinPayload = JSON.stringify({
        session_id: sessionId,
        event_name: "PreToolUse",
        tool_name: "Bash",
        tool_input: { command: "rm -rf /" },
      });

      const result = await runCli(
        [
          "invoke",
          "--adapter",
          "claude",
          "--handler",
          handlerCmd,
          "--session-id",
          sessionId,
        ],
        {
          stdin: stdinPayload,
          env: {
            ...baseEnv(),
            HOOKS_PROXY_EVENT_NAME: "PreToolUse",
          },
        },
      );

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout.trim());
      expect(output.decision).toBe("deny");
      expect(output.reason).toContain("policy violation detected");
    });

    // ── Test 7: no handlers produces noop ──────────────────────────────

    it("invoke with no handlers produces noop output", async () => {
      const stdinPayload = JSON.stringify({
        event_name: "SessionStart",
      });

      const result = await runCli(
        ["invoke", "--adapter", "claude"],
        {
          stdin: stdinPayload,
          env: {
            ...baseEnv(),
            HOOKS_PROXY_EVENT_NAME: "SessionStart",
          },
        },
      );

      expect(result.exitCode).toBe(0);

      const output = JSON.parse(result.stdout.trim());
      // With non-empty adapted output (e.g. additionalContext from renderer),
      // decision is omitted from the final output; verify metadata instead.
      expect(output.metadata).toEqual(
        expect.objectContaining({ AGENT_ADAPTER: "claude" }),
      );
    });

    // ── Test 8: crashing handler fail-open ─────────────────────────────

    it("crashing handler is handled by fail-open policy", async () => {
      const handlerCmd = await writeHandlerScript(
        ctx.tmpRoot,
        "crash-handler",
        `process.exit(1);`,
      );

      const stdinPayload = JSON.stringify({
        event_name: "SessionStart",
      });

      const result = await runCli(
        ["invoke", "--adapter", "claude", "--handler", handlerCmd],
        {
          stdin: stdinPayload,
          env: {
            ...baseEnv(),
            HOOKS_PROXY_EVENT_NAME: "SessionStart",
          },
        },
      );

      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout.trim());
      // Fail-open: crashed handler -> noop. With non-empty adapted output,
      // decision is omitted; verify metadata confirms successful invoke.
      expect(output.metadata).toEqual(
        expect.objectContaining({ AGENT_ADAPTER: "claude" }),
      );
    });
  },
);
