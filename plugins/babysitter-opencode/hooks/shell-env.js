#!/usr/bin/env node
/**
 * Babysitter Shell Environment Hook for OpenCode
 *
 * Fires when OpenCode initializes a shell environment. Injects babysitter
 * environment variables (BABYSITTER_SESSION_ID, BABYSITTER_STATE_DIR, etc.)
 * so that subprocesses and other hooks can discover the active session.
 *
 * This is critical for OpenCode because it does NOT natively inject
 * distinctive env vars into plugins -- the babysitter plugin must self-inject
 * them via this hook.
 *
 * OpenCode plugin protocol:
 *   - Outputs env var assignments as JSON: { "env": { "KEY": "VALUE" } }
 *   - Exit 0 = success
 */

"use strict";

const { readFileSync, mkdirSync, appendFileSync, existsSync } = require("fs");
const path = require("path");
const crypto = require("crypto");

const PLUGIN_ROOT = process.env.OPENCODE_PLUGIN_ROOT || path.resolve(__dirname, "..");
const STATE_DIR = process.env.BABYSITTER_STATE_DIR || path.join(process.cwd(), ".a5c");
const RUNS_DIR = process.env.BABYSITTER_RUNS_DIR || path.join(STATE_DIR, "runs");
const LOG_DIR = process.env.BABYSITTER_LOG_DIR || path.join(PLUGIN_ROOT, ".a5c", "logs");
const LOG_FILE = path.join(LOG_DIR, "babysitter-shell-env-hook.log");

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

function main() {
  blog("shell-env hook invoked");

  // Resolve or generate session ID
  const sessionId = process.env.BABYSITTER_SESSION_ID
    || process.env.OPENCODE_SESSION_ID
    || crypto.randomUUID();

  const sdkVersion = getSdkVersion();

  // Build env vars to inject
  const env = {
    BABYSITTER_SESSION_ID: sessionId,
    OPENCODE_SESSION_ID: sessionId,
    BABYSITTER_STATE_DIR: STATE_DIR,
    BABYSITTER_RUNS_DIR: RUNS_DIR,
    OPENCODE_PLUGIN_ROOT: PLUGIN_ROOT,
  };

  // Add SDK version for downstream hooks
  if (sdkVersion && sdkVersion !== "latest") {
    env.BABYSITTER_SDK_VERSION = sdkVersion;
  }

  // Add global state dir if defined
  const globalStateDir = process.env.BABYSITTER_GLOBAL_STATE_DIR;
  if (globalStateDir) {
    env.BABYSITTER_GLOBAL_STATE_DIR = globalStateDir;
  }

  blog(`Injecting env: ${JSON.stringify(env)}`);

  process.stdout.write(JSON.stringify({ env }) + "\n");
}

main();
