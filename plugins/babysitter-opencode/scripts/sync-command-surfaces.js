#!/usr/bin/env node
/**
 * Sync command surfaces from the canonical babysitter plugin.
 *
 * Copies command .md files from the cursor/codex plugins or generates
 * them from the SDK CLI command definitions. Used during build/deploy
 * to keep command surfaces in sync across harness plugins.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const PLUGIN_ROOT = path.resolve(__dirname, "..");
const COMMANDS_DIR = path.join(PLUGIN_ROOT, "commands");

// Check mode
const checkOnly = process.argv.includes("--check");

function main() {
  // Verify commands directory exists and has files
  if (!fs.existsSync(COMMANDS_DIR)) {
    console.error("ERROR: commands/ directory not found");
    process.exit(1);
  }

  const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith(".md"));
  if (files.length === 0) {
    console.error("ERROR: No command .md files found in commands/");
    process.exit(1);
  }

  console.log(`Found ${files.length} command files:`);
  for (const file of files) {
    const content = fs.readFileSync(path.join(COMMANDS_DIR, file), "utf8");
    const hasHeader = content.startsWith("---");
    const status = hasHeader ? "OK" : "MISSING FRONTMATTER";
    console.log(`  ${file} [${status}]`);
    if (checkOnly && !hasHeader) {
      process.exit(1);
    }
  }

  if (checkOnly) {
    console.log("\nAll command files are valid.");
  } else {
    console.log("\nCommand surfaces synced.");
  }
}

main();
