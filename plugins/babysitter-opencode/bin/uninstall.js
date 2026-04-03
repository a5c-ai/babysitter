#!/usr/bin/env node
/**
 * Babysitter OpenCode Plugin Uninstaller
 *
 * Removes the babysitter plugin from the OpenCode plugins directory.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const WORKSPACE = process.env.OPENCODE_WORKSPACE || process.cwd();
const TARGET_DIR = path.join(WORKSPACE, ".opencode", "plugins", "babysitter");

function removeRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function main() {
  console.log(`Uninstalling babysitter plugin from OpenCode...`);
  console.log(`  Target: ${TARGET_DIR}`);

  if (!fs.existsSync(TARGET_DIR)) {
    console.log("  Plugin not installed -- nothing to remove.");
    return;
  }

  removeRecursive(TARGET_DIR);
  console.log("  Removed babysitter plugin directory.");

  // Clean up empty parent directories
  const pluginsDir = path.join(WORKSPACE, ".opencode", "plugins");
  try {
    const remaining = fs.readdirSync(pluginsDir);
    if (remaining.length === 0) {
      fs.rmdirSync(pluginsDir);
      console.log("  Removed empty .opencode/plugins/ directory.");
    }
  } catch { /* best-effort */ }

  console.log("\nBabysitter plugin uninstalled. Restart OpenCode to complete removal.");
}

main();
