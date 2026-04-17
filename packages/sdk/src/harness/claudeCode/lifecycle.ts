import * as path from "node:path";
import { loadJournal } from "../../storage/journal";
import {
  getSessionFilePath,
  readSessionFile,
  sessionFileExists,
} from "../../session/parse";
import type { SessionState } from "../../session/types";
import {
  deleteSessionFile,
  getCurrentTimestamp,
  updateSessionState,
  writeSessionFile,
} from "../../session/write";
import {
  execFilePromise,
  getClaudeInstalledPluginsPath,
  installCliViaNpm,
  isClaudePluginInstalled,
  renderCommand,
} from "../installSupport";
import type {
  HarnessInstallOptions,
  HarnessInstallResult,
  SessionBindOptions,
  SessionBindResult,
} from "../types";
import { normalizeSessionStateDir } from "../../config";
import { BabysitterRuntimeError, ErrorCategory } from "../../runtime/exceptions";

export async function bindClaudeCodeSession(
  opts: SessionBindOptions,
): Promise<SessionBindResult> {
  const { sessionId, runId, runsDir, maxIterations = 256, prompt, verbose } = opts;
  const resolvedRunDir = path.resolve(opts.runDir);
  const stateDir = normalizeSessionStateDir(
    opts.stateDir ?? process.env.BABYSITTER_STATE_DIR,
  );
  const filePath = getSessionFilePath(stateDir, sessionId);

  if (await sessionFileExists(filePath)) {
    try {
      const existing = await readSessionFile(filePath);
      if (existing.state.runId && existing.state.runId !== runId) {
        const oldRunId = existing.state.runId;
        let isTerminal = false;

        if (existing.state.runDir) {
          try {
            const journal = await loadJournal(existing.state.runDir);
            const hasCompleted = journal.some((e) => e.type === "RUN_COMPLETED");
            const hasFailed = journal.some((e) => e.type === "RUN_FAILED");
            isTerminal = hasCompleted || hasFailed;
          } catch {
            // Safe default
          }
        } else if (runsDir) {
          try {
            const oldRunDir = path.join(runsDir, oldRunId);
            const journal = await loadJournal(oldRunDir);
            const hasCompleted = journal.some((e) => e.type === "RUN_COMPLETED");
            const hasFailed = journal.some((e) => e.type === "RUN_FAILED");
            isTerminal = hasCompleted || hasFailed;
          } catch {
            // Safe default
          }
        }

        if (isTerminal) {
          if (verbose) {
            process.stderr.write(
              `[run:create] Auto-releasing stale session ${sessionId} from terminal run ${oldRunId}\n`,
            );
          }
          await deleteSessionFile(filePath);
        } else {
          return {
            harness: "claude-code",
            sessionId,
            stateFile: filePath,
            error: `Session bound to active run: ${oldRunId}. Complete or fail that run first, or manually remove the session state file at ${filePath}`,
            fatal: true,
          };
        }
      } else {
        await updateSessionState(filePath, { runId, runDir: resolvedRunDir, active: true }, {
          state: existing.state,
          prompt: existing.prompt,
        });
        if (verbose) {
          process.stderr.write(`[run:create] Updated existing session ${sessionId} with run ${runId}\n`);
        }
        return { harness: "claude-code", sessionId, stateFile: filePath };
      }
    } catch {
      // Overwrite corrupted state file
    }
  }

  const nowTs = getCurrentTimestamp();
  const state: SessionState = {
    active: true,
    iteration: 1,
    maxIterations,
    runId,
    runDir: resolvedRunDir,
    runIds: [],
    startedAt: nowTs,
    lastIterationAt: nowTs,
    iterationTimes: [],
  };

  try {
    await writeSessionFile(filePath, state, prompt);
  } catch (e) {
    return {
      harness: "claude-code",
      sessionId,
      error: `Failed to write session state: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  if (verbose) {
    process.stderr.write(`[run:create] Session ${sessionId} initialized and bound to run ${runId}\n`);
  }
  return { harness: "claude-code", sessionId, stateFile: filePath };
}

export async function installClaudeCodeHarness(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  return installCliViaNpm({
    harness: "claude-code",
    cliCommand: "claude",
    packageName: "@anthropic-ai/claude-code",
    summary: "Install the Claude Code CLI globally via npm.",
    options,
  });
}

export async function installClaudeCodePlugin(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  if (isClaudePluginInstalled()) {
    return {
      harness: "claude-code",
      warning: "The Claude Code Babysitter plugin already appears in installed_plugins.json; skipping reinstall.",
      location: getClaudeInstalledPluginsPath(),
    };
  }

  if (options.dryRun) {
    return {
      harness: "claude-code",
      dryRun: true,
      summary: "Add the published Babysitter Claude Code plugin to the marketplace and install it at user scope.",
      command: [
        renderCommand("claude", ["plugin", "marketplace", "add", "a5c-ai/babysitter"]),
        renderCommand("claude", ["plugin", "install", "--scope", "user", "babysitter@a5c.ai"]),
      ].join(" && "),
    };
  }

  const marketplaceArgs = ["plugin", "marketplace", "add", "a5c-ai/babysitter"];
  const marketplaceResult = await execFilePromise("claude", marketplaceArgs);
  if (marketplaceResult.exitCode !== 0) {
    throw new BabysitterRuntimeError(
      "ClaudePluginMarketplaceAddFailed",
      "claude plugin marketplace add a5c-ai/babysitter failed",
      {
        category: ErrorCategory.External,
        details: {
          stdout: marketplaceResult.stdout,
          stderr: marketplaceResult.stderr,
          exitCode: marketplaceResult.exitCode,
        },
      },
    );
  }

  const installArgs = ["plugin", "install", "--scope", "user", "babysitter@a5c.ai"];
  const installResult = await execFilePromise("claude", installArgs);
  if (installResult.exitCode !== 0) {
    throw new BabysitterRuntimeError(
      "ClaudePluginInstallFailed",
      `${renderCommand("claude", installArgs)} failed`,
      {
        category: ErrorCategory.External,
        details: {
          stdout: installResult.stdout,
          stderr: installResult.stderr,
          exitCode: installResult.exitCode,
        },
      },
    );
  }

  return {
    harness: "claude-code",
    summary: "Added the published Babysitter Claude Code plugin to the marketplace and installed it at user scope.",
    command: [
      renderCommand("claude", marketplaceArgs),
      renderCommand("claude", installArgs),
    ].join(" && "),
    output: [
      marketplaceResult.stdout.trim(),
      marketplaceResult.stderr.trim(),
      installResult.stdout.trim(),
      installResult.stderr.trim(),
    ].filter(Boolean).join("\n"),
  };
}
