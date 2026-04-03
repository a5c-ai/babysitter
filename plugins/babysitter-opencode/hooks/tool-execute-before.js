#!/usr/bin/env node
/**
 * Babysitter Tool Execute Before Hook for OpenCode
 *
 * Fires before a tool execution in OpenCode. Delegates to
 * `babysitter hook:run --hook-type pre-tool-use` for pre-tool-use awareness.
 *
 * This hook can be used to:
 * - Log tool invocations for babysitter run observability
 * - Block certain tool calls during specific orchestration phases
 * - Inject babysitter context into tool arguments
 *
 * OpenCode plugin protocol:
 *   - Receives tool context as JSON via stdin
 *   - Outputs JSON to stdout (empty = allow, { block: true } = block)
 *   - Exit 0 = success
 */

"use strict";

const { execSync } = require("child_process");
const { readFileSync, mkdirSync, appendFileSync } = require("fs");
const path = require("path");

const PLUGIN_ROOT = process.env.OPENCODE_PLUGIN_ROOT || path.resolve(__dirname, "..");
const STATE_DIR = process.env.BABYSITTER_STATE_DIR || path.join(process.cwd(), ".a5c");
const LOG_DIR = process.env.BABYSITTER_LOG_DIR || path.join(PLUGIN_ROOT, ".a5c", "logs");
const LOG_FILE = path.join(LOG_DIR, "babysitter-tool-before-hook.log");

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
  const sessionId = process.env.BABYSITTER_SESSION_ID
    || process.env.OPENCODE_SESSION_ID
    || "";

  if (!sessionId) {
    // No session -- pass through without intervention
    process.stdout.write("{}\n");
    return;
  }

  // Read stdin for tool context
  let inputData = "";
  try {
    inputData = require("fs").readFileSync(0, "utf8");
  } catch {
    // No stdin available
  }

  blog(`tool-execute-before: session=${sessionId}`);

  const hookInput = JSON.stringify({
    session_id: sessionId,
    cwd: process.cwd(),
    harness: "opencode",
    plugin_root: PLUGIN_ROOT,
    tool_context: inputData ? JSON.parse(inputData) : {},
  });

  const sdkVersion = getSdkVersion();
  const args = [
    "hook:run",
    "--hook-type", "pre-tool-use",
    "--harness", "opencode",
    "--plugin-root", PLUGIN_ROOT,
    "--state-dir", STATE_DIR,
    "--json",
  ];

  try {
    const result = execSync(`babysitter ${args.join(" ")}`, {
      input: hookInput,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 10000,
      env: { ...process.env, BABYSITTER_STATE_DIR: STATE_DIR },
    });
    const output = result.toString("utf8").trim();
    blog(`Hook result: ${output}`);
    process.stdout.write((output || "{}") + "\n");
  } catch {
    // On failure, allow the tool execution to proceed
    blog("Pre-tool-use hook failed -- allowing execution");
    process.stdout.write("{}\n");
  }
}

main();
