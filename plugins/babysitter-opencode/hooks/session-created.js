#!/usr/bin/env node
/**
 * Babysitter Session Created Hook for OpenCode
 *
 * Fires when an OpenCode session is created. Ensures the babysitter SDK CLI
 * is installed, then delegates to `babysitter hook:run --hook-type session-start`
 * to create baseline session state.
 *
 * OpenCode plugin protocol:
 *   - Receives event context as JSON via process.argv or stdin
 *   - Outputs JSON to stdout
 *   - Exit 0 = success
 */

"use strict";

const { execSync, execFileSync } = require("child_process");
const { readFileSync, mkdirSync, appendFileSync, existsSync, writeFileSync } = require("fs");
const path = require("path");
const crypto = require("crypto");

const PLUGIN_ROOT = process.env.OPENCODE_PLUGIN_ROOT || path.resolve(__dirname, "..");
const STATE_DIR = process.env.BABYSITTER_STATE_DIR || path.join(process.cwd(), ".a5c");
const LOG_DIR = process.env.BABYSITTER_LOG_DIR || path.join(PLUGIN_ROOT, ".a5c", "logs");
const LOG_FILE = path.join(LOG_DIR, "babysitter-session-created-hook.log");

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SDK version & install
// ---------------------------------------------------------------------------

function getSdkVersion() {
  try {
    const versions = JSON.parse(readFileSync(path.join(PLUGIN_ROOT, "versions.json"), "utf8"));
    return versions.sdkVersion || "latest";
  } catch {
    return "latest";
  }
}

function hasBabysitterCli() {
  try {
    execSync("babysitter --version", { stdio: "pipe", timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

function installSdk(version) {
  const marker = path.join(PLUGIN_ROOT, ".babysitter-install-attempted");
  if (existsSync(marker)) return;

  try {
    execSync(`npm i -g "@a5c-ai/babysitter-sdk@${version}" --loglevel=error`, {
      stdio: "pipe",
      timeout: 120000,
    });
    blog(`Installed SDK globally (${version})`);
  } catch {
    // Try user-local prefix
    try {
      const prefix = path.join(process.env.HOME || process.env.USERPROFILE || "~", ".local");
      execSync(`npm i -g "@a5c-ai/babysitter-sdk@${version}" --prefix "${prefix}" --loglevel=error`, {
        stdio: "pipe",
        timeout: 120000,
      });
      blog(`Installed SDK to user prefix (${version})`);
    } catch {
      blog("SDK installation failed");
    }
  }

  try { writeFileSync(marker, version); } catch { /* best-effort */ }
}

// ---------------------------------------------------------------------------
// CLI execution helper
// ---------------------------------------------------------------------------

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
  } catch (err) {
    // Fall back to npx
    try {
      const result = execSync(`npx -y "@a5c-ai/babysitter-sdk@${sdkVersion}" ${args.join(" ")}`, {
        input: inputJson,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 60000,
        env: { ...process.env, BABYSITTER_STATE_DIR: STATE_DIR },
      });
      return result.toString("utf8").trim();
    } catch (npxErr) {
      blog(`Hook execution failed: ${npxErr.message}`);
      return "{}";
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  blog("session-created hook invoked");
  blog(`PLUGIN_ROOT=${PLUGIN_ROOT}`);

  // Generate a session ID if OpenCode doesn't provide one
  const sessionId = process.env.OPENCODE_SESSION_ID
    || process.env.BABYSITTER_SESSION_ID
    || crypto.randomUUID();

  // Set env var so downstream hooks can pick it up
  process.env.BABYSITTER_SESSION_ID = sessionId;

  const sdkVersion = getSdkVersion();

  // Ensure SDK is installed
  if (!hasBabysitterCli()) {
    blog("SDK CLI not found, attempting install");
    installSdk(sdkVersion);
  }

  // Build hook input
  const hookInput = JSON.stringify({
    session_id: sessionId,
    cwd: process.cwd(),
    harness: "opencode",
    plugin_root: PLUGIN_ROOT,
  });

  blog(`Hook input: ${hookInput}`);

  // Delegate to SDK hook handler
  const result = runBabysitterHook("session-start", hookInput);

  blog(`Hook result: ${result}`);

  // Output result
  try {
    const parsed = JSON.parse(result);
    process.stdout.write(JSON.stringify(parsed) + "\n");
  } catch {
    process.stdout.write("{}\n");
  }
}

main();
