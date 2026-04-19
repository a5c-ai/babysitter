#!/usr/bin/env node
/**
 * Unified hook dispatcher (Node.js) — for programmatic targets (Pi, oh-my-pi).
 *
 * Env vars (set by caller / extension activate):
 *   HOOK_TYPE     — canonical hook type slug (session-start, stop, etc.)
 *   ADAPTER_NAME  — harness adapter name (pi, oh-my-pi, etc.)
 *   PLUGIN_ROOT   — resolved plugin root directory
 *
 * Protocol:
 *   - Receives event context as JSON via stdin
 *   - Outputs JSON to stdout
 *   - Exit 0 = success
 */

"use strict";

const { execSync } = require("child_process");
const { readFileSync, mkdirSync, appendFileSync, existsSync, writeFileSync } = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const HOOK_TYPE = process.env.HOOK_TYPE;
const ADAPTER_NAME = process.env.ADAPTER_NAME;
if (!HOOK_TYPE || !ADAPTER_NAME) {
  process.stderr.write("HOOK_TYPE and ADAPTER_NAME env vars are required\n");
  process.exit(2);
}

const PLUGIN_ROOT = process.env.PLUGIN_ROOT || path.resolve(__dirname, "..");
const GLOBAL_ROOT = process.env.BABYSITTER_GLOBAL_STATE_DIR || path.join(os.homedir(), ".a5c");
const STATE_DIR = process.env.BABYSITTER_STATE_DIR || path.join(GLOBAL_ROOT, "state");
const LOG_DIR = process.env.BABYSITTER_LOG_DIR || path.join(GLOBAL_ROOT, "logs");
const LOG_FILE = path.join(LOG_DIR, "hook-" + HOOK_TYPE + ".log");
const SDK_MARKER = path.join(PLUGIN_ROOT, ".babysitter-install-attempted");
const PROXY_MARKER = path.join(PLUGIN_ROOT, ".hooks-proxy-install-attempted");

function ensureDir(dir) {
  try { mkdirSync(dir, { recursive: true }); } catch { /* best-effort */ }
}

function blog(msg) {
  ensureDir(LOG_DIR);
  var ts = new Date().toISOString();
  try { appendFileSync(LOG_FILE, "[INFO] " + ts + " " + msg + "\n"); } catch { /* */ }
}

function getSdkVersion() {
  try {
    return JSON.parse(readFileSync(path.join(PLUGIN_ROOT, "versions.json"), "utf8")).sdkVersion || "latest";
  } catch { return "latest"; }
}

function getInstalledVersion(cmd) {
  try {
    return execSync(cmd + " --version", { stdio: "pipe", timeout: 10000 }).toString().trim();
  } catch { return null; }
}

function installPackage(npmPkg, version, marker) {
  if (existsSync(marker)) return;
  try {
    execSync('npm i -g "' + npmPkg + "@" + version + '" --loglevel=error', { stdio: "pipe", timeout: 120000 });
    blog("Installed " + npmPkg + " globally (" + version + ")");
  } catch {
    try {
      var prefix = path.join(process.env.HOME || process.env.USERPROFILE || "~", ".local");
      execSync('npm i -g "' + npmPkg + "@" + version + '" --prefix "' + prefix + '" --loglevel=error', { stdio: "pipe", timeout: 120000 });
    } catch { blog(npmPkg + " install failed"); }
  }
  try { writeFileSync(marker, version); } catch { /* */ }
}

function resolveProxy() {
  try { execSync("a5c-hooks-proxy --version", { stdio: "pipe", timeout: 5000 }); return "a5c-hooks-proxy"; } catch { /* */ }
  var local = path.join(process.env.HOME || process.env.USERPROFILE || "~", ".local", "bin", process.platform === "win32" ? "a5c-hooks-proxy.exe" : "a5c-hooks-proxy");
  if (existsSync(local)) return local;
  return null;
}

function main() {
  blog("Hook invoked: type=" + HOOK_TYPE + " adapter=" + ADAPTER_NAME);
  var sessionId = process.env.BABYSITTER_SESSION_ID || crypto.randomUUID();
  process.env.BABYSITTER_SESSION_ID = sessionId;

  var sdkVersion = getSdkVersion();

  var curSdk = getInstalledVersion("babysitter");
  if (!curSdk || curSdk !== sdkVersion) installPackage("@a5c-ai/babysitter-sdk", sdkVersion, SDK_MARKER);

  var curProxy = getInstalledVersion("a5c-hooks-proxy");
  if (!curProxy || curProxy !== sdkVersion) installPackage("@a5c-ai/hooks-proxy-cli", sdkVersion, PROXY_MARKER);

  var stdinData = "";
  try { stdinData = readFileSync(0, "utf8"); } catch { /* */ }

  var hookInput = JSON.stringify({
    session_id: sessionId,
    cwd: process.cwd(),
    harness: ADAPTER_NAME,
    plugin_root: PLUGIN_ROOT,
    ...(stdinData ? { event_data: JSON.parse(stdinData) } : {}),
  });

  var proxy = resolveProxy();
  var handler = "babysitter hook:run --harness unified --hook-type " + HOOK_TYPE + " --plugin-root " + PLUGIN_ROOT + " --state-dir " + STATE_DIR + " --json";
  var result;

  try {
    if (proxy) {
      result = execSync('"' + proxy + '" invoke --adapter ' + ADAPTER_NAME + ' --handler "' + handler + '" --json', {
        input: hookInput, stdio: ["pipe", "pipe", "pipe"], timeout: 30000,
        env: Object.assign({}, process.env, { BABYSITTER_STATE_DIR: STATE_DIR }),
      }).toString("utf8").trim();
    } else {
      result = execSync('npx -y "@a5c-ai/hooks-proxy-cli@' + sdkVersion + '" invoke --adapter ' + ADAPTER_NAME + ' --handler "' + handler + '" --json', {
        input: hookInput, stdio: ["pipe", "pipe", "pipe"], timeout: 60000,
        env: Object.assign({}, process.env, { BABYSITTER_STATE_DIR: STATE_DIR }),
      }).toString("utf8").trim();
    }
  } catch (err) {
    blog("Hook failed: " + err.message);
    result = "{}";
  }

  try { process.stdout.write(JSON.stringify(JSON.parse(result)) + "\n"); }
  catch { process.stdout.write("{}\n"); }
}

main();
