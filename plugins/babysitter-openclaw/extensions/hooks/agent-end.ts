/**
 * OpenClaw agent_end hook handler.
 * Delegates to: babysitter hook:run --hook-type stop --harness openclaw
 *
 * Fires after each agent turn completes. This triggers babysitter iteration
 * in a fire-and-forget manner — the hook spawns the CLI asynchronously so
 * it does not block the next agent turn.
 */

import { spawn } from "node:child_process";
import { readFileSync, mkdirSync, appendFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "../..");

function getLogDir(): string {
  const dir = process.env.BABYSITTER_LOG_DIR ?? resolve(homedir(), ".a5c/logs");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function getSdkVersion(): string {
  try {
    const versionsPath = resolve(PLUGIN_ROOT, "versions.json");
    const data = JSON.parse(readFileSync(versionsPath, "utf8"));
    return data.sdkVersion ?? "latest";
  } catch {
    return "latest";
  }
}

function isBabysitterAvailable(): boolean {
  try {
    const { execFileSync } = require("node:child_process");
    execFileSync("babysitter", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function agentEndHandler(context: Record<string, unknown>): Promise<void> {
  const logDir = getLogDir();
  const stateDir = process.env.BABYSITTER_STATE_DIR ?? resolve(process.cwd(), ".a5c");
  const input = JSON.stringify(context);

  const args = [
    "hook:run",
    "--hook-type", "stop",
    "--harness", "openclaw",
    "--plugin-root", PLUGIN_ROOT,
    "--state-dir", stateDir,
    "--json",
  ];

  try {
    let child;
    if (isBabysitterAvailable()) {
      child = spawn("babysitter", args, {
        stdio: ["pipe", "pipe", "pipe"],
        detached: false,
      });
    } else {
      child = spawn("npx", ["-y", `@a5c-ai/babysitter-sdk@${getSdkVersion()}`, ...args], {
        stdio: ["pipe", "pipe", "pipe"],
        detached: false,
      });
    }

    // Write input and close stdin
    if (child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    }

    // Fire-and-forget: log errors but do not await completion
    child.on("error", (err) => {
      try {
        const ts = new Date().toISOString();
        appendFileSync(
          resolve(logDir, "babysitter-agent-end-hook.log"),
          `[ERROR] ${ts} agent-end hook spawn failed: ${err.message}\n`
        );
      } catch {
        // Swallow
      }
    });

    // Collect stderr for diagnostics
    let stderr = "";
    if (child.stderr) {
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
    }

    child.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        try {
          const ts = new Date().toISOString();
          appendFileSync(
            resolve(logDir, "babysitter-agent-end-hook.log"),
            `[WARN] ${ts} agent-end hook exited with code=${code}${stderr ? ` stderr=${stderr.slice(0, 500)}` : ""}\n`
          );
        } catch {
          // Swallow
        }
      }
    });

    // Unref so the child process does not keep the parent alive
    child.unref();
  } catch (err) {
    try {
      const ts = new Date().toISOString();
      appendFileSync(
        resolve(logDir, "babysitter-agent-end-hook.log"),
        `[ERROR] ${ts} agent-end hook failed: ${err instanceof Error ? err.message : String(err)}\n`
      );
    } catch {
      // Swallow
    }
  }
}
