/**
 * OpenClaw session_start hook — delegates to shell script.
 */
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(__dirname, "../..");

export async function sessionStartHandler(context: Record<string, unknown>): Promise<void> {
  try {
    execFileSync("bash", [resolve(PLUGIN_ROOT, "hooks/babysitter-proxied-session-start.sh")], {
      input: JSON.stringify(context),
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
      env: { ...process.env, ADAPTER_NAME: "openclaw", PLUGIN_ROOT },
    });
  } catch { /* best-effort */ }
}
