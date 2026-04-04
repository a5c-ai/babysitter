/**
 * OpenClaw session_start hook handler.
 * Delegates to: babysitter hook:run --hook-type session-start --harness openclaw
 *
 * Ensures the babysitter CLI is available and triggers session initialization.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
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

function resolveBabysitterCli(): string {
  try {
    execFileSync("babysitter", ["--version"], { stdio: "ignore" });
    return "babysitter";
  } catch {
    return `npx -y @a5c-ai/babysitter-sdk@${getSdkVersion()}`;
  }
}

export async function sessionStartHandler(context: Record<string, unknown>): Promise<void> {
  const logDir = getLogDir();
  const stateDir = process.env.BABYSITTER_STATE_DIR ?? resolve(process.cwd(), ".a5c");
  const cli = resolveBabysitterCli();

  try {
    const input = JSON.stringify(context);
    const args = [
      "hook:run",
      "--hook-type", "session-start",
      "--harness", "openclaw",
      "--plugin-root", PLUGIN_ROOT,
      "--state-dir", stateDir,
    ];

    if (cli === "babysitter") {
      execFileSync("babysitter", args, {
        input,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 30_000,
      });
    } else {
      execFileSync("npx", ["-y", `@a5c-ai/babysitter-sdk@${getSdkVersion()}`, ...args], {
        input,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 60_000,
      });
    }
  } catch (err) {
    // Log but do not fail the session — hooks are best-effort
    try {
      const ts = new Date().toISOString();
      const msg = `[ERROR] ${ts} session-start hook failed: ${err instanceof Error ? err.message : String(err)}\n`;
      const { appendFileSync } = await import("node:fs");
      appendFileSync(resolve(logDir, "babysitter-session-start-hook.log"), msg);
    } catch {
      // Swallow logging failures
    }
  }
}
