#!/usr/bin/env node
/**
 * Babysitter Session Idle Hook for OpenCode
 *
 * Fires when the OpenCode agent goes idle. Checks if the current babysitter
 * run has pending effects that need attention. Since OpenCode does NOT have a
 * blocking stop hook, this is fire-and-forget -- it outputs context about
 * pending effects so the agent can decide whether to continue iterating.
 *
 * Delegates to `babysitter hook:run --hook-type stop` (which handles the
 * run-state inspection and iteration tracking).
 *
 * OpenCode plugin protocol:
 *   - Receives event context as JSON via stdin
 *   - Outputs JSON to stdout
 *   - Exit 0 = success
 */

"use strict";

const { execSync } = require("child_process");
const { readFileSync, mkdirSync, appendFileSync } = require("fs");
const path = require("path");

const PLUGIN_ROOT = process.env.OPENCODE_PLUGIN_ROOT || path.resolve(__dirname, "..");
const STATE_DIR = process.env.BABYSITTER_STATE_DIR || path.join(process.cwd(), ".a5c");
const LOG_DIR = process.env.BABYSITTER_LOG_DIR || path.join(PLUGIN_ROOT, ".a5c", "logs");
const LOG_FILE = path.join(LOG_DIR, "babysitter-session-idle-hook.log");

function ensureDir(dir) {
  try { mkdirSync(dir, { recursive: true }); } catch { /* best-effort */ }
}

function blog(msg) {
  ensureDir(LOG_DIR);
  const ts = new Date().toISOString();
  try {
    appendFileSync(LOG_FILE, `[INFO] ${ts} ${msg}\n`);
  } catch { /* best-effort */ }
}

function getSdkVersion() {
  try {
    const versions = JSON.parse(readFileSync(path.join(PLUGIN_ROOT, "versions.json"), "utf8"));
    return versions.sdkVersion || "latest";
  } catch {
    return "latest";
  }
}

function runBabysitterHook(hookType, inputJson) {
  const sdkVersion = getSdkVersion();
  const args = [
    "hook:run",
    "--hook-type", hookType,
    "--harness", "opencode",
    "--plugin-root", PLUGIN_ROOT,
    "--state-dir", STATE_DIR,
    "--json",
  ];

  try {
    const result = execSync(`babysitter ${args.join(" ")}`, {
      input: inputJson,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
      env: { ...process.env, BABYSITTER_STATE_DIR: STATE_DIR },
    });
    return result.toString("utf8").trim();
  } catch {
    try {
      const result = execSync(`npx -y "@a5c-ai/babysitter-sdk@${sdkVersion}" ${args.join(" ")}`, {
        input: inputJson,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 60000,
        env: { ...process.env, BABYSITTER_STATE_DIR: STATE_DIR },
      });
      return result.toString("utf8").trim();
    } catch (err) {
      blog(`Hook execution failed: ${err.message}`);
      return "{}";
    }
  }
}

function main() {
  blog("session-idle hook invoked");

  const sessionId = process.env.BABYSITTER_SESSION_ID
    || process.env.OPENCODE_SESSION_ID
    || "";

  if (!sessionId) {
    blog("No session ID -- nothing to check");
    process.stdout.write("{}\n");
    return;
  }

  const hookInput = JSON.stringify({
    session_id: sessionId,
    cwd: process.cwd(),
    harness: "opencode",
    plugin_root: PLUGIN_ROOT,
  });

  blog(`Checking run status for session ${sessionId}`);

  // Delegate to the stop hook handler, which inspects run state
  // and returns block/allow decisions
  const result = runBabysitterHook("stop", hookInput);

  blog(`Hook result: ${result}`);

  try {
    const parsed = JSON.parse(result);
    process.stdout.write(JSON.stringify(parsed) + "\n");
  } catch {
    process.stdout.write("{}\n");
  }
}

main();
