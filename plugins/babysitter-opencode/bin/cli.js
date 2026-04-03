#!/usr/bin/env node
/**
 * Babysitter OpenCode CLI shim.
 *
 * Provides `babysitter-opencode` command for plugin management tasks
 * (install, uninstall, sync). Delegates heavy lifting to the SDK CLI.
 */

"use strict";

const { execSync } = require("child_process");
const path = require("path");

const PLUGIN_ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const command = args[0] || "help";

function run(cmd) {
  try {
    execSync(cmd, { stdio: "inherit", cwd: PLUGIN_ROOT });
  } catch (err) {
    process.exit(err.status || 1);
  }
}

switch (command) {
  case "install":
    run(`node ${path.join(PLUGIN_ROOT, "bin", "install.js")}`);
    break;
  case "uninstall":
    run(`node ${path.join(PLUGIN_ROOT, "bin", "uninstall.js")}`);
    break;
  case "sync":
    run(`node ${path.join(PLUGIN_ROOT, "scripts", "sync-command-surfaces.js")}`);
    break;
  case "version":
    try {
      const pkg = require(path.join(PLUGIN_ROOT, "package.json"));
      console.log(pkg.version);
    } catch {
      console.log("unknown");
    }
    break;
  case "help":
  default:
    console.log(`babysitter-opencode - Babysitter plugin for OpenCode

Usage:
  babysitter-opencode install     Install plugin into OpenCode
  babysitter-opencode uninstall   Remove plugin from OpenCode
  babysitter-opencode sync        Sync command surfaces
  babysitter-opencode version     Show version
  babysitter-opencode help        Show this help`);
    break;
}
