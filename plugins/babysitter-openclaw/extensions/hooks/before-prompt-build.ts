/**
 * OpenClaw before_prompt_build hook handler.
 * Delegates to: babysitter hook:run --hook-type user-prompt-submit --harness openclaw
 *
 * This is where babysitter injects orchestration context into the prompt.
 * OpenClaw calls this before assembling the system/user prompt for each turn,
 * allowing babysitter to inject iteration instructions, active run state, and
 * pending task context.
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

export async function beforePromptBuildHandler(
  context: Record<string, unknown>
): Promise<Record<string, unknown> | void> {
  const logDir = getLogDir();
  const stateDir = process.env.BABYSITTER_STATE_DIR ?? resolve(process.cwd(), ".a5c");
  const cli = resolveBabysitterCli();

  try {
    const input = JSON.stringify(context);
    const args = [
      "hook:run",
      "--hook-type", "user-prompt-submit",
      "--harness", "openclaw",
      "--plugin-root", PLUGIN_ROOT,
      "--state-dir", stateDir,
      "--json",
    ];

    let stdout: string;
    if (cli === "babysitter") {
      stdout = execFileSync("babysitter", args, {
        input,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 30_000,
        encoding: "utf8",
      }) as string;
    } else {
      stdout = execFileSync("npx", ["-y", `@a5c-ai/babysitter-sdk@${getSdkVersion()}`, ...args], {
        input,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 60_000,
        encoding: "utf8",
      }) as string;
    }

    // Parse the hook result — may contain prompt injection context
    if (stdout && stdout.trim()) {
      try {
        return JSON.parse(stdout.trim()) as Record<string, unknown>;
      } catch {
        // Non-JSON output is ignored
      }
    }
  } catch (err) {
    try {
      const ts = new Date().toISOString();
      const msg = `[ERROR] ${ts} before-prompt-build hook failed: ${err instanceof Error ? err.message : String(err)}\n`;
      const { appendFileSync } = await import("node:fs");
      appendFileSync(resolve(logDir, "babysitter-before-prompt-build-hook.log"), msg);
    } catch {
      // Swallow logging failures
    }
  }
}
