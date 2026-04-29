#!/usr/bin/env node
"use strict";
var execSync = require("child_process").execSync;
var path = require("path");
var readFileSync = require("fs").readFileSync;

var PLUGIN_ROOT = process.env.PLUGIN_ROOT || process.env.PLUGIN_ROOT || path.resolve(__dirname, "..");
var stdin = "";
try { stdin = readFileSync(0, "utf8"); } catch {}
try {
  var result = execSync("bash " + JSON.stringify(path.join(PLUGIN_ROOT, "hooks/pre-tool-use.sh")), {
    input: stdin,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 30000,
    env: Object.assign({}, process.env, {
      HOOK_TYPE: process.env.HOOK_TYPE || "",
      ADAPTER_NAME: process.env.ADAPTER_NAME || "opencode",
      PLUGIN_ROOT: PLUGIN_ROOT
    })
  });
  process.stdout.write(result);
} catch (e) {
  process.stdout.write("{}\n");
}
