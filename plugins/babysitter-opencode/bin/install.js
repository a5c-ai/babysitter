#!/usr/bin/env node
/**
 * Babysitter OpenCode Plugin Installer
 *
 * Copies plugin files into the OpenCode plugins directory:
 *   .opencode/plugins/babysitter/
 *
 * OpenCode discovers plugins as JS/TS modules in .opencode/plugins/.
 * This installer creates the necessary directory structure and copies
 * hook scripts, skills, and an index.js entry point.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const PLUGIN_ROOT = path.resolve(__dirname, "..");
const WORKSPACE = process.env.OPENCODE_WORKSPACE || process.cwd();
const TARGET_DIR = path.join(WORKSPACE, ".opencode", "plugins", "babysitter");

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function main() {
  console.log(`Installing babysitter plugin for OpenCode...`);
  console.log(`  Source: ${PLUGIN_ROOT}`);
  console.log(`  Target: ${TARGET_DIR}`);

  // Create target directory
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  // Copy hooks
  const hooksDir = path.join(PLUGIN_ROOT, "hooks");
  if (fs.existsSync(hooksDir)) {
    copyRecursive(hooksDir, path.join(TARGET_DIR, "hooks"));
    console.log("  Copied hooks/");
  }

  // Copy skills
  const skillsDir = path.join(PLUGIN_ROOT, "skills");
  if (fs.existsSync(skillsDir)) {
    copyRecursive(skillsDir, path.join(TARGET_DIR, "skills"));
    console.log("  Copied skills/");
  }

  // Copy commands
  const commandsDir = path.join(PLUGIN_ROOT, "commands");
  if (fs.existsSync(commandsDir)) {
    copyRecursive(commandsDir, path.join(TARGET_DIR, "commands"));
    console.log("  Copied commands/");
  }

  // Copy plugin.json and versions.json
  for (const file of ["plugin.json", "versions.json"]) {
    const src = path.join(PLUGIN_ROOT, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(TARGET_DIR, file));
      console.log(`  Copied ${file}`);
    }
  }

  // Create index.js entry point for OpenCode plugin discovery
  const indexContent = `#!/usr/bin/env node
/**
 * Babysitter plugin entry point for OpenCode.
 *
 * OpenCode discovers plugins by looking for JS/TS modules in
 * .opencode/plugins/. This file registers the babysitter hooks
 * with the OpenCode plugin system.
 */

"use strict";

const path = require("path");

const PLUGIN_DIR = __dirname;

module.exports = {
  name: "babysitter",
  version: require(path.join(PLUGIN_DIR, "plugin.json")).version,

  hooks: {
    "session.created": require(path.join(PLUGIN_DIR, "hooks", "session-created.js")),
    "session.idle": require(path.join(PLUGIN_DIR, "hooks", "session-idle.js")),
    "shell.env": require(path.join(PLUGIN_DIR, "hooks", "shell-env.js")),
    "tool.execute.before": require(path.join(PLUGIN_DIR, "hooks", "tool-execute-before.js")),
    "tool.execute.after": require(path.join(PLUGIN_DIR, "hooks", "tool-execute-after.js")),
  },
};
`;

  fs.writeFileSync(path.join(TARGET_DIR, "index.js"), indexContent);
  console.log("  Created index.js");

  console.log(`\nBabysitter plugin installed to ${TARGET_DIR}`);
  console.log("Restart OpenCode to activate the plugin.");
}

main();
